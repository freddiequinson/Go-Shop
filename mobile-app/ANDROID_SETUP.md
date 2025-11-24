# 🤖 Android Emulator Setup Guide

## Quick Setup (Recommended)

### Option 1: Install Android Studio (Full Setup)

1. **Download Android Studio**
   - Go to: https://developer.android.com/studio
   - Download and install Android Studio

2. **Install Android SDK**
   - Open Android Studio
   - Go to: Tools → SDK Manager
   - Install:
     - Android SDK Platform 34 (Android 14)
     - Android SDK Build-Tools
     - Android Emulator
     - Android SDK Platform-Tools

3. **Create Virtual Device**
   - Open Android Studio
   - Go to: Tools → Device Manager
   - Click "Create Device"
   - Select: Pixel 5 or Pixel 6
   - System Image: Android 14 (API 34)
   - Click Finish

4. **Set Environment Variables**
   ```powershell
   # Add to System Environment Variables
   ANDROID_HOME = C:\Users\USER\AppData\Local\Android\Sdk
   
   # Add to PATH:
   %ANDROID_HOME%\platform-tools
   %ANDROID_HOME%\emulator
   %ANDROID_HOME%\tools
   %ANDROID_HOME%\tools\bin
   ```

5. **Restart Terminal** and run:
   ```bash
   adb --version
   ```

### Option 2: Quick Install (Expo CLI Method)

Just run:
```bash
npx expo run:android
```

Expo will prompt you to install Android SDK automatically!

## Running the App

### Start the Emulator

**Option A: From Android Studio**
- Open Device Manager
- Click Play button on your virtual device

**Option B: From Command Line**
```bash
emulator -avd Pixel_5_API_34
```

### Run the App

Once emulator is running:
```bash
npm run android
```

Or:
```bash
npx expo run:android
```

## Advantages Over iPhone/Expo Go

✅ No SDK version conflicts
✅ Faster development (hot reload)
✅ Full debugging tools
✅ Test on multiple Android versions
✅ No need for physical device
✅ Works with localhost (no IP needed)

## Troubleshooting

### "adb not found"
- Make sure ANDROID_HOME is set
- Restart terminal
- Check PATH includes platform-tools

### Emulator won't start
- Enable virtualization in BIOS
- Install Intel HAXM or AMD Hypervisor
- Try a different system image

### App won't install
```bash
# Clear cache and rebuild
npm start -- --clear
npx expo run:android --clear
```

## Quick Commands

```bash
# List available emulators
emulator -list-avds

# Start specific emulator
emulator -avd Pixel_5_API_34

# Check connected devices
adb devices

# Run app on Android
npm run android

# Clear and rebuild
npx expo run:android --clear
```

## Next Steps

1. Install Android Studio
2. Create virtual device
3. Set environment variables
4. Restart terminal
5. Run: `npm run android`

The app will build and install on the emulator automatically!
