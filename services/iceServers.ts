export function getIceServers() {
  const user = process.env.EXPO_PUBLIC_METERED_USER || "";
  const pass = process.env.EXPO_PUBLIC_METERED_PASS || "";

  const servers: RTCIceServer[] = [
    { urls: "stun:stun.relay.metered.ca:80" },
    { urls: "stun:stun.l.google.com:19302" },
  ];

  if (user && pass) {
    servers.push(
      {
        urls: "turn:global.relay.metered.ca:80",
        username: user,
        credential: pass,
      },
      {
        urls: "turn:global.relay.metered.ca:80?transport=tcp",
        username: user,
        credential: pass,
      },
      {
        urls: "turn:global.relay.metered.ca:443",
        username: user,
        credential: pass,
      },
      {
        urls: "turns:global.relay.metered.ca:443?transport=tcp",
        username: user,
        credential: pass,
      }
    );
  }

  return servers;
}

// টাইপ (react-native-webrtc ইন্সটলের আগে TS এরর এড়াতে)
type RTCIceServer = {
  urls: string | string[];
  username?: string;
  credential?: string;
};
