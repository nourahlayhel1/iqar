"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { COMMON_AMENITIES, PROPERTY_PURPOSES, PROPERTY_TYPES } from "@/lib/constants";
import type { Customer, CustomerRequest } from "@/lib/types";

type RequestInput = Omit<CustomerRequest, "id" | "createdAt" | "updatedAt">;

export function RequestForm({
  customers,
  mode,
  initialData,
  requestId,
  presetCustomerId
}: {
  customers: Customer[];
  mode: "create" | "edit";
  initialData?: CustomerRequest;
  requestId?: string;
  presetCustomerId?: string;
}) {
  const router = useRouter();
  const [form, setForm] = useState<RequestInput>({
    customerId: initialData?.customerId ?? presetCustomerId ?? customers[0]?.id ?? "",
    requestType: initialData?.requestType ?? "apartment",
    purpose: initialData?.purpose ?? "sale",
    preferredLocations: initialData?.preferredLocations ?? [{ city: "", area: "" }],
    minPrice: initialData?.minPrice,
    maxPrice: initialData?.maxPrice,
    minBedrooms: initialData?.minBedrooms,
    minBathrooms: initialData?.minBathrooms,
    minAreaSqm: initialData?.minAreaSqm,
    mustHaveAmenities: initialData?.mustHaveAmenities ?? [],
    notes: initialData?.notes ?? ""
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError("");

    const response = await fetch(mode === "create" ? "/api/requests" : `/api/requests/${requestId}`, {
      method: mode === "create" ? "POST" : "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form)
    });

    const data = (await response.json().catch(() => null)) as { error?: string } | null;
    setSaving(false);
    if (!response.ok) {
      setError(data?.error ?? "Unable to save request.");
      return;
    }

    router.push(presetCustomerId ? `/customers/${presetCustomerId}` : "/requests");
    router.refresh();
  }

  return (
    <form className="panel" onSubmit={handleSubmit}>
      <h1 className="section-title">{mode === "create" ? "Add customer request" : "Edit customer request"}</h1>
      <p className="section-subtitle">Define required property traits and budget bands.</p>
      {error ? <div className="notice" style={{ marginTop: "1rem" }}>{error}</div> : null}

      <div className="form-grid" style={{ marginTop: "1rem" }}>
        <div>
          <label className="label">Customer</label>
          <select value={form.customerId} onChange={(e) => setForm({ ...form, customerId: e.target.value })} disabled={Boolean(presetCustomerId)}>
            {customers.map((customer) => <option key={customer.id} value={customer.id}>{customer.name}</option>)}
          </select>
        </div>
        <div><label className="label">Type</label><select value={form.requestType} onChange={(e) => setForm({ ...form, requestType: e.target.value as CustomerRequest["requestType"] })}>{PROPERTY_TYPES.map((type) => <option key={type} value={type}>{type}</option>)}</select></div>
        <div><label className="label">Purpose</label><select value={form.purpose} onChange={(e) => setForm({ ...form, purpose: e.target.value as CustomerRequest["purpose"] })}>{PROPERTY_PURPOSES.map((purpose) => <option key={purpose} value={purpose}>{purpose}</option>)}</select></div>
        <div><label className="label">Min price</label><input type="number" min="0" value={form.minPrice ?? ""} onChange={(e) => setForm({ ...form, minPrice: e.target.value ? Number(e.target.value) : undefined })} /></div>
        <div><label className="label">Max price</label><input type="number" min="0" value={form.maxPrice ?? ""} onChange={(e) => setForm({ ...form, maxPrice: e.target.value ? Number(e.target.value) : undefined })} /></div>
        <div><label className="label">Min bedrooms</label><input type="number" min="0" value={form.minBedrooms ?? ""} onChange={(e) => setForm({ ...form, minBedrooms: e.target.value ? Number(e.target.value) : undefined })} /></div>
        <div><label className="label">Min bathrooms</label><input type="number" min="0" value={form.minBathrooms ?? ""} onChange={(e) => setForm({ ...form, minBathrooms: e.target.value ? Number(e.target.value) : undefined })} /></div>
        <div><label className="label">Min area sqm</label><input type="number" min="0" value={form.minAreaSqm ?? ""} onChange={(e) => setForm({ ...form, minAreaSqm: e.target.value ? Number(e.target.value) : undefined })} /></div>
      </div>

      <div style={{ marginTop: "1rem" }}>
        <label className="label">Preferred locations</label>
        <div className="grid">
          {form.preferredLocations.map((location, index) => (
            <div key={index} className="form-grid">
              <input placeholder="City" value={location.city} onChange={(e) => setForm({ ...form, preferredLocations: form.preferredLocations.map((entry, i) => i === index ? { ...entry, city: e.target.value } : entry) })} required />
              <input placeholder="Area (optional)" value={location.area ?? ""} onChange={(e) => setForm({ ...form, preferredLocations: form.preferredLocations.map((entry, i) => i === index ? { ...entry, area: e.target.value } : entry) })} />
            </div>
          ))}
        </div>
        <div className="actions"><button type="button" className="btn-ghost" onClick={() => setForm({ ...form, preferredLocations: [...form.preferredLocations, { city: "", area: "" }] })}>Add location</button></div>
      </div>

      <div style={{ marginTop: "1rem" }}><label className="label">Required amenities (comma separated)</label><input value={(form.mustHaveAmenities ?? []).join(", ")} onChange={(e) => setForm({ ...form, mustHaveAmenities: e.target.value.split(",").map((item) => item.trim()).filter(Boolean) })} /></div>
      <div className="checkbox-grid" style={{ marginTop: "0.75rem" }}>
        {COMMON_AMENITIES.map((amenity) => (
          <label key={amenity} className="checkbox-item">
            <input type="checkbox" checked={(form.mustHaveAmenities ?? []).includes(amenity)} onChange={(e) => setForm({ ...form, mustHaveAmenities: e.target.checked ? [...(form.mustHaveAmenities ?? []), amenity] : (form.mustHaveAmenities ?? []).filter((item) => item !== amenity) })} />
            <span>{amenity}</span>
          </label>
        ))}
      </div>

      <div style={{ marginTop: "1rem" }}><label className="label">Notes</label><textarea value={form.notes ?? ""} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></div>
      <div className="actions"><button type="submit" className="btn" disabled={saving}>{saving ? "Saving..." : mode === "create" ? "Create request" : "Save changes"}</button></div>
    </form>
  );
}
