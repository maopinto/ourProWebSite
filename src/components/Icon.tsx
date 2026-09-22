import type { CSSProperties } from "react";

export type IconName =
  | "arrow"
  | "arrow-up"
  | "download"
  | "sparkles"
  | "layers"
  | "box"
  | "mountain"
  | "sun"
  | "camera"
  | "chevron"
  | "expand"
  | "grid"
  | "cursor"
  | "move"
  | "rotate"
  | "check"
  | "menu"
  | "close"
  | "windows"
  | "apple"
  | "linux"
  | "play"
  | "sliders";

const paths: Record<IconName, React.ReactNode> = {
  arrow: (
    <>
      <path d="M4 12h15m-6-6 6 6-6 6" />
    </>
  ),
  "arrow-up": (
    <>
      <path d="M6 18 18 6M6 6h12v12" />
    </>
  ),
  download: (
    <>
      <path d="M12 3v12m-5-5 5 5 5-5M5 15v5h14v-5" />
    </>
  ),
  sparkles: (
    <>
      <path d="m12 3 2.5 6.5L21 12l-6.5 2.5L12 21l-2.5-6.5L3 12l6.5-2.5L12 3Z" />
      <path d="m20 2 .5 1.5L22 4l-1.5.5L20 6l-.5-1.5L18 4l1.5-.5L20 2Z" />
    </>
  ),
  layers: (
    <>
      <path d="m12 3 10 5-10 5L2 8l10-5Zm-10 9 10 5 10-5M2 16l10 5 10-5" />
    </>
  ),
  box: (
    <>
      <path d="m12 2 9 5v10l-9 5-9-5V7l9-5Zm0 10 9-5M12 12 3 7m9 5v10M7.5 4.5l9 5" />
    </>
  ),
  mountain: (
    <>
      <path d="m2 20 8-16 5 9 3-5 5 12H2Z" />
      <path d="m7 10 3 3 3-3" />
    </>
  ),
  sun: (
    <>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2m0 16v2M2 12h2m16 0h2M5 5l1.5 1.5m11 11L19 19M5 19l1.5-1.5m11-11L19 5" />
    </>
  ),
  camera: (
    <>
      <path d="M3 7h4l2-3h6l2 3h4v13H3V7Z" />
      <circle cx="12" cy="13" r="4" />
    </>
  ),
  chevron: <path d="m8 10 4 4 4-4" />,
  expand: <path d="M8 3H3v5m13-5h5v5M3 16v5h5m13-5v5h-5" />,
  grid: (
    <>
      <path d="M3 3h7v7H3zM14 3h7v7h-7zM3 14h7v7H3zM14 14h7v7h-7z" />
    </>
  ),
  cursor: <path d="m5 3 15 10-8 1-4 7L5 3Z" />,
  move: (
    <>
      <path d="M12 3v18M3 12h18M9 6l3-3 3 3M9 18l3 3 3-3M6 9l-3 3 3 3m12-6 3 3-3 3" />
    </>
  ),
  rotate: (
    <>
      <path d="M20 8a8 8 0 1 0 0 8M20 3v5h-5" />
    </>
  ),
  check: <path d="m5 12 4 4L19 6" />,
  menu: <path d="M4 6h16M4 12h16M4 18h16" />,
  close: <path d="m6 6 12 12M6 18 18 6" />,
  windows: (
    <>
      <path
        d="m3 5 8-1v7H3V5Zm10-1 8-1v8h-8V4ZM3 13h8v7l-8-1v-6Zm10 0h8v8l-8-1v-7Z"
        fill="currentColor"
        stroke="none"
      />
    </>
  ),
  apple: (
    <path
      d="M16.3 3c-.3 1.5-1.4 2.7-3 2.8-.2-1.4 1.1-2.8 3-2.8ZM18.1 13c0-2 1.5-3 1.7-3.2-1-1.6-2.7-1.8-3.4-1.8-1.4-.1-2.7.8-3.4.8-.7 0-1.9-.8-3-.8C7.6 8 5 10 5 13.6c0 2.1.8 4.3 1.9 5.9.9 1.2 1.6 2.2 2.8 2.1 1.2 0 1.6-.7 3.1-.7s1.8.7 3.1.7c1.3 0 2.1-1.1 2.8-2.1.8-1.2 1.2-2.3 1.3-2.7-.1 0-1.9-.8-1.9-3.8Z"
      fill="currentColor"
      stroke="none"
    />
  ),
  linux: (
    <>
      <path d="M9 10V6a3 3 0 0 1 6 0v4l3 6-1 4H7l-1-4 3-6Z" />
      <path d="m10 10 2 2 2-2M7 19l-3 2h6m7-2 3 2h-6" />
      <path d="M10 7h.01M14 7h.01" strokeWidth="3" />
    </>
  ),
  play: <path d="m9 5 11 7-11 7V5Z" />,
  sliders: (
    <>
      <path d="M4 7h7m4 0h5M4 17h3m4 0h9" />
      <circle cx="13" cy="7" r="2" />
      <circle cx="9" cy="17" r="2" />
    </>
  ),
};

export default function Icon({
  name,
  size = 20,
  className = "",
  style,
}: {
  name: IconName;
  size?: number;
  className?: string;
  style?: CSSProperties;
}) {
  return (
    <svg
      className={className}
      style={style}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {paths[name]}
    </svg>
  );
}
