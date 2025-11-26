# Android Build Instructions

This guide covers building the Android app with all required environment variables.

## Prerequisites

1. **Node.js 18+** and **pnpm** installed
2. **Expo CLI** installed globally: `npm install -g expo-cli`
3. **EAS CLI** installed: `npm install -g eas-cli`
4. **Expo account** (sign up at https://expo.dev)
5. **Convex account** and project set up

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

## Step 4: Configure EAS Build

### 4.1. Login to Expo

```bash
eas login
```

### 4.2. Initialize EAS Build (if not already done)

```bash
cd apps/app
eas build:configure
```

This will create/update `eas.json` in the `apps/app/` directory.

### 4.3. Update app.json with EAS Project ID (for push notifications)

Add the EAS project ID to `app.json`. After running `eas build:configure`, you'll get a project ID. Add it to your `app.json`:

```json
{
  "expo": {
    "extra": {
      "eas": {
        "projectId": "your-eas-project-id-here"
      }
    }
  }
}
```

**To get your EAS project ID:**
1. Run `eas build:configure` (it will show the project ID)
2. Or check your Expo dashboard at https://expo.dev

## Step 5: Build for Android

### Option A: Build APK (for testing/distribution outside Play Store)

```bash
cd apps/app
eas build --platform android --profile preview
```

### Option B: Build AAB (for Google Play Store)

```bash
cd apps/app
eas build --platform android --profile production
```

### Option C: Build locally (requires Android SDK setup)

```bash
cd apps/app
eas build --platform android --local
```

**Note:** Local builds require:
- Android SDK installed
- Java Development Kit (JDK)
- Android Studio

## Step 6: Environment Variables in EAS Build

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

## Step 7: Verify Environment Variables

Before building, verify your environment variables are set correctly:

```bash
# Check Convex environment variables
cd apps/app
pnpm dlx convex env list

# Verify .env.local file exists and has correct values
cat .env.local
```

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

## Troubleshooting

### Build fails with "Environment variable not found"
- Ensure `.env.local` exists in `apps/app/` directory
- Verify all `EXPO_PUBLIC_*` variables are set
- Check that variables don't have trailing spaces

### Push notifications not working
- Ensure `extra.eas.projectId` is set in `app.json`
- Verify you're using a development build or production build (not Expo Go)
- Check that `BETTER_AUTH_SECRET` is set in Convex

### Convex connection errors
- Verify `EXPO_PUBLIC_CONVEX_URL` matches your Convex deployment URL
- Check that `SITE_URL` is set correctly in Convex environment
- Ensure Convex deployment is active

### Authentication not working
- Verify `EXPO_PUBLIC_CONVEX_SITE_URL` is set correctly
- Check that `BETTER_AUTH_SECRET` is set in Convex
- Ensure `SITE_URL` in Convex matches your Convex site URL

## APK Size Optimization

The app is configured with several optimizations to reduce APK size:

### Enabled Optimizations

1. **ProGuard/R8 Code Shrinking** (`enableProguardInReleaseBuilds: true`)
   - Removes unused code and obfuscates the codebase
   - Can reduce APK size by 20-40%

2. **Resource Shrinking** (`enableShrinkResourcesInReleaseBuilds: true`)
   - Removes unused resources (images, strings, etc.)
   - Works in conjunction with ProGuard

3. **Split APKs by ABI** (`enableSplitApksByAbi: true`)
   - Creates separate APKs for different CPU architectures (arm64-v8a, armeabi-v7a, x86, x86_64)
   - Each APK only includes native libraries for its specific architecture
   - Can reduce individual APK size by 30-50%

4. **App Bundle (AAB) for Production**
   - Production builds use AAB format instead of APK
   - Google Play automatically generates optimized APKs for each device
   - Typically 15-20% smaller than universal APKs

### Expected Size Reduction

With these optimizations enabled:
- **Before**: ~200MB universal APK
- **After**: 
  - Individual split APKs: ~60-80MB each (architecture-specific)
  - AAB for Play Store: ~80-100MB (Google Play optimizes further)

### Additional Optimization Tips

1. **Optimize Images**
   - Compress PNG images using tools like `pngquant` or `tinypng`
   - Convert images to WebP format where possible
   - Use vector drawables instead of PNGs for icons

2. **Remove Unused Dependencies**
   - Review `package.json` and remove any unused packages
   - Use `npx depcheck` to find unused dependencies

3. **Use Lazy Loading**
   - Code-split large features
   - Load heavy libraries only when needed

4. **Monitor Bundle Size**
   - Use `npx expo-doctor` to check for issues
   - Review build logs for size breakdown

### Building Optimized Versions

```bash
# Build optimized APK (split by ABI)
cd apps/app
eas build --platform android --profile preview

# Build optimized AAB for Play Store (recommended)
eas build --platform android --profile production
```

**Note**: The first build with ProGuard enabled may take longer, but subsequent builds will be faster.

## Additional Resources

- [Expo EAS Build Documentation](https://docs.expo.dev/build/introduction/)
- [Expo Environment Variables](https://docs.expo.dev/guides/environment-variables/)
- [Android App Bundle Guide](https://developer.android.com/guide/app-bundle)
- [Reducing APK Size](https://developer.android.com/topic/performance/reduce-apk-size)
- [Convex Documentation](https://docs.convex.dev/)
- [Better Auth Documentation](https://www.better-auth.com/docs)

## Quick Reference Commands

```bash
# Set Convex environment variables
pnpm dlx convex env set BETTER_AUTH_SECRET=$(openssl rand -base64 32)
pnpm dlx convex env set SITE_URL=https://your-slug.convex.site

# Build Android APK
cd apps/app && eas build --platform android --profile preview

# Build Android AAB for Play Store
cd apps/app && eas build --platform android --profile production

# Check build status
eas build:list

# Download build
eas build:download
```

