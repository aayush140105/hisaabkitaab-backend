# Android Integration - Step by Step

Copy-paste these files into your Android project to start syncing data with the backend.

---

## Step 1: Add Dependencies

Edit your `app/build.gradle.kts`:

```kotlin
dependencies {
    // ... existing dependencies ...
    
    // Networking
    implementation("com.squareup.retrofit2:retrofit:2.11.0")
    implementation("com.squareup.retrofit2:converter-gson:2.11.0")
    implementation("com.squareup.okhttp3:okhttp:4.11.0")
    
    // Coroutines
    implementation("org.jetbrains.kotlinx:kotlinx-coroutines-android:1.7.3")
}
```

Click "Sync Now"

---

## Step 2: Add Network Security Config

Create: `res/xml/network_security_config.xml`

```xml
<?xml version="1.0" encoding="utf-8"?>
<network-security-config>
    <domain-config cleartextTrafficPermitted="true">
        <domain includeSubdomains="true">localhost</domain>
        <domain includeSubdomains="true">10.0.2.2</domain>
    </domain-config>
</network-security-config>
```

Update `AndroidManifest.xml`:

```xml
<application
    android:networkSecurityConfig="@xml/network_security_config"
    ...>
</application>
```

---

## Step 3: Create API Models

Create file: `app/src/main/java/com/example/hisaabkitaab/network/ApiModels.kt`

```kotlin
package com.example.hisaabkitaab.network

import com.google.gson.annotations.SerializedName

// ============ Request Models ============

data class RegisterDeviceRequest(
    @SerializedName("deviceId")
    val deviceId: String,
    @SerializedName("email")
    val email: String? = null
)

data class ExpenseToSync(
    @SerializedName("userId")
    val userId: Int,
    @SerializedName("amountRupees")
    val amountRupees: Long,
    @SerializedName("categoryId")
    val categoryId: String,
    @SerializedName("dateEpochDay")
    val dateEpochDay: Long,
    
    // Enhanced fields
    @SerializedName("city")
    val city: String? = null,
    @SerializedName("latitude")
    val latitude: Double? = null,
    @SerializedName("longitude")
    val longitude: Double? = null,
    @SerializedName("paymentMethod")
    val paymentMethod: String? = null,
    @SerializedName("merchantName")
    val merchantName: String? = null,
    @SerializedName("merchantCategory")
    val merchantCategory: String? = null,
    @SerializedName("hourOfDay")
    val hourOfDay: Int? = null,
    @SerializedName("dayOfWeek")
    val dayOfWeek: String? = null
)

data class IncomeToSync(
    @SerializedName("userId")
    val userId: Int,
    @SerializedName("amountRupees")
    val amountRupees: Long,
    @SerializedName("sourceId")
    val sourceId: String? = null,
    @SerializedName("customSourceLabel")
    val customSourceLabel: String? = null,
    @SerializedName("dateEpochDay")
    val dateEpochDay: Long
)

data class SavingsGoalToSync(
    @SerializedName("userId")
    val userId: Int,
    @SerializedName("name")
    val name: String,
    @SerializedName("emoji")
    val emoji: String,
    @SerializedName("targetRupees")
    val targetRupees: Long? = null,
    @SerializedName("targetMonthYear")
    val targetMonthYear: String? = null,
    @SerializedName("isGeneral")
    val isGeneral: Boolean = false
)

// ============ Response Models ============

data class RegisterResponse(
    @SerializedName("userId")
    val userId: Int,
    @SerializedName("message")
    val message: String
)

data class SyncResponse(
    @SerializedName("id")
    val id: Int,
    @SerializedName("message")
    val message: String
)
```

---

## Step 4: Create API Interface

Create file: `app/src/main/java/com/example/hisaabkitaab/network/HisaabApi.kt`

