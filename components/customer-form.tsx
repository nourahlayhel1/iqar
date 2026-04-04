"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { Customer } from "@/lib/types";

type CustomerInput = Omit<Customer, "id" | "createdAt" | "updatedAt">;

export function CustomerForm({ mode, initialData, customerId }: { mode: "create" | "edit"; initialData?: Customer; customerId?: string }) {
  const router = useRouter();
  const [form, setForm] = useState<CustomerInput>({
    name: initialData?.name ?? "",
    phone: initialData?.phone ?? "",
    altPhone: initialData?.altPhone ?? "",
    notes: initialData?.notes ?? ""
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError("");

    const response = await fetch(mode === "create" ? "/api/customers" : `/api/customers/${customerId}`, {
      method: mode === "create" ? "POST" : "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form)
    });

    const data = (await response.json().catch(() => null)) as { error?: string; customer?: Customer } | null;
    setSaving(false);
    if (!response.ok) {
      setError(data?.error ?? "Unable to save customer.");
      return;
    }

    router.push(mode === "create" ? `/customers/${data?.customer?.id}` : `/customers/${customerId}`);
    router.refresh();
  }

  return (
    <form className="panel" onSubmit={handleSubmit}>
      <h1 className="section-title">{mode === "create" ? "Add customer" : "Edit customer"}</h1>
      <p className="section-subtitle">Store primary contact details and office notes.</p>
      {error ? <div className="notice" style={{ marginTop: "1rem" }}>{error}</div> : null}
      <div className="form-grid" style={{ marginTop: "1rem" }}>
        <div><label className="label">Name</label><input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required /></div>
        <div><label className="label">Phone</label><input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} required /></div>
        <div><label className="label">Alternative phone</label><input value={form.altPhone ?? ""} onChange={(e) => setForm({ ...form, altPhone: e.target.value })} /></div>
      </div>
      <div style={{ marginTop: "1rem" }}><label className="label">Notes</label><textarea value={form.notes ?? ""} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></div>
      <div className="actions"><button type="submit" className="btn" disabled={saving}>{saving ? "Saving..." : mode === "create" ? "Create customer" : "Save changes"}</button></div>
    </form>
  );
}
