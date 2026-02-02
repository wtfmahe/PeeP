package expo.modules.usagestats

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.app.Service
import android.app.usage.UsageStatsManager
import android.content.Context
import android.content.Intent
import android.os.Build
import android.os.Handler
import android.os.IBinder
import android.os.Looper
import android.util.Log
import androidx.core.app.NotificationCompat
import java.net.HttpURLConnection
import java.net.URL
import java.util.concurrent.Executors

class StatusBroadcastService : Service() {
    
    companion object {
        private const val TAG = "StatusBroadcastService"
        private const val CHANNEL_ID = "peep_status_channel"
        private const val NOTIFICATION_ID = 1001
        private const val BROADCAST_INTERVAL = 30000L // 30 seconds
        
        var supabaseUrl: String? = null
        var supabaseKey: String? = null
        var userId: String? = null
        var accessToken: String? = null
    }
    
    private val handler = Handler(Looper.getMainLooper())
    private val executor = Executors.newSingleThreadExecutor()
    private var isRunning = false
    
    private val broadcastRunnable = object : Runnable {
        override fun run() {
            if (isRunning) {
                broadcastStatus()
                handler.postDelayed(this, BROADCAST_INTERVAL)
            }
        }
    }
    
    override fun onCreate() {
        super.onCreate()
        createNotificationChannel()
    }
    
    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        Log.d(TAG, "Service starting...")
        
        // Get data from intent
        intent?.let {
            supabaseUrl = it.getStringExtra("supabaseUrl")
            supabaseKey = it.getStringExtra("supabaseKey")
            userId = it.getStringExtra("userId")
            accessToken = it.getStringExtra("accessToken")
        }
        
        // Start foreground service with notification
        val notification = createNotification()
        startForeground(NOTIFICATION_ID, notification)
        
        // Start broadcasting
        isRunning = true
        handler.post(broadcastRunnable)
        
        Log.d(TAG, "Service started for user: $userId")
        return START_STICKY
    }
    
    override fun onDestroy() {
        Log.d(TAG, "Service stopping...")
        isRunning = false
        handler.removeCallbacks(broadcastRunnable)
        super.onDestroy()
    }
    
    override fun onBind(intent: Intent?): IBinder? = null
    
    private fun createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(
                CHANNEL_ID,
                "Peep Status",
                NotificationManager.IMPORTANCE_LOW
            ).apply {
                description = "Broadcasts your app activity to friends"
                setShowBadge(false)
            }
            
            val notificationManager = getSystemService(NotificationManager::class.java)
            notificationManager.createNotificationChannel(channel)
        }
    }
    
    private fun createNotification(): Notification {
        val intent = packageManager.getLaunchIntentForPackage(packageName)
        val pendingIntent = PendingIntent.getActivity(
            this, 0, intent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )
        
        return NotificationCompat.Builder(this, CHANNEL_ID)
            .setContentTitle("Peep")
            .setContentText("Sharing your activity with friends")
            .setSmallIcon(android.R.drawable.ic_menu_view)
            .setContentIntent(pendingIntent)
            .setOngoing(true)
            .setPriority(NotificationCompat.PRIORITY_LOW)
            .build()
    }
    
    private fun broadcastStatus() {
        executor.execute {
            try {
                val currentApp = getForegroundApp()
                if (currentApp != null && userId != null && supabaseUrl != null) {
                    val friendlyName = getFriendlyAppName(currentApp)
                    sendToSupabase(currentApp, friendlyName)
                    Log.d(TAG, "Broadcasted: $friendlyName")
                }
            } catch (e: Exception) {
                Log.e(TAG, "Broadcast error: ${e.message}")
            }
        }
    }
    
    private fun getForegroundApp(): String? {
        val usageStatsManager = getSystemService(Context.USAGE_STATS_SERVICE) as UsageStatsManager
        val endTime = System.currentTimeMillis()
        val beginTime = endTime - 10000 // Last 10 seconds
        
        val usageStats = usageStatsManager.queryUsageStats(
            UsageStatsManager.INTERVAL_DAILY,
            beginTime,
            endTime
        )
        
        if (usageStats.isNullOrEmpty()) return null
        
        return usageStats
            .filter { it.lastTimeUsed > 0 && it.packageName != packageName }
            .maxByOrNull { it.lastTimeUsed }
            ?.packageName
    }
    
    private fun getFriendlyAppName(packageName: String): String {
        val appMap = mapOf(
            "com.google.android.youtube" to "Watching YouTube 📺",
            "com.instagram.android" to "On Instagram 📸",
            "com.whatsapp" to "Chatting on WhatsApp 💬",
            "com.twitter.android" to "On Twitter/X 🐦",
            "com.facebook.katana" to "On Facebook 📘",
            "com.spotify.music" to "Listening to Spotify 🎵",
            "com.netflix.mediaclient" to "Watching Netflix 🎬",
            "com.snapchat.android" to "On Snapchat 👻",
            "com.zhiliaoapp.musically" to "Scrolling TikTok 🎵",
            "com.google.android.gm" to "Checking Email 📧",
            "com.google.android.apps.maps" to "Using Maps 🗺️",
            "com.android.chrome" to "Browsing Chrome 🌐",
            "com.google.android.dialer" to "On a Call 📞"
        )
        
        return appMap[packageName] ?: "Using ${packageName.split(".").last()} 📱"
    }
    
    private fun sendToSupabase(currentApp: String, friendlyName: String) {
        val url = URL("$supabaseUrl/rest/v1/user_status?on_conflict=user_id")
        val connection = url.openConnection() as HttpURLConnection
        
        try {
            connection.requestMethod = "POST"
            connection.setRequestProperty("Content-Type", "application/json")
            connection.setRequestProperty("apikey", supabaseKey)
            connection.setRequestProperty("Authorization", "Bearer $accessToken")
            connection.setRequestProperty("Prefer", "resolution=merge-duplicates")
            connection.doOutput = true
            
            val jsonBody = """
                {
                    "user_id": "$userId",
                    "current_app": "$currentApp",
                    "friendly_name": "$friendlyName",
                    "updated_at": "${java.time.Instant.now()}"
                }
            """.trimIndent()
            
            connection.outputStream.use { os ->
                os.write(jsonBody.toByteArray())
            }
            
            val responseCode = connection.responseCode
            if (responseCode != 200 && responseCode != 201) {
                Log.e(TAG, "Supabase error: $responseCode")
            }
        } finally {
            connection.disconnect()
        }
    }
}
