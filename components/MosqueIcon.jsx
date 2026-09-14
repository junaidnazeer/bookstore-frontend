export default function MosqueIcon({ size = 28, className = "" }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className={className}
    >
      <path
        d="M12 2c-1.5 2-1.5 4 0 5.5C13.5 6 13.5 4 12 2z"
        fill="currentColor"
      />
      <path
        d="M4 10c0-2.5 2-4.5 4-5.5v2.5c-1.2.8-2 2-2 3v1h4V9c0-1.8 1-3 2-3.5C13 6 14 7.2 14 9v2h4v-1c0-1-.8-2.2-2-3V5.5c2 1 4 3 4 5.5v9H4v-9z"
        fill="currentColor"
      />
      <rect x="2" y="19" width="20" height="2" fill="currentColor" />
    </svg>
  );
}
