# 🔧 Fix Android System Image Download Error

## The Problem
The Android 15 (API 36) system image download is corrupted.

## Solution: Use Android 14 (API 34) Instead

### In Android Studio:

1. **Open SDK Manager**
   - Tools → SDK Manager
   - Go to "SDK Platforms" tab

2. **Install Android 14.0 (API 34)**
   - Check the box for "Android 14.0 (UpsideDownCake)"
   - Click "Show Package Details"
   - Select: **Google Play Intel x86_64 Atom System Image**
   - Click "Apply" → "OK"

3. **Create Virtual Device with API 34**
   - Tools → Device Manager
   - Click "Create Device"
   - Select: **Pixel 5**
   - Click "Next"
   - On "System Image" screen:
     - Click "x86 Images" tab
     - Find: **Android 14.0 (API 34)** with Google Play
     - Click "Download" (if not already downloaded)
     - Select it and click "Next"
   - Click "Finish"

## Alternative: Try Different Download Method

If API 34 also fails:

1. **Clear SDK Manager Cache**
   - Close Android Studio
   - Delete: `C:\Users\USER\.android\cache`
   - Reopen Android Studio
   - Try downloading again

2. **Use Command Line**
   ```powershell
   cd C:\Users\USER\AppData\Local\Android\Sdk\cmdline-tools\latest\bin
   .\sdkmanager "system-images;android-34;google_apis_playstore;x86_64"
   ```

3. **Check Internet Connection**
   - Try disabling VPN if you're using one
   - Try different network
   - Check firewall settings

## Recommended System Images (in order of preference)

1. ✅ **Android 14 (API 34)** - Most stable, widely used
2. ✅ **Android 13 (API 33)** - Very stable
3. ✅ **Android 12 (API 31)** - Older but reliable
4. ⚠️ **Android 15 (API 36)** - Newest, may have issues

## After Successful Installation

1. **Start the emulator:**
   - Device Manager → Click Play ▶️ button

2. **Run your app:**
   ```bash
   npm run android
   ```

## Quick Test

Once emulator is running, verify it works:
```bash
adb devices
```

You should see your emulator listed!
