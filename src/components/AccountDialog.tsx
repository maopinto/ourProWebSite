import { useEffect, useId, useRef, useState } from "react";
import type { MouseEvent } from "react";

type AccountDialogProps = {
  open: boolean;
  onClose: () => void;
};

export default function AccountDialog({ open, onClose }: AccountDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [status, setStatus] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const id = useId();

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (open && !dialog.open) {
      dialog.showModal();
    } else if (!open) {
      if (dialog.open) dialog.close();
      formRef.current?.reset();
      setStatus("");
      setShowPassword(false);
    }
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

  function changeMode(nextMode: "signin" | "signup") {
    setMode(nextMode);
    setStatus("");
    setShowPassword(false);
    formRef.current?.reset();
  }

  return (
    <dialog
      ref={dialogRef}
      className="modal account-modal"
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
        aria-label="Close account dialog"
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

      <p className="modal-eyebrow">YOUR NEXT WORLD STARTS HERE</p>
      <h2 className="modal-title" id={`${id}-title`}>
        {mode === "signin" ? "Welcome back." : "Make room for ideas."}
      </h2>
      <p className="modal-description" id={`${id}-description`}>
        A space for your worlds, experiments, and everything in between.
      </p>

      <div
        className="auth-tabs"
        role="group"
        aria-label="Choose account action"
      >
        <button
          type="button"
          className={mode === "signin" ? "is-active" : ""}
          aria-pressed={mode === "signin"}
          onClick={() => changeMode("signin")}
        >
          Sign in
        </button>
        <button
          type="button"
          className={mode === "signup" ? "is-active" : ""}
          aria-pressed={mode === "signup"}
          onClick={() => changeMode("signup")}
        >
          Create account
        </button>
      </div>

      <p className="form-notice">
        Account access is coming soon. This form is a preview.
      </p>

      <form
        ref={formRef}
        className="auth-form"
        onSubmit={(event) => {
          event.preventDefault();
          setStatus(
            "Account access isn’t connected yet. Your details have not been saved.",
          );
        }}
      >
        {mode === "signup" && (
          <label className="field-label" htmlFor={`${id}-name`}>
            Your name
            <input
              className="form-input"
              id={`${id}-name`}
              name="name"
              type="text"
              placeholder="Alex Morgan"
              autoComplete="name"
              required
            />
          </label>
        )}
        <label className="field-label" htmlFor={`${id}-email`}>
          Email address
          <input
            className="form-input"
            id={`${id}-email`}
            name="email"
            type="email"
            placeholder="you@example.com"
            autoComplete="username"
            required
          />
        </label>
        <label className="field-label" htmlFor={`${id}-password`}>
          Password
        </label>
        <div className="password-field">
          <input
            className="form-input"
            id={`${id}-password`}
            name="password"
            type={showPassword ? "text" : "password"}
            placeholder="At least 8 characters"
            autoComplete={
              mode === "signup" ? "new-password" : "current-password"
            }
            minLength={8}
            required
          />
          <button
            className="password-toggle"
            type="button"
            aria-label={showPassword ? "Hide password" : "Show password"}
            aria-pressed={showPassword}
            onClick={() => setShowPassword((shown) => !shown)}
          >
            {showPassword ? "Hide" : "Show"}
          </button>
        </div>
        {mode === "signin" && (
          <button
            className="auth-forgot"
            type="button"
            onClick={() =>
              setStatus(
                "Password recovery will be available when account access launches.",
              )
            }
          >
            Forgot password?
          </button>
        )}
        <button className="button button-primary" type="submit">
          {mode === "signin" ? "Sign in" : "Create account"}
          <span aria-hidden="true">↗</span>
        </button>
        <p className="form-status" role="status" aria-live="polite">
          {status}
        </p>
      </form>
      <p className="auth-footer">Built for the worlds only you can imagine.</p>
    </dialog>
  );
}
