import { LOCAL_COUNTRY_CODES } from "./constants";

export function isExpatCountry(countryCode?: string | null): boolean {
  if (!countryCode) return false;
  const cc = countryCode.toUpperCase();
  return !(LOCAL_COUNTRY_CODES as readonly string[]).includes(cc);
}

export function displayContactName(
  customName: string | null | undefined,
  fullName: string | null | undefined,
  username: string | null | undefined,
  phoneCode: string | null | undefined
): string {
  if (customName?.trim()) return customName.trim();
  if (fullName?.trim()) return fullName.trim();
  if (username?.trim()) return username.trim();
  return phoneCode || "Unknown";
}