```kotlin
package com.example.hisaabkitaab.network

import retrofit2.http.*

interface HisaabApi {
    
    // ============ Auth ============
    @POST("auth/register")
    suspend fun registerDevice(@Body request: RegisterDeviceRequest): RegisterResponse
    
    // ============ Data Ingestion ============
    @POST("data/expense")
    suspend fun syncExpense(@Body expense: ExpenseToSync): SyncResponse
    
    @POST("data/income")
    suspend fun syncIncome(@Body income: IncomeToSync): SyncResponse
    
    @POST("data/savings-goal")
    suspend fun syncSavingsGoal(@Body goal: SavingsGoalToSync): SyncResponse
}
```

---

## Step 5: Create API Client

Create file: `app/src/main/java/com/example/hisaabkitaab/network/ApiClient.kt`

```kotlin
package com.example.hisaabkitaab.network

import retrofit2.Retrofit
import retrofit2.converter.gson.GsonConverterFactory

object ApiClient {
    
    // ⚠️ CHANGE THIS TO YOUR BACKEND URL
    // For local testing on Android emulator: "http://10.0.2.2:5000/api/"
    // For local testing on device: "http://192.168.1.X:5000/api/" (your laptop's IP)
    // For deployed backend: "https://your-backend.onrender.com/api/"
    
    private const val BASE_URL = "http://10.0.2.2:5000/api/"
    
    val instance: HisaabApi by lazy {
        Retrofit.Builder()
            .baseUrl(BASE_URL)
            .addConverterFactory(GsonConverterFactory.create())
            .build()
            .create(HisaabApi::class.java)
    }
}
```

