"use client";

import { Plus, Trash2, Users } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { EditableGroup } from "@/lib/receipt-types";

import { requiredHighlightSoftStyle } from "./constants";
import { FieldLabel, SectionShell } from "./shared";

export function GroupListSection({
  groups,
  unnamedGroupIds,
  updateGroup,
  addGroup,
  removeGroup,
}: {
  groups: EditableGroup[];
  unnamedGroupIds: Set<string>;
  updateGroup: (groupId: string, updates: Partial<EditableGroup>) => void;
  addGroup: () => void;
  removeGroup: (groupId: string) => void;
}) {
  return (
    <SectionShell
      title="Split groups"
      eyebrow="Participants"
      icon={Users}
      tone="primary"
    >
      <p className="mb-4 text-xs uppercase tracking-[0.18em] text-[var(--muted-foreground)]">
        Name each group
      </p>
      <div className="space-y-4">
        {groups.map((group, index) => (
          <div
            key={group.id}
            className="rounded-[1.4rem] border border-[var(--line)] bg-[var(--panel-strong)] p-4"
          >
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="rounded-full border border-[var(--line)] bg-[color-mix(in_oklab,var(--secondary)_20%,transparent)] px-3 py-1 text-xs font-medium uppercase tracking-[0.22em] text-[var(--muted-foreground)]">
                Group {index + 1}
              </div>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  className="rounded-full border border-[var(--line)] !bg-[var(--foreground)] !text-[var(--background)] hover:!bg-[#ff0000] hover:!text-[#fff8f6] disabled:!bg-[var(--muted)] disabled:!text-[var(--muted-foreground)]"
                  onClick={() => removeGroup(group.id)}
                  disabled={groups.length === 1}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="mt-4 grid gap-4 md:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)]">
              <label className="space-y-2">
                <FieldLabel
                  label="Group name"
                  showRequired={unnamedGroupIds.has(group.id)}
                />
                <input
                  value={group.displayName}
                  onChange={(event) =>
                    updateGroup(group.id, {
                      displayName: event.target.value,
                    })
                  }
                  placeholder="Alex + Sam"
                  className="h-12 w-full rounded-[1rem] border border-[var(--line)] bg-[var(--panel-strong)] px-4 font-medium text-[var(--foreground)] outline-none"
                  style={
                    unnamedGroupIds.has(group.id)
                      ? requiredHighlightSoftStyle
                      : undefined
                  }
                />
              </label>

              <label className="space-y-2">
                <span className="text-sm font-medium text-[var(--foreground)]">
                  Member notes
                </span>
                <input
                  value={group.notes}
                  onChange={(event) =>
                    updateGroup(group.id, {
                      notes: event.target.value,
                    })
                  }
                  placeholder="Optional names or notes"
                  className="h-12 w-full rounded-[1rem] border border-[var(--line)] bg-[var(--panel-strong)] px-4 font-medium text-[var(--foreground)] outline-none"
                />
              </label>
            </div>
          </div>
        ))}
      </div>

      <Button
        type="button"
        variant="outline"
        className="mt-5 rounded-full border border-[var(--line)] bg-[var(--panel)] px-5 text-sm font-medium text-[var(--foreground)] hover:bg-[color-mix(in_oklab,var(--primary)_12%,white)]"
        onClick={addGroup}
      >
        <Plus className="h-4 w-4" />
        Add group
      </Button>
    </SectionShell>
  );
}
