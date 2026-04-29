import { MessageSquare, MoreHorizontal } from "lucide-react";
import type { Task } from "@/types/kanban";

interface Props {
  task: Task;
  onDragStart: (e: React.DragEvent, id: string) => void;
  onClick: () => void;
  onDelete: (id: string) => void;
}

export default function TaskCard({ task, onDragStart, onClick, onDelete }: Props) {
  // If we had columns passed to TaskCard, we could lookup task.status to display it colored.
  return (
    <div
      draggable
      onDragStart={(e) => onDragStart(e, task.id)}
      onClick={onClick}
      className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 cursor-grab active:cursor-grabbing hover:shadow-md hover:border-blue-300 transition-all group relative overflow-hidden"
    >
      <div className="flex justify-between items-start mb-2">
        <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-gray-100 text-gray-600">
          {task.type}
        </span>
        <button 
          onClick={(e) => {
            e.stopPropagation();
            if (confirm("คุณแน่ใจหรือไม่ที่จะลบงานนี้?")) {
              onDelete(task.id);
            }
          }}
          className="text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
          title="ลบงานนี้"
        >
          <MoreHorizontal className="w-4 h-4" />
        </button>
      </div>

      <p className="text-sm font-medium text-gray-800 mb-4">
        {task.title}
      </p>

      <div className="flex justify-between items-end mt-auto">
        <div className="flex items-center gap-2 text-gray-400">
          <MessageSquare className="w-3.5 h-3.5" />
          <span className="text-xs">{task.comments || 0}</span>
        </div>
        <div
          title={`Assignee: ${task.assignee}`}
          className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center text-[10px] font-bold text-blue-700 border border-white shadow-sm ring-1 ring-gray-100"
        >
          {task.assignee}
        </div>
      </div>
    </div>
  );
}