import th from "@/locales/th.json";
import en from "@/locales/en.json";

export type Locale = "th" | "en";

export const DEFAULT_LOCALE: Locale = "th";
export const LOCALE_STORAGE_KEY = "app_locale";

export const translations = { th, en };

export type Translations = typeof th;

