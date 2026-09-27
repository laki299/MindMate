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
   
