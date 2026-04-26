"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  COMMON_AMENITIES,
  CURRENCIES,
  PROPERTY_PURPOSES,
  PROPERTY_SOURCE_LABELS,
  PROPERTY_SOURCES,
  PROPERTY_TYPES
} from "@/lib/constants";
import type { Owner, Property } from "@/lib/types";

type PropertyInput = Omit<Property, "id" | "createdAt" | "updatedAt">;
type ContactMode = "existing" | "new";

const emptyValues: PropertyInput = {
  title: "",
  description: "",
  type: "apartment",
  purpose: "sale",
  price: 0,
  currency: "USD",
  source: "direct_owner",
  location: { city: "", area: "" },
  bedrooms: undefined,
  bathrooms: undefined,
  areaSqm: undefined,
  floor: undefined,
  parking: false,
  furnished: false,
  amenities: [],
  images: [],
  ownerName: "",
  ownerPhone: ""
};

export function PropertyForm() {
  const router = useRouter();
  const base = emptyValues;
  const [form, setForm] = useState<PropertyInput>({ ...base, location: { ...base.location } });
  const [selectedImages, setSelectedImages] = useState<File[]>([]);
  const [owners, setOwners] = useState<Owner[]>([]);
  const [contactMode, setContactMode] = useState<ContactMode>("existing");
  const [saving, setSaving] = useState(false);
  const [loadingOwners, setLoadingOwners] = useState(true);
  const [error, setError] = useState("");
  const contactLabel = form.source === "broker" ? "Broker" : "Owner";
  const selectedOwner = owners.find((owner) => owner.id === form.ownerId);

  useEffect(() => {
    let active = true;

    async function loadOwners() {
      try {
        const response = await fetch("/api/owners", { cache: "no-store" });
        const data = (await response.json().catch(() => null)) as { owners?: Owner[]; error?: string } | null;
        if (!response.ok) {
          throw new Error(data?.error ?? "Unable to load contacts.");
        }

        if (!active) return;
        const nextOwners = data?.owners ?? [];
        setOwners(nextOwners);
        setContactMode(nextOwners.length ? "existing" : "new");
        if (nextOwners.length) {
          setForm((current) => ({
            ...current,
            ownerId: current.ownerId ?? nextOwners[0].id,
            ownerName: current.ownerName || nextOwners[0].name,
            ownerPhone: current.ownerPhone || nextOwners[0].phone
          }));
        }
      } catch (loadError) {
        if (!active) return;
        setOwners([]);
        setContactMode("new");
        setError((current) => current || (loadError instanceof Error ? loadError.message : "Unable to load contacts."));
      } finally {
        if (active) setLoadingOwners(false);
      }
    }

    void loadOwners();
    return () => {
      active = false;
    };
  }, []);

  function handleContactModeChange(mode: ContactMode) {
    setContactMode(mode);
    setError("");

    if (mode === "existing") {
      const fallbackOwner = owners[0];
      setForm((current) => ({
        ...current,
        ownerId: fallbackOwner?.id,
        ownerName: fallbackOwner?.name ?? "",
        ownerPhone: fallbackOwner?.phone ?? ""
      }));
      return;
    }

    setForm((current) => ({
      ...current,
      ownerId: undefined,
      ownerName: "",
      ownerPhone: ""
    }));
  }

  function handleExistingOwnerChange(ownerId: string) {
    const owner = owners.find((entry) => entry.id === ownerId);
    setForm((current) => ({
      ...current,
      ownerId: owner?.id,
      ownerName: owner?.name ?? "",
      ownerPhone: owner?.phone ?? ""
    }));
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError("");

    const body = new FormData();
    body.append("payload", JSON.stringify(form));
    selectedImages.forEach((image) => body.append("images", image));

    const response = await fetch("/api/properties", {
      method: "POST",
      body
    });

    const data = (await response.json().catch(() => null)) as { error?: string; property?: Property } | null;
    setSaving(false);
    if (!response.ok) {
      setError(data?.error ?? "Unable to save property.");
      return;
    }

    router.push(`/properties/${data?.property?.id}`);
    router.refresh();
  }

  return (
    <form className="panel" onSubmit={handleSubmit}>
      <h1 className="section-title">Add property</h1>
      <p className="section-subtitle">Capture listing basics, owner details, and media links.</p>
      {error ? <div className="notice" style={{ marginTop: "1rem" }}>{error}</div> : null}

      <div className="form-grid" style={{ marginTop: "1rem" }}>
        <div><label className="label">Title</label><input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required /></div>
        <div><label className="label">Price</label><input type="number" min="0" value={form.price} onChange={(e) => setForm({ ...form, price: Number(e.target.value) })} required /></div>
        <div>
          <label className="label">Listed by</label>
          <select value={form.source ?? "direct_owner"} onChange={(e) => setForm({ ...form, source: e.target.value as Property["source"] })}>
            {PROPERTY_SOURCES.map((source) => (
              <option key={source} value={source}>{PROPERTY_SOURCE_LABELS[source]}</option>
            ))}
          </select>
        </div>
        <div><label className="label">Type</label><select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value as Property["type"] })}>{PROPERTY_TYPES.map((type) => <option key={type} value={type}>{type}</option>)}</select></div>
        <div><label className="label">Purpose</label><select value={form.purpose} onChange={(e) => setForm({ ...form, purpose: e.target.value as Property["purpose"] })}>{PROPERTY_PURPOSES.map((purpose) => <option key={purpose} value={purpose}>{purpose}</option>)}</select></div>
        <div><label className="label">Currency</label><select value={form.currency} onChange={(e) => setForm({ ...form, currency: e.target.value as Property["currency"] })}>{CURRENCIES.map((currency) => <option key={currency} value={currency}>{currency}</option>)}</select></div>
        <div><label className="label">City</label><input value={form.location.city} onChange={(e) => setForm({ ...form, location: { ...form.location, city: e.target.value } })} required /></div>
        <div><label className="label">Area</label><input value={form.location.area ?? ""} onChange={(e) => setForm({ ...form, location: { ...form.location, area: e.target.value } })} /></div>
        <div><label className="label">Bedrooms</label><input type="number" min="0" value={form.bedrooms ?? ""} onChange={(e) => setForm({ ...form, bedrooms: e.target.value ? Number(e.target.value) : undefined })} /></div>
        <div><label className="label">Bathrooms</label><input type="number" min="0" value={form.bathrooms ?? ""} onChange={(e) => setForm({ ...form, bathrooms: e.target.value ? Number(e.target.value) : undefined })} /></div>
        <div>
          <label className="label">Area</label>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <input
              type="number"
              min="0"
              value={form.areaSqm ?? ""}
              onChange={(e) => setForm({ ...form, areaSqm: e.target.value ? Number(e.target.value) : undefined })}
            />
            <span className="muted">sqm</span>
          </div>
        </div>
        <div><label className="label">Floor</label><input type="number" value={form.floor ?? ""} onChange={(e) => setForm({ ...form, floor: e.target.value ? Number(e.target.value) : undefined })} /></div>
        <div>
          <label className="label">{contactLabel} source</label>
          <select value={contactMode} onChange={(e) => handleContactModeChange(e.target.value as ContactMode)}>
            {owners.length ? <option value="existing">Select existing {contactLabel.toLowerCase()}</option> : null}
            <option value="new">Create new {contactLabel.toLowerCase()}</option>
          </select>
        </div>
        {contactMode === "existing" ? (
          <>
            <div>
              <label className="label">{contactLabel} name</label>
              <select
                value={form.ownerId ?? owners[0]?.id ?? ""}
                onChange={(e) => handleExistingOwnerChange(e.target.value)}
                disabled={loadingOwners || !owners.length}
                required
              >
                {owners.length ? null : <option value="">No contacts available</option>}
                {owners.map((owner) => (
                  <option key={owner.id} value={owner.id}>
                    {owner.name} ({owner.phone})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">{contactLabel} phone</label>
              <input value={selectedOwner?.phone ?? form.ownerPhone ?? ""} readOnly />
            </div>
          </>
        ) : (
          <>
            <div>
              <label className="label">{contactLabel} name</label>
              <input
                value={form.ownerName ?? ""}
                onChange={(e) => setForm({ ...form, ownerId: undefined, ownerName: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="label">{contactLabel} phone</label>
              <input
                value={form.ownerPhone ?? ""}
                onChange={(e) => setForm({ ...form, ownerId: undefined, ownerPhone: e.target.value })}
                required
              />
            </div>
          </>
        )}
      </div>

      <div style={{ marginTop: "1rem" }}><label className="label">Description</label><textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} required /></div>
      <div style={{ marginTop: "1rem" }}><label className="label">Amenities (comma separated)</label><input value={form.amenities.join(", ")} onChange={(e) => setForm({ ...form, amenities: e.target.value.split(",").map((item) => item.trim()).filter(Boolean) })} /></div>
      <div className="checkbox-grid" style={{ marginTop: "0.75rem" }}>
        {COMMON_AMENITIES.map((amenity) => (
          <label key={amenity} className="checkbox-item">
            <input type="checkbox" checked={form.amenities.includes(amenity)} onChange={(e) => setForm({ ...form, amenities: e.target.checked ? [...form.amenities, amenity] : form.amenities.filter((item) => item !== amenity) })} />
            <span>{amenity}</span>
          </label>
        ))}
      </div>
      <div style={{ marginTop: "1rem" }}>
        <label className="label">Images</label>
        <label className="btn-secondary" style={{ cursor: "pointer" }}>
          Choose images from files
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={(e) => setSelectedImages(Array.from(e.target.files ?? []))}
            style={{ display: "none" }}
          />
        </label>
        <p className="muted" style={{ marginTop: "0.5rem" }}>
          Selected images will be uploaded from your computer files.
        </p>
      </div>

      {selectedImages.length ? (
        <div className="stats" style={{ marginTop: "0.75rem" }}>
          {selectedImages.map((image) => (
            <span key={`${image.name}-${image.size}`} className="stat-pill">{image.name}</span>
          ))}
        </div>
      ) : null}

      {form.images.length ? (
        <div className="grid properties" style={{ marginTop: "1rem" }}>
          {form.images.map((image) => (
            <div key={image} className="panel">
              <div className="image-frame">
                <img src={image} alt={form.title || "Property image"} />
              </div>
              <div className="actions">
                <button
                  type="button"
                  className="btn-danger"
                  onClick={() => setForm({ ...form, images: form.images.filter((entry) => entry !== image) })}
                >
                  Remove image
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : null}
      <div className="checkbox-grid" style={{ marginTop: "1rem" }}>
        <label className="checkbox-item"><input type="checkbox" checked={form.parking ?? false} onChange={(e) => setForm({ ...form, parking: e.target.checked })} /><span>Parking</span></label>
        <label className="checkbox-item"><input type="checkbox" checked={form.furnished ?? false} onChange={(e) => setForm({ ...form, furnished: e.target.checked })} /><span>Furnished</span></label>
      </div>
      <div className="actions"><button type="submit" className="btn" disabled={saving}>{saving ? "Saving..." : "Create property"}</button></div>
    </form>
  );
}
