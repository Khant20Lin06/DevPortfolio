"use client";

import AdminMessengerPanel from "@/features/chat/admin/AdminMessengerPanel";
import { useAdminChatController } from "@/features/chat/admin/useAdminChatController";

export default function AdminChatView({
  controller: providedController,
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
  const shouldOwnController = !providedController;
  const ownedController = useAdminChatController({
    enabled: shouldOwnController && enabled,
    token,
    currentAdminId,
    onUnauthorized,
    isOpen,
    resetToListOnOpen,
  });
  const controller = providedController ?? ownedController;

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
