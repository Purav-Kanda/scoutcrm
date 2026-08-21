"use client";

import { useState } from "react";
import { authFetch } from "@/lib/authClient";

export default function NewLeadModal({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: () => void;
}) {
  const [form, setForm] = useState({
    company_name: "",
    website: "",
    contact_name: "",
    contact_title: "",
    contact_email: "",
    notes: "",
  });
  const [saving, setSaving] = useState(false);

  const set = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [key]: e.target.value }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.company_name || !form.contact_name) return;
    setSaving(true);
    await authFetch("/api/leads", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setSaving(false);
    onCreated();
  };

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-[1px] flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
        <h2 className="text-base font-semibold mb-4 text-neutral-900">Add lead</h2>
        <form onSubmit={submit} className="space-y-3">
          <input
            required
            placeholder="Company name"
            value={form.company_name}
            onChange={set("company_name")}
            className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-neutral-500 focus:ring-2 focus:ring-neutral-100 transition-shadow"
          />
          <input
            placeholder="Website (optional)"
            value={form.website}
            onChange={set("website")}
            className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-neutral-500 focus:ring-2 focus:ring-neutral-100 transition-shadow"
          />
          <input
            required
            placeholder="Contact name"
            value={form.contact_name}
            onChange={set("contact_name")}
            className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-neutral-500 focus:ring-2 focus:ring-neutral-100 transition-shadow"
          />
          <input
            placeholder="Contact title"
            value={form.contact_title}
            onChange={set("contact_title")}
            className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-neutral-500 focus:ring-2 focus:ring-neutral-100 transition-shadow"
          />
          <input
            placeholder="Contact email"
            value={form.contact_email}
            onChange={set("contact_email")}
            className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-neutral-500 focus:ring-2 focus:ring-neutral-100 transition-shadow"
          />
          <textarea
            placeholder="Notes"
            value={form.notes}
            onChange={set("notes")}
            rows={3}
            className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-neutral-500 focus:ring-2 focus:ring-neutral-100 transition-shadow"
          />
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg px-4 py-2 text-sm text-neutral-600 hover:bg-neutral-100 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="rounded-lg bg-neutral-900 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-neutral-700 active:scale-[0.98] disabled:opacity-50 transition-all"
            >
              {saving ? "Saving…" : "Add lead"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
