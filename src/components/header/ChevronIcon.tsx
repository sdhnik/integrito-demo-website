export default function ChevronIcon({ open = false }: { open?: boolean }) {
  return (
    <svg
      className={`header-chevron${open ? ' is-open' : ''}`}
      viewBox="0 0 12 12"
      width="12"
      height="12"
      aria-hidden="true"
      focusable="false"
    >
      <path
        d="M2.5 4.25 6 7.75 9.5 4.25"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
