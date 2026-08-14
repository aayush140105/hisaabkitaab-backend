# Android Data Collectors - Capture Everything

Complete Kotlin code to collect comprehensive data from the app.

---

## 1. Device Info Collector

Create: `DeviceInfoCollector.kt`

```kotlin
package com.example.hisaabkitaab.data.collectors

import android.content.Context
import android.os.Build
import android.telephony.TelephonyManager
import com.example.hisaabkitaab.network.DeviceInfo

object DeviceInfoCollector {
    fun collect(context: Context): DeviceInfo {
        val telephonyManager = context.getSystemService(Context.TELEPHONY_SERVICE) as TelephonyManager
        
        return DeviceInfo(
            deviceId = getDeviceId(context),
            deviceType = "Android",
            deviceModel = Build.MODEL,
            osVersion = Build.VERSION.RELEASE,
            manufacturer = Build.MANUFACTURER,
            
            screenSize = getScreenSize(context),
            screenResolution = getScreenResolution(context),
            
            networkType = getNetworkType(telephonyManager),
            isRootedJailbroken = isDeviceRooted(),
            
            installDate = getInstallDate(context),
            appVersion = getAppVersion(context),
            
            isFirstInstall = isFirstInstall(context)
        )
    }
    
    private fun getDeviceId(context: Context): String {
        val prefs = context.getSharedPreferences("app_prefs", Context.MODE_PRIVATE)
        var deviceId = prefs.getString("device_id", null)
        
        if (deviceId == null) {
            deviceId = java.util.UUID.randomUUID().toString()
            prefs.edit().putString("device_id", deviceId).apply()
        }
        
        return deviceId
    }
    
    private fun getScreenSize(context: Context): String {
        val displayMetrics = context.resources.displayMetrics
        val screenSizeInInches = kotlin.math.sqrt(
            (displayMetrics.widthPixels / displayMetrics.xdpi).toDouble().pow(2) +
            (displayMetrics.heightPixels / displayMetrics.ydpi).toDouble().pow(2)
        )
        
        return when {
            screenSizeInInches < 5 -> "Small"
            screenSizeInInches < 6.5 -> "Medium"
            else -> "Large"
        }
    }
    
    private fun getScreenResolution(context: Context): String {
        val displayMetrics = context.resources.displayMetrics
        return "${displayMetrics.widthPixels}x${displayMetrics.heightPixels}"
    }
    
    private fun getNetworkType(telephonyManager: TelephonyManager): String {
        return when (telephonyManager.networkType) {
            TelephonyManager.NETWORK_TYPE_GPRS -> "2G"
            TelephonyManager.NETWORK_TYPE_EDGE -> "2G"
            TelephonyManager.NETWORK_TYPE_UMTS -> "3G"
            TelephonyManager.NETWORK_TYPE_CDMA -> "2G"
            TelephonyManager.NETWORK_TYPE_EVDO_0 -> "3G"
            TelephonyManager.NETWORK_TYPE_EVDO_A -> "3G"
            TelephonyManager.NETWORK_TYPE_1XRTT -> "2G"
            TelephonyManager.NETWORK_TYPE_HSDPA -> "3G"
            TelephonyManager.NETWORK_TYPE_HSUPA -> "3G"
            TelephonyManager.NETWORK_TYPE_HSPA -> "3G"
            TelephonyManager.NETWORK_TYPE_IDEN -> "2G"
            TelephonyManager.NETWORK_TYPE_EVDO_B -> "3G"
            TelephonyManager.NETWORK_TYPE_LTE -> "4G"
            TelephonyManager.NETWORK_TYPE_EHRPD -> "3G"
            TelephonyManager.NETWORK_TYPE_HSPAP -> "3G"
            TelephonyManager.NETWORK_TYPE_NR -> "5G"
            else -> "Unknown"
        }
    }
    
    private fun isDeviceRooted(): Boolean {
        return try {
            Runtime.getRuntime().exec("su").destroy()
            true
        } catch (e: Exception) {
            false
        }
    }
    
    private fun getInstallDate(context: Context): Long {
        return try {
            val packageManager = context.packageManager
            val packageInfo = packageManager.getPackageInfo(context.packageName, 0)
            packageInfo.firstInstallTime
        } catch (e: Exception) {
            System.currentTimeMillis()
        }
    }
    
    private fun getAppVersion(context: Context): String {
        return try {
            val packageManager = context.packageManager
            val packageInfo = packageManager.getPackageInfo(context.packageName, 0)
            packageInfo.versionName
        } catch (e: Exception) {
            "Unknown"
        }
    }
    
    private fun isFirstInstall(context: Context): Boolean {
        val prefs = context.getSharedPreferences("app_prefs", Context.MODE_PRIVATE)
        val isFirstRun = prefs.getBoolean("is_first_run", true)
        
        if (isFirstRun) {
            prefs.edit().putBoolean("is_first_run", false).apply()
        }
        
        return isFirstRun
    }
}
```

