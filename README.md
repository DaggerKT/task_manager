# Task Manager

ระบบจัดการงาน (Task Management) ที่รองรับการทำงานร่วมกันแบบ Real-time พร้อมมุมมอง Kanban Board และ Gantt Chart Timeline

## Features

- **Kanban Board:** จัดการสถานะงานแบบลากวาง (Drag & Drop)
- **Real-time Collaboration:** อัปเดตข้อมูลทันทีเมื่อมีการเปลี่ยนแปลงผ่าน WebSockets
- **Gantt Chart Timeline:** วางแผนงานด้วยมุมมอง Timeline (ใช้ `gantt-task-react`)
- **Rich Text Editor:** เขียนรายละเอียดงานด้วย TinyMCE หรือ Quill Editor พร้อมรองรับการปรับขนาดรูปภาพ
- **User Management:** ระบบจัดการผู้ได้รับมอบหมาย (Assignees) และคอมเมนต์
- **Notifications:** ระบบแจ้งเตือนผ่าน Email (Nodemailer)

## Tech Stack

- **Frontend:** [Next.js 16 (App Router)](https://nextjs.org/), [React 19](https://react.dev/), [Ant Design 6](https://ant.design/)
- **Styling:** [Tailwind CSS 4](https://tailwindcss.com/)
- **Backend:** Next.js API Routes & Custom Node.js Real-time Server
- **Database & ORM:** [PostgreSQL](https://www.postgresql.org/) with [Prisma ORM](https://www.prisma.io/)
- **Communication:** [WS (WebSockets)](https://github.com/websockets/ws) สำหรับระบบ Real-time

---

## Installation & Setup

### 1. Clone Project

```bash
git clone <your-repository-url>
cd task_manager

```

### 2. Install Dependencies

```bash
pnpm install

```

### 3. Environment Variables

สร้างไฟล์ `.env` ที่ Root Project และกำหนดค่าดังนี้:

```env
DATABASE_URL="postgresql://<user>:<password>@localhost:5432/task_db"
TINYMCE_API_KEY="your_api_key"
# กำหนดค่าอื่นๆ เช่น SMTP สำหรับ Nodemailer

```

### 4. Database Setup

รัน Prisma Migration เพื่อสร้าง Schema ใน Database:

```bash
pnpm prisma migrate dev

```

---

## Running the Project

### Development Mode

รันทั้ง Next.js และ Real-time Server พร้อมกัน:

```bash
pnpm dev

```

### Production Mode

Build และ Start ระบบ:

```bash
pnpm build
pnpm start:server

```

---

## 📑 Scripts Reference

| Command              | Description                                     |
| -------------------- | ----------------------------------------------- |
| `pnpm dev`           | รัน Next.js และ Real-time server (concurrently) |
| `pnpm build`         | Build โปรเจคสำหรับ Production                   |
| `pnpm prisma studio` | เปิด GUI สำหรับจัดการข้อมูลใน Database          |
| `pnpm deploy`        | รันสคริปต์เพื่อ Deploy ไปยัง Production server  |
| `pnpm lint`          | ตรวจสอบคุณภาพ Code ด้วย ESLint                  |

---

## Project Structure (Key Folders)

- `/app`: โครงสร้างหน้าเว็บหลัก (App Router)
- `/prisma`: Database Schema และ Migrations
- `realtime-server.cjs`: WebSocket Server สำหรับจัดการ Event แบบ Real-time
- `/components`: Reusable UI Components (Kanban, Gantt, Editors)

---

## Notes

- **TinyMCE:** ใช้สำหรับรายละเอียดงาน รองรับการ Resize รูปภาพแบบ Open Source
- **Real-time:** หากมีการแก้ไขงาน ระบบจะส่งสัญญาณผ่าน `ws` เพื่ออัปเดต UI ของผู้ใช้คนอื่นทันทีโดยไม่ต้อง Refresh หน้าจอ

---

**Developed with by DaggerKT**
