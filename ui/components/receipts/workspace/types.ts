"use client";

import type { RefObject } from "react";

import { useAuth } from "@/components/auth/auth-provider";
import { buildReceiptSavePlan, getGroupItemShareDetails, getGroupShareSummaries, getReceiptEditorValidation } from "@/lib/receipt-editor";
import { buildReceiptSummaryShareData } from "@/lib/receipt-summary-share";
import type {
  EditableGroup,
  EditableItem,
  Receipt,
  ReceiptEditorState,
} from "@/lib/receipt-types";

export type ReceiptWorkspaceItemValidation = {
  descriptionMissing: boolean;
  quantityInvalid: boolean;
  unitPriceInvalid: boolean;
  missingGroupAssignment: boolean;
};

export type ReceiptWorkspaceValidation = ReturnType<
  typeof getReceiptEditorValidation
>;
export type ReceiptWorkspaceSavePlan = ReturnType<typeof buildReceiptSavePlan>;
export type ReceiptWorkspaceGroupShare = ReturnType<
  typeof getGroupShareSummaries
>[number];
export type ReceiptWorkspaceGroupItemShareDetail = ReturnType<
  typeof getGroupItemShareDetails
>[number];
export type ReceiptWorkspaceAuthStatus = ReturnType<typeof useAuth>["status"];

export type ReceiptWorkspaceController = {
  status: ReceiptWorkspaceAuthStatus;
  receiptId?: string;
  summaryRef: RefObject<HTMLElement | null>;
  actionBarRef: RefObject<HTMLDivElement | null>;
  actionBarActionsRef: RefObject<HTMLDivElement | null>;
  editorState: ReceiptEditorState;
  sourceReceipt: Receipt | null;
  hasStartedDraft: boolean;
  shouldShowUploadGate: boolean;
  isLoading: boolean;
  isMissing: boolean;
  isSaving: boolean;
  isDeleting: boolean;
  isDeleteConfirming: boolean;
  isSharingSummary: boolean;
  isParsingReceipt: boolean;
  saveMessage: string | null;
  shareMessage: string | null;
  parseMessage: string | null;
  parseIssues: string[];
  warningMessage: string | null;
  footerOffset: number;
  actionBarHeight: number;
  actionBarActionsHeight: number;
  isMobileViewport: boolean;
  isMobileActionBarCompact: boolean;
  isMobileActionBarMinimized: boolean;
  validation: ReceiptWorkspaceValidation;
  savePlan: ReceiptWorkspaceSavePlan;
  isDirty: boolean;
  subtotalCents: number;
  totalCents: number;
  groupShares: ReceiptWorkspaceGroupShare[];
  groupItemShareDetails: ReceiptWorkspaceGroupItemShareDetail[];
  groupSharesById: Map<string, ReceiptWorkspaceGroupShare>;
  groupItemShareDetailsByGroupId: Map<
    string,
    ReceiptWorkspaceGroupItemShareDetail[]
  >;
  summaryShareData: ReturnType<typeof buildReceiptSummaryShareData>;
  merchantNameMissing: boolean;
  receiptDateMissing: boolean;
  unnamedGroupIds: Set<string>;
  itemValidationById: Map<string, ReceiptWorkspaceItemValidation>;
  hasSavedReceipt: boolean;
  heading: string;
  workspaceDescription: string;
  isCompactActionBar: boolean;
  isMinimizedMobileActionBar: boolean;
  setIsDeleteConfirming: (value: boolean) => void;
  toggleMobileActionBarMinimized: () => void;
  beginManualEntry: () => void;
  requestReceiptUpload: () => boolean;
  handleReceiptUpload: (file: File) => Promise<void>;
  updateField: <K extends keyof ReceiptEditorState>(
    field: K,
    value: ReceiptEditorState[K],
  ) => void;
  updateGroup: (groupId: string, updates: Partial<EditableGroup>) => void;
  addGroup: () => void;
  removeGroup: (groupId: string) => void;
  addItem: () => void;
  updateItem: (itemId: string, updates: Partial<EditableItem>) => void;
  removeItem: (itemId: string) => void;
  toggleGroupAssignment: (itemId: string, groupId: string) => void;
  handleSave: () => Promise<void>;
  handleDelete: () => Promise<void>;
  handleShareSummary: () => Promise<void>;
  scrollToSummary: () => void;
  scrollToFullSummary: () => void;
};
