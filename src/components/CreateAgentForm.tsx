"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
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

export function CreateAgentForm() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    agentLocation: "ABROAD",
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const res = await fetch("/api/admin/agents", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setLoading(false);
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setError(extractErrorMessage(body.error, "Failed to create agent"));
      return;
    }
    toast.success(`${form.name} was added as an agent`);
    setForm({ name: "", email: "", password: "", agentLocation: "ABROAD" });
    setOpen(false);
    router.refresh();
  }

  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <Plus /> New agent
      </Button>

      {open && (
        <Modal
          title="Create agent account"
          description="Grant a team member access to manage shipments"
          onClose={() => setOpen(false)}
        >
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="agent-name" className="mb-1.5">
                Full name
              </Label>
              <Input
                id="agent-name"
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="agent-email" className="mb-1.5">
                  Email
                </Label>
                <Input
                  id="agent-email"
                  required
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="agent-password" className="mb-1.5">
                  Temporary password
                </Label>
                <Input
                  id="agent-password"
                  required
                  minLength={8}
                  type="password"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                />
              </div>
            </div>
            <div>
              <Label htmlFor="agent-location" className="mb-1.5">
                Based
              </Label>
              <Select
                value={form.agentLocation}
                onValueChange={(value) => value && setForm({ ...form, agentLocation: value })}
              >
                <SelectTrigger id="agent-location" className="w-full">
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
                {loading ? "Creating..." : "Create agent"}
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </>
  );
}
