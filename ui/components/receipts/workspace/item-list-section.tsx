"use client";

import { ArrowUpDown, MapPin, Plus, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatCurrency, getItemLineSubtotalCents } from "@/lib/receipt-editor";
import type { EditableGroup, EditableItem } from "@/lib/receipt-types";
import { cn } from "@/lib/utils";

import {
  requiredHighlightFillStyle,
  requiredHighlightSoftStyle,
} from "./constants";
import type { ReceiptWorkspaceItemValidation } from "./use-receipt-workspace";
import { FieldLabel, GroupChip, SectionShell } from "./shared";

export function ItemListSection({
  items,
  groups,
  itemValidationById,
  updateItem,
  addItem,
  removeItem,
  toggleGroupAssignment,
}: {
  items: EditableItem[];
  groups: EditableGroup[];
  itemValidationById: Map<string, ReceiptWorkspaceItemValidation>;
  updateItem: (itemId: string, updates: Partial<EditableItem>) => void;
  addItem: () => void;
  removeItem: (itemId: string) => void;
  toggleGroupAssignment: (itemId: string, groupId: string) => void;
}) {
  return (
    <SectionShell
      title="Items and assignment"
      eyebrow="Line items"
      icon={MapPin}
      tone="primary"
    >
      <div className="space-y-5">
        {items.map((item, index) => {
          const itemValidation = itemValidationById.get(item.id);

          return (
            <div
              key={item.id}
              className="rounded-[1.4rem] border border-[var(--line)] bg-[var(--panel-strong)] p-5"
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="inline-flex items-center gap-2">
                  <div className="rounded-full border border-[var(--line)] bg-[color-mix(in_oklab,var(--secondary)_14%,transparent)] px-3 py-1 text-xs font-medium uppercase tracking-[0.22em] text-[var(--muted-foreground)]">
                    Item {index + 1}
                  </div>
                  <span className="text-sm font-medium text-[var(--muted-foreground)]">
                    {formatCurrency(getItemLineSubtotalCents(item))}
                  </span>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  className="rounded-full border border-[var(--line)] !bg-[var(--foreground)] !text-[var(--background)] hover:!bg-[#ff0000] hover:!text-[#fff8f6] disabled:!bg-[var(--muted)] disabled:!text-[var(--muted-foreground)]"
                  onClick={() => removeItem(item.id)}
                  disabled={items.length === 1}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>

              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <label className="space-y-2 md:col-span-2">
                  <FieldLabel
                    label="Description"
                    showRequired={itemValidation?.descriptionMissing ?? false}
                  />
                  <Input
                    value={item.description}
                    onChange={(event) =>
                      updateItem(item.id, {
                        description: event.target.value,
                      })
                    }
                    placeholder="Shared fries"
                    className="h-12 rounded-[1rem] border border-[var(--line)] bg-[var(--panel-strong)] px-4 font-medium"
                    style={
                      itemValidation?.descriptionMissing
                        ? requiredHighlightSoftStyle
                        : undefined
                    }
                  />
                </label>

                <label className="space-y-2">
                  <span className="text-sm font-medium text-[var(--foreground)]">
                    Category
                  </span>
                  <Input
                    value={item.category}
                    onChange={(event) =>
                      updateItem(item.id, {
                        category: event.target.value,
                      })
                    }
                    placeholder="Optional"
                    className="h-12 rounded-[1rem] border border-[var(--line)] bg-[var(--panel-strong)] px-4 font-medium"
                  />
                </label>

                <label className="space-y-2">
                  <FieldLabel
                    label="Quantity"
                    showRequired={itemValidation?.quantityInvalid ?? false}
                  />
                  <Input
                    inputMode="numeric"
                    value={item.quantity}
                    onChange={(event) =>
                      updateItem(item.id, {
                        quantity: event.target.value,
                      })
                    }
                    className="h-12 rounded-[1rem] border border-[var(--line)] bg-[var(--panel-strong)] px-4 font-medium"
                    style={
                      itemValidation?.quantityInvalid
                        ? requiredHighlightSoftStyle
                        : undefined
                    }
                  />
                </label>

                <label className="space-y-2">
                  <FieldLabel
                    label="Unit price"
                    showRequired={itemValidation?.unitPriceInvalid ?? false}
                  />
                  <Input
                    inputMode="decimal"
                    value={item.unitPrice}
                    onChange={(event) =>
                      updateItem(item.id, {
                        unitPrice: event.target.value,
                      })
                    }
                    className="h-12 rounded-[1rem] border border-[var(--line)] bg-[var(--panel-strong)] px-4 font-medium"
                    style={
                      itemValidation?.unitPriceInvalid
                        ? requiredHighlightSoftStyle
                        : undefined
                    }
                  />
                </label>

                <label className="space-y-2">
                  <span className="text-sm font-medium text-[var(--foreground)]">
                    Line discount
                  </span>
                  <Input
                    inputMode="decimal"
                    value={item.discount}
                    onChange={(event) =>
                      updateItem(item.id, {
                        discount: event.target.value,
                      })
                    }
                    className="h-12 rounded-[1rem] border border-[var(--line)] bg-[var(--panel-strong)] px-4 font-medium"
                  />
                </label>
              </div>

              <div
                className={cn(
                  "mt-5 rounded-[1.1rem] border px-4 py-4",
                  itemValidation?.missingGroupAssignment
                    ? "border-[var(--line)]"
                    : "border-[var(--line)] bg-[var(--surface)]",
                )}
                style={
                  itemValidation?.missingGroupAssignment
                    ? requiredHighlightSoftStyle
                    : undefined
                }
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="inline-flex items-center gap-2">
                    <ArrowUpDown className="h-4 w-4 text-[var(--muted-foreground)]" />
                    <p className="text-sm font-semibold text-[var(--foreground)]">
                      Assign this item to group(s)
                      {itemValidation?.missingGroupAssignment ? (
                        <span
                          className="ml-2 rounded-full border border-foreground px-2 py-0.5 text-[0.62rem] uppercase tracking-[0.18em]"
                          style={requiredHighlightFillStyle}
                        >
                          Required
                        </span>
                      ) : null}
                    </p>
                  </div>
                  <p className="text-xs uppercase tracking-[0.18em] text-[var(--muted-foreground)]">
                    Equal split across selected groups
                  </p>
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  {groups.map((group) => (
                    <GroupChip
                      key={group.id}
                      active={item.selectedGroupIds.includes(group.id)}
                      label={group.displayName || "Untitled group"}
                      onClick={() => toggleGroupAssignment(item.id, group.id)}
                    />
                  ))}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <Button
        type="button"
        variant="outline"
        className="mt-5 rounded-full border border-[var(--line)] bg-[var(--panel)] px-5 text-sm font-medium text-[var(--foreground)] hover:bg-[color-mix(in_oklab,var(--primary)_12%,white)]"
        onClick={addItem}
      >
        <Plus className="h-4 w-4" />
        Add item
      </Button>
    </SectionShell>
  );
}
