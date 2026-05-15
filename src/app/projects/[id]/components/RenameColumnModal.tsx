"use client";

import { Button, ColorPicker, Divider, Input, Modal, Space, Typography } from "antd";
import { useLanguage } from "@/contexts/LanguageContext";
import { COLOR_OPTIONS } from "@/utils/kanban";

interface RenameColumnModalProps {
	open: boolean;
	value: string;
	color: string;
	onChangeValue: (value: string) => void;
	onChangeColor: (color: string) => void;
	onCancel: () => void;
	onSubmit: () => void | Promise<void>;
}

export default function RenameColumnModal({
	open,
	value,
	color,
	onChangeValue,
	onChangeColor,
	onCancel,
	onSubmit,
}: RenameColumnModalProps) {
	const { t } = useLanguage();

	return (
		<Modal
			title={t.projects.renameColumn}
			open={open}
			onCancel={onCancel}
			footer={[
				<Button key="cancel" onClick={onCancel}>
					{t.common.cancel}
				</Button>,
				<Button key="submit" type="primary" onClick={() => void onSubmit()}>
					{t.common.save}
				</Button>,
			]}
			centered
			destroyOnHidden
		>
			<div
				style={{
					display: "flex",
					flexDirection: "column",
					gap: "20px",
					paddingTop: "10px",
				}}
			>
				<Input
					placeholder="Column Name"
					value={value}
					onChange={(e) => onChangeValue(e.target.value)}
					onPressEnter={() => void onSubmit()}
					autoFocus
				/>

				<div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
					<Typography.Text type="secondary" style={{ fontSize: "12px" }}>
						{t.kanban.colorPickerLabel}
					</Typography.Text>

					<Space align="center" split={<Divider type="vertical" />}>
						<ColorPicker
							value={color}
							onChange={(nextColor) => onChangeColor(nextColor.toHexString())}
							presets={[
								{
									label: "Recommended",
									colors: COLOR_OPTIONS.map((opt) => opt.color),
								},
							]}
							showText
						/>

						<Typography.Text type="secondary" style={{ fontSize: "12px" }}>
							{t.kanban.currentColor}:{" "}
							<Typography.Text code>{color.toUpperCase()}</Typography.Text>
						</Typography.Text>
					</Space>
				</div>
			</div>
		</Modal>
	);
}
