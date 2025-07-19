# Add project specific ProGuard rules here.
# By default, the flags in this file are appended to flags specified
# in /usr/local/Cellar/android-sdk/24.3.3/tools/proguard/proguard-android.txt
# You can edit the include path and order by changing the proguardFiles
# directive in build.gradle.
#
# For more details, see
#   http://developer.android.com/guide/developing/tools/proguard.html

# react-native-reanimated
-keep class com.swmansion.reanimated.** { *; }
-keep class com.facebook.react.turbomodule.** { *; }

# Add any project specific keep options here:

# Expo fetch API (react-native runtime)
-keep class com.facebook.react.modules.network.** { *; }
-dontwarn com.facebook.react.modules.network.**

# okhttp & okio (기본 네트워크 백엔드)
-keep class okhttp3.** { *; }
-dontwarn okhttp3.**
-keep class okio.** { *; }
-dontwarn okio.**

# If you're using axios or fetch
-keep class expo.modules.kotlin.** { *; }
-dontwarn expo.modules.kotlin.**

# (Optional) your own server API package if applicable
# -keep class com.yourpackage.api.** { *; }

