import { create } from "zustand";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Lang } from "../lib/i18n";
import { lightTheme, darkTheme, AppTheme } from "../lib/theme";

type SettingsState = {
  lang: Lang;
  darkMode: boolean;
  theme: AppTheme;
  hydrated: boolean;
  setLang: (lang: Lang) => Promise<void>;
  setDarkMode: (dark: boolean) => Promise<void>;
  hydrate: () => Promise<void>;
};

export const useSettingsStore = create<SettingsState>((set) => ({
  lang: "bn",
  darkMode: false,
  theme: lightTheme,
  hydrated: false,

  setLang: async (lang) => {
    await AsyncStorage.setItem("mm_lang", lang);
    set({ lang });
  },

  setDarkMode: async (dark) => {
    await AsyncStorage.setItem("mm_dark", dark ? "1" : "0");
    set({ darkMode: dark, theme: dark ? darkTheme : lightTheme });
  },

  hydrate: async () => {
    try {
      const langRaw = await AsyncStorage.getItem("mm_lang");
      const darkRaw = await AsyncStorage.getItem("mm_dark");
      const lang: Lang = langRaw === "en" ? "en" : "bn";
      const dark = darkRaw === "1";
      set({
        lang,
        darkMode: dark,
        theme: dark ? darkTheme : lightTheme,
        hydrated: true,
      });
    } catch {
      set({ hydrated: true });
    }
  },
}));
