package com.bruste68.englishplayondevice.whisper

import android.util.Log
import com.facebook.react.bridge.*
import com.facebook.react.module.annotations.ReactModule

@ReactModule(name = "Whisper")
class WhisperModule(private val context: ReactApplicationContext) : ReactContextBaseJavaModule(context) {

    init {
        try {
            System.loadLibrary("cpp")  // CMake로 빌드한 so 라이브러리
            Log.d(TAG, "✅ JNI 라이브러리 로드 성공")
        } catch (e: UnsatisfiedLinkError) {
            Log.e(TAG, "❌ JNI 라이브러리 로드 실패", e)
        }
    }

    override fun getName(): String {
        return "Whisper"
    }

    @ReactMethod
    fun getWhisperVersion(promise: Promise) {
        try {
            promise.resolve("Whisper Native Module v1.0")
        } catch (e: Exception) {
            promise.reject("ERROR", e)
        }
    }

    @ReactMethod
    fun testLog() {
        Log.d(TAG, "✅ testLog() 호출됨!")
    }

    // ✅ JNI 연결 함수
    external fun nativeLoadModel(path: String): Boolean
    external fun nativeTranscribe(audioPath: String): String

    @ReactMethod
    fun loadModel(path: String, promise: Promise) {
        try {
            val success = nativeLoadModel(path)
            if (success) {
                promise.resolve(true)
            } else {
                throw Exception("Model load failed in native code")
            }
        } catch (e: Exception) {
            promise.reject("LOAD_MODEL_FAILED", e)
        }
    }

    @ReactMethod
    fun transcribe(audioPath: String, promise: Promise) {
        try {
            val result = nativeTranscribe(audioPath)
            promise.resolve(result)
        } catch (e: Exception) {
            promise.reject("TRANSCRIBE_FAILED", e)
        }
    }

    companion object {
        private const val TAG = "WhisperModule"
    }
}
