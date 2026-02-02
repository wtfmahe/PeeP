# 👁️ Peep

A fun social app that lets you see what your friends are doing on their phones - with their permission!

## 📱 What is Peep?

Peep is a React Native app that allows friends to "peep" each other's phone activity. When you tap the Peep button, you can see which app your friend is currently using. It's a playful way to stay connected and curious about what your friends are up to!

## ✨ Features

- **Real App Detection** - Uses Android's `UsageStatsManager` to detect foreground apps
- **Friend List** - View your friends and their current app status
- **Daily Limits** - Peep limits prevent overuse (configurable)
- **Beautiful UI** - Clean black & white design with eye-catching animations
- **Permission Handling** - Graceful prompts for required permissions

## 🛠️ Tech Stack

- **React Native** with Expo
- **Expo Router** for navigation
- **TypeScript** for type safety
- **Custom Native Module** (Kotlin) for Android UsageStats API

## 📦 Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/peep.git
cd peep
```

2. Install dependencies:
```bash
npm install
```

3. Run on Android:
```bash
npx expo run:android
```

## 🔧 Project Structure

```
peep/
├── app/                    # Expo Router screens
│   ├── index.tsx          # Main home screen
│   └── _layout.tsx        # Navigation layout
├── components/            # Reusable UI components
│   ├── FriendCard.tsx    # Friend list item
│   └── PeepEye.tsx       # 3D eye animation
├── modules/              # Native modules
│   └── usage-stats/      # Android UsageStats native module
│       ├── android/      # Kotlin implementation
│       ├── index.ts      # JS interface
│       └── src/          # TypeScript module
├── constants/            # Design tokens & theme
├── services/             # Business logic
└── stores/               # State management
```

## 📱 Native Module: UsageStats

The core feature relies on a custom Expo native module that interfaces with Android's `UsageStatsManager`:

```typescript
import UsageStats from './modules/usage-stats';

// Check if permission is granted
const hasPermission = await UsageStats.hasPermission();

// Request permission (opens system settings)
await UsageStats.requestPermission();

// Get the foreground app
const packageName = await UsageStats.getForegroundApp();
```

### Required Permissions

The app requires the `PACKAGE_USAGE_STATS` permission, which must be granted manually by the user in system settings.

## 🎨 Design

- **Theme**: Sleek black & white with accent colors
- **Typography**: Clean, modern sans-serif
- **Animations**: Smooth transitions and eye animations

## 🚀 Future Plans

- [ ] iOS implementation (Screen Time API)
- [ ] Backend integration (Supabase)
- [ ] Push notifications
- [ ] 3D animated eye component
- [ ] Friend request system
- [ ] Real-time updates

## 📄 License

MIT License - feel free to use and modify!

---

Built with ❤️
