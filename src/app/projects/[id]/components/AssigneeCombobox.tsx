"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { X, Search } from "lucide-react";
import { searchUsers, type UserSearchResult } from "@/actions/user";

interface SelectedAssignee {
  id: string;
  name: string;
  avatar: string;
  avatarUrl: string;
}

interface AssigneeComboboxProps {
  selectedAssignees: SelectedAssignee[];
  onAdd: (user: SelectedAssignee) => void;
  onRemove: (userId: string) => void;
  minOne?: boolean;
  allowedUserIds?: string[];
}

export default function AssigneeCombobox({
  selectedAssignees,
  onAdd,
  onRemove,
  minOne = true,
  allowedUserIds,
}: AssigneeComboboxProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<UserSearchResult[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const doSearch = useCallback(
    async (q: string) => {
      if (!q.trim()) {
        setResults([]);
        setIsOpen(false);
        return;
      }
      setIsLoading(true);
      try {
        const data = await searchUsers(q, allowedUserIds);
        setResults(data);
        setIsOpen(true);
      } finally {
        setIsLoading(false);
      }
    },
    [allowedUserIds],
  );

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setQuery(val);
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => {
      void doSearch(val);
    }, 300);
  };

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleSelect = (user: UserSearchResult) => {
    if (selectedAssignees.some((a) => a.id === user.id)) return;
    onAdd({
      id: user.id,
      name: user.name || user.username,
      avatar: (user.name || user.username)?.[0]?.toUpperCase() || "U",
      avatarUrl: user.avatar || "",
    });
    setQuery("");
    setResults([]);
    setIsOpen(false);
  };

  const isSelected = (userId: string) =>
    selectedAssignees.some((a) => a.id === userId);

  return (
    <div className="space-y-2">
      {/* Selected tags */}
      {selectedAssignees.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {selectedAssignees.map((assignee) => {
            const isOnly = minOne && selectedAssignees.length <= 1;
            return (
              <div
                key={assignee.id}
                className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 border border-blue-100 px-2 py-1"
              >
                <span className="w-5 h-5 rounded-full bg-blue-100 flex items-center justify-center text-[10px] font-bold text-blue-700 overflow-hidden shrink-0">
                  {assignee.avatarUrl ? (
                    <Image
                      src={assignee.avatarUrl}
                      alt={assignee.name}
                      width={20}
                      height={20}
                      className="w-full h-full object-cover rounded-full"
                      unoptimized
                    />
                  ) : (
                    assignee.avatar
                  )}
                </span>
                <span className="text-xs font-medium text-blue-800">
                  {assignee.name}
                </span>
                <button
                  type="button"
                  disabled={isOnly}
                  onClick={() => onRemove(assignee.id)}
                  className="text-blue-400 hover:text-red-500 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  title={isOnly ? "ต้องมีผู้รับผิดชอบอย่างน้อย 1 คน" : "ลบ"}
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Search input */}
      <div ref={containerRef} className="relative">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          <input
            type="text"
            value={query}
            onChange={handleInputChange}
            onFocus={() => {
              if (results.length > 0) setIsOpen(true);
            }}
            placeholder="ค้นหาสมาชิกทีมด้วยชื่อ, username, รหัสพนักงาน หรือ email..."
            className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {isLoading && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
          )}
        </div>

        {isOpen && results.length > 0 && (
          <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-52 overflow-y-auto">
            {results.map((user) => {
              const selected = isSelected(user.id);
              return (
                <button
                  key={user.id}
                  type="button"
                  onClick={() => !selected && handleSelect(user)}
                  disabled={selected}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 text-left transition-colors ${
                    selected
                      ? "opacity-40 cursor-not-allowed bg-gray-50"
                      : "hover:bg-blue-50 cursor-pointer"
                  }`}
                >
                  <span className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-xs font-bold text-blue-700 shrink-0 overflow-hidden">
                    {user.avatar ? (
                      <Image
                        src={user.avatar}
                        alt={user.name || user.username}
                        width={32}
                        height={32}
                        className="w-full h-full object-cover rounded-full"
                        unoptimized
                      />
                    ) : (
                      (user.name || user.username)?.[0]?.toUpperCase() || "U"
                    )}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-medium text-gray-900 truncate">
                      {user.name || user.username}
                    </div>
                    <div className="text-xs text-gray-500 truncate">
                      @{user.username}
                      {user.empNo && ` · ${user.empNo}`}
                      {user.email && ` · ${user.email}`}
                    </div>
                  </div>
                  {selected && (
                    <span className="text-xs text-blue-600 font-medium shrink-0">
                      เลือกแล้ว
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        )}

        {isOpen && !isLoading && query.trim() && results.length === 0 && (
          <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg p-3 text-sm text-gray-500 text-center">
            ไม่พบผู้ใช้ที่ตรงกับ &quot;{query}&quot;
          </div>
        )}
      </div>

      <p className="text-xs text-gray-500">
        เลือกได้หลายคน{minOne ? " และต้องมีอย่างน้อย 1 คน" : ""}
      </p>
    </div>
  );
}
