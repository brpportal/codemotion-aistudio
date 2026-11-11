# CodeMotion Studio — Android wrapper

Ye folder ek patli si **native Android shell** hai jo is repo ki web app
(Vite + React, AI Studio se bani hui) ko installable APK me band karti hai.
Koi Compose nahi — sirf ek `MainActivity` + framework `WebView`, is liye
APK chhota rehta hai.

## Web build assets me kaise aati hai

1. `npm install --legacy-peer-deps && npm run build` se web app ki `dist/`
   banti hai (vite `base: './'` rakhta hai taake `file://` par chale).
2. `dist/` ki poori copy `app/src/main/assets/www/` me jati hai —
   ek copy repo me pehle se rakhi hai taake sirf Gradle build bhi chal jaye.
3. App `file:///android_asset/www/index.html` load karti hai.
4. CI (`.github/workflows/build.yml`) har push par steps 1–2 dobara karke
   phir `./gradlew assembleRelease` chalata hai — yani APK me hamesha
   latest web build jata hai, repo wali copy sirf local sahulat hai.

## Downloads — blob bridge design

Web app apni files (project.json save, MP4 export) `blob:` URL + `<a download>`
click se download karti hai. **Android WebView blob: downloads ko default
par ignore kar deta hai**, is liye teen rukh rakhe gaye hain:

- **Injected JS** (`onPageFinished` me): document par capture-phase click
  listener lagta hai. Agar click kisi `<a download href="blob:...">` par ho
  to default roka jata hai, blob ko `fetch` + `FileReader` se base64 banaya
  jata hai aur `window.CMBridge.saveBase64(name, mime, base64)` call hota hai.
  Script chhota, defensive (har jagah try/catch) aur sirf ek dafa install hota hai.
- **`CMBridge.saveBase64`** (native): base64 decode karke file ko asal
  **Downloads** folder me likhta hai — API 29+ par `MediaStore.Downloads`
  (IS_PENDING flow), us se neeche app ke external Downloads dir me
  (koi storage permission nahi chahiye). Aakhir me Toast se file ka naam
  bataya jata hai. R8 in methods ko rename na kare, is ke liye
  `app/proguard-rules.pro` me keep rules hain.
- **`setDownloadListener`**: http(s) downloads `DownloadManager` se public
  Downloads me jate hain; agar koi blob: URL listener tak pohanch bhi jaye
  (programmatic click waghera) to page ke andar usi blob ko fetch karke
  bridge ko bhej diya jata hai.

## File chooser

`<input type="file">` (image upload + project.json import) ke liye
`WebChromeClient.onShowFileChooser` → `OpenMultipleDocuments`
ActivityResultLauncher. Accept types sanitize hote hain (MIME rakhe jate
hain, `.json` jaisi extensions MIME me badli jati hain). Chuni hui URI(s)
callback ko wapas milti hain; `allowContentAccess` ki wajah se WebView
unhe page ko parhne deta hai.

## Local build

```sh
# pehle web build taaza karo (optional — repo copy mojood hai)
npm install --legacy-peer-deps && npm run build
rm -rf android/app/src/main/assets/www
mkdir -p android/app/src/main/assets/www
cp -r dist/. android/app/src/main/assets/www/

cd android
./gradlew assembleRelease   # pehli dafa wrapper generate karna pare to:
                            # gradle wrapper --gradle-version 8.9
```

Release build minified + shrinkResources ke sath banti hai aur debug key
se sign hoti hai (test build — seedha install ho jati hai).

- Package: `com.brpportal.codemotionstudio`
- minSdk 26 · targetSdk/compileSdk 34 · versionName 1.0.0
