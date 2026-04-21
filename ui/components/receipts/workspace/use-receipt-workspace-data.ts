"use client";

import { useEffect, useState } from "react";

import { createEditableGroup, createEditableItem, createEmptyReceiptEditorState, mapReceiptToEditorState } from "@/lib/receipt-editor";
import type {
  EditableGroup,
  EditableItem,
  Receipt,
  ReceiptEditorState,
} from "@/lib/receipt-types";

import { logWorkspaceError } from "./workspace-helpers";
import type { ReceiptWorkspaceAuthStatus } from "./types";
import { getReceipt } from "@/lib/receipt-api";

export function useReceiptWorkspaceData({
  receiptId,
  status,
  router,
}: {
  receiptId?: string;
  status: ReceiptWorkspaceAuthStatus;
  router: { push: (href: string) => void; replace: (href: string) => void };
}) {
  const [editorState, setEditorState] = useState<ReceiptEditorState>(() =>
    createEmptyReceiptEditorState(),
  );
  const [sourceReceipt, setSourceReceipt] = useState<Receipt | null>(null);
  const [hasStartedDraft, setHasStartedDraft] = useState(Boolean(receiptId));
  const [isLoading, setIsLoading] = useState(Boolean(receiptId));
  const [isMissing, setIsMissing] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [shareMessage, setShareMessage] = useState<string | null>(null);
  const [parseMessage, setParseMessage] = useState<string | null>(null);
  const [parseIssues, setParseIssues] = useState<string[]>([]);
  const [warningMessage, setWarningMessage] = useState<string | null>(null);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/login");
      return;
    }

    if (status !== "authenticated") {
      return;
    }

    const currentReceiptId = receiptId;

    if (!currentReceiptId) {
      setSourceReceipt(null);
      setEditorState(createEmptyReceiptEditorState());
      setHasStartedDraft(false);
      setIsLoading(false);
      setIsMissing(false);
      return;
    }

    const targetReceiptId: string = currentReceiptId;

    let isActive = true;

    async function loadReceipt() {
      setIsLoading(true);
      setWarningMessage(null);

      try {
        const receipt = await getReceipt(targetReceiptId);

        if (!isActive) {
          return;
        }

        if (!receipt) {
          setIsMissing(true);
          setSourceReceipt(null);
          return;
        }

        setIsMissing(false);
        setSourceReceipt(receipt);
        setEditorState(mapReceiptToEditorState(receipt));
        setHasStartedDraft(true);
      } catch (error) {
        if (!isActive) {
          return;
        }

        logWorkspaceError(
          "load receipt",
          error,
          "Unable to load this receipt.",
        );
      } finally {
        if (isActive) {
          setIsLoading(false);
        }
      }
    }

    void loadReceipt();

    return () => {
      isActive = false;
    };
  }, [receiptId, router, status]);

  function clearTransientMessages() {
    setSaveMessage(null);
    setShareMessage(null);
    setParseMessage(null);
  }

  function clearParseIssues() {
    setParseIssues([]);
  }

  function updateField<K extends keyof ReceiptEditorState>(
    field: K,
    value: ReceiptEditorState[K],
  ) {
    clearTransientMessages();
    clearParseIssues();
    setWarningMessage(null);
    setEditorState((current) => ({
      ...current,
      [field]: value,
    }));
  }

  function updateGroup(groupId: string, updates: Partial<EditableGroup>) {
    clearTransientMessages();
    clearParseIssues();
    setEditorState((current) => ({
      ...current,
      groups: current.groups.map((group) =>
        group.id === groupId ? { ...group, ...updates } : group,
      ),
    }));
  }

  function addGroup() {
    clearTransientMessages();
    clearParseIssues();
    setEditorState((current) => ({
      ...current,
      groups: [...current.groups, createEditableGroup()],
    }));
  }

  function removeGroup(groupId: string) {
    clearTransientMessages();
    clearParseIssues();
    setEditorState((current) => {
      if (current.groups.length === 1) {
        return current;
      }

      return {
        ...current,
        groups: current.groups.filter((group) => group.id !== groupId),
        items: current.items.map((item) => ({
          ...item,
          selectedGroupIds: item.selectedGroupIds.filter(
            (selectedGroupId) => selectedGroupId !== groupId,
          ),
        })),
      };
    });
  }

  function addItem() {
    clearTransientMessages();
    clearParseIssues();
    setEditorState((current) => ({
      ...current,
      items: [
        ...current.items,
        createEditableItem({
          selectedGroupIds: current.groups[0] ? [current.groups[0].id] : [],
        }),
      ],
    }));
  }

  function updateItem(itemId: string, updates: Partial<EditableItem>) {
    clearTransientMessages();
    clearParseIssues();
    setEditorState((current) => ({
      ...current,
      items: current.items.map((item) =>
        item.id === itemId ? { ...item, ...updates } : item,
      ),
    }));
  }

  function removeItem(itemId: string) {
    clearTransientMessages();
    clearParseIssues();
    setEditorState((current) => ({
      ...current,
      items:
        current.items.length === 1
          ? [
              createEditableItem({
                selectedGroupIds: current.groups[0]
                  ? [current.groups[0].id]
                  : [],
              }),
            ]
          : current.items.filter((item) => item.id !== itemId),
    }));
  }

  function toggleGroupAssignment(itemId: string, groupId: string) {
    clearTransientMessages();
    clearParseIssues();
    setEditorState((current) => ({
      ...current,
      items: current.items.map((item) => {
        if (item.id !== itemId) {
          return item;
        }

        const isSelected = item.selectedGroupIds.includes(groupId);

        return {
          ...item,
          selectedGroupIds: isSelected
            ? item.selectedGroupIds.filter(
                (selectedGroupId) => selectedGroupId !== groupId,
              )
            : [...item.selectedGroupIds, groupId],
        };
      }),
    }));
  }

  function beginManualEntry() {
    clearTransientMessages();
    setSourceReceipt(null);
    setEditorState(createEmptyReceiptEditorState());
    setHasStartedDraft(true);
    setIsMissing(false);
    setWarningMessage(null);
    clearParseIssues();
  }

  return {
    editorState,
    setEditorState,
    sourceReceipt,
    setSourceReceipt,
    hasStartedDraft,
    setHasStartedDraft,
    isLoading,
    isMissing,
    saveMessage,
    setSaveMessage,
    shareMessage,
    setShareMessage,
    parseMessage,
    setParseMessage,
    parseIssues,
    setParseIssues,
    warningMessage,
    setWarningMessage,
    beginManualEntry,
    updateField,
    updateGroup,
    addGroup,
    removeGroup,
    addItem,
    updateItem,
    removeItem,
    toggleGroupAssignment,
  };
}