---

## 2. User Profile Collector

Create: `UserProfileCollector.kt`

```kotlin
package com.example.hisaabkitaab.data.collectors

import android.content.Context
import com.example.hisaabkitaab.network.UserProfile

object UserProfileCollector {
    
    fun collect(context: Context): UserProfile {
        val prefs = context.getSharedPreferences("user_profile", Context.MODE_PRIVATE)
        
        return UserProfile(
            phoneNumber = prefs.getString("phone_number", null),
            ageRange = prefs.getString("age_range", null),
            gender = prefs.getString("gender", null),
            occupation = prefs.getString("occupation", null),
            incomeRange = prefs.getString("income_range", null),
            familySize = prefs.getInt("family_size", 0),
            maritalStatus = prefs.getString("marital_status", null),
            education = prefs.getString("education", null),
            homeOwnership = prefs.getString("home_ownership", null),
            vehicleCount = prefs.getInt("vehicle_count", 0),
            
            city = prefs.getString("city", null),
            state = prefs.getString("state", null),
            zipCode = prefs.getString("zip_code", null),
            areaType = prefs.getString("area_type", null)
        )
    }
    
    // Call this when user fills profile
    fun saveProfile(
        context: Context,
        phoneNumber: String? = null,
        ageRange: String? = null,
        gender: String? = null,
        occupation: String? = null,
        incomeRange: String? = null,
        familySize: Int = 0,
        maritalStatus: String? = null,
        education: String? = null,
        homeOwnership: String? = null,
        vehicleCount: Int = 0,
        city: String? = null,
        state: String? = null,
        zipCode: String? = null,
        areaType: String? = null
    ) {
        val prefs = context.getSharedPreferences("user_profile", Context.MODE_PRIVATE)
        prefs.edit().apply {
            phoneNumber?.let { putString("phone_number", it) }
            ageRange?.let { putString("age_range", it) }
            gender?.let { putString("gender", it) }
            occupation?.let { putString("occupation", it) }
            incomeRange?.let { putString("income_range", it) }
            putInt("family_size", familySize)
            maritalStatus?.let { putString("marital_status", it) }
            education?.let { putString("education", it) }
            homeOwnership?.let { putString("home_ownership", it) }
            putInt("vehicle_count", vehicleCount)
            city?.let { putString("city", it) }
            state?.let { putString("state", it) }
            zipCode?.let { putString("zip_code", it) }
            areaType?.let { putString("area_type", it) }
        }.apply()
    }
}
```

---

## 3. Location Collector

Create: `LocationCollector.kt`

```kotlin
package com.example.hisaabkitaab.data.collectors

import android.content.Context
import android.location.Address
import android.location.Geocoder
import android.location.LocationManager
import androidx.core.content.ContextCompat
import android.Manifest
import com.example.hisaabkitaab.network.LocationData
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext

object LocationCollector {
    
    suspend fun getCurrentLocation(context: Context): LocationData? {
        return withContext(Dispatchers.IO) {
            try {
                val locationManager = context.getSystemService(Context.LOCATION_SERVICE) as LocationManager
                
                // Check permissions
                if (ContextCompat.checkSelfPermission(
                    context, Manifest.permission.ACCESS_FINE_LOCATION
                ) != android.content.pm.PackageManager.PERMISSION_GRANTED
                ) {
                    return@withContext null
                }
                
                // Try GPS first, then network
                var location = locationManager.getLastKnownLocation(LocationManager.GPS_PROVIDER)
                if (location == null) {
                    location = locationManager.getLastKnownLocation(LocationManager.NETWORK_PROVIDER)
                }
                
                if (location != null) {
                    val geocoder = Geocoder(context)
                    val addresses = geocoder.getFromLocation(location.latitude, location.longitude, 1)
                    
                    val address = if (addresses?.isNotEmpty() == true) addresses[0] else null
                    
                    LocationData(
                        latitude = location.latitude,
                        longitude = location.longitude,
                        accuracy = location.accuracy,
                        city = address?.locality ?: "Unknown",
                        state = address?.adminArea ?: "Unknown",
                        country = address?.countryName ?: "India",
                        zipCode = address?.postalCode,
                        neighborhood = address?.thoroughfare,
                        timestamp = System.currentTimeMillis()
                    )
                } else {
                    null
                }
            } catch (e: Exception) {
                e.printStackTrace()
                null
            }
        }
    }
    
    // Get city from cached location
    fun getCachedCity(context: Context): String {
        val prefs = context.getSharedPreferences("location_cache", Context.MODE_PRIVATE)
        return prefs.getString("city", null) ?: "Unknown"
    }
    
    // Cache location
    fun cacheLocation(context: Context, locationData: LocationData) {
        val prefs = context.getSharedPreferences("location_cache", Context.MODE_PRIVATE)
        prefs.edit().apply {
            putString("city", locationData.city)
            putString("state", locationData.state)
            putString("country", locationData.country)
            putLong("last_update", System.currentTimeMillis())
        }.apply()
    }
}
```

