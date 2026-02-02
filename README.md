# Peep 👁️

**See what your friends are doing on their phones — in real-time.**

Peep is a social app that lets you check what apps your friends are currently using. Tap to "peep" a friend and instantly see if they're watching YouTube, scrolling Instagram, or chatting on WhatsApp.

![React Native](https://img.shields.io/badge/React_Native-0.76-blue)
![Expo](https://img.shields.io/badge/Expo-52-black)
![Supabase](https://img.shields.io/badge/Supabase-Backend-green)
![Platform](https://img.shields.io/badge/Platform-Android-brightgreen)

## ✨ Features

- **🔐 Authentication** — Email/password signup & login via Supabase Auth
- **👥 Friend System** — Add friends by username, accept/reject requests
- **📡 Real-Time Status** — See what apps your friends are using (updates every 30s)
- **👁️ Peep Action** — Tap to peep a friend, they get a notification
- **🔔 Toast Notifications** — Subtle black popup when you get peeped
- **🔋 Battery Optimized** — Broadcasting pauses when app is in background

## 📱 Screenshots

| Home Screen | Friends | Peep Notification |
|-------------|---------|-------------------|
| Friend list with status | Add & manage friends | Subtle toast popup |

## 🛠️ Tech Stack

- **Frontend:** React Native + Expo (SDK 52)
- **Navigation:** Expo Router
- **State Management:** Zustand
- **Backend:** Supabase (Auth, Database, Realtime)
- **Native Module:** Custom UsageStats module (Android)

## 📋 Prerequisites

- Node.js 18+
- Android Studio with emulator
- Supabase account

## 🚀 Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/YOUR_USERNAME/peep.git
cd peep
```

### 2. Install dependencies

```bash
npm install
```

### 3. Set up Supabase

1. Create a new project at [supabase.com](https://supabase.com)
2. Go to **SQL Editor** and run the SQL files in order:
   - `supabase/schema.sql`
   - `supabase/user_status.sql`
3. Go to **Authentication > Providers > Email** and:
   - Enable Email provider
   - Turn OFF "Confirm email"

### 4. Configure environment

Update `lib/supabase.ts` with your Supabase credentials:

```typescript
const SUPABASE_URL = 'https://YOUR_PROJECT.supabase.co';
const SUPABASE_ANON_KEY = 'your-anon-key';
```

### 5. Run the app

```bash
npx expo run:android
```

## 📁 Project Structure

```
peep/
├── app/                    # Expo Router screens
│   ├── auth/              # Login & signup screens
│   ├── _layout.tsx        # Root layout with auth protection
│   ├── index.tsx          # Home screen (friend list)
│   └── friends.tsx        # Friend management screen
├── components/
│   ├── feature/           # Feature-specific components
│   │   └── FriendCard.tsx
│   └── ui/                # Reusable UI components
│       └── Toast.tsx
├── lib/
│   └── supabase.ts        # Supabase client & types
├── modules/
│   └── usage-stats/       # Native Android module
├── stores/
│   ├── authStore.ts       # Authentication state
│   └── friendStore.ts     # Friend & status state
├── supabase/
│   ├── schema.sql         # Main database schema
│   └── user_status.sql    # Real-time status table
└── services/
    └── StatusBroadcaster.ts  # Status broadcasting service
```

## 🗄️ Database Schema

### Tables

| Table | Description |
|-------|-------------|
| `profiles` | User profiles (username, avatar) |
| `friends` | Friend relationships (pending/accepted) |
| `peeps` | Log of peep actions |
| `user_status` | Real-time app status per user |

### Row Level Security

All tables have RLS policies ensuring:
- Users can only see their own data and friends' data
- Users can only modify their own records

## 🔧 Native Module: UsageStats

The app uses a custom Expo module to detect the foreground app on Android.

**Permissions required:**
- `PACKAGE_USAGE_STATS` — Requires user to grant in Settings

**Exported functions:**
- `hasPermission()` — Check if usage access is granted
- `requestPermission()` — Open settings to grant access
- `getForegroundApp()` — Get current foreground package name

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License.

## 🙏 Acknowledgments

- [Expo](https://expo.dev) for the amazing React Native tooling
- [Supabase](https://supabase.com) for the backend infrastructure
- [Zustand](https://github.com/pmndrs/zustand) for simple state management
