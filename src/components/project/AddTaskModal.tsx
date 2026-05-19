import {
  Avatar,
  Button,
  Checkbox,
  Col,
  DatePicker,
  Input,
  Modal,
  Row,
  Select,
  Space,
  Typography,
} from "antd";
import dayjs from "dayjs";
import { useLanguage } from "@/contexts/LanguageContext";
import TinyEditor from "@/components/TinyEditor";

interface Props {
  isTaskModalOpen: boolean;
  setIsTaskModalOpen: (open: boolean) => void;
  newTaskTitle: string;
  setNewTaskTitle: (title: string) => void;
  newTaskType: string;
  setNewTaskType: (type: string) => void;
  newTaskAssigneeIds: string[];
  setNewTaskAssigneeIds: (ids: string[]) => void;
  newTaskStartDate: string;
  setNewTaskStartDate: (date: string) => void;
  newTaskDueDate: string;
  setNewTaskDueDate: (date: string) => void;
  newTaskIsUrgent: boolean;
  setNewTaskIsUrgent: (isUrgent: boolean) => void;
  newTaskDescription: string;
  setNewTaskDescription: (desc: string) => void;
  members: { id: string; name: string; avatarUrl: string }[];
  teamMemberIds: string[];
  handleAddTaskSubmit: () => void;
  setNewTaskStepId: (id: string) => void;
}

export default function AddTaskModal({
  isTaskModalOpen,
  setIsTaskModalOpen,
  newTaskTitle,
  setNewTaskTitle,
  newTaskType,
  setNewTaskType,
  newTaskAssigneeIds,
  setNewTaskAssigneeIds,
  newTaskStartDate,
  setNewTaskStartDate,
  newTaskDueDate,
  setNewTaskDueDate,
  newTaskIsUrgent,
  setNewTaskIsUrgent,
  newTaskDescription,
  setNewTaskDescription,
  members,
  teamMemberIds,
  handleAddTaskSubmit,
  setNewTaskStepId,
}: Props) {
  const { t } = useLanguage();
  return (
    <Modal
      title={t.kanban.createNewTask}
      open={isTaskModalOpen}
      onCancel={() => {
        setIsTaskModalOpen(false);
        setNewTaskStepId("");
        setNewTaskIsUrgent(false);
      }}
      width={"80vw"}
      style={{ top: 20, minHeight: "80vh" }}
      footer={[
        <Button
          key="cancel"
          onClick={() => {
            setIsTaskModalOpen(false);
            setNewTaskStepId("");
            setNewTaskIsUrgent(false);
          }}
        >
          {t.common.cancel}
        </Button>,
        <Button
          key="submit"
          type="primary"
          onClick={handleAddTaskSubmit}
          disabled={!newTaskTitle.trim() || newTaskAssigneeIds.length === 0}
        >
          {t.kanban.createNewTask}
        </Button>,
      ]}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "20px",
          minHeight: "80vh",
          maxHeight: "80vh",
          overflowY: "auto",
          overflowX: "hidden",
        }}
        className="thin-scrollbar"
      >
        {/* Task Title */}
        <div>
          <Typography.Text strong>
            {t.kanban.taskTitleLabel}{" "}
            <span style={{ color: "#ff4d4f" }}>*</span>
          </Typography.Text>
          <Input
            placeholder={t.kanban.taskTitlePlaceholder}
            value={newTaskTitle}
            onChange={(e) => setNewTaskTitle(e.target.value)}
            style={{ marginTop: "8px" }}
          />
        </div>

        <Row gutter={16}>
          <Col span={12}>
            <Typography.Text
              strong
              style={{ display: "block", marginBottom: "8px" }}
            >
              {t.kanban.taskTypeLabel}
            </Typography.Text>
            <Select
              style={{ width: "100%" }}
              value={newTaskType}
              onChange={setNewTaskType}
              options={[
                { label: "Frontend", value: "Frontend" },
                { label: "Backend", value: "Backend" },
                { label: "Design", value: "Design" },
                { label: "QA", value: "QA" },
                { label: t.kanban.taskTypeGeneral, value: "General" },
              ]}
            />
          </Col>
          <Col span={12}>
            <Typography.Text
              strong
              style={{ display: "block", marginBottom: "8px" }}
            >
              {t.kanban.assigneeLabel}
            </Typography.Text>
            <Select
              mode="multiple"
              style={{ width: "100%" }}
              placeholder="เลือกผู้รับผิดชอบ"
              value={newTaskAssigneeIds}
              onChange={(values) => {
                if (values.length === 0) {
                  alert(t.kanban.minOneAssignee);
                  return;
                }
                setNewTaskAssigneeIds(values);
              }}
              optionLabelProp="label"
              options={members
                .filter((m) => teamMemberIds.includes(m.id))
                .map((member) => ({
                  label: (
                    <Space>
                      <Avatar size="small" src={member.avatarUrl}>
                        {member.name[0]}
                      </Avatar>
                      {member.name}
                    </Space>
                  ),
                  value: member.id,
                }))}
            />
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={12}>
            <Typography.Text
              strong
              style={{ display: "block", marginBottom: "8px" }}
            >
              {t.kanban.startDateLabel} / {t.kanban.dueDateLabel}
            </Typography.Text>
            <DatePicker.RangePicker
              style={{ width: "100%" }}
              value={
                newTaskStartDate && newTaskDueDate
                  ? [dayjs(newTaskStartDate), dayjs(newTaskDueDate)]
                  : null
              }
              onChange={(dates) => {
                if (!dates || !dates[0] || !dates[1]) {
                  setNewTaskStartDate("");
                  setNewTaskDueDate("");
                  return;
                }
                setNewTaskStartDate(dates[0].format("YYYY-MM-DD"));
                setNewTaskDueDate(dates[1].format("YYYY-MM-DD"));
              }}
            />
          </Col>
          <Col span={12}>
            <Typography.Text
              strong
              style={{ display: "block", marginBottom: "8px" }}
            >
              ⚡ {t.kanban.urgent}
            </Typography.Text>
            <Checkbox
              checked={newTaskIsUrgent}
              onChange={(e) => setNewTaskIsUrgent(e.target.checked)}
            ></Checkbox>
          </Col>
        </Row>

        <div>
          <Typography.Text
            strong
            style={{ display: "block", marginBottom: "8px" }}
          >
            {t.kanban.descriptionLabel}
          </Typography.Text>
          <div
            style={{
              border: "1px solid #d9d9d9",
              borderRadius: "8px",
              overflow: "hidden",
            }}
          >
            <TinyEditor
              newDescription={newTaskDescription}
              setNewDescription={setNewTaskDescription}
            />
          </div>
        </div>
      </div>
    </Modal>
  );
}
