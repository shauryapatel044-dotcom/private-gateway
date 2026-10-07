package com.upigateway.listener

import android.content.ComponentName
import android.content.Intent
import android.os.Bundle
import android.provider.Settings
import android.text.TextUtils
import android.widget.Button
import android.widget.EditText
import android.widget.TextView
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import org.json.JSONObject
import java.io.OutputStreamWriter
import java.net.HttpURLConnection
import java.net.URL

class MainActivity : AppCompatActivity() {

    private lateinit var etServerUrl: EditText
    private lateinit var tvStatus: TextView
    private lateinit var btnSave: Button
    private lateinit var btnPermission: Button
    private lateinit var btnTest: Button

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_main)

        etServerUrl = findViewById(R.id.etServerUrl)
        tvStatus = findViewById(R.id.tvStatus)
        btnSave = findViewById(R.id.btnSave)
        btnPermission = findViewById(R.id.btnPermission)
        btnTest = findViewById(R.id.btnTest)

        val prefs = getSharedPreferences("UpiGatewayPrefs", MODE_PRIVATE)
        val savedUrl = prefs.getString("server_url", "http://192.168.1.5:3000/api/notification-webhook")
        etServerUrl.setText(savedUrl)

        btnSave.setOnClickListener {
            val url = etServerUrl.text.toString().trim()
            if (url.isNotEmpty()) {
                prefs.edit().putString("server_url", url).apply()
                Toast.makeText(this, "Gateway URL Saved!", Toast.LENGTH_SHORT).show()
            }
        }

        btnPermission.setOnClickListener {
            startActivity(Intent(Settings.ACTION_NOTIFICATION_LISTENER_SETTINGS))
        }

        btnTest.setOnClickListener {
            val endpoint = etServerUrl.text.toString().trim()
            CoroutineScope(Dispatchers.IO).launch {
                try {
                    val url = URL(endpoint)
                    val conn = url.openConnection() as HttpURLConnection
                    conn.requestMethod = "POST"
                    conn.setRequestProperty("Content-Type", "application/json")
                    conn.doOutput = true

                    val testPayload = JSONObject().apply {
                        put("packageName", "in.omnicard.app")
                        put("title", "OmniCard Alert: Test Payment")
                        put("text", "Rs. 10.00 credited to your OmniCard via UPI. UPI Ref: 123456789012")
                    }

                    OutputStreamWriter(conn.outputStream).use { it.write(testPayload.toString()) }
                    val code = conn.responseCode
                    runOnUiThread {
                        Toast.makeText(this@MainActivity, "Test Result: HTTP $code", Toast.LENGTH_LONG).show()
                    }
                    conn.disconnect()
                } catch (e: Exception) {
                    runOnUiThread {
                        Toast.makeText(this@MainActivity, "Error: ${e.message}", Toast.LENGTH_LONG).show()
                    }
                }
            }
        }
    }

    override fun onResume() {
        super.onResume()
        updatePermissionStatus()
    }

    private fun updatePermissionStatus() {
        val isGranted = isNotificationServiceEnabled()
        if (isGranted) {
            tvStatus.text = "Status: ACTIVE (Listening for OmniCard & UPI Alerts)"
            tvStatus.setTextColor(android.graphics.Color.GREEN)
        } else {
            tvStatus.text = "Status: PERMISSION REQUIRED (Tap button below)"
            tvStatus.setTextColor(android.graphics.Color.RED)
        }
    }

    private fun isNotificationServiceEnabled(): Boolean {
        val pkgName = packageName
        val flat = Settings.Secure.getString(contentResolver, "enabled_notification_listeners")
        if (!TextUtils.isEmpty(flat)) {
            val names = flat.split(":".toRegex()).toTypedArray()
            for (name in names) {
                val cn = ComponentName.unflattenFromString(name)
                if (cn != null && TextUtils.equals(pkgName, cn.packageName)) {
                    return true
                }
            }
        }
        return false
    }
}
