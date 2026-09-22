import { useEffect, useId, useRef, useState } from "react";
import type { MouseEvent } from "react";

type DownloadDialogProps = {
  open: boolean;
  onClose: () => void;
};

const platforms = ["Windows", "macOS", "Linux"] as const;

function PlatformIcon({ platform }: { platform: (typeof platforms)[number] }) {
  if (platform === "Windows") {
    return (
      <svg
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="currentColor"
        aria-hidden="true"
      >
        <path d="M3 4.5 10.5 3.5v7.75H3V4.5Zm9-1.2 9-1.2v9.15h-9V3.3ZM3 12.75h7.5v7.75L3 19.5v-6.75Zm9 0h9v9.15l-9-1.2v-7.95Z" />
      </svg>
    );
  }
  if (platform === "macOS") {
    return (
      <svg
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        aria-hidden="true"
      >
        <rect
          x="3"
          y="3.5"
          width="18"
          height="13"
          rx="2"
          stroke="currentColor"
          strokeWidth="1.6"
        />
        <path
          d="M9 21h6m-3-4.5V21M3 13h18"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
        />
      </svg>
    );
  }
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <rect
        x="3"
        y="4"
        width="18"
        height="16"
        rx="2.5"
        stroke="currentColor"
        strokeWidth="1.6"
      />
      <path
        d="m7 9 3 3-3 3m6 0h4"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function DownloadDialog({ open, onClose }: DownloadDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [platform, setPlatform] =
    useState<(typeof platforms)[number]>("Windows");
  const id = useId();

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  function handleBackdropClick(event: MouseEvent<HTMLDialogElement>) {
    if (event.target !== event.currentTarget) return;
    const bounds = event.currentTarget.getBoundingClientRect();
    if (
      event.clientX < bounds.left ||
      event.clientX > bounds.right ||
      event.clientY < bounds.top ||
      event.clientY > bounds.bottom
    ) {
      onClose();
    }
  }

  return (
    <dialog
      ref={dialogRef}
      className="modal download-modal"
      aria-labelledby={`${id}-title`}
      aria-describedby={`${id}-description`}
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      onClick={handleBackdropClick}
    >
      <button
        className="modal-close"
        type="button"
        onClick={onClose}
        aria-label="Close download dialog"
      >
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          aria-hidden="true"
        >
          <path
            d="m6 6 12 12M18 6 6 18"
            stroke="currentColor"
            strokeWidth="1.7"
            strokeLinecap="round"
          />
        </svg>
      </button>
      <p className="modal-eyebrow">TERRA FOR DESKTOP</p>
      <h2 className="modal-title" id={`${id}-title`}>
        Your next world awaits.
      </h2>
      <p className="modal-description" id={`${id}-description`}>
        Install TERRA to send prompts and create your own worlds. This website
        is a preview; the first desktop release is coming soon.
      </p>

      <div
        className="platform-options"
        role="group"
        aria-label="Choose your operating system"
      >
        {platforms.map((item) => (
          <button
            key={item}
            type="button"
            className={`platform-option${platform === item ? " is-selected" : ""}`}
            aria-pressed={platform === item}
            onClick={() => setPlatform(item)}
          >
            <PlatformIcon platform={item} />
            <span className="platform-name">{item}</span>
            <span className="platform-detail">Planned</span>
          </button>
        ))}
      </div>

      <p className="form-notice">
        TERRA is in development. An installer for {platform} is not available
        yet. Check back here for release news.
      </p>
      <button className="button button-primary" type="button" disabled>
        Coming soon
      </button>
      <button
        className="auth-footer modal-back"
        type="button"
        onClick={onClose}
      >
        Back to exploring <span aria-hidden="true">↗</span>
      </button>
    </dialog>
  );
}
