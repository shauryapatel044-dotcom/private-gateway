# UPI Gateway Notification Listener (Android App)

This Android app runs in the background and intercepts incoming push notifications from **OmniCard**, **PhonePe**, **Paytm**, **FamPay**, or SMS. Whenever a payment alert is received, it extracts the title and body and posts it via HTTP POST to:

```
POST http://<your-ip-or-domain>:3000/api/notification-webhook
```

The gateway extracts the ₹ amount and 12-digit UTR, automatically reconciles the matching order, and marks it as **SUCCESS**.

---

## ⚡ Option A: Instant 60-Second Setup with MacroDroid (No Android Studio Needed!)

If you want to start right away without building an APK from source:

1. Install **[MacroDroid](https://play.google.com/store/apps/details?id=com.arlosoft.macrodroid)** (Free on Google Play Store).
2. Click **Add Macro**:
   - **Trigger**: Notifications → Notification Received → Select Applications: **OmniCard** (or any UPI app).
   - **Action**: Applications → HTTP Request:
     - Method: `POST`
     - URL: `http://<your-ip-or-domain>:3000/api/notification-webhook`
     - Content Type: `application/json`
     - Body:
       ```json
       {
         "packageName": "{not_pkg_name}",
         "title": "{not_title}",
         "text": "{not_body}"
       }
       ```
3. Save the Macro. Whenever your phone receives an OmniCard payment notification, MacroDroid immediately fires the webhook to your gateway and confirms the order!

---

## 🛠️ Option B: Build the Native Android Studio Project

1. Open this folder in **Android Studio**:
   `upi-gateway/android-notification-listener/`
2. Connect your Android phone via USB (or use an emulator) and click **Run / Build APK**.
3. Open the app on your phone:
   - Enter your Gateway URL (e.g. `http://192.168.1.5:3000/api/notification-webhook` or your Vercel/Ngrok domain).
   - Tap **Enable Notification Listener Permission** and toggle ON.
   - Tap **Send Test Ping to Gateway** to verify.
4. The service will run in the background and forward all OmniCard payment alerts automatically.
