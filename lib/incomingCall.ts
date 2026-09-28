import { supabase } from "./supabase";
import { RealtimeChannel } from "@supabase/supabase-js";

export type IncomingPayload = {
  fromId: string;
  fromName: string;
  callType: "audio" | "video";
  callId: string;
};

type Handlers = {
  onIncoming: (p: IncomingPayload) => void;
  onCancel?: (callId: string) => void;
};

/**
 * প্রতি ইউজার চ্যানেল: a2a:{userId}
 * caller broadcast করে type=invite
 */
export function subscribeIncomingCalls(
  myUserId: string,
  handlers: Handlers
): RealtimeChannel {
  const channel = supabase.channel(`a2a:${myUserId}`, {
    config: { broadcast: { self: false } },
  });

  channel
    .on("broadcast", { event: "invite" }, ({ payload }) => {
      const p = payload as IncomingPayload;
      if (p?.fromId) handlers.onIncoming(p);
    })
    .on("broadcast", { event: "cancel" }, ({ payload }) => {
      const id = (payload as any)?.callId;
      if (id) handlers.onCancel?.(id);
    })
    .subscribe();

  return channel;
}

export async function sendCallInvite(opts: {
  toUserId: string;
  fromId: string;
  fromName: string;
  callType: "audio" | "video";
  callId: string;
}) {
  const ch = supabase.channel(`a2a:${opts.toUserId}`);
  await ch.subscribe();
  await ch.send({
    type: "broadcast",
    event: "invite",
    payload: {
      fromId: opts.fromId,
      fromName: opts.fromName,
      callType: opts.callType,
      callId: opts.callId,
    },
  });
  // channel পরে remove করা যায়
  setTimeout(() => {
    void supabase.removeChannel(ch);
  }, 2000);
}

export async function sendCallCancel(toUserId: string, callId: string) {
  const ch = supabase.channel(`a2a:${toUserId}`);
  await ch.subscribe();
  await ch.send({
    type: "broadcast",
    event: "cancel",
    payload: { callId },
  });
  setTimeout(() => {
    void supabase.removeChannel(ch);
  }, 1500);
}
