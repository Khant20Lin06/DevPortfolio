"use client";

import AdminMessengerPanel from "@/features/chat/admin/AdminMessengerPanel";
import { useAdminChatController } from "@/features/chat/admin/useAdminChatController";

export default function AdminChatView({
  enabled = false,
  token = "",
  currentAdminId = "",
  onUnauthorized,
  isReadOnly = false,
  mode = "adminPage",
  isOpen = true,
  resetToListOnOpen = false,
  onClose,
  pushStatus = "",
  pushHint = "",
  onEnableNotifications,
}) {
  const controller = useAdminChatController({
    enabled,
    token,
    currentAdminId,
    onUnauthorized,
    isOpen,
    resetToListOnOpen,
  });

  return (
    <AdminMessengerPanel
      controller={controller}
      currentAdminId={currentAdminId}
      isReadOnly={isReadOnly}
      mode={mode}
      onClose={onClose}
      pushStatus={pushStatus}
      pushHint={pushHint}
      onEnableNotifications={onEnableNotifications}
    />
  );
}

