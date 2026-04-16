"use client";

import { useRouter } from "next/navigation";

import { useAuth } from "@/components/auth/auth-provider";

import { getReceiptWorkspaceDerivedState } from "./workspace-selectors";
import { useReceiptWorkspaceActions } from "./use-receipt-workspace-actions";
import { useReceiptWorkspaceData } from "./use-receipt-workspace-data";
import { useReceiptWorkspaceLayout } from "./use-receipt-workspace-layout";
import type {
  ReceiptWorkspaceAuthStatus,
  ReceiptWorkspaceController,
  ReceiptWorkspaceGroupItemShareDetail,
  ReceiptWorkspaceGroupShare,
  ReceiptWorkspaceItemValidation,
  ReceiptWorkspaceSavePlan,
  ReceiptWorkspaceValidation,
} from "./types";

export type {
  ReceiptWorkspaceAuthStatus,
  ReceiptWorkspaceController,
  ReceiptWorkspaceGroupItemShareDetail,
  ReceiptWorkspaceGroupShare,
  ReceiptWorkspaceItemValidation,
  ReceiptWorkspaceSavePlan,
  ReceiptWorkspaceValidation,
} from "./types";

export function useReceiptWorkspace({
  receiptId,
}: {
  receiptId?: string;
}): ReceiptWorkspaceController {
  const router = useRouter();
  const { status } = useAuth();

  const data = useReceiptWorkspaceData({
    receiptId,
    status,
    router,
  });

  const derived = getReceiptWorkspaceDerivedState({
    editorState: data.editorState,
    sourceReceipt: data.sourceReceipt,
    receiptId,
  });

  const actions = useReceiptWorkspaceActions({
    receiptId,
    editorState: data.editorState,
    sourceReceipt: data.sourceReceipt,
    canSave: derived.validation.canSave,
    summaryShareData: derived.summaryShareData,
    router,
    setEditorState: data.setEditorState,
    setSourceReceipt: data.setSourceReceipt,
    setSaveMessage: data.setSaveMessage,
    setShareMessage: data.setShareMessage,
    setWarningMessage: data.setWarningMessage,
  });

  const layout = useReceiptWorkspaceLayout({
    isDeleteConfirming: actions.isDeleteConfirming,
    isSharingSummary: actions.isSharingSummary,
    isSaving: actions.isSaving,
    sourceReceiptId: data.sourceReceipt?.receiptId,
  });

  return {
    status: status as ReceiptWorkspaceAuthStatus,
    receiptId,
    summaryRef: layout.summaryRef,
    actionBarRef: layout.actionBarRef,
    actionBarActionsRef: layout.actionBarActionsRef,
    editorState: data.editorState,
    sourceReceipt: data.sourceReceipt,
    isLoading: data.isLoading,
    isMissing: data.isMissing,
    isSaving: actions.isSaving,
    isDeleting: actions.isDeleting,
    isDeleteConfirming: actions.isDeleteConfirming,
    isSharingSummary: actions.isSharingSummary,
    saveMessage: data.saveMessage,
    shareMessage: data.shareMessage,
    warningMessage: data.warningMessage,
    footerOffset: layout.footerOffset,
    actionBarHeight: layout.actionBarHeight,
    actionBarActionsHeight: layout.actionBarActionsHeight,
    isMobileViewport: layout.isMobileViewport,
    isMobileActionBarCompact: layout.isMobileActionBarCompact,
    isMobileActionBarMinimized: layout.isMobileActionBarMinimized,
    validation: derived.validation as ReceiptWorkspaceValidation,
    savePlan: derived.savePlan as ReceiptWorkspaceSavePlan,
    isDirty: derived.isDirty,
    subtotalCents: derived.subtotalCents,
    totalCents: derived.totalCents,
    groupShares: derived.groupShares as ReceiptWorkspaceGroupShare[],
    groupItemShareDetails:
      derived.groupItemShareDetails as ReceiptWorkspaceGroupItemShareDetail[],
    groupSharesById: derived.groupSharesById,
    groupItemShareDetailsByGroupId: derived.groupItemShareDetailsByGroupId,
    summaryShareData: derived.summaryShareData,
    merchantNameMissing: derived.merchantNameMissing,
    receiptDateMissing: derived.receiptDateMissing,
    unnamedGroupIds: derived.unnamedGroupIds,
    itemValidationById:
      derived.itemValidationById as Map<string, ReceiptWorkspaceItemValidation>,
    hasSavedReceipt: derived.hasSavedReceipt,
    heading: derived.heading,
    workspaceDescription: derived.workspaceDescription,
    isCompactActionBar: layout.isCompactActionBar,
    isMinimizedMobileActionBar: layout.isMinimizedMobileActionBar,
    setIsDeleteConfirming: actions.setIsDeleteConfirming,
    toggleMobileActionBarMinimized: layout.toggleMobileActionBarMinimized,
    updateField: data.updateField,
    updateGroup: data.updateGroup,
    addGroup: data.addGroup,
    removeGroup: data.removeGroup,
    addItem: data.addItem,
    updateItem: data.updateItem,
    removeItem: data.removeItem,
    toggleGroupAssignment: data.toggleGroupAssignment,
    handleSave: actions.handleSave,
    handleDelete: actions.handleDelete,
    handleShareSummary: actions.handleShareSummary,
    scrollToSummary: layout.scrollToSummary,
    scrollToFullSummary: layout.scrollToFullSummary,
  };
}
