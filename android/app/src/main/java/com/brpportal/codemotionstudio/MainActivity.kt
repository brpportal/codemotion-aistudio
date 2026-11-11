package com.brpportal.codemotionstudio

import android.annotation.SuppressLint
import android.app.DownloadManager
import android.content.ContentValues
import android.content.Context
import android.net.Uri
import android.os.Build
import android.os.Bundle
import android.os.Environment
import android.provider.MediaStore
import android.util.Base64
import android.view.ViewGroup
import android.webkit.CookieManager
import android.webkit.DownloadListener
import android.webkit.JavascriptInterface
import android.webkit.URLUtil
import android.webkit.ValueCallback
import android.webkit.WebChromeClient
import android.webkit.WebSettings
import android.webkit.WebView
import android.webkit.WebViewClient
import android.widget.Toast
import androidx.activity.ComponentActivity
import androidx.activity.result.contract.ActivityResultContracts
import org.json.JSONObject
import java.io.File
import java.io.FileOutputStream

/**
 * CodeMotion Studio — patli si native shell, andar poori web app
 * (assets/www) WebView me chalti hai. Koi Compose nahi.
 *
 * Teen khaas kaam:
 *  1. <input type="file"> ke liye file chooser (image upload + project.json import).
 *  2. http(s) downloads DownloadManager se.
 *  3. blob: downloads ke liye CMBridge — WebView blob: URLs ko khud handle
 *     nahi karta, is liye page me chhota JS inject karke blob ko base64 me
 *     badal kar native side Downloads folder me save kiya jata hai.
 */
class MainActivity : ComponentActivity() {

    private lateinit var webView: WebView
    private var filePathCallback: ValueCallback<Array<Uri>>? = null

    /**
     * File picker — OpenMultipleDocuments is liye ke input agar multiple ho
     * to bhi chal jaye; result hamesha Array<Uri> (cancel par null) callback ko.
     */
    private val fileChooserLauncher = registerForActivityResult(
        ActivityResultContracts.OpenMultipleDocuments()
    ) { uris: List<Uri> ->
        val callback = filePathCallback
        filePathCallback = null
        callback?.onReceiveValue(if (uris.isEmpty()) null else uris.toTypedArray())
    }

    @SuppressLint("SetJavaScriptEnabled")
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        webView = WebView(this)
        setContentView(webView)

        with(webView.settings) {
            javaScriptEnabled = true
            domStorageEnabled = true
            allowFileAccess = true
            allowContentAccess = true
            mediaPlaybackRequiresUserGesture = false
            builtInZoomControls = false
            displayZoomControls = false
            loadWithOverviewMode = true
            useWideViewPort = true
            cacheMode = WebSettings.LOAD_DEFAULT
        }

        webView.addJavascriptInterface(CMBridge(), BRIDGE_NAME)
        webView.webViewClient = StudioWebViewClient()
        webView.webChromeClient = StudioWebChromeClient()
        webView.setDownloadListener(StudioDownloadListener())

