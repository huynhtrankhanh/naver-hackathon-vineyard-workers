# Android App Release Guide

This guide documents the process for building and releasing the SmartMoney Android app.

## Table of Contents

1. [Build Types](#build-types)
2. [Building an APK](#building-an-apk)
3. [Building an AAB for Google Play](#building-an-aab-for-google-play)
4. [Setting Up Signing Keys](#setting-up-signing-keys)
5. [Google Play Submission](#google-play-submission)

## Build Types

### Debug APK
- Used for testing and development
- Not signed with a release key
- Can be installed directly on devices with "Install from unknown sources" enabled

### Release APK
- Unsigned release build
- Suitable for manual signing or testing

### Signed AAB (Android App Bundle)
- Required format for Google Play Store submission
- Must be signed with your release keystore
- Google Play will generate optimized APKs for each device configuration

## Building an APK

### Using GitHub Actions (Recommended)

1. Go to the repository on GitHub
2. Navigate to **Actions** tab
3. Select **"Build APK"** workflow from the left sidebar
4. Click **"Run workflow"** button
5. Choose the build type:
   - `debug` - For testing (default)
   - `release` - For release (unsigned)
6. Click **"Run workflow"**
7. Once complete, download the APK from the workflow run's **Artifacts** section

### Building Locally

```bash
cd Frontend-MoneyTrack

# Install dependencies
npm install

# Build the web app
npm run build

# Sync with Capacitor
npx cap sync android

# Build debug APK
cd android
./gradlew assembleDebug

# The APK will be at:
# android/app/build/outputs/apk/debug/app-debug.apk
```

## Building an AAB for Google Play

### Prerequisites

Before building a signed AAB, you must set up the signing secrets in GitHub:

1. **ANDROID_KEYSTORE_BASE64**: Your keystore file encoded in base64
2. **ANDROID_KEYSTORE_PASSWORD**: The password for the keystore
3. **ANDROID_KEY_ALIAS**: The alias of the key in the keystore
4. **ANDROID_KEY_PASSWORD**: The password for the key

### Using GitHub Actions

1. Ensure all signing secrets are configured (see [Setting Up Signing Keys](#setting-up-signing-keys))
2. Go to the repository on GitHub
3. Navigate to **Actions** tab
4. Select **"Build AAB (Signed)"** workflow from the left sidebar
5. Click **"Run workflow"** button
6. Click **"Run workflow"** to start the build
7. Once complete, download the AAB from the workflow run's **Artifacts** section

**Note:** The workflow will fail if signing secrets are not configured, with a helpful error message listing the required secrets.

## Setting Up Signing Keys

### Step 1: Generate a Keystore (First Time Only)

If you don't have a keystore yet, generate one:

```bash
keytool -genkey -v -keystore smartmoney-release.jks -keyalg RSA -keysize 2048 -validity 9125 -alias smartmoney
```

**IMPORTANT:** Store this keystore file and passwords securely. If lost, you cannot update your app on Google Play.

### Step 2: Encode the Keystore

Convert your keystore to base64:

```bash
base64 -i smartmoney-release.jks -o keystore-base64.txt
```

### Step 3: Add Secrets to GitHub

1. Go to your repository on GitHub
2. Navigate to **Settings** → **Secrets and variables** → **Actions**
3. Add the following repository secrets:

| Secret Name | Description |
|-------------|-------------|
| `ANDROID_KEYSTORE_BASE64` | Contents of `keystore-base64.txt` |
| `ANDROID_KEYSTORE_PASSWORD` | Password you set when creating the keystore |
| `ANDROID_KEY_ALIAS` | Key alias (e.g., `smartmoney`) |
| `ANDROID_KEY_PASSWORD` | Password for the key (often same as keystore password) |

### Step 4: Verify Setup

Run the "Build AAB (Signed)" workflow. If configured correctly, it will build and sign the AAB.

## Google Play Submission

### First-Time Setup

1. Create a [Google Play Developer account](https://play.google.com/console/) ($25 one-time fee)
2. Create a new app in the Google Play Console
3. Fill in the store listing information:
   - App name: SmartMoney
   - Short description
   - Full description
   - Screenshots (see `screenshots/` folder for app screenshots)
   - Feature graphic
   - App icon

### Uploading the AAB

1. Build a signed AAB using the GitHub workflow
2. Download the AAB artifact
3. In Google Play Console, go to **Production** → **Create new release**
4. Upload the `.aab` file
5. Add release notes
6. Submit for review

### Required Screenshots for Google Play

Google Play requires screenshots for:
- **Phone**: At least 2 screenshots (1080x1920 or similar)
- **7-inch tablet**: Optional but recommended
- **10-inch tablet**: Optional but recommended

Pre-generated screenshots are available in the `screenshots/` folder:
- `phone-*.png` - Phone-sized screenshots (412x915)
- `tablet-7inch-*.png` - 7-inch tablet screenshots (600x960)
- `tablet-10inch-*.png` - 10-inch tablet screenshots (800x1280)

## Troubleshooting

### "Signing secrets not configured" error

Ensure all four secrets are properly set in GitHub repository settings:
- ANDROID_KEYSTORE_BASE64
- ANDROID_KEYSTORE_PASSWORD
- ANDROID_KEY_ALIAS
- ANDROID_KEY_PASSWORD

### Build fails with Java version error

The workflows use JDK 17. If building locally, ensure you have JDK 17 installed.

### APK/AAB not found after build

Check the workflow logs for errors. Common issues:
- Frontend build failures (TypeScript errors)
- Gradle build failures (dependency issues)
- Signing failures (incorrect keystore or passwords)

## App Information

- **App ID**: `com.huynhtrankhanh.smartmoney`
- **App Name**: SmartMoney
- **Min SDK**: 23 (Android 6.0)
- **Target SDK**: 35 (Android 15)
