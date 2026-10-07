package com.upigateway.listener

import android.service.notification.NotificationListenerService
import android.service.notification.StatusBarNotification
import android.util.Log
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import org.json.JSONObject
import java.io.OutputStreamWriter
import java.net.HttpURLConnection
import java.net.URL

class NotificationService : NotificationListenerService() {

    private val TAG = "UPI_NotificationListener"

    override fun onNotificationPosted(sbn: StatusBarNotification?) {
        super.onNotificationPosted(sbn)
        if (sbn == null) return

        val packageName = sbn.packageName ?: ""
        val extras = sbn.notification.extras
        val title = extras.getString("android.title") ?: ""
        val text = extras.getCharSequence("android.text")?.toString() ?: ""

        val combined = "$title $text".lowercase()

        // Filter for financial and UPI notification keywords
        val isFinancial = combined.contains("omnicard") ||
                combined.contains("credited") ||
                combined.contains("received") ||
                combined.contains("upi") ||
                combined.contains("fampay") ||
                combined.contains("rs.") ||
                combined.contains("₹")

        if (!isFinancial) {
            return
        }

        Log.d(TAG, "Intercepted Payment Notification from [$packageName]: Title='$title' Text='$text'")

        // Retrieve server webhook URL from SharedPreferences
        val prefs = getSharedPreferences("UpiGatewayPrefs", MODE_PRIVATE)
        val serverUrl = prefs.getString("server_url", "http://192.168.1.5:3000/api/notification-webhook") ?: return

        // Dispatch HTTP POST to UPI Gateway in background
        CoroutineScope(Dispatchers.IO).launch {
            postNotificationToGateway(serverUrl, packageName, title, text)
        }
    }

    private fun postNotificationToGateway(endpointUrl: String, pkg: String, title: String, text: String) {
        try {
            val url = URL(endpointUrl)
            val conn = url.openConnection() as HttpURLConnection
            conn.requestMethod = "POST"
            conn.setRequestProperty("Content-Type", "application/json; charset=UTF-8")
            conn.connectTimeout = 8000
            conn.readTimeout = 8000
            conn.doOutput = true

            val payload = JSONObject().apply {
                put("packageName", pkg)
                put("title", title)
                put("text", text)
                put("timestamp", System.currentTimeMillis().toString())
            }

            OutputStreamWriter(conn.outputStream).use { it.write(payload.toString()) }

            val responseCode = conn.responseCode
            Log.d(TAG, "Dispatched notification to gateway: HTTP $responseCode")
            conn.disconnect()
        } catch (e: Exception) {
            Log.e(TAG, "Failed to send notification to gateway: ${e.message}")
        }
    }
}
