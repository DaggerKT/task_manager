import { ProjectInfo, ProjectMember, Task, Column, ColorOption } from './types';

export const MOCK_PROJECT: ProjectInfo = {
  id: "1",
  name: "Website Redesign",
  description: "ปรับปรุงหน้าเว็บไซต์หลักของบริษัทให้ทันสมัยและรองรับมือถือมากขึ้น",
  status: "Active",
  dueDate: "2024-05-15",
};

export const MOCK_MEMBERS: ProjectMember[] = [
  { id: 1, name: "Khomkrit U.", role: "Project Manager", avatar: "K" },
  { id: 2, name: "Jane Doe", role: "UI/UX Designer", avatar: "J" },
  { id: 3, name: "John Smith", role: "Frontend Dev", avatar: "S" },
];

export const INITIAL_TASKS: Task[] = [
  {
    id: "t1",
    title: "ออกแบบ Wireframe หน้าแรก",
    status: "done",
    type: "Design",
    assignee: "J",
    description: "<p>ออกแบบหน้าแรกให้สวยงามและมีการใช้งานครบถ้วน</p>",
    comments: 2,
    commentList: [
      { id: 1, text: "เริ่มร่างแบบแล้วครับ", author: "J", timestamp: "10:00 AM" },
      { id: 2, text: "ส่งให้ดูบ่ายนี้นะ", author: "J", timestamp: "1:30 PM" }
    ]
  },
  {
    id: "t2",
    title: "เชื่อมต่อ API ข้อมูลผู้ใช้",
    status: "in_progress",
    type: "Backend",
    assignee: "S",
    description: "<p>ดึง Token และอ่านค่า Role เพื่อตรวจสอบสิทธิ์</p>",
    comments: 1,
    commentList: [
      { id: 1, text: "กำลังไล่เช็ค Endpoint ครับ", author: "S", timestamp: "9:15 AM" }
    ]
  },
  {
    id: "t3",
    title: "ปรับปรุงระบบ Login",
    status: "todo",
    type: "Frontend",
    assignee: "K",
    description: "<p>เพิ่มปุ่มลืมรหัสผ่านและเชื่อม UI ให้ตรงกับ Design System</p>",
    comments: 0,
    commentList: []
  },
  {
    id: "t4",
    title: "ทดสอบ Responsive หน้า Dashboard",
    status: "todo",
    type: "QA",
    assignee: "S",
    description: "<p>เทสระบบในโหมดมือถือและแท็บเล็ตให้ไม่หลุดเฟรม</p>",
    comments: 5,
    commentList: [
      { id: 1, text: "iPhone 12 หน้าจอแตกนิดหน่อยครับ เดี่ยวแก้โค้ดให้", author: "S", timestamp: "เมื่อวาน" },
      { id: 2, text: "โอเคครับ", author: "K", timestamp: "11:00 AM" }
    ]
  },
  {
    id: "t5",
    title: "จัดการสิทธิ์ผู้ใช้งาน",
    status: "in_progress",
    type: "Backend",
    assignee: "K",
    description: "<p>ตรวจสอบตาราง Role ใน Database</p>",
    comments: 0,
    commentList: []
  },
];

export const INITIAL_COLUMNS: Column[] = [
  { id: "todo", title: "รอทำ (To Do)", color: "#9ca3af" },
  { id: "in_progress", title: "กำลังทำ (In Progress)", color: "#3b82f6" },
  { id: "done", title: "เสร็จสิ้น (Done)", color: "#22c55e" },
];

export const COLOR_OPTIONS: ColorOption[] = [
  { id: "blue", label: "สีฟ้า", color: "#3b82f6" },
  { id: "purple", label: "สีม่วง", color: "#a855f7" },
  { id: "pink", label: "สีชมพู", color: "#ec4899" },
  { id: "orange", label: "สีส้ม", color: "#f97316" },
  { id: "yellow", label: "สีเหลือง", color: "#eab308" },
  { id: "teal", label: "สีเขียวอมฟ้า", color: "#14b8a6" },
];