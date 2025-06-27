package com.bruste68.englishplayondevice

import android.os.Bundle
import android.content.Context
import android.net.ConnectivityManager
import android.net.NetworkInfo
import android.widget.Toast
import androidx.appcompat.app.AlertDialog
import com.facebook.react.ReactActivity
import com.facebook.react.ReactActivityDelegate
import expo.modules.ReactActivityDelegateWrapper
import com.bruste68.englishplayondevice.R
import com.bruste68.englishplayondevice.BuildConfig

class MainActivity : ReactActivity() {

  override fun getMainComponentName(): String = "main"

  override fun createReactActivityDelegate(): ReactActivityDelegate {
    return ReactActivityDelegateWrapper(this, ReactActivityDelegate(this, mainComponentName))
  }

  override fun onCreate(savedInstanceState: Bundle?) {
    super.onCreate(savedInstanceState)

    if (BuildConfig.DEBUG) {
        println("App is in Debug mode")
    }

    // 다운로드 시작 시 네트워크 상태 확인
    checkNetworkAndDownload()
  }

  private fun checkNetworkAndDownload() {
    val connectivityManager = getSystemService(Context.CONNECTIVITY_SERVICE) as ConnectivityManager
    val activeNetwork: NetworkInfo? = connectivityManager.activeNetworkInfo

    if (activeNetwork != null && activeNetwork.isConnected) {
        if (activeNetwork.type == ConnectivityManager.TYPE_WIFI) {
            // Wi-Fi 연결 시 다운로드 진행
            startDownload()
        } else if (activeNetwork.type == ConnectivityManager.TYPE_MOBILE) {
            // 모바일 데이터 연결 시 확인 대화 상자 표시
            showMobileDataWarning()
        }
    } else {
        Toast.makeText(this, "인터넷에 연결되어 있지 않습니다.", Toast.LENGTH_SHORT).show()
    }
  }

  private fun showMobileDataWarning() {
    AlertDialog.Builder(this)
        .setTitle("모바일 데이터")
        .setMessage("모바일 데이터로 다운로드하시겠습니까? 데이터 요금이 부과될 수 있습니다.")
        .setPositiveButton("다운로드") { _, _ -> startDownload() }
        .setNegativeButton("취소", null)
        .show()
  }

  private fun startDownload() {
    // 다운로드 로직을 추가하세요
    Toast.makeText(this, "다운로드를 시작합니다.", Toast.LENGTH_SHORT).show()
  }

  override fun invokeDefaultOnBackPressed() {
    super.onBackPressed()
  }
}
