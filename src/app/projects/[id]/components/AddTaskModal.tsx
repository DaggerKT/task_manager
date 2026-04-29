import { useState } from "react";
import { X } from "lucide-react";
import dynamic from "next/dynamic";
import type { ProjectMember } from "@/types/project";
import "react-quill-new/dist/quill.snow.css";

const ReactQuill = dynamic(() => import("react-quill-new"), { ssr: false });

interface Props {
  isOpen: boolean;
  onClose: () => void;
  members: ProjectMember[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onAddTask: (task: any) => void;
}

export default function AddTaskModal({ isOpen, onClose, members, onAddTask }: Props) {
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskType, setNewTaskType] = useState("General");
  const [newTaskAssignee, setNewTaskAssignee] = useState("K");
  const [newTaskDescription, setNewTaskDescription] = useState("");

  if (!isOpen) return null;

  const handleSubmit = () => {
    if (!newTaskTitle.trim()) return;

    onAddTask({
      id: `t_${Date.now()}`,
      title: newTaskTitle,
      status: "todo",
      type: newTaskType,
      assignee: newTaskAssignee,
      description: newTaskDescription,
      comments: 0,
      commentList: []
    });

    setNewTaskTitle("");
    setNewTaskType("General");
    setNewTaskAssignee("K");
    setNewTaskDescription("");
  };

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl overflow-hidden relative flex flex-col max-h-[90vh]">
        <div className="flex justify-between items-center p-5 border-b border-gray-100 shrink-0">
          <h2 className="text-lg font-bold text-gray-900">สร้างงานใหม่</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="p-6 space-y-5 overflow-y-auto flex-1">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">ชื่องาน (Task Title) <span className="text-red-500">*</span></label>
            <input 
              type="text" 
              value={newTaskTitle}
              onChange={(e) => setNewTaskTitle(e.target.value)}
              placeholder="เช่น ออกแบบหน้า Login..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">ประเภทงาน (Type)</label>
              <select 
                value={newTaskType}
                onChange={(e) => setNewTaskType(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              >
                <option value="Frontend">Frontend</option>
                <option value="Backend">Backend</option>
                <option value="Design">Design</option>
                <option value="QA">QA</option>
                <option value="General">ทั่วไป (General)</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">ผู้รับผิดชอบ (Assignee)</label>
              <select 
                value={newTaskAssignee}
                onChange={(e) => setNewTaskAssignee(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              >
                {members.map(member => (
                  <option key={member.id} value={member.avatar}>{member.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex-1 flex flex-col min-h-[250px]">
            <label className="block text-sm font-medium text-gray-700 mb-1.5">รายละเอียด (Description - รองรับรูปภาพ)</label>
            <div className="flex-1 border border-gray-300 rounded-lg overflow-hidden [&_.quill]:h-[200px] [&_.ql-container]:border-none [&_.ql-toolbar]:border-none [&_.ql-toolbar]:border-b [&_.ql-toolbar]:border-gray-300">
              <ReactQuill 
                theme="snow" 
                value={newTaskDescription} 
                onChange={setNewTaskDescription}
                placeholder="พิมพ์รายละเอียดงาน วางภาพ หรือจัดรูปแบบได้ตามต้องการ..."
                modules={{
                  toolbar: [
                    [{ 'header': [1, 2, 3, false] }],
                    ['bold', 'italic', 'underline', 'strike'],
                    [{ 'list': 'ordered'}, { 'list': 'bullet' }],
                    ['link', 'image'],
                    ['clean']
                  ],
                }}
              />
            </div>
          </div>
        </div>

        <div className="p-5 border-t border-gray-100 flex justify-end gap-3 bg-gray-50 shrink-0">
          <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200 rounded-lg transition-colors">
            ยกเลิก
          </button>
          <button 
            onClick={handleSubmit}
            disabled={!newTaskTitle.trim()}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors"
          >
            สร้างงาน
          </button>
        </div>
      </div>
    </div>
  );
}