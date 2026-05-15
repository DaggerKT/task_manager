export const COLOR_OPTIONS = [
  { id: "blue", label: "สีฟ้า", color: "#3b82f6" },
  { id: "purple", label: "สีม่วง", color: "#8b5cf6" },
  { id: "pink", label: "สีชมพู", color: "#ec4899" },
  { id: "orange", label: "สีส้ม", color: "#f97316" },
  { id: "yellow", label: "สีเหลือง", color: "#eab308" },
  { id: "teal", label: "สีเขียวอมฟ้า", color: "#14b8a6" },
];

export const PROTECTED_COLUMN_KEYS = new Set(["todo", "inprogress", "done"]);

export function isProtectedColumnTitle(title: string) {
  const normalized = title.toLowerCase().replace(/[\s_-]+/g, "");
  return PROTECTED_COLUMN_KEYS.has(normalized);
}

export function isTodoColumnTitle(title: string) {
  const normalized = title.toLowerCase().replace(/[\s_-]+/g, "");
  return normalized === "todo";
}

export function isDoneColumnTitle(title: string) {
  const normalized = title.toLowerCase().replace(/[\s_-]+/g, "");
  return normalized === "done";
}

export function toDateInputValue(value: string | null | undefined) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const year = date.getUTCFullYear();
  const month = `${date.getUTCMonth() + 1}`.padStart(2, "0");
  const day = `${date.getUTCDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function formatTaskDueDate(value: string | null | undefined) {
  const isoDate = toDateInputValue(value);
  if (!isoDate) return "";
  const [year, month, day] = isoDate.split("-");
  return `${day}/${month}/${year}`;
}
