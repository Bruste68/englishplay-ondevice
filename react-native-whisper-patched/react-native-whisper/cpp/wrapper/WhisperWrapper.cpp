#include <jni.h>
#include <string>
#include <android/log.h>

#define LOG_TAG "WhisperWrapper"
#define LOGD(...) __android_log_print(ANDROID_LOG_DEBUG, LOG_TAG, __VA_ARGS__)

// 내부 whisper.cpp 함수와 연결해주는 더미 구현 예시
extern "C"
JNIEXPORT jboolean JNICALL
Java_com_bruste68_englishplayondevice_whisper_WhisperModule_nativeLoadModel(
        JNIEnv *env, jobject thiz, jstring model_path) {
    const char *path = env->GetStringUTFChars(model_path, 0);
    LOGD("Native loadModel called with path: %s", path);
    env->ReleaseStringUTFChars(model_path, path);
    return JNI_TRUE;
}

extern "C"
JNIEXPORT jstring JNICALL
Java_com_bruste68_englishplayondevice_whisper_WhisperModule_nativeTranscribe(
        JNIEnv *env, jobject thiz, jstring audio_path) {
    const char *path = env->GetStringUTFChars(audio_path, 0);
    LOGD("Native transcribe called with path: %s", path);
    env->ReleaseStringUTFChars(audio_path, path);
    return env->NewStringUTF("This is a transcribed result.");
}