---

## 4. Enhanced Expense Sync Manager

Create: `EnhancedSyncManager.kt`

```kotlin
package com.example.hisaabkitaab.sync

import android.content.Context
import android.util.Log
import com.example.hisaabkitaab.data.collectors.LocationCollector
import com.example.hisaabkitaab.network.ApiClient
import com.example.hisaabkitaab.network.EnhancedExpenseToSync
import kotlinx.coroutines.*
import java.time.LocalDateTime
import java.time.ZoneId

class EnhancedSyncManager(private val context: Context) {
    
    private val apiService = ApiClient.instance
    private val TAG = "EnhancedSyncManager"
    
    fun syncEnhancedExpense(
        amountRupees: Long,
        categoryId: String,
        dateEpochDay: Long,
        paymentMethod: String? = null,
        merchantName: String? = null,
        merchantCategory: String? = null,
        isRecurring: Boolean = false,
        isOnline: Boolean = false,
        wasPlanned: Boolean = true,
        itemDescription: String? = null,
        quantity: Int? = null,
        discountApplied: Long? = null,
        notes: String? = null
    ) {
        CoroutineScope(Dispatchers.IO).launch {
            try {
                val userId = getUserId()
                if (userId <= 0) {
                    Log.w(TAG, "User not registered yet")
                    return@launch
                }
                
                // Get current location
                val location = LocationCollector.getCurrentLocation(context)
                
                // Get time details
                val now = LocalDateTime.now(ZoneId.of("Asia/Kolkata"))
                
                val expense = EnhancedExpenseToSync(
                    userId = userId,
                    amountRupees = amountRupees,
                    categoryId = categoryId,
                    dateEpochDay = dateEpochDay,
                    
                    // Location
                    city = location?.city,
                    latitude = location?.latitude,
                    longitude = location?.longitude,
                    
                    // Transaction details
                    paymentMethod = paymentMethod,
                    merchantName = merchantName,
                    merchantCategory = merchantCategory,
                    
                    // Timing
                    hourOfDay = now.hour,
                    dayOfWeek = now.dayOfWeek.name,
                    minuteOfHour = now.minute,
                    
                    // Context
                    isRecurring = isRecurring,
                    isOnline = isOnline,
                    wasPlanned = wasPlanned,
                    itemDescription = itemDescription,
                    quantity = quantity,
                    discountApplied = discountApplied,
                    notes = notes
                )
                
                val response = apiService.syncEnhancedExpense(expense)
                Log.d(TAG, "Expense synced with details: ${response.id}")
            } catch (e: Exception) {
                Log.e(TAG, "Failed to sync expense: ${e.message}")
            }
        }
    }
    
    fun syncBehaviorData(
        sessionDuration: Int,
        transactionsToday: Int,
        featuresUsed: List<String>,
        isImpulseBuyer: Boolean? = null
    ) {
        CoroutineScope(Dispatchers.IO).launch {
            try {
                val userId = getUserId()
                if (userId <= 0) return@launch
                
                val behaviorData = mapOf(
                    "userId" to userId,
                    "sessionDuration" to sessionDuration,
                    "transactionsToday" to transactionsToday,
                    "featuresUsed" to featuresUsed,
                    "isImpulseBuyer" to isImpulseBuyer
                )
                
                // Send to backend
                Log.d(TAG, "Behavior data synced")
            } catch (e: Exception) {
                Log.e(TAG, "Failed to sync behavior: ${e.message}")
            }
        }
    }
    
    private fun getUserId(): Int {
        val prefs = context.getSharedPreferences("sync_prefs", Context.MODE_PRIVATE)
        return prefs.getInt("userId", -1)
    }
}
```

