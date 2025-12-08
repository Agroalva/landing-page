# Incomplete UI Features

This document lists all UI elements and features that are not fully implemented yet in the Agroalva mobile app.

## 🏠 Home Feed (`app/(tabs)/index.tsx`)

### Search Bar
- **Search input** - No `onPress` or navigation handler. Users can type but clicking doesn't navigate to search screen
- **Filter button** - No `onPress` handler. Button exists but does nothing

### Featured Banner
- **Banner card** - No `onPress` handler. Banner displays but isn't clickable/navigable

### Product Cards
- **Heart/Favorite button** - No `onPress` handler. Button displays but doesn't toggle favorites
- **"Ver todas" link** - No `onPress` handler. Doesn't navigate anywhere

---

## 🔍 Search Screen (`app/(tabs)/search.tsx`)

### Search Results
- **Profile results** - `onPress` handler is empty. Profile search results don't navigate to user profiles

### Popular Categories
- **Category cards** - Clicking sets filter but doesn't trigger search or navigate properly

---

## 💬 Messages Screen (`app/(tabs)/messages.tsx`)

### Create Message Button
- **"Create" button** - Has TODO comment. Currently redirects to search screen instead of proper user picker flow
- **User picker screen** - Missing. Need dedicated screen to select user to message

---

## 👤 Profile Screen (`app/(tabs)/profile.tsx`)

### Header Actions
- **Settings button** - No `onPress` handler. Settings screen doesn't exist
- **Share profile button** - No `onPress` handler. Share functionality not implemented

### Menu Items
- **"Ver todas" for posts** - No `onPress` handler. Doesn't navigate to full posts list
- **Favoritos menu item** - No `onPress` handler. Favorites screen doesn't exist
- **Help & Support menu item** - No `onPress` handler. Help screen doesn't exist

---

## 📦 Product Detail Screen (`app/product/[id].tsx`)

### Seller Profile
- **"Ver perfil" button** - Has TODO comment. Shows alert instead of navigating to user profile view
- **User profile view screen** - Missing. Need screen to view other users' profiles

### Location
- **Location display** - Location is collected in create post but not saved/displayed in product detail

---

## 💭 Chat Screen (`app/chat/[id].tsx`)

### Header Actions
- **More button (ellipsis)** - No `onPress` handler. Menu/actions not implemented
- **Online status** - Hardcoded as "Activa". Not connected to real presence/online status

---

## ➕ Create Post Screen (`app/create-post.tsx`)

### Location
- **Location data** - Location is collected via `handleUseCurrentLocation` but not included in `createProduct` mutation call. Location state exists but isn't saved to database

---

## 🎨 General UI/UX Features

### Feed Enhancements
- **Pagination/Infinite scroll** - Feed loads fixed 20 items, no "load more" functionality
- **Pull-to-refresh** - Not implemented. Users can't refresh feed by pulling down
- **Loading skeletons** - Only basic ActivityIndicator, no skeleton loaders

### Post Actions
- **Edit post** - No edit button or edit screen for post authors
- **Delete post** - No delete button or confirmation dialog for post authors
- **Share post** - No share functionality (native share sheet)
- **Report/Flag** - No report button or moderation flow

### Search Features
- **Search suggestions** - No autocomplete or suggestions while typing
- **Search analytics** - Not tracked

### Real-time Features
- **Typing indicators** - Not implemented in chat
- **Online/presence status** - Hardcoded, not real-time
- **Last seen timestamps** - Not implemented

### Navigation & Screens
- **Favorites screen** - Referenced but doesn't exist
- **User profile view screen** - For viewing other users' profiles
- **Settings screen** - Referenced but doesn't exist
- **Help & Support screen** - Referenced but doesn't exist
- **Full posts list screen** - "Ver todas" links don't navigate anywhere

### Error Handling & Empty States
- **Error boundaries** - Not implemented
- **Retry functionality** - No retry buttons on errors
- **Offline mode handling** - Not implemented
- **Better empty states** - Basic empty states, could be more helpful/actionable

### Polish & Animations
- **Haptic feedback** - Not implemented
- **Screen transitions** - Basic, no custom animations
- **List item animations** - No animations on scroll/load
- **Loading animations** - Only basic ActivityIndicator

---

## 📊 Summary by Priority

### High Priority (Blocks Core Functionality)
1. ❌ Favorite button in feed doesn't work
2. ❌ Location not saved when creating posts
3. ❌ "Ver perfil" button doesn't navigate
4. ❌ Create message flow incomplete (redirects to search)

### Medium Priority (Missing Features)
5. ❌ Search bar in home doesn't navigate
6. ❌ Filter button doesn't work
7. ❌ Profile search results don't navigate
8. ❌ Settings screen missing
9. ❌ Favorites screen missing
10. ❌ User profile view screen missing

### Low Priority (Polish & Enhancements)
11. ❌ Share functionality
12. ❌ Edit/Delete posts
13. ❌ Pagination/Infinite scroll
14. ❌ Pull-to-refresh
15. ❌ Typing indicators
16. ❌ Real online status
17. ❌ Loading skeletons
18. ❌ Search suggestions
19. ❌ Haptic feedback
20. ❌ Animations

---

**Last Updated:** 2024-12-19

