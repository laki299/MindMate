/**
 * কন্টাক্ট সেভ করা থাকলে → custom_name + contact_avatar
 * না থাকলে / অচেনা কলার → প্রোফাইল full_name + avatar_url
 */
export function resolveContactDisplay(opts: {
  customName?: string | null;
  contactAvatar?: string | null;
  profileName?: string | null;
  profileUsername?: string | null;
  profileAvatar?: string | null;
  phoneCode?: string | null;
  unknownLabel?: string;
}): { name: string; avatarUrl: string | null } {
  const nameFromContact = opts.customName?.trim();
  if (nameFromContact) {
    return {
      name: nameFromContact,
      avatarUrl: opts.contactAvatar || opts.profileAvatar || null,
    };
  }

  const nameFromProfile =
    opts.profileName?.trim() ||
    opts.profileUsername?.trim() ||
    opts.phoneCode ||
    opts.unknownLabel ||
    "Unknown";

  return {
    name: nameFromProfile,
    avatarUrl: opts.profileAvatar || null,
  };
}

export function resolveIncomingCallerDisplay(opts: {
  /** লোকাল কন্টাক্টে সেভ করা নাম */
  savedCustomName?: string | null;
  savedAvatar?: string | null;
  /** কলারের প্রোফাইল */
  callerFullName?: string | null;
  callerUsername?: string | null;
  callerAvatar?: string | null;
  callerPhoneCode?: string | null;
  unknownLabel?: string;
}): { name: string; avatarUrl: string | null } {
  if (opts.savedCustomName?.trim()) {
    return {
      name: opts.savedCustomName.trim(),
      avatarUrl: opts.savedAvatar || opts.callerAvatar || null,
    };
  }
  return {
    name:
      opts.callerFullName?.trim() ||
      opts.callerUsername?.trim() ||
      opts.callerPhoneCode ||
      opts.unknownLabel ||
      "Unknown",
    avatarUrl: opts.callerAvatar || null,
  };
  }
