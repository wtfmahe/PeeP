package expo.modules.usagestats

import android.app.AppOpsManager
import android.app.usage.UsageStats
import android.app.usage.UsageStatsManager
import android.content.Context
import android.content.Intent
import android.os.Process
import android.provider.Settings
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import java.util.Calendar

class UsageStatsModule : Module() {
  override fun definition() = ModuleDefinition {
    Name("UsageStats")

    Function("hasPermission") {
      val context = context
      val appOps = context.getSystemService(Context.APP_OPS_SERVICE) as AppOpsManager
      val mode = appOps.checkOpNoThrow(
        AppOpsManager.OPSTR_GET_USAGE_STATS,
        Process.myUid(),
        context.packageName
      )
      return@Function mode == AppOpsManager.MODE_ALLOWED
    }

    Function("requestPermission") {
      val context = context
      val intent = Intent(Settings.ACTION_USAGE_ACCESS_SETTINGS)
      intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
      context.startActivity(intent)
    }

    Function("getForegroundApp") {
      val context = context
      val usageStatsManager = context.getSystemService(Context.USAGE_STATS_SERVICE) as UsageStatsManager
      val endTime = System.currentTimeMillis()
      val startTime = endTime - 1000 * 60 * 5 // 5 minutes ago for better history

      val usageStatsList = usageStatsManager.queryUsageStats(
        UsageStatsManager.INTERVAL_DAILY,
        startTime,
        endTime
      )

      if (usageStatsList != null && usageStatsList.isNotEmpty()) {
        // Sort by last time used (most recent first)
        val sortedStats = usageStatsList
          .filter { it.lastTimeUsed > 0 }
          .sortedByDescending { it.lastTimeUsed }
        
        // Find the first app that is NOT our own app (simulate getting friend's activity)
        val ownPackage = context.packageName // com.anonymous.peep
        for (stat in sortedStats) {
          if (stat.packageName != ownPackage && 
              !stat.packageName.contains("launcher") &&
              !stat.packageName.contains("systemui")) {
            return@Function stat.packageName
          }
        }
      }
      return@Function null
    }
  }

  private val context: Context
    get() = appContext.reactContext ?: throw IllegalStateException("React context is null")
}