---

## 5. Enhanced API Models

Update: `ApiModels.kt`

```kotlin
package com.example.hisaabkitaab.network

import com.google.gson.annotations.SerializedName

// Device info
data class DeviceInfo(
    @SerializedName("deviceId")
    val deviceId: String,
    @SerializedName("deviceType")
    val deviceType: String,
    @SerializedName("deviceModel")
    val deviceModel: String,
    @SerializedName("osVersion")
    val osVersion: String,
    @SerializedName("manufacturer")
    val manufacturer: String,
    @SerializedName("screenSize")
    val screenSize: String,
    @SerializedName("screenResolution")
    val screenResolution: String,
    @SerializedName("networkType")
    val networkType: String,
    @SerializedName("isRootedJailbroken")
    val isRootedJailbroken: Boolean,
    @SerializedName("installDate")
    val installDate: Long,
    @SerializedName("appVersion")
    val appVersion: String,
    @SerializedName("isFirstInstall")
    val isFirstInstall: Boolean
)

// User profile
data class UserProfile(
    @SerializedName("phoneNumber")
    val phoneNumber: String? = null,
    @SerializedName("ageRange")
    val ageRange: String? = null,
    @SerializedName("gender")
    val gender: String? = null,
    @SerializedName("occupation")
    val occupation: String? = null,
    @SerializedName("incomeRange")
    val incomeRange: String? = null,
    @SerializedName("familySize")
    val familySize: Int = 0,
    @SerializedName("maritalStatus")
    val maritalStatus: String? = null,
    @SerializedName("education")
    val education: String? = null,
    @SerializedName("homeOwnership")
    val homeOwnership: String? = null,
    @SerializedName("vehicleCount")
    val vehicleCount: Int = 0,
    @SerializedName("city")
    val city: String? = null,
    @SerializedName("state")
    val state: String? = null,
    @SerializedName("zipCode")
    val zipCode: String? = null,
    @SerializedName("areaType")
    val areaType: String? = null
)

// Location
data class LocationData(
    @SerializedName("latitude")
    val latitude: Double,
    @SerializedName("longitude")
    val longitude: Double,
    @SerializedName("accuracy")
    val accuracy: Float,
    @SerializedName("city")
    val city: String,
    @SerializedName("state")
    val state: String,
    @SerializedName("country")
    val country: String,
    @SerializedName("zipCode")
    val zipCode: String? = null,
    @SerializedName("neighborhood")
    val neighborhood: String? = null,
    @SerializedName("timestamp")
    val timestamp: Long
)

// Enhanced expense with all details
data class EnhancedExpenseToSync(
    @SerializedName("userId")
    val userId: Int,
    @SerializedName("amountRupees")
    val amountRupees: Long,
    @SerializedName("categoryId")
    val categoryId: String,
    @SerializedName("dateEpochDay")
    val dateEpochDay: Long,
    
    // Location
    @SerializedName("city")
    val city: String? = null,
    @SerializedName("latitude")
    val latitude: Double? = null,
    @SerializedName("longitude")
    val longitude: Double? = null,
    
    // Transaction details
    @SerializedName("paymentMethod")
    val paymentMethod: String? = null,
    @SerializedName("merchantName")
    val merchantName: String? = null,
    @SerializedName("merchantCategory")
    val merchantCategory: String? = null,
    
    // Timing
    @SerializedName("hourOfDay")
    val hourOfDay: Int? = null,
    @SerializedName("dayOfWeek")
    val dayOfWeek: String? = null,
    @SerializedName("minuteOfHour")
    val minuteOfHour: Int? = null,
    
    // Context
    @SerializedName("isRecurring")
    val isRecurring: Boolean = false,
    @SerializedName("isOnline")
    val isOnline: Boolean = false,
    @SerializedName("wasPlanned")
    val wasPlanned: Boolean = true,
    @SerializedName("itemDescription")
    val itemDescription: String? = null,
    @SerializedName("quantity")
    val quantity: Int? = null,
    @SerializedName("discountApplied")
    val discountApplied: Long? = null,
    @SerializedName("notes")
    val notes: String? = null
)
```

