import AsyncStorage from "@react-native-async-storage/async-storage";

const AD_STREAK_KEY = "ad_streak_count";
const AD_LAST_AT_KEY = "ad_last_at";
const AD_BATCH_UNTIL_KEY = "ad_batch_until";

const SV_STREAK_KEY = "sv_streak_count";
const SV_LAST_AT_KEY = "sv_last_at";
const SV_BATCH_UNTIL_KEY = "sv_batch_until";

export type LimitConfig = {
  maxPerMinute: number;
  maxConsecutive: number;
  batchCooldownMinutes: number;
};

export type LimitResult =
  | { ok: true }
  | { ok: false; reason: string };

async function checkLimit(
  streakKey: string,
  lastAtKey: string,
  batchUntilKey: string,
  cfg: LimitConfig,
  label: string
): Promise<LimitResult> {
  const now = Date.now();

  const batchUntilRaw = await AsyncStorage.getItem(batchUntilKey);
  const batchUntil = batchUntilRaw ? parseInt(batchUntilRaw, 10) : 0;
  if (batchUntil > now) {
    const mins = Math.ceil((batchUntil - now) / 60000);
    return {
      ok: false,
      reason: `${label}: টানা লিমিট শেষ। ${mins} মিনিট পর আবার চেষ্টা করো।`,
    };
  }

  const lastAtRaw = await AsyncStorage.getItem(lastAtKey);
  const lastAt = lastAtRaw ? parseInt(lastAtRaw, 10) : 0;
  const minGap = 60000 / Math.max(1, cfg.maxPerMinute);

  if (lastAt && now - lastAt < minGap) {
    const sec = Math.ceil((minGap - (now - lastAt)) / 1000);
    return {
      ok: false,
      reason: `${label}: প্রতি মিনিটে সর্বোচ্চ ${cfg.maxPerMinute}টি। ${sec}s অপেক্ষা করো।`,
    };
  }

  return { ok: true };
}

async function recordWatch(
  streakKey: string,
  lastAtKey: string,
  batchUntilKey: string,
  cfg: LimitConfig
) {
  const now = Date.now();
  await AsyncStorage.setItem(lastAtKey, String(now));

  const streakRaw = await AsyncStorage.getItem(streakKey);
  let streak = streakRaw ? parseInt(streakRaw, 10) : 0;
  streak += 1;

  if (streak >= cfg.maxConsecutive) {
    const until = now + cfg.batchCooldownMinutes * 60 * 1000;
    await AsyncStorage.setItem(batchUntilKey, String(until));
    await AsyncStorage.setItem(streakKey, "0");
  } else {
    await AsyncStorage.setItem(streakKey, String(streak));
  }
}

export async function canWatchAd(cfg: LimitConfig): Promise<LimitResult> {
  return checkLimit(
    AD_STREAK_KEY,
    AD_LAST_AT_KEY,
    AD_BATCH_UNTIL_KEY,
    cfg,
    "অ্যাড"
  );
}

export async function recordAdWatch(cfg: LimitConfig) {
  return recordWatch(
    AD_STREAK_KEY,
    AD_LAST_AT_KEY,
    AD_BATCH_UNTIL_KEY,
    cfg
  );
}

export async function canWatchShortVideo(cfg: LimitConfig): Promise<LimitResult> {
  return checkLimit(
    SV_STREAK_KEY,
    SV_LAST_AT_KEY,
    SV_BATCH_UNTIL_KEY,
    cfg,
    "শর্ট ভিডিও"
  );
}

export async function recordShortVideoWatch(cfg: LimitConfig) {
  return recordWatch(
    SV_STREAK_KEY,
    SV_LAST_AT_KEY,
    SV_BATCH_UNTIL_KEY,
    cfg
  );
 }