**⚠️ UPDATE BASE_URL:**
- **Emulator**: `http://10.0.2.2:5000/api/`
- **Physical device**: `http://192.168.1.X:5000/api/` (replace X with your laptop's IP)
- **Cloud**: `https://your-backend.onrender.com/api/`

---

## Step 6: Create Sync Manager

Create file: `app/src/main/java/com/example/hisaabkitaab/sync/SyncManager.kt`

```kotlin
package com.example.hisaabkitaab.sync

import android.content.Context
import android.util.Log
import com.example.hisaabkitaab.network.ApiClient
import com.example.hisaabkitaab.network.RegisterDeviceRequest
import com.example.hisaabkitaab.network.ExpenseToSync
import com.example.hisaabkitaab.network.IncomeToSync
import com.example.hisaabkitaab.network.SavingsGoalToSync
import kotlinx.coroutines.*
import java.time.LocalDateTime
import java.time.ZoneId

class SyncManager(private val context: Context) {
    
    private val apiService = ApiClient.instance
    private val TAG = "SyncManager"
    
    /**
     * Register device with backend
     */
    fun registerDevice(deviceId: String, email: String? = null) {
        CoroutineScope(Dispatchers.IO).launch {
            try {
                val request = RegisterDeviceRequest(deviceId, email)
                val response = apiService.registerDevice(request)
                
                // Save userId to SharedPreferences
                val prefs = context.getSharedPreferences("sync_prefs", Context.MODE_PRIVATE)
                prefs.edit().putInt("userId", response.userId).apply()
                
                Log.d(TAG, "✅ Device registered. UserId: ${response.userId}")
            } catch (e: Exception) {
                Log.e(TAG, "❌ Registration failed: ${e.message}")
            }
        }
    }
    
    /**
     * Sync expense to backend
     */
    fun syncExpense(
        amountRupees: Long,
        categoryId: String,
        dateEpochDay: Long,
        city: String? = null,
        paymentMethod: String? = null,
        merchantName: String? = null
    ) {
        CoroutineScope(Dispatchers.IO).launch {
            try {
                val userId = getUserId()
                if (userId <= 0) {
                    Log.w(TAG, "User not registered yet")
                    return@launch
                }
                
                // Get time details
                val now = LocalDateTime.now(ZoneId.of("Asia/Kolkata"))
                
                val expense = ExpenseToSync(
                    userId = userId,
                    amountRupees = amountRupees,
                    categoryId = categoryId,
                    dateEpochDay = dateEpochDay,
                    city = city,
                    paymentMethod = paymentMethod,
                    merchantName = merchantName,
                    hourOfDay = now.hour,
                    dayOfWeek = now.dayOfWeek.name
                )
                
                val response = apiService.syncExpense(expense)
                Log.d(TAG, "✅ Expense synced: ${response.id}")
            } catch (e: Exception) {
                Log.e(TAG, "❌ Failed to sync expense: ${e.message}")
            }
        }
    }
    
    /**
     * Sync income to backend
     */
    fun syncIncome(
        amountRupees: Long,
        sourceId: String? = null,
        customSourceLabel: String? = null,
        dateEpochDay: Long
    ) {
        CoroutineScope(Dispatchers.IO).launch {
            try {
                val userId = getUserId()
                if (userId <= 0) return@launch
                
                val income = IncomeToSync(
                    userId = userId,
                    amountRupees = amountRupees,
                    sourceId = sourceId,
                    customSourceLabel = customSourceLabel,
                    dateEpochDay = dateEpochDay
                )
                
                val response = apiService.syncIncome(income)
                Log.d(TAG, "✅ Income synced: ${response.id}")
            } catch (e: Exception) {
                Log.e(TAG, "❌ Failed to sync income: ${e.message}")
            }
        }
    }
    
    /**
     * Sync savings goal to backend
     */
    fun syncSavingsGoal(
        name: String,
        emoji: String,
        targetRupees: Long? = null,
        targetMonthYear: String? = null,
        isGeneral: Boolean = false
    ) {
        CoroutineScope(Dispatchers.IO).launch {
            try {
                val userId = getUserId()
                if (userId <= 0) return@launch
                
                val goal = SavingsGoalToSync(
                    userId = userId,
                    name = name,
                    emoji = emoji,
                    targetRupees = targetRupees,
                    targetMonthYear = targetMonthYear,
                    isGeneral = isGeneral
                )
                
                val response = apiService.syncSavingsGoal(goal)
                Log.d(TAG, "✅ Savings goal synced: ${response.id}")
            } catch (e: Exception) {
                Log.e(TAG, "❌ Failed to sync savings goal: ${e.message}")
            }
        }
    }
    
    /**
     * Get saved userId
     */
    private fun getUserId(): Int {
        val prefs = context.getSharedPreferences("sync_prefs", Context.MODE_PRIVATE)
        return prefs.getInt("userId", -1)
    }
}
```

---

## Step 7: Add Internet Permission

Edit `AndroidManifest.xml`:

```xml
<uses-permission android:name="android.permission.INTERNET" />
```

---

## Step 8: Register Device on App Start

Edit your `MainActivity.kt` or `HisaabKitaabApplication.kt`:

```kotlin
import com.example.hisaabkitaab.sync.SyncManager
import java.util.UUID

class HisaabKitaabApplication : Application() {
    override fun onCreate() {
        super.onCreate()
        
        // Get or create device ID
        val prefs = getSharedPreferences("app_prefs", Context.MODE_PRIVATE)
        var deviceId = prefs.getString("device_id", null)
        
        if (deviceId == null) {
            deviceId = UUID.randomUUID().toString()
            prefs.edit().putString("device_id", deviceId).apply()
        }
        
        // Register with backend
        val syncManager = SyncManager(this)
        syncManager.registerDevice(deviceId, null) // Add email if available
        
        Log.d("App", "Device registered: $deviceId")
    }
}
```

---

## Step 9: Update Your Repository to Sync Data

### For ExpenseRepository:

Find your existing expense repository and add sync calls:

```kotlin
// In your ExpenseRepository or ExpenseRepositoryImpl
import com.example.hisaabkitaab.sync.SyncManager

class ExpenseRepositoryImpl(
    private val expenseDao: ExpenseDao,
    private val context: Context
) : ExpenseRepository {
    
    private val syncManager = SyncManager(context)
    
    override suspend fun insertExpense(expense: ExpenseEntity): Long {
        // Save to local database (existing code)
        val localId = expenseDao.insertExpense(expense)
        
        // NEW: Also sync to backend (non-blocking)
        syncManager.syncExpense(
            amountRupees = expense.amountRupees,
            categoryId = expense.categoryId,
            dateEpochDay = expense.dateEpochDay
        )
        
        return localId
    }
}
```

### For IncomeRepository:

```kotlin
class IncomeRepositoryImpl(
    private val incomeDao: IncomeDao,
    private val context: Context
) : IncomeRepository {
    
    private val syncManager = SyncManager(context)
    
    override suspend fun insertIncome(income: IncomeEntity): Long {
        // Save locally
        val localId = incomeDao.insertIncome(income)
        
        // NEW: Sync to backend
        syncManager.syncIncome(
            amountRupees = income.amountRupees,
            sourceId = income.sourceId,
            customSourceLabel = income.customSourceLabel,
            dateEpochDay = income.dateEpochDay
        )
        
        return localId
    }
}
```

### For SavingsGoalRepository:

```kotlin
class SavingsGoalRepositoryImpl(
    private val savingsGoalDao: SavingsGoalDao,
    private val context: Context
) : SavingsGoalRepository {
    
    private val syncManager = SyncManager(context)
    
    override suspend fun insertSavingsGoal(goal: SavingsGoalEntity): Long {
        // Save locally
        val localId = savingsGoalDao.insertSavingsGoal(goal)
        
        // NEW: Sync to backend
        syncManager.syncSavingsGoal(
            name = goal.name,
            emoji = goal.emoji,
            targetRupees = goal.targetRupees,
            targetMonthYear = goal.targetMonthYear,
            isGeneral = goal.isGeneral
        )
        
        return localId
    }
}
```

---

## Step 10: Update AppContainer (Dependency Injection)

If you're using manual DI, update your `AppContainer.kt`:

```kotlin
class AppContainer(private val context: Context) {
    // ... existing code ...
    
    val syncManager: SyncManager by lazy {
        SyncManager(context)
    }
}
```

---

## Testing Locally

### 1. Start Backend

```bash
cd ~/Developer/HisaabKitaabBackend
npm run dev
```

Should show: `Backend running on http://localhost:5000`

### 2. Update API URL in `ApiClient.kt`

For emulator:
```kotlin
private const val BASE_URL = "http://10.0.2.2:5000/api/"
```

For device (replace with your laptop IP):
```kotlin
private const val BASE_URL = "http://192.168.1.X:5000/api/"
```

### 3. Run Android App

Build and run the app in Android Studio.

### 4. Check Logs

In Android Studio Logcat, you should see:
```
✅ Device registered. UserId: 1
✅ Expense synced: 1
✅ Income synced: 1
```

### 5. Verify Backend Received Data

```bash
# In another terminal
curl "http://localhost:5000/api/analytics/top-categories?aggregated=true"

# Should return the data you just entered
```

---

## Troubleshooting

### "Connection refused"
- Check backend is running: `npm run dev`
- Check API_BASE_URL is correct
- Check firewall isn't blocking port 5000

### "Device not registered"
- Check logs for registration error
- Manually call `syncManager.registerDevice(deviceId)`

### "No data in backend"
- Check Logcat for sync errors
- Verify database connection in backend
- Check that userId is saved correctly

### "App crashes"
- Check you added all imports
- Check manifest permissions are added
- Check gradle dependencies are installed

---

## File Structure After Integration

```
app/src/main/java/com/example/hisaabkitaab/
├── network/
│   ├── ApiClient.kt              (NEW)
│   ├── ApiModels.kt              (NEW)
│   └── HisaabApi.kt              (NEW)
├── sync/
│   └── SyncManager.kt            (NEW)
├── data/
│   └── repository/
│       ├── ExpenseRepositoryImpl.kt    (MODIFIED - add sync)
│       ├── IncomeRepositoryImpl.kt     (MODIFIED - add sync)
│       └── SavingsGoalRepositoryImpl.kt (MODIFIED - add sync)
└── ... (rest of your app unchanged)
```

---

## What's Happening Now

1. ✅ App saves data locally (as before)
2. ✅ App sends copy to backend (new)
3. ✅ Backend stores in PostgreSQL (new)
4. ✅ You can analyze all user data (new)

**Your app works exactly the same, but now you collect data!** 📊

---

**Ready to integrate? Copy all these files and follow the steps!** 🚀
