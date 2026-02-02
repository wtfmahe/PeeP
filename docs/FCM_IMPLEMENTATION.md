# FCM Implementation Plan for Peep

## Overview

Firebase Cloud Messaging (FCM) will enable "Peep on Demand" — when User A peeps User B, it sends a push notification to User B's phone, waking it up to report their current app status.

---

## What YOU Need To Do (One-Time Setup)

### Step 1: Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Click **"Create a project"** → Name it "Peep"
3. Disable Google Analytics (optional)
4. Wait for project creation

### Step 2: Add Android App to Firebase

1. Click **"Add app"** → Select **Android**
2. Enter package name: `com.anonymous.peep`
3. Download `google-services.json`
4. Place it in: `/Users/mahe/.gemini/antigravity/scratch/peep/android/app/google-services.json`

### Step 3: Get Server Key (for Backend)

1. Go to **Project Settings** → **Cloud Messaging**
2. Copy the **Server Key** (or create a Service Account JSON for v1 API)
3. We'll add this to Supabase Secrets

### Step 4: Enable Cloud Functions (or use Supabase Edge Functions)

We need a backend function that:
- Listens for new rows in `peeps` table
- Sends FCM push to the target user's device

---

## What I Will Code

### 1. Client-Side (React Native)

```
npm install expo-notifications expo-device
```

- Register for push notifications on app start
- Save FCM token to `profiles.fcm_token` in Supabase
- Handle incoming push notifications

### 2. Database Changes

Add column to store FCM tokens:
```sql
ALTER TABLE profiles ADD COLUMN fcm_token TEXT;
```

### 3. Backend Trigger (Supabase Edge Function)

When a peep is inserted:
1. Get target user's FCM token from profiles
2. Get peeper's username
3. Send FCM push: "👀 {username} wants to peep you!"
4. Target device wakes up, broadcasts status to `user_status`
5. Peeper fetches the updated status

---

## Flow Diagram

```
User A (Peeper)                  Supabase                     User B (Target)
      |                              |                              |
      |  1. INSERT INTO peeps        |                              |
      | ---------------------------> |                              |
      |                              |  2. Trigger Edge Function    |
      |                              | ----------------------------> |
      |                              |     Send FCM Push            |
      |                              |                              |
      |                              |  3. Device wakes up          |
      |                              | <--------------------------- |
      |                              |     UPSERT user_status       |
      |                              |                              |
      |  4. Fetch user_status        |                              |
      | <--------------------------- |                              |
      |     Show friend's activity   |                              |
```

---

## Estimated Time

| Task | Time |
|------|------|
| Firebase setup (you) | 15 min |
| Client-side code (me) | 30 min |
| Edge Function (me) | 20 min |
| Testing | 15 min |
| **Total** | ~1.5 hours |

---

## Files I Will Create/Modify

1. `lib/notifications.ts` — Push notification service
2. `app/_layout.tsx` — Register for notifications on login
3. `supabase/add_fcm_token.sql` — Database migration
4. `supabase/functions/send-peep-notification/` — Edge function

---

## Ready to Start?

Once you complete Steps 1-3 above (Firebase setup + download google-services.json), let me know and I'll implement the FCM integration!
