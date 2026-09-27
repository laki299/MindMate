# MindMate

মানসিক সাপোর্ট কথোপকথন অ্যাপ — Expo + Supabase + WebRTC (P2P) + Metered TURN.

## Stack
- React Native (Expo Router)
- Supabase (Auth, DB, Realtime, RPC)
- WebRTC (`react-native-webrtc`) + Supabase signaling
- Metered.ca TURN
- AppLovin MAX (পরে)

## Roles
- **User** — queue, chat, call, gift, earn coins (ads)
- **Host** — queue, rates, earnings, block/report (ads নয়)
- **Admin** — stats, ad limits, monetization, reports, hosts

## Setup (Laptop)

1. Clone repo  
2. Copy env:
   ```bash
   cp .env.example .env
   
Fill:

- EXPO_PUBLIC_SUPABASE_URL
- EXPO_PUBLIC_SUPABASE_ANON_KEY
- EXPO_PUBLIC_METERED_USER
- EXPO_PUBLIC_METERED_PASS

3. Install:
   ```bash
   npm install
   npx expo install react-native-webrtc

4. Supabase SQL: run schema + RPCs (transfer_coins, grant_ad_reward, etc.)

5. Do not use Expo Go for calls. Build:
   ```bash
   npx eas login
npx eas build -p android --profile development
