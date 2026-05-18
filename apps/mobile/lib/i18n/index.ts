import { create } from "zustand";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { translations, type Lang, type Translations } from "./translations";

const STORAGE_KEY = "gdai_lang";

interface I18nStore {
  lang: Lang;
  t: Translations;
  setLang: (lang: Lang) => Promise<void>;
  initLang: () => Promise<void>;
}

export const useI18n = create<I18nStore>((set) => ({
  lang: "tr",
  t: translations.tr,
  setLang: async (lang) => {
    await AsyncStorage.setItem(STORAGE_KEY, lang);
    set({ lang, t: translations[lang] });
  },
  initLang: async () => {
    try {
      const stored = (await AsyncStorage.getItem(STORAGE_KEY)) as Lang | null;
      if (stored === "en" || stored === "tr") {
        set({ lang: stored, t: translations[stored] });
      }
    } catch {
      // ignore
    }
  },
}));

export type { Lang, Translations };
