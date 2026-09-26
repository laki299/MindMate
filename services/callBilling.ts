import { supabase } from "../lib/supabase";

/**
 * প্রতি সেকেন্ডে host.call_rate অনুযায়ী কয়েন কাটে।
 * ব্যালেন্স শেষ হলে onBroke() কল।
 */
export function startCallBilling(opts: {
  userId: string;
  hostId: string;
  sessionId: string;
  ratePerSecond: number;
  monetizationOn: boolean;
  getBalance: () => number;
  onBalanceUpdate: (next: number) => void;
  onBroke: () => void;
}) {
  if (!opts.monetizationOn || opts.ratePerSecond <= 0) {
    return () => {};
  }

  const tick = async () => {
    const bal = opts.getBalance();
    if (bal < opts.ratePerSecond) {
      opts.onBroke();
      return;
    }

    try {
      await supabase.rpc("transfer_coins", {
        p_from_user_id: opts.userId,
        p_to_host_id: opts.hostId,
        p_amount: opts.ratePerSecond,
        p_type: "audio_call",
        p_service_type: "audio_call",
        p_session_id: opts.sessionId,
        p_description: "Audio call 1s",
      });
      opts.onBalanceUpdate(bal - opts.ratePerSecond);
    } catch {
      opts.onBroke();
    }
  };

  const id = setInterval(tick, 1000);
  return () => clearInterval(id);
}
