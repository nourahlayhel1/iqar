"use client";

import Link from "next/link";
import { useState } from "react";
import { formatCurrency } from "@/lib/format";
import type { Property } from "@/lib/types";

export function RequestMatchButton({ requestId }: { requestId: string }) {
  const [matches, setMatches] = useState<Property[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function loadMatches() {
    setLoading(true);
    setError("");
    const response = await fetch(`/api/requests/${requestId}/matches`, { cache: "no-store" });
    const data = (await response.json().catch(() => null)) as { error?: string; matches?: Property[] } | null;
    setLoading(false);

    if (!response.ok) {
      setError(data?.error ?? "Unable to load matches.");
      return;
    }

    setMatches(data?.matches ?? []);
  }

  return (
    <div>
      <button type="button" className="btn" onClick={loadMatches} disabled={loading}>
        {loading ? "Finding..." : "Find matches"}
      </button>
      {error ? <div className="notice" style={{ marginTop: "0.75rem" }}>{error}</div> : null}
      {matches ? (
        <div style={{ marginTop: "1rem" }}>
          {matches.length ? (
            <div className="grid properties">
              {matches.map((property) => (
                <div key={property.id} className="card">
                  <p className="eyebrow">{property.location.city}</p>
                  <h3 style={{ margin: "0.25rem 0" }}>{property.title}</h3>
                  <p className="price">{formatCurrency(property.price, property.currency)}</p>
                  <div className="actions">
                    <Link href={`/properties/${property.id}`} className="btn-secondary">
                      View property
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state">No current matches for this request.</div>
          )}
        </div>
      ) : null}
    </div>
  );
}
