/** Lightweight outline icons for V21.1 Quick Actions — no icon library. */

type IconProps = {
  className?: string;
};

const stroke = {
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.6,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
};

export function IconEye({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 20 20" width="16" height="16" aria-hidden="true">
      <path {...stroke} d="M1.8 10S4.5 4.5 10 4.5 18.2 10 18.2 10 15.5 15.5 10 15.5 1.8 10 1.8 10Z" />
      <circle {...stroke} cx="10" cy="10" r="2.4" />
    </svg>
  );
}

export function IconEyeOff({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 20 20" width="16" height="16" aria-hidden="true">
      <path {...stroke} d="M3 3.5 17 16.5" />
      <path
        {...stroke}
        d="M8.2 5.1C8.8 4.9 9.4 4.5 10 4.5c5.5 0 8.2 5.5 8.2 5.5a12.6 12.6 0 0 1-2.1 2.5M5.1 6.8C3.2 8 1.8 10 1.8 10S4.5 15.5 10 15.5c1 0 1.9-.2 2.7-.5"
      />
      <path {...stroke} d="M8.4 8.5a2.4 2.4 0 0 0 3.2 3.2" />
    </svg>
  );
}

export function IconInfo({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 20 20" width="16" height="16" aria-hidden="true">
      <circle {...stroke} cx="10" cy="10" r="7.2" />
      <path {...stroke} d="M10 9v4.2M10 6.4h.01" />
    </svg>
  );
}

export function IconArrowDown({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 20 20" width="16" height="16" aria-hidden="true">
      <path {...stroke} d="M10 4.2v11.6M5.8 11.6 10 15.8l4.2-4.2" />
    </svg>
  );
}

/**
 * File Down — outlined document with folded corner + download arrow.
 * Used by Export PDF (desktop chip + mobile More menu).
 */
export function IconExportPdf({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 20 20" width="16" height="16" aria-hidden="true">
      <path
        {...stroke}
        d="M12.2 2.5H5.8A1.3 1.3 0 0 0 4.5 3.8v12.4A1.3 1.3 0 0 0 5.8 17.5h8.4a1.3 1.3 0 0 0 1.3-1.3V7.2Z"
      />
      <path {...stroke} d="M12.2 2.5v3.4a1.3 1.3 0 0 0 1.3 1.3h3.5" />
      <path {...stroke} d="M10 9.2v5.2M7.6 12.2 10 14.6l2.4-2.4" />
    </svg>
  );
}

export function IconMessage({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 20 20" width="16" height="16" aria-hidden="true">
      <path
        {...stroke}
        d="M4.2 4.5h11.6A1.7 1.7 0 0 1 17.5 6.2v6.2a1.7 1.7 0 0 1-1.7 1.7H8.3L4 16.5v-2.4H4.2A1.7 1.7 0 0 1 2.5 12.4V6.2A1.7 1.7 0 0 1 4.2 4.5Z"
      />
    </svg>
  );
}

export function IconDoc({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 20 20" width="16" height="16" aria-hidden="true">
      <path {...stroke} d="M6 3.5h5.2L15.5 8v8.5a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1v-12a1 1 0 0 1 1-1Z" />
      <path {...stroke} d="M11.2 3.5V8h4.3M7.5 11h5M7.5 13.8h5" />
    </svg>
  );
}

export function IconMore({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 20 20" width="16" height="16" aria-hidden="true">
      <circle cx="4.5" cy="10" r="1.2" fill="currentColor" />
      <circle cx="10" cy="10" r="1.2" fill="currentColor" />
      <circle cx="15.5" cy="10" r="1.2" fill="currentColor" />
    </svg>
  );
}
