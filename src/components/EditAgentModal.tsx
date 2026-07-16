"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Modal } from "./Modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { extractErrorMessage } from "@/lib/formError";

export function EditAgentModal({
  agentId,
  initial,
}: {
  agentId: string;
  initial: { name: string; email: string; agentLocation: "ABROAD" | "GHANA" };
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState(initial);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const res = await fetch(`/api/admin/agents/${agentId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    setLoading(false);
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setError(extractErrorMessage(body.error, "Failed to save changes"));
      return;
    }
    toast.success("Agent profile updated");
    setOpen(false);
    router.refresh();
  }

  return (
    <>
      <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
        Edit profile
      </Button>

      {open && (
        <Modal
          title="Edit agent profile"
          description="Only admins can change an agent's details, typically after the agent requests it."
          onClose={() => setOpen(false)}
        >
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="edit-agent-name" className="mb-1.5">
                Full name
              </Label>
              <Input
                id="edit-agent-name"
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="edit-agent-email" className="mb-1.5">
                Email
              </Label>
              <Input
                id="edit-agent-email"
                required
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="edit-agent-location" className="mb-1.5">
                Based
              </Label>
              <Select
                value={form.agentLocation}
                onValueChange={(value) =>
                  setForm({ ...form, agentLocation: value as "ABROAD" | "GHANA" })
                }
              >
                <SelectTrigger id="edit-agent-location" className="w-full">
                  <SelectValue>
                    {(value: string) =>
                      value === "GHANA" ? "Ghana (home team)" : "Abroad (origin team)"
                    }
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ABROAD">Abroad (origin team)</SelectItem>
                  <SelectItem value="GHANA">Ghana (home team)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {error && (
              <div className="rounded-lg border border-red-100 bg-red-50 px-3.5 py-2.5 text-sm text-brand-red">
                {error}
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? "Saving..." : "Save changes"}
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </>
  );
}
