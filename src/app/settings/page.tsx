"use client";

import { Save, Bell, User, Globe } from "lucide-react";

export default function SettingsPage() {
  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-10">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">ตั้งค่า (Settings)</h1>
        <p className="text-sm text-gray-500 mt-1">จัดการการตั้งค่าบัญชีและการใช้งานระบบ</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
         {/* Profile Settings */}
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-center gap-3 mb-6">
            <User className="w-5 h-5 text-blue-600" />
            <h2 className="text-lg font-semibold text-gray-800">ข้อมูลผู้ใช้งาน (Profile)</h2>
          </div>
          
          <div className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">ชื่อ (First Name)</label>
                <input type="text" defaultValue="Khomkrit" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">นามสกุล (Last Name)</label>
                <input type="text" defaultValue="U." className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">อีเมล (Email)</label>
              <input type="email" defaultValue="khomkrit@example.com" disabled className="w-full px-3 py-2 border border-gray-200 bg-gray-50 text-gray-500 rounded-lg" />
              <p className="text-xs text-gray-500 mt-1.5">ไม่อนุญาตให้เปลี่ยนอีเมลที่ใช้สมัคร กรุณาติดต่อ Admin หากต้องการเปลี่ยน</p>
            </div>
          </div>
        </div>

        {/* Notifications */}
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-center gap-3 mb-6">
            <Bell className="w-5 h-5 text-blue-600" />
            <h2 className="text-lg font-semibold text-gray-800">การแจ้งเตือน (Notifications)</h2>
          </div>
          
          <div className="space-y-4">
            <label className="flex items-center justify-between cursor-pointer">
              <div>
                <p className="text-sm font-medium text-gray-900">แจ้งเตือนผ่านอีเมล (Email Notifications)</p>
                <p className="text-xs text-gray-500">รับแจ้งเตือนเมื่อมีการมอบหมายงานใหม่ให้คุณ</p>
              </div>
              <div className="relative">
                <input type="checkbox" className="sr-only peer" defaultChecked />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </div>
            </label>
            <label className="flex items-center justify-between cursor-pointer">
              <div>
                <p className="text-sm font-medium text-gray-900">แจ้งเตือนบนเบราว์เซอร์ (Push Notifications)</p>
                <p className="text-xs text-gray-500">รับแจ้งเตือนแบบเรียลไทม์เมื่อโปรเจคมีการเปลี่ยนแปลง</p>
              </div>
              <div className="relative">
                <input type="checkbox" className="sr-only peer" defaultChecked />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </div>
            </label>
          </div>
        </div>

        {/* Preferences */}
        <div className="p-6">
          <div className="flex items-center gap-3 mb-6">
            <Globe className="w-5 h-5 text-blue-600" />
            <h2 className="text-lg font-semibold text-gray-800">การตั้งค่าทั่วไป (Preferences)</h2>
          </div>
          
          <div className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">ภาษา (Language)</label>
              <select className="w-full sm:w-1/2 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white">
                <option value="th">ภาษาไทย (Thai)</option>
                <option value="en">English (US)</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-end pt-4">
         <button className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-lg font-medium transition-colors shadow-sm">
           <Save className="w-5 h-5" />
           <span>บันทึกการเปลี่ยนแปลง</span>
         </button>
      </div>

    </div>
  );
}