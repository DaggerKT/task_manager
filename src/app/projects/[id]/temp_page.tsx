"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight, MoreHorizontal, Plus } from "lucide-react";
import { INITIAL_COLUMNS, INITIAL_TASKS, MOCK_PROJECT, MOCK_MEMBERS, COLOR_OPTIONS } from "./mockData";
import TaskCard from "./components/TaskCard";
import AddColumnModal from "./components/AddColumnModal";
import AddTaskModal from "./components/AddTaskModal";
import ViewTaskModal from "./components/ViewTaskModal";
import { Task, Column } from "./types";

export default function ProjectDetailPage() {
  const [columns, setColumns] = useState<Column[]>(INITIAL_COLUMNS);
  const [tasks, setTasks] = useState<Task[]>(INITIAL_TASKS);
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [viewTask, setViewTask] = useState<Task | null>(null);

  const handleAddColumn = (title: string, colorId: string, insertAfterId: string) => {
    const colorObj = COLOR_OPTIONS.find((c) => c.id === colorId) || COLOR_OPTIONS[0];
    const newCol: Column = {
      id: `col_${Date.now()}`,
      title,
      color: colorObj.color,
    };

    const newColumns = [...columns];
    const insertIndex = newColumns.findIndex((c) => c.id === insertAfterId);
    
    if (insertIndex !== -1) {
      newColumns.splice(insertIndex + 1, 0, newCol);
    } else {
      newColumns.splice(newColumns.length - 1, 0, newCol);
    }
    setColumns(newColumns);
    setIsAddModalOpen(false);
  };

  const handleMoveColumn = (index: number, direction: 'left' | 'right') => {
    if (index === 0 || index === columns.length - 1) return;
    const newIndex = direction === 'left' ? index - 1 : index + 1;
    if (newIndex === 0 || newIndex === columns.length - 1) return;

    const newColumns = [...columns];
    const temp = newColumns[index];
    newColumns[index] = newColumns[newIndex];
    newColumns[newIndex] = temp;
    setColumns(newColumns);
  };

  const handleDeleteColumn = (id: string) => {
    const hasTasks = tasks.some((t) => t.status === id);
    if (hasTasks) {
      alert("ไม่สามารถลบคอลัมน์นี้ได้เพราะยังมีงานอยู่");
      return;
    }
    setColumns(columns.filter((col) => col.id !== id));
  };

  const handleDragStart = (e: React.DragEvent, id: string) => {
    setDraggedTaskId(id);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDrop = (e: React.DragEvent, status: string) => {
    e.preventDefault();
    if (!draggedTaskId) return;

    setTasks(tasks.map((task) => (task.id === draggedTaskId ? { ...task, status } : task)));
    setDraggedTaskId(null);
  };

  return (
    <div className="h-full flex flex-col space-y-6">
      {/* Project Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-2xl font-bold text-gray-900">{MOCK_PROJECT.name}</h1>
            <span className="px-2.5 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-700">{MOCK_PROJECT.status}</span>
          </div>
          <p className="text-sm text-gray-500">{MOCK_PROJECT.description}</p>
        </div>

        {/* Members & Actions */}
        <div className="flex items-center gap-4">
          <div className="flex items-center">
            <div className="flex -space-x-2 mr-3">
              {MOCK_MEMBERS.map((member) => (
                <div key={member.id} title={member.name} className="w-8 h-8 rounded-full bg-linear-to-tr from-blue-100 to-blue-200 border-2 border-white flex items-center justify-center text-blue-700 text-xs font-bold shadow-sm cursor-help hover:-translate-y-1 transition-transform">
                  {member.avatar}
                </div>
              ))}
            </div>
            
            <button onClick={() => prompt("ddd:")} title="เพิ่มสมาชิก" className="w-8 h-8 rounded-full border border-dashed border-gray-300 flex items-center justify-center text-gray-400 hover:text-blue-600 hover:border-blue-400 transition-colors bg-white shadow-sm">
              <Plus className="w-4 h-4" />
            </button>
          </div>

          <div className="h-8 w-px bg-gray-200 hidden sm:block"></div>

          <button onClick={() => setIsAddModalOpen(true)} className="flex items-center gap-2 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm">
            <Plus className="w-4 h-4" /> เพิ่มขั้นตอน
          </button>

          <button onClick={() => setIsTaskModalOpen(true)} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm">
            <Plus className="w-4 h-4" /> สร้างงาน
          </button>
        </div>
      </div>

      {/* Kanban Board */}
      <div className="flex-1 flex gap-6 overflow-x-auto pb-4 items-start">
        {columns.map((col, index) => {
          const columnTasks = tasks.filter((t) => t.status === col.id);
          return (
            <div key={col.id} className={`shrink-0 w-80 rounded-xl p-4 flex flex-col max-h-full ${col.color} border border-gray-100`} onDragOver={handleDragOver} onDrop={(e) => handleDrop(e, col.id)}>
              <div className="flex justify-between items-center mb-4 px-1">
                <div className="flex items-center gap-2">
                  <div className={`w-2.5 h-2.5 rounded-full ${col.color} border border-gray-300`}></div>
                  <h3 className="font-semibold text-gray-700 text-sm">{col.title}</h3>
                  <span className="text-xs font-medium bg-white text-gray-500 px-2 py-0.5 rounded-full shadow-sm">{columnTasks.length}</span>
                </div>
                
                <div className="flex items-center gap-1">
                  {index > 1 && (
                    <button className="text-gray-400 hover:text-blue-600 transition-colors p-1" onClick={() => handleMoveColumn(index, 'left')} title="เลื่อนซ้าย">
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                  )}
                  {index > 0 && index < columns.length - 2 && (
                    <button className="text-gray-400 hover:text-blue-600 transition-colors p-1" onClick={() => handleMoveColumn(index, 'right')} title="เลื่อนขวา">
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  )}
                  {index !== 0 && index !== columns.length - 1 && (
                    <button className="text-gray-400 hover:text-red-500 transition-colors p-1 ml-1" onClick={() => handleDeleteColumn(col.id)} title="ลบคอลัมน์">
                      <MoreHorizontal className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              <div className="flex-1 overflow-y-auto space-y-3 min-h-[150px]">
                {columnTasks.map((task) => (
                  <TaskCard key={task.id} task={task} onDragStart={handleDragStart} onClick={() => setViewTask(task)} onDelete={(id) => setTasks(tasks.filter((t) => t.id !== id))} />
                ))}
                {columnTasks.length === 0 && (
                  <div className="h-full min-h-[100px] border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center text-gray-400 text-sm">
                    ลากงานมาวางที่นี่
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <AddColumnModal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} columns={columns} colorOptions={COLOR_OPTIONS} onAddColumn={handleAddColumn} />
      <AddTaskModal isOpen={isTaskModalOpen} onClose={() => setIsTaskModalOpen(false)} members={MOCK_MEMBERS} onAddTask={(task) => { setTasks([...tasks, task]); setIsTaskModalOpen(false); }} />
      <ViewTaskModal task={viewTask} columns={columns} members={MOCK_MEMBERS} onClose={() => setViewTask(null)} onDelete={(id) => setTasks(tasks.filter((t) => t.id !== id))} onUpdate={(updatedTask) => { setTasks(tasks.map((t) => t.id === updatedTask.id ? updatedTask : t)); setViewTask(updatedTask); }} />
    </div>
  );
}