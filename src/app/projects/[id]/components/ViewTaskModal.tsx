import { useState } from "react";
import { X } from "lucide-react";
import dynamic from "next/dynamic";
import { Task, Column, ProjectMember } from "../types";
import "react-quill-new/dist/quill.snow.css";

const ReactQuill = dynamic(() => import("react-quill-new"), { ssr: false });

interface Props {
  task: Task | null;
  columns: Column[];
  members: ProjectMember[];
  onClose: () => void;
  onDelete: (id: string) => void;
  onUpdate: (updatedTask: Task) => void;
}

export default function ViewTaskModal({ task, columns, members, onClose, onDelete, onUpdate }: Props) {
  const [newComment, setNewComment] = useState("");
  const [isEditingDescription, setIsEditingDescription] = useState(false);
  const [editDescriptionContent, setEditDescriptionContent] = useState("");

  if (!task) return null;

  const handleAddComment = () => {
    if (!newComment.trim()) return;
    
    const newCommentObj = {
      id: Date.now(),
      text: newComment,
      author: "K",
      timestamp: new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })
    };

    onUpdate({
      ...task,
      comments: (task.comments || 0) + 1,
      commentList: [...(task.commentList || []), newCommentObj]
    });
    setNewComment("");
  };

  const handleSaveDescription = () => {
    onUpdate({ ...task, description: editDescriptionContent });
    setIsEditingDescription(false);
  };

  const handleClose = () => {
    setIsEditingDescription(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl overflow-hidden relative flex flex-col max-h-[90vh]">
        <div className="flex justify-between items-center p-5 border-b border-gray-100 shrink-0">
          <div className="flex items-center gap-3">
            <span className="px-2.5 py-1 bg-gray-100 text-gray-700 text-xs font-semibold rounded">{task.type}</span>
            <span className="text-gray-500 text-sm">ID: {task.id}</span>
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={() => {
                if (confirm("คุณแน่ใจหรือไม่ที่จะลบงานนี้?")) {
                  onDelete(task.id);
                  handleClose();
                }
              }}
              className="text-red-500 hover:text-red-700 p-2 hover:bg-red-50 rounded-lg transition-colors text-sm font-medium"
            >
              ลบงาน
            </button>
            <button onClick={handleClose} className="text-gray-400 hover:text-gray-600 p-1">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
        
        <div className="p-6 space-y-5 overflow-y-auto flex-1">
          <h2 className="text-2xl font-bold text-gray-900">{task.title}</h2>
          
          <div className="grid grid-cols-2 gap-4 border border-gray-100 bg-gray-50 rounded-xl p-4">
             <div>
                <p className="text-xs text-gray-500 mb-1">สถานะปัจจุบัน</p>
                <div className="flex items-center gap-2 font-medium text-gray-900">
                  {(() => {
                    const col = columns.find(c => c.id === task.status);
                    return col ? (
                      <>
                        <div className="w-2.5 h-2.5 rounded-full shadow-[0_0_2px_rgba(0,0,0,0.2)]" style={{ backgroundColor: col.color }} />
                        {col.title}
                      </>
                    ) : (
                      task.status
                    )
                  })()}
                </div>
             </div>
             <div>
                <p className="text-xs text-gray-500 mb-1">ผู้รับผิดชอบ</p>
                <div className="flex items-center gap-2">
                   <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center text-[10px] font-bold text-blue-700">
                     {task.assignee}
                   </div>
                   <span className="text-sm font-medium">{members.find(m => m.avatar === task.assignee)?.name || task.assignee}</span>
                </div>
             </div>
          </div>

          <div className="flex flex-col">
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-sm font-semibold text-gray-800">รายละเอียด (Description)</h3>
              {!isEditingDescription && (
                <button 
                  onClick={() => {
                    setIsEditingDescription(true);
                    setEditDescriptionContent(task.description || "");
                  }}
                  className="text-xs text-blue-600 hover:text-blue-800 hover:underline font-medium px-2 py-1 bg-blue-50 hover:bg-blue-100 rounded-md transition-colors"
                >
                  แก้ไขรายละเอียด
                </button>
              )}
            </div>

            {isEditingDescription ? (
              <div className="border border-gray-300 rounded-lg overflow-hidden [&_.quill]:h-[150px] [&_.ql-container]:border-none [&_.ql-toolbar]:border-none [&_.ql-toolbar]:border-b [&_.ql-toolbar]:border-gray-300 flex flex-col mb-4">
                <ReactQuill 
                  theme="snow" 
                  value={editDescriptionContent} 
                  onChange={setEditDescriptionContent}
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
                <div className="flex justify-end gap-2 p-3 bg-gray-50 border-t border-gray-200 mt-10">
                  <button 
                    onClick={() => setIsEditingDescription(false)}
                    className="px-4 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-200 rounded-lg transition-colors"
                  >
                    ยกเลิก
                  </button>
                  <button 
                    onClick={handleSaveDescription}
                    className="px-4 py-1.5 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
                  >
                    บันทึก
                  </button>
                </div>
              </div>
            ) : (
              task.description && task.description !== "<p><br></p>" ? (
                <div 
                  className="text-gray-700 bg-white border border-gray-100 rounded-lg p-4 [&>p]:mb-3 [&>h1]:text-2xl [&>h1]:font-bold [&>h2]:text-xl [&>h2]:font-bold [&>h3]:text-lg [&>h3]:font-bold [&>ul]:list-disc [&>ul]:pl-5 [&>ol]:list-decimal [&>ol]:pl-5 [&>ol]:mb-3 [&>ul]:mb-3 [&_img]:max-w-full [&_img]:rounded-md [&_a]:text-blue-600 [&_a]:underline"
                  dangerouslySetInnerHTML={{ __html: task.description }}
                />
              ) : (
                <div className="text-gray-400 italic text-sm bg-gray-50 border border-dashed border-gray-200 p-4 rounded-lg text-center">ไม่มีรายละเอียดงาน...</div>
              )
            )}
          </div>

          <div className="pt-4 border-t border-gray-100">
            <h3 className="text-sm font-semibold text-gray-800 mb-3">ความคิดเห็น ({task.comments || 0})</h3>
            <div className="space-y-3 mb-4">
              {(task.commentList || []).map((comment) => (
                <div key={comment.id} className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-xs font-bold text-blue-700 shrink-0 border border-white shadow-sm ring-1 ring-gray-100">
                    {comment.author}
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3 w-full border border-gray-100">
                    <div className="flex justify-between items-start mb-1">
                      <span className="text-xs font-bold text-gray-800">
                        {members.find(m => m.avatar === comment.author)?.name || comment.author}
                      </span>
                      <span className="text-[10px] text-gray-400">{comment.timestamp}</span>
                    </div>
                    <p className="text-sm text-gray-600">{comment.text}</p>
                  </div>
                </div>
              ))}
              {(!task.commentList || task.commentList.length === 0) && (
                <div className="text-center text-sm text-gray-400 py-4 bg-gray-50 rounded-lg border border-dashed border-gray-200">ยังไม่มีความคิดเห็น... เริ่มพูดคุยเลย</div>
              )}
            </div>
            
            <div className="flex gap-3 items-start mt-4">
              <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-xs font-bold text-blue-700 shrink-0 border border-white shadow-sm ring-1 ring-gray-100">
                K
              </div>
              <div className="flex-1 flex gap-2">
                <input 
                  type="text"
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddComment()}
                  placeholder="พิมพ์ความคิดเห็น หรืออัปเดตความคืบหน้า..."
                  className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button 
                  onClick={handleAddComment}
                  disabled={!newComment.trim()}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  ส่ง
                </button>
              </div>
            </div>
          </div>
        </div>
        
        <div className="p-5 border-t border-gray-100 flex justify-end gap-3 bg-gray-50 shrink-0">
          <button onClick={handleClose} className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 transition-colors rounded-lg">
            ปิดหน้าต่าง
          </button>
        </div>
      </div>
    </div>
  );
}