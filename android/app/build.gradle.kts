plugins {
    id("com.android.application")
    id("org.jetbrains.kotlin.android")
}

android {
    namespace = "com.brpportal.codemotionstudio"
    compileSdk = 34

    defaultConfig {
        applicationId = "com.brpportal.codemotionstudio"
        minSdk = 26
        targetSdk = 34
        versionCode = 2
        versionName = "1.0.1"
    }

    buildTypes {
        release {
            // Chhota size: minify + resource shrink (WhatsApp delivery ke liye <5MB target)
            isMinifyEnabled = true
            isShrinkResources = true
            proguardFiles(
                getDefaultProguardFile("proguard-android-optimize.txt"),
                "proguard-rules.pro"
            )
            // Test build hai — debug key se sign karo taake seedha install ho jaye
            signingConfig = signingConfigs.getByName("debug")
        }
    }
    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }
    kotlinOptions {
        jvmTarget = "17"
    }
}

dependencies {
    // Sirf ActivityResultContracts (file chooser) ke liye — koi Compose nahi,
    // WebView framework ka hai, is liye APK chhota rehta hai.
    implementation("androidx.activity:activity-ktx:1.9.2")
}
