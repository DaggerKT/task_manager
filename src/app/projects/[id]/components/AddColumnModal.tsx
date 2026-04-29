import { useState } from "react";
import { X } from "lucide-react";
import { Column, ColorOption } from "../types";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  columns: Column[];
  colorOptions: ColorOption[];
  onAddColumn: (title: string, colorId: string, insertAfterId: string) => void;
}

export default function AddColumnModal({ isOpen, onClose, columns, colorOptions, onAddColumn }: Props) {
  const [newColTitle, setNewColTitle] = useState("");
  const [newColColor, setNewColColor] = useState("#3b82f6");
  // ใส่ค่า Default ขั้นต้นเป็น "todo" หรือถ้ามีการเปลี่ยนแปลงจะค่อยว่ากันตอน Submit
  const [insertAfterId, setInsertAfterId] = useState("todo");

  // เพื่อป้องกัน Warning setState ภายใน useEffect เราใช้ onOpen handler แทน หรือแค่ default เวลาเลือก
  const defaultInsertAfterId = columns.length > 1 ? columns[columns.length - 2].id : "todo";

  if (!isOpen) return null;

  const handleSubmit = () => {
    if (!newColTitle.trim()) return;
    onAddColumn(newColTitle, newColColor, insertAfterId === "todo" ? defaultInsertAfterId : insertAfterId);
    setNewColTitle("");
    setNewColColor("#3b82f6");
    setInsertAfterId("todo"); // reset form
  };

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden relative">
        <div className="flex justify-between items-center p-5 border-b border-gray-100">
          <h2 className="text-lg font-bold text-gray-900">เพิ่มขั้นตอนใหม่</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="p-6 space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">ชื่อขั้นตอน</label>
            <input 
              type="text" 
              value={newColTitle}
              onChange={(e) => setNewColTitle(e.target.value)}
              placeholder="เช่น ตรวจสอบโค้ด, รออนุมัติ..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">เลือกสัญลักษณ์สี หรือกำหนดเอง</label>
            <div className="flex gap-3 items-center flex-wrap">
              {colorOptions.map((color) => (
                <button
                  key={color.id}
                  onClick={() => setNewColColor(color.color)}
                  className={`w-8 h-8 rounded-full ring-offset-2 transition-all ${newColColor === color.color ? 'ring-2 ring-gray-400 scale-110 shadow-md' : 'hover:scale-105 shadow-sm'}`}
                  style={{ backgroundColor: color.color }}
                  title={color.label}
                />
              ))}
              <div className="w-px h-8 bg-gray-200 mx-1 border-none"></div>
              <div className="flex items-center gap-2">
                <div 
                  className="w-8 h-8 rounded-full ring-offset-2 transition-all ring-2 ring-gray-200 overflow-hidden relative shadow-sm"
                  style={{ backgroundColor: newColColor }}
                >
                  <input 
                    type="color" 
                    value={newColColor}
                    onChange={(e) => setNewColColor(e.target.value)}
                    className="absolute inset-0 w-12 h-12 -top-2 -left-2 cursor-pointer opacity-0"
                    title="เลือกสีที่ต้องการ"
                  />
                </div>
                <span className="text-xs text-gray-500 font-mono bg-gray-100 px-2 py-1 rounded">
                  {newColColor.toUpperCase()}
                </span>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">ตำแหน่ง (ต้องการให้อยู่หลังช่องไหน)</label>
            <select 
              value={insertAfterId === "todo" ? defaultInsertAfterId : insertAfterId}
              onChange={(e) => setInsertAfterId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            >
              {columns.slice(0, -1).map(col => (
                <option key={col.id} value={col.id}>{col.title}</option>
              ))}
            </select>
            <p className="text-xs text-gray-500 mt-2">
              * จะถูกแทรกไว้ตรงกลาง ไม่สามารถไปอยู่หลัง &quot;เสร็จสิ้น&quot; ได้
            </p>
          </div>
        </div>

        <div className="p-5 border-t border-gray-100 flex justify-end gap-3 bg-gray-50">
          <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200 rounded-lg transition-colors">
            ยกเลิก
          </button>
          <button 
            onClick={handleSubmit}
            disabled={!newColTitle.trim()}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors"
          >
            ตกลง
          </button>
        </div>
      </div>
    </div>
  );
}