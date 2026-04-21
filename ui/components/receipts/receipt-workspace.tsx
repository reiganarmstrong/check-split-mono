"use client";

import Link from "next/link";
import { motion } from "motion/react";
import { AlertCircle } from "lucide-react";

import { AuthSessionScreen } from "@/components/auth/auth-session-screen";
import { Button } from "@/components/ui/button";

import { ReceiptActionBar } from "./workspace/action-bar";
import { AdjustmentsSection } from "./workspace/adjustments-section";
import { GroupListSection } from "./workspace/group-list-section";
import { ItemListSection } from "./workspace/item-list-section";
import { ReceiptDetailsSection } from "./workspace/receipt-details-section";
import { ReceiptUploadGate } from "./workspace/receipt-upload-gate";
import { SummaryAside } from "./workspace/summary-aside";
import { useReceiptWorkspace } from "./workspace/use-receipt-workspace";
import { WorkspaceHeader } from "./workspace/workspace-header";
import { EditorNotice } from "./workspace/shared";

export function ReceiptWorkspace({
  receiptId,
  autoOpenUploadGate = false,
}: {
  receiptId?: string;
  autoOpenUploadGate?: boolean;
}) {
  const workspace = useReceiptWorkspace({ receiptId });

  if (workspace.status !== "authenticated" || workspace.isLoading) {
    return (
      <AuthSessionScreen
        title={
          receiptId ? "Opening receipt workspace" : "Preparing a new receipt"
        }
        description="Pulling the current draft into place."
      />
    );
  }

  if (workspace.isMissing) {
    return (
      <main className="flex flex-1 items-center justify-center px-4 pb-20 pt-8 sm:px-6 lg:px-8">
        <div className="auth-shell w-full max-w-xl rounded-[2rem] px-8 py-12 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-[1.2rem] border border-[var(--line)] bg-[var(--surface)]">
            <AlertCircle className="h-8 w-8 text-[var(--foreground)]" />
          </div>
          <h1 className="mt-6 text-4xl leading-none text-[var(--foreground)]">
            Receipt not found
          </h1>
          <p className="mt-4 text-base leading-7 text-[var(--muted-foreground)]">
            This receipt either does not exist in your account or is no longer
            available.
          </p>
          <Button
            asChild
            className="mt-8 rounded-full bg-[var(--foreground)] px-5 text-sm font-medium text-[var(--background)] hover:opacity-90"
          >
            <Link href="/dashboard">Back to saved splits</Link>
          </Button>
        </div>
      </main>
    );
  }

  return (
    <main
      className="flex-1 pt-4"
      style={{ paddingBottom: Math.max(128, workspace.actionBarHeight + 24) }}
    >
      <section className="page-shell pb-12">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
        >
          <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
            <div className="space-y-6">
              {workspace.shouldShowUploadGate ? null : (
                <WorkspaceHeader
                  heading={workspace.heading}
                  workspaceDescription={workspace.workspaceDescription}
                  receiptOccurredAt={workspace.editorState.receiptOccurredAt}
                  groupCount={workspace.editorState.groups.length}
                  itemCount={workspace.editorState.items.length}
                  canSave={workspace.validation.canSave}
                />
              )}

              {workspace.warningMessage ? (
                <EditorNotice
                  tone="warning"
                  message={workspace.warningMessage}
                />
              ) : null}

              {workspace.parseMessage ? (
                <EditorNotice
                  tone="success"
                  message={workspace.parseMessage}
                />
              ) : null}

              {workspace.parseIssues.length > 0 ? (
                <div className="workspace-panel rounded-[1.6rem] px-5 py-5 sm:px-6">
                  <p className="text-[0.7rem] uppercase tracking-[0.22em] text-[var(--muted-foreground)]">
                    Parse notes
                  </p>
                  <div className="workspace-line mt-4 space-y-2 pt-4">
                    {workspace.parseIssues.map((issue) => (
                      <EditorNotice
                        key={issue}
                        tone="warning"
                        message={issue}
                      />
                    ))}
                  </div>
                </div>
              ) : null}

              {workspace.shouldShowUploadGate ? (
                <motion.div
                  initial={{ opacity: 0, y: 24 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.05, duration: 0.3 }}
                >
                  <ReceiptUploadGate
                    autoOpenOnMount={autoOpenUploadGate}
                    isParsingReceipt={workspace.isParsingReceipt}
                    beginManualEntry={workspace.beginManualEntry}
                    handleReceiptUpload={workspace.handleReceiptUpload}
                  />
                </motion.div>
              ) : (
                <>
                  <motion.div
                    initial={{ opacity: 0, y: 24 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.05, duration: 0.3 }}
                  >
                    <ReceiptDetailsSection
                      editorState={workspace.editorState}
                      merchantNameMissing={workspace.merchantNameMissing}
                      receiptDateMissing={workspace.receiptDateMissing}
                      isParsingReceipt={workspace.isParsingReceipt}
                      requestReceiptUpload={workspace.requestReceiptUpload}
                      handleReceiptUpload={workspace.handleReceiptUpload}
                      updateField={workspace.updateField}
                    />
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: 24 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1, duration: 0.3 }}
                  >
                    <GroupListSection
                      groups={workspace.editorState.groups}
                      unnamedGroupIds={workspace.unnamedGroupIds}
                      updateGroup={workspace.updateGroup}
                      addGroup={workspace.addGroup}
                      removeGroup={workspace.removeGroup}
                    />
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: 24 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.15, duration: 0.3 }}
                  >
                    <ItemListSection
                      items={workspace.editorState.items}
                      groups={workspace.editorState.groups}
                      itemValidationById={workspace.itemValidationById}
                      updateItem={workspace.updateItem}
                      addItem={workspace.addItem}
                      removeItem={workspace.removeItem}
                      toggleGroupAssignment={workspace.toggleGroupAssignment}
                    />
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: 24 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2, duration: 0.3 }}
                  >
                    <AdjustmentsSection
                      editorState={workspace.editorState}
                      updateField={workspace.updateField}
                    />
                  </motion.div>
                </>
              )}
            </div>

            {workspace.shouldShowUploadGate ? null : (
              <SummaryAside
                summaryRef={workspace.summaryRef}
                groups={workspace.editorState.groups}
                editorState={workspace.editorState}
                subtotalCents={workspace.subtotalCents}
                totalCents={workspace.totalCents}
                groupSharesById={workspace.groupSharesById}
                groupItemShareDetailsByGroupId={
                  workspace.groupItemShareDetailsByGroupId
                }
                toggleGroupPaid={workspace.toggleGroupPaid}
                isSharingSummary={workspace.isSharingSummary}
                handleShareSummary={workspace.handleShareSummary}
                scrollToFullSummary={workspace.scrollToFullSummary}
              />
            )}
          </div>
        </motion.div>
      </section>

      {workspace.shouldShowUploadGate ? null : (
        <ReceiptActionBar
          actionBarRef={workspace.actionBarRef}
          actionBarActionsRef={workspace.actionBarActionsRef}
          footerOffset={workspace.footerOffset}
          isCompactActionBar={workspace.isCompactActionBar}
          isMinimizedMobileActionBar={workspace.isMinimizedMobileActionBar}
          isMobileViewport={workspace.isMobileViewport}
          isDeleteConfirming={workspace.isDeleteConfirming}
          isDeleting={workspace.isDeleting}
          isSaving={workspace.isSaving}
          isSharingSummary={workspace.isSharingSummary}
          isParsingReceipt={workspace.isParsingReceipt}
          isDirty={workspace.isDirty}
          hasSavedReceipt={workspace.hasSavedReceipt}
          warningMessage={workspace.warningMessage}
          shareMessage={workspace.shareMessage}
          saveMessage={workspace.saveMessage}
          totalCents={workspace.totalCents}
          validation={workspace.validation}
          savePlan={workspace.savePlan}
          actionBarActionsHeight={workspace.actionBarActionsHeight}
          toggleMobileActionBarMinimized={
            workspace.toggleMobileActionBarMinimized
          }
          setIsDeleteConfirming={workspace.setIsDeleteConfirming}
          scrollToSummary={workspace.scrollToSummary}
          handleShareSummary={workspace.handleShareSummary}
          handleDelete={workspace.handleDelete}
          handleSave={workspace.handleSave}
        />
      )}
    </main>
  );
}
