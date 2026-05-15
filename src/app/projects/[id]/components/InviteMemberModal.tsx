"use client";

import { useEffect, useState } from "react";
import { Button, Input, Modal, Spin, Typography } from "antd";
import { CheckSquareOutlined } from "@ant-design/icons";
import { createInvitation, createOpenInvitation } from "@/actions/invitation";
import { useLanguage } from "@/contexts/LanguageContext";

interface InviteMemberModalProps {
	open: boolean;
	onClose: () => void;
	teamId: string;
	projectId: string;
}

export default function InviteMemberModal({
	open,
	onClose,
	teamId,
	projectId,
}: InviteMemberModalProps) {
	const { t } = useLanguage();
	const [inviteIdentifier, setInviteIdentifier] = useState("");
	const [inviteError, setInviteError] = useState("");
	const [inviteSuccess, setInviteSuccess] = useState("");
	const [inviteLink, setInviteLink] = useState("");
	const [inviteActionLoading, setInviteActionLoading] = useState<
		"invite" | "generate" | "copy" | null
	>(null);

	const resetInviteState = () => {
		setInviteIdentifier("");
		setInviteError("");
		setInviteSuccess("");
		setInviteLink("");
	};

	const handleClose = () => {
		resetInviteState();
		onClose();
	};

	const handleInviteMember = async () => {
		const input = inviteIdentifier.trim();
		if (!input || inviteActionLoading) return;

		setInviteError("");
		setInviteSuccess("");
		setInviteLink("");
		setInviteActionLoading("invite");

		try {
			const res = await createInvitation(teamId, projectId, input);
			if (!res.success) {
				setInviteError(res.error || t.kanban.inviteFailed);
				return;
			}

			setInviteSuccess(t.kanban.inviteSuccess);
			setInviteLink(res.inviteLink || "");
			setInviteIdentifier("");
		} finally {
			setInviteActionLoading(null);
		}
	};

	const handleGenerateInviteLink = async () => {
		if (inviteActionLoading) return;

		setInviteError("");
		setInviteSuccess("");
		setInviteLink("");
		setInviteActionLoading("generate");

		try {
			const res = await createOpenInvitation(teamId, projectId);
			if (!res.success || !res.inviteLink) {
				setInviteError(res.error || t.kanban.cannotCreateInviteLink);
				return;
			}
			setInviteSuccess(t.kanban.inviteLinkCreated);
			setInviteLink(res.inviteLink);
		} finally {
			setInviteActionLoading(null);
		}
	};

	const handleCopyInviteLink = async () => {
		if (inviteActionLoading) return;

		setInviteActionLoading("copy");
		setInviteError("");
		let link = inviteLink;

		try {
			if (!link) {
				const openInviteRes = await createOpenInvitation(teamId, projectId);
				if (!openInviteRes.success || !openInviteRes.inviteLink) {
					setInviteError(openInviteRes.error || t.kanban.cannotCreateInviteLink);
					return;
				}
				link = openInviteRes.inviteLink;
				setInviteLink(link);
			}

			await navigator.clipboard.writeText(link);
			setInviteSuccess(t.kanban.inviteLinkCopied);
		} catch {
			setInviteError(t.kanban.cannotCopyInviteLink);
		} finally {
			setInviteActionLoading(null);
		}
	};

	useEffect(() => {
		if (!inviteSuccess) return;

		if (inviteSuccess === t.kanban.inviteLinkCopied) {
			const timer = window.setTimeout(() => {
				setInviteSuccess("");
			}, 3000);
			return () => window.clearTimeout(timer);
		}
	}, [inviteSuccess, t.kanban.inviteLinkCopied]);

	return (
		<Modal
			title={t.kanban.inviteMember}
			open={open}
			onCancel={handleClose}
			footer={[
				<Button
					key="cancel"
					onClick={handleClose}
					disabled={!!inviteActionLoading}
				>
					{t.common.cancel}
				</Button>,
				<Button
					key="invite"
					onClick={() => void handleInviteMember()}
					disabled={!inviteIdentifier.trim() || !!inviteActionLoading}
					type="primary"
				>
					{inviteActionLoading === "invite" ? t.common.loading : t.kanban.invite}
				</Button>,
				<Button
					key="generate"
					onClick={() => void handleGenerateInviteLink()}
					type="primary"
					disabled={!!inviteActionLoading}
				>
					{inviteActionLoading === "generate"
						? t.common.loading
						: t.kanban.generateInviteLink}
				</Button>,
			]}
		>
			<div className="space-y-4">
				<Typography.Text type="secondary">{t.kanban.inviteHint}</Typography.Text>
				<div>
					<label className="block text-sm font-medium text-gray-700 mb-1.5">
						{t.kanban.inviteeInfo}
					</label>
					<Input
						value={inviteIdentifier}
						onChange={(e) => setInviteIdentifier(e.target.value)}
						onKeyDown={(e) => {
							if (
								e.key === "Enter" &&
								inviteIdentifier.trim() &&
								!inviteActionLoading
							) {
								void handleInviteMember();
							}
						}}
						placeholder={t.kanban.invitePlaceholder}
						disabled={!!inviteActionLoading}
						autoFocus
					/>
					{inviteActionLoading && (
						<Typography.Text
							type="secondary"
							className="mt-2 flex items-center gap-1.5"
						>
							<Spin size="small" className="mr-1.5" />
							{t.common.loading}
						</Typography.Text>
					)}
					{inviteError && (
						<Typography.Text type="danger" className="mt-2">
							{inviteError}
						</Typography.Text>
					)}
					{inviteSuccess && (
						<Typography.Text type="success" className="mt-2">
							{inviteSuccess}
						</Typography.Text>
					)}
					{inviteLink && (
						<div className="mt-3 space-y-2">
							<Typography.Text type="secondary" className="break-all">
								{inviteLink}
							</Typography.Text>
							<Button
								type="primary"
								onClick={() => void handleCopyInviteLink()}
								disabled={!!inviteActionLoading}
								className="inline-flex items-center mt-3"
							>
								{inviteActionLoading === "copy" ? (
									<Spin size="small" className="mr-1.5" />
								) : null}
								{inviteSuccess === t.kanban.inviteLinkCopied ? (
									<CheckSquareOutlined
										className="w-3.5 h-3.5 inline-block mr-1 text-green-600"
										title={t.kanban.inviteLinkCopied}
									/>
								) : null}{" "}
								{t.kanban.copyInviteLink}
							</Button>
						</div>
					)}
				</div>
			</div>
		</Modal>
	);
}
