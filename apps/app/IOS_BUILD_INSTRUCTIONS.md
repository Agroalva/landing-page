# iOS Build Instructions

This guide covers building the iOS app with all required environment variables and Apple Developer setup.

## Prerequisites

1. **Node.js 18+** and **pnpm** installed
2. **Expo CLI** installed globally: `npm install -g expo-cli`
3. **EAS CLI** installed: `npm install -g eas-cli`
4. **Expo account** (sign up at https://expo.dev)
5. **Apple Developer Account** ($99/year) - Required for App Store distribution
6. **Convex account** and project set up

## Step 1: Install Dependencies

```bash
# From the root of the monorepo
pnpm install

# Navigate to the app directory
cd apps/app
```

## Step 2: Configure Convex Environment Variables

These variables are set in your Convex deployment (not in the app):

```bash
# From apps/app directory

# 1. Set BETTER_AUTH_SECRET (generate a secure secret)
pnpm dlx convex env set BETTER_AUTH_SECRET=$(openssl rand -base64 32)

# 2. Set SITE_URL (replace <your-slug> with your actual Convex deployment slug)
# Get your deployment URL from: https://dashboard.convex.dev
pnpm dlx convex env set SITE_URL=https://<your-slug>.convex.site

# Optional: Set CONVEX_SITE_URL (if different from SITE_URL)
pnpm dlx convex env set CONVEX_SITE_URL=https://<your-slug>.convex.site
```

**To find your Convex deployment URL:**
1. Go to https://dashboard.convex.dev
2. Select your project
3. The deployment URL will be shown (format: `https://<slug>.convex.cloud` and `https://<slug>.convex.site`)

## Step 3: Create Expo Environment Variables File

Create a `.env.local` file in `apps/app/` directory:

```bash
cd apps/app
touch .env.local
```

Add the following content to `.env.local`:

```env
# Convex deployment URL (for Convex client)
# Replace <your-slug> with your actual Convex deployment slug
EXPO_PUBLIC_CONVEX_URL=https://<your-slug>.convex.cloud

# Convex site URL (for Better Auth endpoints)
# Replace <your-slug> with your actual Convex deployment slug
EXPO_PUBLIC_CONVEX_SITE_URL=https://<your-slug>.convex.site
```

**Important Notes:**
- Replace `<your-slug>` with your actual Convex deployment slug
- Variables prefixed with `EXPO_PUBLIC_` are embedded at build time
- Never commit `.env.local` to git (it should be in `.gitignore`)

## Step 4: Configure Apple Developer Account

### 4.1. Apple Developer Account Setup

1. **Sign up for Apple Developer Program**
   - Go to https://developer.apple.com/programs/
   - Enroll ($99/year) - Required for App Store distribution
   - Wait for approval (usually 24-48 hours)

2. **Add Apple Account to EAS**

```bash
cd apps/app
eas login
eas build:configure
```

When prompted, you'll need to:
- Sign in with your Apple ID
- EAS will automatically manage certificates and provisioning profiles

### 4.2. Configure Bundle Identifier

The bundle identifier is already set in `app.json`:
- Current: `com.tymkiwdylan.dev.agroalva`

**To change it:**
1. Update `ios.bundleIdentifier` in `app.json`
2. Register the bundle ID in your Apple Developer account:
   - Go to https://developer.apple.com/account/resources/identifiers/list
   - Click "+" to add a new App ID
   - Enter your bundle identifier

**Note:** EAS can automatically register the bundle ID if you have the right permissions.

## Step 5: Configure EAS Build

### 5.1. Login to Expo

```bash
eas login
```

### 5.2. Initialize EAS Build (if not already done)

```bash
cd apps/app
eas build:configure
```

This will create/update `eas.json` in the `apps/app/` directory.

### 5.3. Update app.json with EAS Project ID

The EAS project ID is already configured in `app.json`:
```json
{
  "expo": {
    "extra": {
      "eas": {
        "projectId": "8dedbe1f-914d-4280-afc9-44ccc9a59d32"
      }
    }
  }
}
```

## Step 6: Build for iOS

### Option A: Build for Physical Device (Ad Hoc Distribution)

For testing on physical devices:

```bash
cd apps/app
eas build --platform ios --profile preview
```

This creates an `.ipa` file that can be installed via:
- TestFlight (recommended)
- Direct installation via EAS Build download link

### Option B: Build for App Store (Production)

For App Store submission:

```bash
cd apps/app
eas build --platform ios --profile production
```

This creates an App Store build that can be submitted via:
- `eas submit` command
- App Store Connect manually

### Option C: Build for Simulator (Development)

For iOS Simulator testing:

```bash
cd apps/app
eas build --platform ios --profile development
```

**Note:** Simulator builds are only for development and cannot be distributed.

### Option D: Build Locally (Requires macOS and Xcode)

```bash
cd apps/app
eas build --platform ios --local
```

**Requirements:**
- macOS (required for iOS builds)
- Xcode installed
- Xcode Command Line Tools
- CocoaPods (installed automatically by EAS)

## Step 7: Environment Variables in EAS Build

EAS Build automatically reads environment variables from:

1. **`.env.local`** file (for `EXPO_PUBLIC_*` variables)
2. **EAS Secrets** (for sensitive variables)

### Setting EAS Secrets (Optional - for CI/CD)

If you want to manage environment variables through EAS:

```bash
# Set secrets in EAS
eas secret:create --scope project --name EXPO_PUBLIC_CONVEX_URL --value "https://your-slug.convex.cloud"
eas secret:create --scope project --name EXPO_PUBLIC_CONVEX_SITE_URL --value "https://your-slug.convex.site"
```

### Using EAS Secrets in eas.json

You can reference secrets in `eas.json`:

```json
{
  "build": {
    "production": {
      "env": {
        "EXPO_PUBLIC_CONVEX_URL": "@expo-public-convex-url",
        "EXPO_PUBLIC_CONVEX_SITE_URL": "@expo-public-convex-site-url"
      }
    }
  }
}
```

## Step 8: Submit to App Store

### Using EAS Submit (Recommended)

```bash
cd apps/app
eas submit --platform ios --profile production
```

This will:
1. Upload your build to App Store Connect
2. Automatically handle authentication
3. Create a new app version if needed

### Manual Submission

1. Download the build:
   ```bash
   eas build:download
   ```

2. Upload to App Store Connect:
   - Go to https://appstoreconnect.apple.com
   - Navigate to your app
   - Create a new version
   - Upload the `.ipa` file using Transporter app or Xcode

## Step 9: TestFlight Distribution

### Automatic via EAS Submit

When you run `eas submit`, the build is automatically available in TestFlight after processing (usually 10-30 minutes).

### Manual TestFlight Upload

1. Download the build from EAS
2. Use Transporter app or Xcode to upload to App Store Connect
3. Wait for processing
4. Add testers in TestFlight section

## Complete Environment Variables Checklist

### Convex Backend Variables (set via `convex env set`)
- [ ] `BETTER_AUTH_SECRET` - Secret for Better Auth (generate with `openssl rand -base64 32`)
- [ ] `SITE_URL` - Your Convex site URL (e.g., `https://your-slug.convex.site`)
- [ ] `CONVEX_SITE_URL` - Optional, same as SITE_URL if not set separately

### Expo App Variables (in `.env.local` or EAS Secrets)
- [ ] `EXPO_PUBLIC_CONVEX_URL` - Your Convex deployment URL (e.g., `https://your-slug.convex.cloud`)
- [ ] `EXPO_PUBLIC_CONVEX_SITE_URL` - Your Convex site URL (e.g., `https://your-slug.convex.site`)

### EAS Configuration (in `app.json`)
- [ ] `extra.eas.projectId` - Your EAS project ID (for push notifications)
- [ ] `ios.bundleIdentifier` - Your iOS bundle identifier

### Apple Developer Account
- [ ] Apple Developer Program membership ($99/year)
- [ ] Bundle ID registered in Apple Developer account
- [ ] Apple account added to EAS

## Troubleshooting

### Build fails with "No Apple Developer account found"
- Ensure you've logged in with your Apple ID: `eas login`
- Verify your Apple Developer account is active
- Check that you've accepted the Apple Developer agreement

### Build fails with "Bundle identifier already exists"
- The bundle ID is already registered to another Apple Developer account
- Change the bundle identifier in `app.json` to a unique one
- Or transfer the bundle ID to your account (requires original owner)

### Certificate/Provisioning Profile errors
- EAS automatically manages certificates, but you may need to:
  - Ensure you have the right permissions in your Apple Developer account
  - Check that your Apple Developer membership is active
  - Try running `eas build:configure` again

### Push notifications not working
- Ensure `extra.eas.projectId` is set in `app.json`
- Verify you're using a development build or production build (not Expo Go)
- Check that `BETTER_AUTH_SECRET` is set in Convex
- Ensure push notification capability is enabled in Apple Developer account

### Convex connection errors
- Verify `EXPO_PUBLIC_CONVEX_URL` matches your Convex deployment URL
- Check that `SITE_URL` is set correctly in Convex environment
- Ensure Convex deployment is active

### Authentication not working
- Verify `EXPO_PUBLIC_CONVEX_SITE_URL` is set correctly
- Check that `BETTER_AUTH_SECRET` is set in Convex
- Ensure `SITE_URL` in Convex matches your Convex site URL

### Build takes too long
- iOS builds typically take 15-30 minutes on EAS servers
- First build may take longer due to certificate generation
- Check build status: `eas build:list`

## iOS-Specific Considerations

### App Store Review Guidelines
- Ensure your app complies with [App Store Review Guidelines](https://developer.apple.com/app-store/review/guidelines/)
- Test all features before submission
- Provide clear app description and screenshots

### Privacy Permissions
- iOS requires privacy descriptions for all permissions
- Already configured in `app.json` for:
  - Photos access (expo-image-picker)
  - Camera access (expo-image-picker)

### App Icons and Assets
- Ensure all required icon sizes are provided
- Current icon: `./assets/images/icon.png`
- iOS automatically generates all required sizes

### Minimum iOS Version
- Expo SDK 54 supports iOS 13.4+
- This is automatically configured

## Quick Reference Commands

```bash
# Set Convex environment variables
pnpm dlx convex env set BETTER_AUTH_SECRET=$(openssl rand -base64 32)
pnpm dlx convex env set SITE_URL=https://your-slug.convex.site

# Build iOS for testing (Ad Hoc)
cd apps/app && eas build --platform ios --profile preview

# Build iOS for App Store
cd apps/app && eas build --platform ios --profile production

# Submit to App Store
cd apps/app && eas submit --platform ios --profile production

# Check build status
eas build:list

# Download build
eas build:download

# View build logs
eas build:view
```

## Additional Resources

- [Expo EAS Build Documentation](https://docs.expo.dev/build/introduction/)
- [iOS Build Guide](https://docs.expo.dev/build/building-on-eas/)
- [App Store Submission Guide](https://docs.expo.dev/submit/introduction/)
- [Expo Environment Variables](https://docs.expo.dev/guides/environment-variables/)
- [Apple Developer Documentation](https://developer.apple.com/documentation/)
- [Convex Documentation](https://docs.convex.dev/)
- [Better Auth Documentation](https://www.better-auth.com/docs)