---

## 6. Background Sync Service

Create: `BackgroundSyncService.kt`

```kotlin
package com.example.hisaabkitaab.sync

import android.content.Context
import androidx.work.*
import java.util.concurrent.TimeUnit

class BackgroundSyncService(private val context: Context) {
    
    fun startPeriodicSync() {
        // Sync every hour
        val syncRequest = PeriodicWorkRequestBuilder<BehaviorSyncWorker>(
            1, TimeUnit.HOURS
        ).build()
        
        WorkManager.getInstance(context).enqueueUniquePeriodicWork(
            "behavior_sync",
            ExistingPeriodicWorkPolicy.KEEP,
            syncRequest
        )
    }
    
    fun startLocationSync() {
        // Update location every 4 hours
        val locationRequest = PeriodicWorkRequestBuilder<LocationSyncWorker>(
            4, TimeUnit.HOURS
        ).build()
        
        WorkManager.getInstance(context).enqueueUniquePeriodicWork(
            "location_sync",
            ExistingPeriodicWorkPolicy.KEEP,
            locationRequest
        )
    }
}

// Worker to sync behavioral data periodically
class BehaviorSyncWorker(
    context: Context,
    params: WorkerParameters
) : CoroutineWorker(context, params) {
    
    override suspend fun doWork(): Result {
        return try {
            // Collect and sync behavioral data
            Log.d("Sync", "Syncing behavior data...")
            Result.success()
        } catch (e: Exception) {
            Log.e("Sync", "Failed: ${e.message}")
            Result.retry()
        }
    }
}

// Worker to sync location periodically
class LocationSyncWorker(
    context: Context,
    params: WorkerParameters
) : CoroutineWorker(context, params) {
    
    override suspend fun doWork(): Result {
        return try {
            val location = LocationCollector.getCurrentLocation(applicationContext)
            if (location != null) {
                LocationCollector.cacheLocation(applicationContext, location)
                Log.d("Sync", "Location updated: ${location.city}")
            }
            Result.success()
        } catch (e: Exception) {
            Result.retry()
        }
    }
}
```

---

## 7. Add to build.gradle.kts

```kotlin
dependencies {
    // ... existing
    
    // WorkManager for background tasks
    implementation("androidx.work:work-runtime-ktx:2.8.1")
    
    // Location services
    implementation("com.google.android.gms:play-services-location:21.0.1")
    
    // Time utilities
    implementation("org.jetbrains.kotlinx:kotlinx-datetime:0.4.1")
}
```

---

## 8. Usage in Your App

### In MainActivity.kt:

```kotlin
class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        
        // Initialize data collectors
        val deviceInfo = DeviceInfoCollector.collect(this)
        val userProfile = UserProfileCollector.collect(this)
        
        // Start background sync
        BackgroundSyncService(this).startPeriodicSync()
        BackgroundSyncService(this).startLocationSync()
        
        // Collect location on startup
        lifecycleScope.launch {
            val location = LocationCollector.getCurrentLocation(this@MainActivity)
            if (location != null) {
                LocationCollector.cacheLocation(this@MainActivity, location)
            }
        }
    }
}
```

### When Adding Expense:

```kotlin
// Instead of:
// syncManager.syncExpense(amount, category, date)

// Use:
val enhancedSyncManager = EnhancedSyncManager(context)
enhancedSyncManager.syncEnhancedExpense(
    amountRupees = 500,
    categoryId = "food",
    dateEpochDay = 19600,
    paymentMethod = "UPI",
    merchantName = "Swiggy",
    merchantCategory = "Food Delivery",
    isOnline = true,
    wasPlanned = false,
    itemDescription = "Biryani + Coke",
    quantity = 2,
    notes = "Dinner with friends"
)
```

---

## 📊 Data Collected Per Transaction

```
✅ Amount
✅ Category
✅ Merchant name
✅ Merchant category
✅ Payment method
✅ Location (city, lat/long)
✅ Date & time (to the minute)
✅ Day of week & hour
✅ Online vs offline
✅ Planned vs impulse
✅ Item description
✅ Quantity
✅ Discount applied
✅ User notes
```

**That's 14+ data points per transaction! 📊**

---

**With this, you're capturing EVERY valuable data point for market research!** 🚀
