# TERRA

A responsive, English-language website foundation for an AI-assisted 3D landscape application. Built with React, TypeScript, and Vite, with a native WebGL terrain preview.

## Run locally

Requires Node.js 22 or later.

```sh
npm install
npm run dev
```

On Windows PowerShell, use `npm.cmd` if local execution policy blocks `npm.ps1`. Open the local address printed by Vite (normally http://127.0.0.1:5173).

```sh
npm run build
npm run preview
```

## Included

- Responsive landing page, mobile navigation, product walkthrough, team story, and download entry points.
- Interactive terrain with Alpine, Desert, and Island presets; drag or use arrow keys to rotate, switch shaded/wireframe modes, or enter full screen.
- A view-only terrain showcase with selectable example prompts. The prompt field is read-only, suggestions only change the displayed example, and the call to action opens the app download dialog. Nothing is sent or generated on the website.
- Example prompts rotate with a soft slide-and-blur transition every few seconds. Readers can pause or choose manually; rotation stops when the preview is offscreen, the tab is hidden, a dialog is open, the prompt is focused, or reduced motion is enabled.
- Accessible account dialogs with sign-in/create-account views and browser form validation.
- Download dialog with Windows, macOS, and Linux platform selection.
- Reduced-motion support, keyboard focus states, and native dialog focus management.
- Scroll-triggered section reveals and staggered feature cards, plus scroll-linked contour movement in supported browsers. Animations respect reduced-motion settings and content stays visible when the observer API is unavailable.

## Next steps

TERRA is a working name. Update branding and copy in `src/App.tsx` and page metadata in `index.html`.

Account forms are visual previews: they do not authenticate, transmit, or save credentials. Connect a real authentication service in `src/components/AccountDialog.tsx` before enabling account access. The password reset action also requires a real service.

No application installer was supplied. Downloads deliberately show **Coming soon**. Connect actual release URLs, supported operating systems, release metadata, and any account access checks in `src/components/DownloadDialog.tsx` when the application is ready.

The terrain is a website showcase, independent of the future desktop application's AI generation. World creation and sending prompts belong in the installed desktop app; do not add a web generation handler. No installer detection is attempted by this website.

Typography uses Google Fonts with local system fallbacks. No analytics, authentication service, database, or external AI API is configured. No secrets are needed to run this version.
