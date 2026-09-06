export function PinIcon({ active }: { active?: boolean }) {
  return (
    <svg viewBox="0 0 24 24" className={`pin-icon${active ? ' active' : ''}`} aria-hidden="true">
      <circle cx="12" cy="8" r="6" fill="currentColor" />
      <path d="M12 14 L12 22" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}
