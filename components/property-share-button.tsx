"use client";

import { MouseEvent, useState } from "react";

export function PropertyShareButton({
  title,
  url,
  compact = false,
  iconOnly = false
}: {
  title: string;
  url?: string;
  compact?: boolean;
  iconOnly?: boolean;
}) {
  const [status, setStatus] = useState("");

  async function shareProperty(event: MouseEvent<HTMLButtonElement>) {
    event.preventDefault();
    event.stopPropagation();

    const shareUrl = url ? new URL(url, window.location.origin).toString() : window.location.href;
    const shareData = {
      title,
      text: title,
      url: shareUrl
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
        return;
      }

      await navigator.clipboard.writeText(shareUrl);
      setStatus("Link copied");
      window.setTimeout(() => setStatus(""), 2200);
    } catch (error) {
      if ((error as Error).name === "AbortError") return;
      setStatus("Could not share");
      window.setTimeout(() => setStatus(""), 2200);
    }
  }

  return (
    <div className={iconOnly ? "share-action share-action-icon" : compact ? "share-action share-action-card" : "share-action"}>
      <button
        type="button"
        className={iconOnly ? "share-icon-button" : compact ? "btn-ghost" : "btn-secondary"}
        onClick={shareProperty}
        aria-label={`Share ${title}`}
        title="Share"
      >
        {iconOnly ? (
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path
              d="M7.5 12.5 16.5 7.5M7.5 11.5l9 5M7 15.75a3 3 0 1 1 0-6 3 3 0 0 1 0 6Zm10-7a3 3 0 1 1 0-6 3 3 0 0 1 0 6Zm0 12.5a3 3 0 1 1 0-6 3 3 0 0 1 0 6Z"
              fill="none"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="1.8"
            />
          </svg>
        ) : (
          "Share"
        )}
      </button>
      {status ? <span className="muted">{status}</span> : null}
    </div>
  );
}
