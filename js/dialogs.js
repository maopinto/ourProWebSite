(function () {
  "use strict";

  const accountDialog = document.getElementById("account-dialog");
  const downloadDialog = document.getElementById("download-dialog");
  const dialogs = [accountDialog, downloadDialog];
  const form = accountDialog.querySelector("form");
  const title = document.getElementById("account-title");
  const nameField = accountDialog.querySelector("[data-account-name-field]");
  const nameInput = document.getElementById("account-name");
  const passwordInput = document.getElementById("account-password");
  const passwordToggle = accountDialog.querySelector(".password-toggle");
  const forgotButton = accountDialog.querySelector(".auth-forgot");
  const submitLabel = accountDialog.querySelector("[data-account-submit-label]");
  const status = accountDialog.querySelector(".form-status");
  const modeButtons = accountDialog.querySelectorAll("[data-account-mode]");
  const platformButtons = downloadDialog.querySelectorAll("[data-platform]");
  const downloadNotice = downloadDialog.querySelector("[data-download-notice]");

  function announceDialogChange(dialog) {
    document.dispatchEvent(new CustomEvent("terra:dialogchange", {
      detail: {
        dialog: dialog === accountDialog ? "account" : "download",
        open: dialog.open,
        anyOpen: dialogs.some(function (item) { return item.open; })
      }
    }));
  }

  function setPasswordVisible(visible) {
    passwordInput.type = visible ? "text" : "password";
    passwordToggle.textContent = visible ? "Hide" : "Show";
    passwordToggle.setAttribute("aria-label", visible ? "Hide password" : "Show password");
    passwordToggle.setAttribute("aria-pressed", String(visible));
  }

  function setAccountMode(mode) {
    const signingUp = mode === "signup";
    form.reset();
    status.textContent = "";
    setPasswordVisible(false);
    title.textContent = signingUp ? "Make room for ideas." : "Welcome back.";
    submitLabel.textContent = signingUp ? "Create account" : "Sign in";
    nameField.hidden = !signingUp;
    nameInput.disabled = !signingUp;
    forgotButton.hidden = signingUp;
    passwordInput.autocomplete = signingUp ? "new-password" : "current-password";
    modeButtons.forEach(function (button) {
      const selected = button.dataset.accountMode === mode;
      button.classList.toggle("is-active", selected);
      button.setAttribute("aria-pressed", String(selected));
    });
  }

  function setPlatform(platform) {
    platformButtons.forEach(function (button) {
      const selected = button.dataset.platform === platform;
      button.classList.toggle("is-selected", selected);
      button.setAttribute("aria-pressed", String(selected));
    });
    downloadNotice.textContent = "TERRA is in development. An installer for " + platform +
      " is not available yet. Check back here for release news.";
  }

  function openDialog(dialog) {
    if (dialog.open) return;
    dialogs.forEach(function (other) {
      if (other !== dialog && other.open) other.close();
    });
    // Native modal dialogs handle focus trapping and return focus to their opener.
    dialog.showModal();
    announceDialogChange(dialog);
  }

  dialogs.forEach(function (dialog) {
    dialog.querySelectorAll("[data-close-dialog]").forEach(function (button) {
      button.addEventListener("click", function () { dialog.close(); });
    });
    dialog.addEventListener("cancel", function (event) {
      event.preventDefault();
      dialog.close();
    });
    dialog.addEventListener("click", function (event) {
      if (event.target !== dialog) return;
      const bounds = dialog.getBoundingClientRect();
      if (event.clientX < bounds.left || event.clientX > bounds.right ||
          event.clientY < bounds.top || event.clientY > bounds.bottom) {
        dialog.close();
      }
    });
    dialog.addEventListener("close", function () {
      if (dialog === accountDialog) setAccountMode("signin");
      else setPlatform("Windows");
      announceDialogChange(dialog);
    });
  });

  modeButtons.forEach(function (button) {
    button.addEventListener("click", function () {
      setAccountMode(button.dataset.accountMode);
    });
  });
  passwordToggle.addEventListener("click", function () {
    setPasswordVisible(passwordInput.type === "password");
  });
  forgotButton.addEventListener("click", function () {
    status.textContent = "Password recovery will be available when account access launches.";
  });
  form.addEventListener("submit", function (event) {
    event.preventDefault();
    // Preview only: never transmit, log, or persist form values.
    status.textContent = "Account access isn’t connected yet. Your details have not been saved.";
  });
  platformButtons.forEach(function (button) {
    button.addEventListener("click", function () { setPlatform(button.dataset.platform); });
  });

  window.TerraDialogs = {
    openAccount: function () { openDialog(accountDialog); },
    openDownload: function () { openDialog(downloadDialog); }
  };
})();
