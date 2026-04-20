"use client";

import { useState } from "react";
import { CustomSelect } from "@/components/custom-select";
import { PROPERTY_TYPES } from "@/lib/constants";
import type { CustomerRequest } from "@/lib/types";

type RequestInput = Omit<CustomerRequest, "id" | "createdAt" | "updatedAt">;
type IntakeInput = {
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  preferredDate: string;
};

const whatsappUrl =
  process.env.NEXT_PUBLIC_WHATSAPP_URL ??
  "https://wa.me/96170000001?text=Hello%2C%20I%20want%20to%20ask%20about%20a%20property.";

export function RequestForm({
  presetCustomerId
}: {
  presetCustomerId?: string;
}) {
  const [intake, setIntake] = useState<IntakeInput>({
    customerName: "",
    customerPhone: "",
    customerEmail: "",
    preferredDate: ""
  });
  const [form, setForm] = useState<RequestInput>({
    customerId: presetCustomerId ?? "",
    requestType: "apartment",
    purpose: "sale",
    preferredLocations: [{ city: "", area: "" }],
    mustHaveAmenities: [],
    notes: ""
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [submitted, setSubmitted] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError("");

    const intakeNotes = [
      form.notes,
      intake.customerEmail ? `Email: ${intake.customerEmail}` : "",
      intake.preferredDate ? `Preferred date: ${intake.preferredDate}` : ""
    ].filter(Boolean).join("\n");
    const payload = { ...form, ...intake, notes: intakeNotes };

    const response = await fetch("/api/requests", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    const data = (await response.json().catch(() => null)) as { error?: string } | null;
    setSaving(false);
    if (!response.ok) {
      setError(data?.error ?? "Unable to save request.");
      return;
    }

    setSubmitted(true);
    setIntake({ customerName: "", customerPhone: "", customerEmail: "", preferredDate: "" });
    setForm({
      customerId: "",
      requestType: "apartment",
      purpose: "sale",
      preferredLocations: [{ city: "", area: "" }],
      mustHaveAmenities: [],
      notes: ""
    });
  }

  const location = form.preferredLocations[0] ?? { city: "", area: "" };

  return (
      <main className="contact-page">
        <section className="contact-banner">
          <h1>Get in Touch</h1>
          <p>Connect with our real estate advisors for bespoke property guidance and private access.</p>
        </section>

        <section className="contact-content">
          <div className="contact-info">
            <h2>Global Headquarters</h2>
            <div className="contact-detail">
              <span>01</span>
              <div>
                <h3>Beirut Office</h3>
                <p>Achrafieh, Beirut<br />Lebanon</p>
              </div>
            </div>
            <div className="contact-detail">
              <span>02</span>
              <div>
                <h3>Direct Line</h3>
                <p>+961 70 000 001<br />Available for urgent inquiries</p>
              </div>
            </div>
            <div className="contact-detail">
              <span>03</span>
              <div>
                <h3>Email</h3>
                <p>advisory@iqar.com<br />press@iqar.com</p>
              </div>
            </div>
            <div className="contact-detail">
              <span>04</span>
              <div>
                <h3>Office Hours</h3>
                <p>Monday - Friday: 9:00 AM - 6:00 PM<br />Saturday: By appointment only</p>
              </div>
            </div>
            <a className="btn whatsapp-btn" href={whatsappUrl} target="_blank" rel="noreferrer">Talk on WhatsApp</a>
          </div>

          <form className="inquiry-card" onSubmit={handleSubmit}>
            <h2>Send an Inquiry</h2>
            {submitted ? <div className="notice">Your request was sent. We will contact you shortly.</div> : null}
            {error ? <div className="notice">{error}</div> : null}

            <div className="form-grid">
              <div>
                <label className="label">Full name</label>
                <input value={intake.customerName} onChange={(e) => setIntake({ ...intake, customerName: e.target.value })} required />
              </div>
              <div>
                <label className="label">Phone number</label>
                <input value={intake.customerPhone} onChange={(e) => setIntake({ ...intake, customerPhone: e.target.value })} required />
              </div>
              <div>
                <label className="label">Email address</label>
                <input type="email" value={intake.customerEmail} onChange={(e) => setIntake({ ...intake, customerEmail: e.target.value })} />
              </div>
              <div>
                <label className="label">Preferred date</label>
                <input type="date" value={intake.preferredDate} onChange={(e) => setIntake({ ...intake, preferredDate: e.target.value })} />
              </div>
              <div>
                <label className="label">I want to</label>
                <CustomSelect
                  value={form.purpose}
                  options={[
                    { value: "sale", label: "Buy" },
                    { value: "rent", label: "Rent" }
                  ]}
                  onChange={(value) => setForm({ ...form, purpose: value as CustomerRequest["purpose"] })}
                  ariaLabel="I want to"
                />
              </div>
              <div>
                <label className="label">Property type</label>
                <CustomSelect
                  value={form.requestType}
                  options={PROPERTY_TYPES.map((type) => ({ value: type, label: type }))}
                  onChange={(value) => setForm({ ...form, requestType: value as CustomerRequest["requestType"] })}
                  ariaLabel="Property type"
                />
              </div>
              <div>
                <label className="label">Budget</label>
                <CustomSelect
                  value={form.maxPrice ? String(form.maxPrice) : ""}
                  placeholder="Select budget"
                  options={[
                    { value: "", label: "Select budget" },
                    { value: "100000", label: "Up to 100,000" },
                    { value: "250000", label: "Up to 250,000" },
                    { value: "500000", label: "Up to 500,000" },
                    { value: "1000000", label: "Up to 1,000,000" },
                    { value: "2500000", label: "Above 1,000,000" }
                  ]}
                  onChange={(value) => setForm({ ...form, maxPrice: value ? Number(value) : undefined })}
                  ariaLabel="Budget"
                />
              </div>
              <div>
                <label className="label">Bedrooms</label>
                <CustomSelect
                  value={form.minBedrooms ? String(form.minBedrooms) : ""}
                  placeholder="Any"
                  options={[
                    { value: "", label: "Any" },
                    { value: "1", label: "1+" },
                    { value: "2", label: "2+" },
                    { value: "3", label: "3+" },
                    { value: "4", label: "4+" }
                  ]}
                  onChange={(value) => setForm({ ...form, minBedrooms: value ? Number(value) : undefined })}
                  ariaLabel="Bedrooms"
                />
              </div>
              <div>
                <label className="label">City</label>
                <input value={location.city} onChange={(e) => setForm({ ...form, preferredLocations: [{ ...location, city: e.target.value }] })} required />
              </div>
              <div>
                <label className="label">Area</label>
                <input value={location.area ?? ""} onChange={(e) => setForm({ ...form, preferredLocations: [{ ...location, area: e.target.value }] })} placeholder="Optional" />
              </div>
            </div>

            <div>
              <label className="label">Message</label>
              <textarea value={form.notes ?? ""} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="I am interested in..." />
            </div>

            <button type="submit" className="inquiry-submit" disabled={saving}>{saving ? "Sending..." : "Request Information"}</button>
          </form>
        </section>

        <section className="map-panel">
          <a href="https://www.google.com/maps/search/?api=1&query=Achrafieh%20Beirut" target="_blank" rel="noreferrer">View on Google Maps</a>
        </section>

        <section className="faq-section">
          <div className="faq-heading">
            <h2>Frequently Asked Questions</h2>
            <p>Find answers to common questions about our services.</p>
          </div>
          <div className="faq-list">
            <details open>
              <summary>How do I schedule a private viewing?</summary>
              <p>You can send the inquiry form, use WhatsApp, or call our office directly. An advisor will coordinate a time that suits your schedule.</p>
            </details>
            <details>
              <summary>Do you handle off-market properties?</summary>
              <p>Yes. We work with private sellers and selected owners to provide discreet access to opportunities not shown publicly.</p>
            </details>
            <details>
              <summary>What areas do you cover?</summary>
              <p>We primarily cover Beirut and premium Lebanese markets, with regional partner access in Dubai and Riyadh.</p>
            </details>
            <details>
              <summary>Can you assist with international relocation?</summary>
              <p>Yes. We can help shortlist properties, coordinate viewings, and support a smooth move through our advisory network.</p>
            </details>
          </div>
        </section>
      </main>
  );
}
