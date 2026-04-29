"use client";

import { useState } from "react";
import { Save, Bell, Globe, CheckCircle } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import type { Locale } from "@/lib/i18n";

export default function SettingsPage() {
  const { locale, t, setLocale } = useLanguage();
  const [selectedLocale, setSelectedLocale] = useState<Locale>(locale);
  const [emailNotif, setEmailNotif] = useState(true);
  const [pushNotif, setPushNotif] = useState(true);
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setLocale(selectedLocale);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-10">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">{t.settings.title}</h1>
        <p className="text-sm text-gray-500 mt-1">{t.settings.subtitle}</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {/* Notifications */}
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-center gap-3 mb-6">
            <Bell className="w-5 h-5 text-blue-600" />
            <h2 className="text-lg font-semibold text-gray-800">
              {t.settings.notifications.title}
            </h2>
          </div>

          <div className="space-y-4">
            <label className="flex items-center justify-between cursor-pointer">
              <div>
                <p className="text-sm font-medium text-gray-900">
                  {t.settings.notifications.email}
                </p>
                <p className="text-xs text-gray-500">
                  {t.settings.notifications.emailDesc}
                </p>
              </div>
              <div className="relative">
                <input
                  type="checkbox"
                  className="sr-only peer"
                  checked={emailNotif}
                  onChange={(e) => setEmailNotif(e.target.checked)}
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </div>
            </label>
            <label className="flex items-center justify-between cursor-pointer">
              <div>
                <p className="text-sm font-medium text-gray-900">
                  {t.settings.notifications.push}
                </p>
                <p className="text-xs text-gray-500">
                  {t.settings.notifications.pushDesc}
                </p>
              </div>
              <div className="relative">
                <input
                  type="checkbox"
                  className="sr-only peer"
                  checked={pushNotif}
                  onChange={(e) => setPushNotif(e.target.checked)}
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </div>
            </label>
          </div>
        </div>

        {/* Preferences */}
        <div className="p-6">
          <div className="flex items-center gap-3 mb-6">
            <Globe className="w-5 h-5 text-blue-600" />
            <h2 className="text-lg font-semibold text-gray-800">
              {t.settings.preferences.title}
            </h2>
          </div>

          <div className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t.settings.preferences.language}
              </label>
              <select
                value={selectedLocale}
                onChange={(e) => setSelectedLocale(e.target.value as Locale)}
                className="w-full sm:w-1/2 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
              >
                <option value="th">{t.settings.preferences.languageTh}</option>
                <option value="en">{t.settings.preferences.languageEn}</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-end gap-4 pt-4">
        {saved && (
          <div className="flex items-center gap-2 text-green-600 text-sm font-medium animate-in fade-in">
            <CheckCircle className="w-4 h-4" />
            {t.settings.saveSuccess}
          </div>
        )}
        <button
          onClick={handleSave}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-lg font-medium transition-colors shadow-sm"
        >
          <Save className="w-5 h-5" />
          <span>{t.settings.save}</span>
        </button>
      </div>
    </div>
  );
}
