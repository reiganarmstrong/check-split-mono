"use client";

import {
  buildReceiptSavePlan,
  formatCurrency,
  getGroupItemShareDetails,
  getGroupShareSummaries,
  getReceiptEditorValidation,
  getReceiptSubtotalCents,
  getReceiptTotalCents,
  isMeaningfullyDirty,
  parseMoneyInputToCents,
} from "@/lib/receipt-editor";
import { buildReceiptSummaryShareData } from "@/lib/receipt-summary-share";
import type { Receipt, ReceiptEditorState } from "@/lib/receipt-types";

export function getReceiptWorkspaceDerivedState({
  editorState,
  sourceReceipt,
  receiptId,
}: {
  editorState: ReceiptEditorState;
  sourceReceipt: Receipt | null;
  receiptId?: string;
}) {
  const validation = getReceiptEditorValidation(editorState);
  const savePlan = buildReceiptSavePlan(editorState, sourceReceipt);
  const isDirty = isMeaningfullyDirty(editorState, sourceReceipt);
  const subtotalCents = getReceiptSubtotalCents(editorState);
  const totalCents = getReceiptTotalCents(editorState);
  const groupShares = getGroupShareSummaries(editorState);
  const groupItemShareDetails = getGroupItemShareDetails(editorState);
  const groupSharesById = new Map(
    groupShares.map((share) => [share.groupId, share]),
  );
  const groupItemShareDetailsByGroupId = new Map(
    editorState.groups.map((group) => [
      group.id,
      groupItemShareDetails.filter((detail) => detail.groupId === group.id),
    ]),
  );
  const summaryShareData = buildReceiptSummaryShareData({
    discountLabel: formatCurrency(parseMoneyInputToCents(editorState.discount)),
    feeLabel: formatCurrency(parseMoneyInputToCents(editorState.fee)),
    groups: editorState.groups.map((group) => {
      const share = groupSharesById.get(group.id);

      return {
        amountLabel: formatCurrency(share?.amountCents ?? 0),
        discountLabel: formatCurrency(share?.discountShareCents ?? 0),
        feeLabel: formatCurrency(share?.feeShareCents ?? 0),
        groupDisplayName: group.displayName,
        itemsLabel: formatCurrency(share?.itemSubtotalCents ?? 0),
        itemDetails: (groupItemShareDetailsByGroupId.get(group.id) ?? []).map(
          (detail) => ({
            amountLabel: formatCurrency(detail.shareCents),
            description: detail.description,
            ratioLabel: detail.ratioLabel,
            subtotalLabel: formatCurrency(detail.lineSubtotalCents),
          }),
        ),
        taxLabel: formatCurrency(share?.taxShareCents ?? 0),
        tipLabel: formatCurrency(share?.tipShareCents ?? 0),
      };
    }),
    locationName: editorState.locationName,
    merchantName: editorState.merchantName,
    receiptOccurredAt: editorState.receiptOccurredAt,
    subtotalLabel: formatCurrency(subtotalCents),
    taxLabel: formatCurrency(parseMoneyInputToCents(editorState.tax)),
    tipLabel: formatCurrency(parseMoneyInputToCents(editorState.tip)),
    totalLabel: formatCurrency(totalCents),
  });
  const merchantNameMissing = editorState.merchantName.trim().length === 0;
  const receiptDateMissing = editorState.receiptOccurredAt.trim().length === 0;
  const unnamedGroupIds = new Set(
    editorState.groups
      .filter((group) => group.displayName.trim().length === 0)
      .map((group) => group.id),
  );
  const itemValidationById = new Map(
    editorState.items.map((item) => [
      item.id,
      {
        descriptionMissing: item.description.trim().length === 0,
        quantityInvalid: !/^[1-9]\d*$/.test(item.quantity.trim()),
        unitPriceInvalid: !/^\d+(\.\d{0,2})?$/.test(item.unitPrice.trim()),
        missingGroupAssignment: item.selectedGroupIds.length === 0,
      },
    ]),
  );
  const heading =
    editorState.merchantName.trim() ||
    (receiptId ? "Receipt draft" : "New manual receipt");
  const workspaceDescription = receiptId ? "Edit and save." : "Parse, group, save.";
  const hasSavedReceipt = Boolean(sourceReceipt?.receiptId);

  return {
    validation,
    savePlan,
    isDirty,
    subtotalCents,
    totalCents,
    groupShares,
    groupItemShareDetails,
    groupSharesById,
    groupItemShareDetailsByGroupId,
    summaryShareData,
    merchantNameMissing,
    receiptDateMissing,
    unnamedGroupIds,
    itemValidationById,
    heading,
    workspaceDescription,
    hasSavedReceipt,
  };
}