        if (savedInstanceState != null && webView.restoreState(savedInstanceState) != null) {
            // State restore ho gaya — dobara load nahi karna.
        } else {
            webView.loadUrl("file:///android_asset/www/index.html")
        }
    }

    override fun onSaveInstanceState(outState: Bundle) {
        if (::webView.isInitialized) webView.saveState(outState)
        super.onSaveInstanceState(outState)
    }

    override fun onPause() {
        if (::webView.isInitialized) webView.onPause()
        super.onPause()
    }

    override fun onResume() {
        super.onResume()
        if (::webView.isInitialized) webView.onResume()
    }

    override fun onDestroy() {
        if (::webView.isInitialized) {
            (webView.parent as? ViewGroup)?.removeView(webView)
            webView.stopLoading()
            webView.webChromeClient = null
            webView.destroy()
        }
        super.onDestroy()
    }

    @Deprecated("WebView history ke liye simple override hi kaafi hai")
    override fun onBackPressed() {
        if (::webView.isInitialized && webView.canGoBack()) {
            webView.goBack()
        } else {
            @Suppress("DEPRECATION")
            super.onBackPressed()
        }
    }

    // ------------------------------------------------------------------
    // File chooser (<input type="file">)
    // ------------------------------------------------------------------

    private inner class StudioWebChromeClient : WebChromeClient() {
        override fun onShowFileChooser(
            webView: WebView?,
            filePathCallback: ValueCallback<Array<Uri>>?,
            fileChooserParams: FileChooserParams?
        ): Boolean {
            // Pichli pending request ko saaf karke nayi lagao.
            this@MainActivity.filePathCallback?.onReceiveValue(null)
            this@MainActivity.filePathCallback = filePathCallback

            val mimeTypes = sanitizeMimeTypes(fileChooserParams?.acceptTypes)
            return try {
                fileChooserLauncher.launch(mimeTypes)
                true
            } catch (e: Exception) {
                this@MainActivity.filePathCallback = null
                filePathCallback?.onReceiveValue(null)
                false
            }
        }
    }

    /** accept list me MIME bhi ho sakte hain aur ".json" jaisi extensions bhi. */
    private fun sanitizeMimeTypes(acceptTypes: Array<String>?): Array<String> {
        val out = mutableListOf<String>()
        acceptTypes?.forEach { raw ->
            raw.split(",").forEach { part ->
                val t = part.trim()
                when {
                    t.isEmpty() -> Unit
                    t.contains("/") -> out.add(t)
                    t.startsWith(".") -> EXT_TO_MIME[t.lowercase()]?.let { out.add(it) }
                }
            }
        }
        return if (out.isEmpty()) arrayOf("*/*") else out.distinct().toTypedArray()
    }

    // ------------------------------------------------------------------
    // Downloads
    // ------------------------------------------------------------------

    private inner class StudioWebViewClient : WebViewClient() {
        override fun onPageFinished(view: WebView?, url: String?) {
            super.onPageFinished(view, url)
            // Blob-anchor downloads ko page ke andar hi rok kar bridge ko do.
            view?.evaluateJavascript(BLOB_BRIDGE_JS, null)
        }
    }

    private inner class StudioDownloadListener : DownloadListener {
        override fun onDownloadStart(
            url: String?,
            userAgent: String?,
            contentDisposition: String?,
            mimeType: String?,
            contentLength: Long
        ) {
            if (url.isNullOrEmpty()) return
            when {
                url.startsWith("blob:") -> fetchBlobIntoBridge(url)
                url.startsWith("http://") || url.startsWith("https://") ->
                    enqueueHttpDownload(url, userAgent, contentDisposition, mimeType)
                else -> toast("Is qisam ka download support nahi hai")
            }
        }
    }

    /** DownloadListener par aya blob: URL page ke andar hi zinda hota hai —
     *  wahin fetch karke bridge ko bhej do (naam yahan maloom nahi, bridge
     *  mime se extension laga lega). */
    private fun fetchBlobIntoBridge(blobUrl: String) {
        val quoted = JSONObject.quote(blobUrl)
        val js = """
            (function(){ try {
              fetch($quoted).then(function(r){ return r.blob(); }).then(function(b){
                var fr = new FileReader();
                fr.onloadend = function(){
                  try {
                    var s = String(fr.result || '');
                    var i = s.indexOf(',');
                    if (window.$BRIDGE_NAME) window.$BRIDGE_NAME.saveBase64(
                      'download', b.type || 'application/octet-stream', i >= 0 ? s.slice(i + 1) : s);
                  } catch(e){}
                };
                fr.readAsDataURL(b);
              }).catch(function(){});
            } catch(e){} })();
        """.trimIndent()
        webView.evaluateJavascript(js, null)
    }

    private fun enqueueHttpDownload(
        url: String,
        userAgent: String?,
        contentDisposition: String?,
        mimeType: String?
    ) {
        try {
            val fileName = URLUtil.guessFileName(url, contentDisposition, mimeType)
            val request = DownloadManager.Request(Uri.parse(url)).apply {
                setMimeType(mimeType)
                if (!userAgent.isNullOrEmpty()) addRequestHeader("User-Agent", userAgent)
                CookieManager.getInstance().getCookie(url)?.let {
                    addRequestHeader("Cookie", it)
                }
                setTitle(fileName)
                setDescription("CodeMotion Studio download")
                setNotificationVisibility(
                    DownloadManager.Request.VISIBILITY_VISIBLE_NOTIFY_COMPLETED
                )
                setDestinationInExternalPublicDir(Environment.DIRECTORY_DOWNLOADS, fileName)
            }
            val dm = getSystemService(Context.DOWNLOAD_SERVICE) as DownloadManager
            dm.enqueue(request)
            toast("Download shuru: $fileName")
        } catch (e: Exception) {
            toast("Download fail: ${e.message}")
        }
    }

    // ------------------------------------------------------------------
    // CMBridge — JS se base64 file save karna
    // ------------------------------------------------------------------

    inner class CMBridge {

        /**
         * Page (injected JS) blob ko base64 bana kar yahan bhejti hai.
         * API 29+ par MediaStore se asal Downloads folder me, us se neeche
         * app ke external Downloads dir me save hota hai (permission-free).
         */
        @JavascriptInterface
        fun saveBase64(name: String, mime: String, base64: String) {
            try {
                val bytes = Base64.decode(base64, Base64.DEFAULT)
                val safeName = sanitizeFileName(name, mime)
                saveToDownloads(safeName, mime, bytes)
                toast("Downloads me save ho gaya: $safeName")
            } catch (e: Exception) {
                toast("Save fail: ${e.message}")
            }
        }
    }

    private fun saveToDownloads(name: String, mime: String, bytes: ByteArray) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            val resolver = contentResolver
            val values = ContentValues().apply {
                put(MediaStore.Downloads.DISPLAY_NAME, name)
                put(
                    MediaStore.Downloads.MIME_TYPE,
                    mime.ifEmpty { "application/octet-stream" }
                )
                put(MediaStore.Downloads.RELATIVE_PATH, Environment.DIRECTORY_DOWNLOADS)
                put(MediaStore.Downloads.IS_PENDING, 1)
            }
            val uri = resolver.insert(MediaStore.Downloads.EXTERNAL_CONTENT_URI, values)
                ?: throw IllegalStateException("MediaStore insert fail")
            try {
                val stream = resolver.openOutputStream(uri)
                    ?: throw IllegalStateException("Output stream nahi khula")
                stream.use { it.write(bytes) }
                values.clear()
                values.put(MediaStore.Downloads.IS_PENDING, 0)
                resolver.update(uri, values, null, null)
            } catch (e: Exception) {
                resolver.delete(uri, null, null)
                throw e
            }
        } else {
            val dir = getExternalFilesDir(Environment.DIRECTORY_DOWNLOADS) ?: filesDir
            if (!dir.exists()) dir.mkdirs()
            FileOutputStream(File(dir, name)).use { it.write(bytes) }
        }
    }

    private fun sanitizeFileName(name: String, mime: String): String {
        var clean = name.replace(Regex("[\\\\/:*?\"<>|]"), "_").trim()
        if (clean.isEmpty() || clean == "download") {
            clean = "codemotion-download"
        }
        if (!clean.contains('.')) {
            val ext = android.webkit.MimeTypeMap.getSingleton()
                .getExtensionFromMimeType(mime)
            if (!ext.isNullOrEmpty()) clean = "$clean.$ext"
        }
        return clean
    }

    private fun toast(message: String) {
        runOnUiThread {
            Toast.makeText(this@MainActivity, message, Toast.LENGTH_LONG).show()
        }
    }

    companion object {
        private const val BRIDGE_NAME = "CMBridge"

        private val EXT_TO_MIME = mapOf(
            ".json" to "application/json",
            ".png" to "image/png",
            ".jpg" to "image/jpeg",
            ".jpeg" to "image/jpeg",
            ".webp" to "image/webp",
            ".gif" to "image/gif",
            ".mp4" to "video/mp4",
            ".txt" to "text/plain"
        )

        /**
         * Page me inject hone wala chhota script: <a download href="blob:...">
         * ke clicks ko capture phase me rokta hai, blob ko base64 bana kar
         * CMBridge.saveBase64 ko deta hai. Sirf ek dafa install hota hai,
         * poora try/catch me hai taake page ko kabhi toray na.
         */
        private const val BLOB_BRIDGE_JS = """
(function(){
  try {
    if (window.__cmBridgeInstalled) return;
    window.__cmBridgeInstalled = true;
    document.addEventListener('click', function(e){
      try {
        var t = e.target;
        var a = (t && t.closest) ? t.closest('a[download]') : null;
        if (!a) return;
        var href = a.getAttribute('href') || '';
        if (href.indexOf('blob:') !== 0) return;
        e.preventDefault();
        e.stopPropagation();
        var name = a.getAttribute('download') || 'download';
        fetch(href).then(function(r){ return r.blob(); }).then(function(b){
          var fr = new FileReader();
          fr.onloadend = function(){
            try {
              var s = String(fr.result || '');
              var i = s.indexOf(',');
              if (window.CMBridge && window.CMBridge.saveBase64) {
                window.CMBridge.saveBase64(name, b.type || 'application/octet-stream',
                  i >= 0 ? s.slice(i + 1) : s);
              }
            } catch(err){}
          };
          fr.readAsDataURL(b);
        }).catch(function(){});
      } catch(err){}
    }, true);
  } catch(err){}
})();
"""
    }
}
