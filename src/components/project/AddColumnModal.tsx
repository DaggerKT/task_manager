import { useState } from "react";
import {
  Button,
  ColorPicker,
  Input,
  Modal,
  Select,
  Space,
  Typography,
} from "antd";
import { useLanguage } from "@/contexts/LanguageContext";
import type { Column } from "@/types/kanban";
import { COLOR_OPTIONS } from "@/utils/kanban";

interface Props {
  isOpen: boolean;
  setIsAddModalOpen: (open: boolean) => void;
  columns: Column[];
  handleSubmit: () => void;
  newColTitle: string;
  setNewColTitle: (title: string) => void;
  newColColor: string;
  setNewColColor: (color: string) => void;
  insertAfterId: string;
  setInsertAfterId: (id: string) => void;
}

export default function AddColumnModal({
  isOpen,
  setIsAddModalOpen,
  columns,
  handleSubmit,
  newColTitle,
  setNewColTitle,
  newColColor,
  setNewColColor,
  insertAfterId,
  setInsertAfterId,
}: Props) {
  const { t } = useLanguage();

  return (
    <Modal
      title={t.projects.addStep}
      open={isOpen}
      onCancel={() => setIsAddModalOpen(false)}
      footer={[
        <Button key="cancel" onClick={() => setIsAddModalOpen(false)}>
          {t.common.cancel}
        </Button>,
        <Button
          key="submit"
          type="primary"
          onClick={handleSubmit}
          disabled={!newColTitle.trim()}
        >
          {t.kanban.ok}
        </Button>,
      ]}
      centered
      destroyOnHidden
    >
      <Space
        direction="vertical"
        size="large"
        style={{ width: "100%", paddingTop: "10px" }}
      >
        {/* ชื่อ Column */}
        <div>
          <Typography.Text
            strong
            style={{ display: "block", marginBottom: "8px" }}
          >
            {t.projects.columnName}
          </Typography.Text>
          <Input
            placeholder="เช่น ตรวจสอบโค้ด, รออนุมัติ..."
            value={newColTitle}
            onChange={(e) => setNewColTitle(e.target.value)}
            onPressEnter={newColTitle.trim() ? handleSubmit : undefined}
            autoFocus
          />
        </div>

        {/* เลือกสี */}
        <div>
          <Typography.Text
            strong
            style={{ display: "block", marginBottom: "8px" }}
          >
            {t.kanban.colorPickerLabel}
          </Typography.Text>
          <Space align="center">
            <ColorPicker
              value={newColColor}
              onChange={(color) => setNewColColor(color.toHexString())}
              presets={[
                {
                  label: "Recommended",
                  colors: COLOR_OPTIONS.map((opt) => opt.color),
                },
              ]}
              showText
            />
            <Typography.Text type="secondary" style={{ fontSize: "12px" }}>
              <Typography.Text code>
                {newColColor.toUpperCase()}
              </Typography.Text>
            </Typography.Text>
          </Space>
        </div>

        {/* เลือกตำแหน่ง */}
        <div>
          <Typography.Text
            strong
            style={{ display: "block", marginBottom: "8px" }}
          >
            {t.kanban.positionLabel}
          </Typography.Text>
          <Select
            style={{ width: "100%" }}
            value={insertAfterId}
            onChange={(value) => setInsertAfterId(value)}
            options={columns.slice(0, -1).map((col) => ({
              label: col.title,
              value: col.id,
            }))}
          />
          <Typography.Text
            type="secondary"
            style={{ fontSize: "12px", marginTop: "8px", display: "block" }}
          >
            {t.kanban.positionNote}
          </Typography.Text>
        </div>
      </Space>
    </Modal>
  );
}
