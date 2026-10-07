// Oyelearn mark — outer ring uses currentColor (set text-[#2067D3] or dark:text-[#5F93E3])
export function OyelearnMark({ size = 32, className = "" }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="9.0 9.0 182.0 182.0" className={className} role="img" aria-label="Oyelearn">
      <path d="M149.25 163.04A80 80 0 1 1 137.56 29.36" fill="none" stroke="currentColor" strokeWidth="22"/><path d="M161.28 48.58A80 80 0 0 1 169.28 140.00" fill="none" stroke="currentColor" strokeWidth="22"/><path d="M121.48 144.04A49 49 0 1 1 135.25 65.96" fill="none" stroke="#F59E0B" strokeWidth="20" strokeLinecap="round"/><circle cx="146.60" cy="84.86" r="12.4" fill="#F59E0B"/>
    </svg>
  );
}
