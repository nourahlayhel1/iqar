"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function DeleteButton({ endpoint, redirectTo, label }: { endpoint: string; redirectTo: string; label: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleDelete() {
    if (!window.confirm("Delete this record?")) return;
    setLoading(true);
    const response = await fetch(endpoint, { method: "DELETE" });
    setLoading(false);

    if (!response.ok) {
      const data = (await response.json().catch(() => null)) as { error?: string } | null;
      window.alert(data?.error ?? "Delete failed.");
      return;
    }

    router.push(redirectTo);
    router.refresh();
  }

  return <button type="button" className="btn-danger" onClick={handleDelete} disabled={loading}>{loading ? "Deleting..." : label}</button>;
}
