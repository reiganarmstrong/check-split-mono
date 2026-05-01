"use client";

import { ChevronDown, ChevronUp, Plus, Trash2, Users } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { EditableGroup } from "@/lib/receipt-types";

import { requiredHighlightSoftStyle } from "../lib/constants";
import { FieldLabel, SectionShell } from "../lib/shared";

export function GroupListSection({
  groups,
  unnamedGroupIds,
  invalidGroupWeightIds,
  updateGroup,
  addGroup,
  removeGroup,
}: {
  groups: EditableGroup[];
  unnamedGroupIds: Set<string>;
  invalidGroupWeightIds: Set<string>;
  updateGroup: (groupId: string, updates: Partial<EditableGroup>) => void;
  addGroup: () => void;
  removeGroup: (groupId: string) => void;
}) {
  function getWeightValue(value: string) {
    const parsedValue = Number.parseInt(value, 10);

    if (!Number.isFinite(parsedValue) || parsedValue < 1) {
      return 1;
    }

    return parsedValue;
  }

  function handleWeightChange(groupId: string, value: string) {
    const digitsOnly = value.replace(/\D/g, "").replace(/^0+/, "");

    updateGroup(groupId, {
      shareWeight: digitsOnly,
    });
  }

  function stepWeight(group: EditableGroup, direction: 1 | -1) {
    const nextWeight = Math.max(
      getWeightValue(group.shareWeight) + direction,
      1,
    );

    updateGroup(group.id, {
      shareWeight: String(nextWeight),
    });
  }

  return (
    <SectionShell
      title="Split groups"
      eyebrow="Who pays"
      icon={Users}
      tone="primary"
    >
      <p className="mb-4 text-xs uppercase tracking-[0.18em] text-[var(--muted-foreground)]">
        Name and weight each group
      </p>
      <div className="space-y-4">
        {groups.map((group, index) => {
          const groupNameInputId = `receipt-group-${group.id}-name`;
          const groupWeightInputId = `receipt-group-${group.id}-weight`;
          const groupNotesInputId = `receipt-group-${group.id}-notes`;

          return (
            <div
              key={group.id}
              className="rounded-[0.9rem] border border-[var(--line)] bg-[var(--panel-strong)] p-4"
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="rounded-full border border-black bg-white px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-[color-mix(in_oklab,var(--foreground)_74%,black)]">
                  Group {index + 1}
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    className="rounded-[0.7rem] border border-[var(--line)] !bg-[var(--foreground)] !text-[var(--background)] hover:!bg-[#ff0000] hover:!text-[#fff8f6] disabled:!bg-[var(--muted)] disabled:!text-[var(--muted-foreground)]"
                    onClick={() => removeGroup(group.id)}
                    disabled={groups.length === 1}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="mt-4 grid gap-4 md:grid-cols-[minmax(0,0.8fr)_minmax(8rem,0.4fr)_minmax(0,1.2fr)]">
                <div className="grid gap-2 md:grid-rows-[1.5rem_3rem]">
                  <FieldLabel
                    htmlFor={groupNameInputId}
                    label="Group name"
                    showRequired={unnamedGroupIds.has(group.id)}
                  />
                  <Input
                    id={groupNameInputId}
                    value={group.displayName}
                    onChange={(event) =>
                      updateGroup(group.id, {
                        displayName: event.target.value,
                      })
                    }
                    placeholder="Alex + Sam"
                    className="h-12 w-full rounded-[0.8rem] border border-[var(--line)] bg-[var(--panel-strong)] px-4 font-medium text-[var(--foreground)] outline-none"
                    style={
                      unnamedGroupIds.has(group.id)
                        ? requiredHighlightSoftStyle
                        : undefined
                    }
                  />
                </div>

                <div className="grid gap-2 md:grid-rows-[1.5rem_3rem]">
                  <FieldLabel
                    htmlFor={groupWeightInputId}
                    label="Weight"
                    showRequired={invalidGroupWeightIds.has(group.id)}
                  />
                  <div
                    className="grid h-12 grid-cols-[minmax(0,1fr)_2.5rem] overflow-hidden rounded-[0.8rem] border border-[var(--line)] bg-[var(--panel-strong)]"
                    style={
                      invalidGroupWeightIds.has(group.id)
                        ? requiredHighlightSoftStyle
                        : undefined
                    }
                  >
                    <Input
                      id={groupWeightInputId}
                      value={group.shareWeight}
                      onChange={(event) =>
                        handleWeightChange(group.id, event.target.value)
                      }
                      inputMode="numeric"
                      min="1"
                      step="1"
                      placeholder="1"
                      className="h-full min-w-0 rounded-none border-0 bg-transparent px-4 font-medium text-[var(--foreground)] shadow-none focus-visible:border-0 focus-visible:ring-0"
                    />
                    <div className="grid border-l border-[var(--line)]">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-xs"
                        className="h-full w-full rounded-none border-[var(--line)] p-0 text-[var(--foreground)] hover:bg-[color-mix(in_oklab,var(--primary)_12%,white)]"
                        onClick={() => stepWeight(group, 1)}
                        aria-label={`Increase weight for ${group.displayName || `group ${index + 1}`}`}
                      >
                        <ChevronUp className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-xs"
                        className="h-full w-full rounded-none p-0 text-[var(--foreground)] hover:bg-[color-mix(in_oklab,var(--primary)_12%,white)] disabled:text-[var(--muted-foreground)] disabled:hover:bg-transparent"
                        onClick={() => stepWeight(group, -1)}
                        disabled={getWeightValue(group.shareWeight) <= 1}
                        aria-label={`Decrease weight for ${group.displayName || `group ${index + 1}`}`}
                      >
                        <ChevronDown className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="grid gap-2 md:grid-rows-[1.5rem_3rem]">
                  <Label
                    htmlFor={groupNotesInputId}
                    className="inline-flex h-6 items-center text-sm font-medium text-[var(--foreground)]"
                  >
                    Member notes
                  </Label>
                  <Input
                    id={groupNotesInputId}
                    value={group.notes}
                    onChange={(event) =>
                      updateGroup(group.id, {
                        notes: event.target.value,
                      })
                    }
                    placeholder="Optional names or notes"
                    className="h-12 w-full rounded-[0.8rem] border border-[var(--line)] bg-[var(--panel-strong)] px-4 font-medium text-[var(--foreground)] outline-none"
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <Button
        type="button"
        variant="outline"
        className="mt-5 rounded-[0.8rem] border border-[var(--line)] bg-[var(--panel)] px-5 text-sm font-medium text-[var(--foreground)] hover:bg-[color-mix(in_oklab,var(--primary)_12%,white)]"
        onClick={addGroup}
      >
        <Plus className="h-4 w-4" />
        Add group
      </Button>
    </SectionShell>
  );
}
