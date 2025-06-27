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
-keep class androidx.startup.** { *; }
-dontwarn androidx.startup.**

# react-native-gesture-handler (만약 사용 중이라면)
-keep class com.swmansion.gesturehandler.** { *; }

# react-native-iap (만약 obfuscation 이슈가 있다면)
-keep class com.dooboolab.rniap.** { *; }
-dontwarn com.android.billingclient.**

# expo-updates 관련
-keep class expo.modules.updates.** { *; }


# Add any project specific keep options here:
