package com.example.upilistener.ui.main

import android.content.Context
import android.content.Intent
import android.provider.Settings
import android.widget.Toast
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.core.app.NotificationManagerCompat
import androidx.navigation3.runtime.NavKey
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import org.json.JSONObject
import java.io.OutputStreamWriter
import java.net.HttpURLConnection
import java.net.URL

@Composable
fun MainScreen(
    onItemClick: (NavKey) -> Unit = {},
    modifier: Modifier = Modifier
) {
    val context = LocalContext.current
    val coroutineScope = rememberCoroutineScope()
    val prefs = remember { context.getSharedPreferences("UpiGatewayPrefs", Context.MODE_PRIVATE) }

    var serverUrl by remember {
        mutableStateOf(
            prefs.getString("server_url", "http://192.168.1.4:3000/api/notification-webhook")
                ?: "http://192.168.1.4:3000/api/notification-webhook"
        )
    }

    var isListenerEnabled by remember {
        mutableStateOf(
            NotificationManagerCompat.getEnabledListenerPackages(context).contains(context.packageName)
        )
    }

    var isTesting by remember { mutableStateOf(false) }
    var testResult by remember { mutableStateOf<String?>(null) }
    var saveMessage by remember { mutableStateOf<String?>(null) }

    // Recheck permission when screen resumes
    LaunchedEffect(Unit) {
        isListenerEnabled = NotificationManagerCompat.getEnabledListenerPackages(context).contains(context.packageName)
    }

    Scaffold(
        topBar = {
            Surface(
                color = MaterialTheme.colorScheme.surface,
                tonalElevation = 4.dp
            ) {
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .statusBarsPadding()
                        .padding(horizontal = 20.dp, vertical = 16.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Column {
                        Text(
                            text = "UPI Payment Listener",
                            style = MaterialTheme.typography.titleLarge,
                            fontWeight = FontWeight.Bold,
                            color = MaterialTheme.colorScheme.onSurface
                        )
                        Text(
                            text = "OmniCard / UPI Gateway Bridge",
                            style = MaterialTheme.typography.bodySmall,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                    }
                }
            }
        }
    ) { innerPadding ->
        Column(
            modifier = modifier
                .fillMaxSize()
                .padding(innerPadding)
                .verticalScroll(rememberScrollState())
                .padding(20.dp),
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            // Permission Status Card
            Card(
                shape = RoundedCornerShape(16.dp),
                colors = CardDefaults.cardColors(
                    containerColor = if (isListenerEnabled)
                        Color(0xFF0F3822)
                    else
                        Color(0xFF3B2605)
                ),
                modifier = Modifier.fillMaxWidth()
            ) {
                Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        Surface(
                            shape = RoundedCornerShape(50),
                            color = if (isListenerEnabled) Color(0xFF10B981) else Color(0xFFF59E0B),
                            modifier = Modifier.size(10.dp)
                        ) {}
                        Text(
                            text = if (isListenerEnabled) "Notification Access: ACTIVE" else "Notification Access: REQUIRED",
                            fontWeight = FontWeight.Bold,
                            fontSize = 14.sp,
                            color = if (isListenerEnabled) Color(0xFF6EE7B7) else Color(0xFFFDE68A)
                        )
                    }

                    Text(
                        text = if (isListenerEnabled)
                            "The app is actively listening for OmniCard & UPI notifications and will forward credits automatically."
                        else
                            "Android requires you to grant Notification Access so this service can detect incoming UPI payment alerts.",
                        fontSize = 12.sp,
                        color = Color.White.copy(alpha = 0.85f),
                        lineHeight = 16.sp
                    )

                    if (!isListenerEnabled) {
                        Button(
                            onClick = {
                                val intent = Intent(Settings.ACTION_NOTIFICATION_LISTENER_SETTINGS)
                                context.startActivity(intent)
                            },
                            colors = ButtonDefaults.buttonColors(containerColor = Color(0xFFF59E0B)),
                            modifier = Modifier.fillMaxWidth().padding(top = 4.dp),
                            shape = RoundedCornerShape(10.dp)
                        ) {
                            Text("Grant Notification Access", fontWeight = FontWeight.SemiBold, color = Color.Black)
                        }
                    } else {
                        OutlinedButton(
                            onClick = {
                                val intent = Intent(Settings.ACTION_NOTIFICATION_LISTENER_SETTINGS)
                                context.startActivity(intent)
                            },
                            modifier = Modifier.fillMaxWidth().padding(top = 4.dp),
                            shape = RoundedCornerShape(10.dp)
                        ) {
                            Text("Open Notification Settings", fontSize = 12.sp)
                        }
                    }
                }
            }

            // Webhook Configuration Card
            Card(
                shape = RoundedCornerShape(16.dp),
                colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant),
                modifier = Modifier.fillMaxWidth()
            ) {
                Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
                    Text(
                        text = "Payment Gateway Webhook URL",
                        fontWeight = FontWeight.Bold,
                        fontSize = 15.sp,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )

                    Text(
                        text = "Enter your server's endpoint (local WiFi IP or deployed domain):",
                        fontSize = 12.sp,
                        color = MaterialTheme.colorScheme.onSurfaceVariant.copy(alpha = 0.7f)
                    )

                    OutlinedTextField(
                        value = serverUrl,
                        onValueChange = { serverUrl = it },
                        modifier = Modifier.fillMaxWidth(),
                        singleLine = true,
                        placeholder = { Text("http://192.168.1.4:3000/api/notification-webhook") },
                        shape = RoundedCornerShape(10.dp)
                    )

                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        Button(
                            onClick = {
                                prefs.edit().putString("server_url", serverUrl.trim()).apply()
                                saveMessage = "URL saved successfully!"
                                Toast.makeText(context, "Webhook URL saved!", Toast.LENGTH_SHORT).show()
                            },
                            modifier = Modifier.weight(1f),
                            shape = RoundedCornerShape(10.dp)
                        ) {
                            Text("Save URL")
                        }

                        FilledTonalButton(
                            onClick = {
                                isTesting = true
                                testResult = null
                                coroutineScope.launch(Dispatchers.IO) {
                                    try {
                                        val url = URL(serverUrl.trim())
                                        val conn = url.openConnection() as HttpURLConnection
                                        conn.requestMethod = "POST"
                                        conn.setRequestProperty("Content-Type", "application/json; charset=UTF-8")
                                        conn.connectTimeout = 6000
                                        conn.readTimeout = 6000
                                        conn.doOutput = true

                                        val payload = JSONObject().apply {
                                            put("packageName", "com.eroute.omnicard")
                                            put("title", "OmniCard Test Ping")
                                            put("text", "Connection test from UpiListener App")
                                            put("timestamp", System.currentTimeMillis().toString())
                                        }

                                        OutputStreamWriter(conn.outputStream).use { it.write(payload.toString()) }
                                        val code = conn.responseCode
                                        conn.disconnect()

                                        withContext(Dispatchers.Main) {
                                            isTesting = false
                                            testResult = if (code == 200) "✓ Connection Successful (HTTP 200)" else "Server returned HTTP $code"
                                            Toast.makeText(context, "Ping Success (HTTP $code)", Toast.LENGTH_SHORT).show()
                                        }
                                    } catch (e: Exception) {
                                        withContext(Dispatchers.Main) {
                                            isTesting = false
                                            testResult = "Error: ${e.localizedMessage ?: e.message}"
                                            Toast.makeText(context, "Connection Failed", Toast.LENGTH_LONG).show()
                                        }
                                    }
                                }
                            },
                            enabled = !isTesting,
                            modifier = Modifier.weight(1f),
                            shape = RoundedCornerShape(10.dp)
                        ) {
                            Text(if (isTesting) "Pinging..." else "Test Ping")
                        }
                    }

                    if (testResult != null) {
                        Surface(
                            shape = RoundedCornerShape(8.dp),
                            color = if (testResult?.startsWith("✓") == true) Color(0xFF0F3822) else Color(0xFF381010),
                            modifier = Modifier.fillMaxWidth()
                        ) {
                            Text(
                                text = testResult ?: "",
                                fontSize = 12.sp,
                                modifier = Modifier.padding(10.dp),
                                color = if (testResult?.startsWith("✓") == true) Color(0xFF6EE7B7) else Color(0xFFFCA5A5)
                            )
                        }
                    }
                }
            }

            // Monitored Apps Card
            Card(
                shape = RoundedCornerShape(16.dp),
                colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant),
                modifier = Modifier.fillMaxWidth()
            ) {
                Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    Text(
                        text = "Monitored Payment Apps",
                        fontWeight = FontWeight.Bold,
                        fontSize = 14.sp,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )

                    val apps = listOf(
                        "OmniCard (com.eroute.omnicard)",
                        "FamPay (com.fampay.in)",
                        "PhonePe (com.phonepe.app)",
                        "Google Pay (com.google.android.apps.nbu.paisa.user)",
                        "Paytm (net.one97.paytm)",
                        "Any UPI App with credit / Rs. / ₹ alerts"
                    )

                    apps.forEach { app ->
                        Row(
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.spacedBy(6.dp),
                            modifier = Modifier.padding(vertical = 2.dp)
                        ) {
                            Text("•", color = MaterialTheme.colorScheme.primary, fontWeight = FontWeight.Bold)
                            Text(
                                text = app,
                                fontSize = 12.sp,
                                color = MaterialTheme.colorScheme.onSurfaceVariant.copy(alpha = 0.8f)
                            )
                        }
                    }
                }
            }

            // Information Card
            Card(
                shape = RoundedCornerShape(16.dp),
                colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.5f)),
                modifier = Modifier.fillMaxWidth()
            ) {
                Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(6.dp)) {
                    Text(
                        text = "How Verification Works:",
                        fontWeight = FontWeight.SemiBold,
                        fontSize = 13.sp,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                    Text(
                        text = "1. Customer scans UPI QR on your website and pays via any UPI app.\n" +
                               "2. OmniCard sends a push notification to this phone.\n" +
                               "3. This app intercepts the notification and sends the amount + 12-digit UTR to your website in <50ms.\n" +
                               "4. Website confirms the pending order automatically!",
                        fontSize = 12.sp,
                        color = MaterialTheme.colorScheme.onSurfaceVariant.copy(alpha = 0.75f),
                        lineHeight = 18.sp
                    )
                }
            }
        }
    }
}
