"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import {
  Avatar,
  Button,
  Empty,
  Input,
  List,
  Spin,
  Tag,
  Typography,
} from "antd";
import { X, Search } from "lucide-react";
import { searchUsers, type UserSearchResult } from "@/actions/user";
import { useLanguage } from "@/contexts/LanguageContext";

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
  const { t } = useLanguage();

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

  const getInitial = (name?: string) => name?.[0]?.toUpperCase() || "U";

  return (
    <div className="space-y-2">
      {selectedAssignees.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selectedAssignees.map((assignee) => {
            const isOnly = minOne && selectedAssignees.length <= 1;
            return (
              <Tag
                key={assignee.id}
                className="inline-flex! items-center gap-1.5 rounded-full px-2 py-1 mr-0"
                color="blue"
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
                <Button
                  type="text"
                  disabled={isOnly}
                  onClick={() => onRemove(assignee.id)}
                  size="small"
                  icon={<X className="w-3 h-3" />}
                  className="text-blue-400 hover:text-red-500"
                  title={isOnly ? t.kanban.minOneAssignee : t.kanban.removeMember}
                />
              </Tag>
            );
          })}
        </div>
      )}

      <div ref={containerRef} className="relative">
        <Input
          value={query}
          onChange={handleInputChange}
          onFocus={() => {
            if (results.length > 0) setIsOpen(true);
          }}
          placeholder={t.kanban.inviteHint}
          size="middle"
          prefix={<Search className="w-4 h-4 text-gray-400" />}
          suffix={isLoading ? <Spin size="small" /> : null}
        />

        {isOpen && results.length > 0 && (
          <div className="absolute z-50 top-full left-0 right-0 mt-1 rounded-lg border border-gray-200 bg-white shadow-lg max-h-52 overflow-y-auto">
            <List
              size="small"
              dataSource={results}
              renderItem={(user) => {
                const selected = isSelected(user.id);
                return (
                  <List.Item
                    className={`px-2.5 py-2 ${selected ? "bg-gray-50" : "hover:bg-blue-50"}`}
                    actions={
                      selected
                        ? [
                            <Typography.Text
                              key="selected"
                              type="secondary"
                              className="text-xs"
                            >
                              {t.kanban.selected}
                            </Typography.Text>,
                          ]
                        : undefined
                    }
                  >
                    <Button
                      type="text"
                      disabled={selected}
                      onClick={() => !selected && handleSelect(user)}
                      className="w-full h-auto px-0 text-left"
                    >
                      <div className="w-full flex items-center gap-3">
                        <Avatar
                          size={32}
                          src={user.avatar || undefined}
                          icon={
                            !user.avatar ? (
                              <span className="text-xs font-bold text-blue-700">
                                {getInitial(user.name || user.username)}
                              </span>
                            ) : undefined
                          }
                          className={!user.avatar ? "bg-blue-100" : undefined}
                        />
                        <div className="min-w-0 flex-1">
                          <Typography.Text className="block text-sm font-medium truncate">
                            {user.name || user.username}
                          </Typography.Text>
                          <Typography.Text
                            type="secondary"
                            className="block text-xs truncate"
                          >
                            @{user.username}
                            {user.empNo && ` · ${user.empNo}`}
                            {user.email && ` · ${user.email}`}
                          </Typography.Text>
                        </div>
                      </div>
                    </Button>
                  </List.Item>
                );
              }}
            />
          </div>
        )}

        {isOpen && !isLoading && query.trim() && results.length === 0 && (
          <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg p-4">
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description={
                <Typography.Text type="secondary" className="text-sm">
                  {t.kanban.noMatchingUsers} &quot;{query}&quot;
                </Typography.Text>
              }
            />
          </div>
        )}
      </div>

      <Typography.Text type="secondary" className="text-xs">
        {t.kanban.selectMultiplePeople}
        {minOne && t.kanban.andAtLeastOne}
      </Typography.Text>
    </div>
  );
}
