# CodeMotion Studio — ProGuard rules (release minify ON hai).

# Blob-download bridge: CMBridge ke @JavascriptInterface methods JS se naam
# lekar reflection se call hote hain — R8 inhe rename/remove na kare.
-keep class com.brpportal.codemotionstudio.MainActivity$CMBridge { *; }
-keepclassmembers class com.brpportal.codemotionstudio.MainActivity$CMBridge {
    @android.webkit.JavascriptInterface <methods>;
}

# @JavascriptInterface annotation runtime par dikhni chahiye.
-keepattributes *Annotation*
