type CorgiMarkProps = {
  size?: "sm" | "md";
};

export function CorgiMark({ size = "md" }: CorgiMarkProps) {
  const className = size === "sm" ? "h-12 w-12" : "h-16 w-16";

  return (
    <svg className={className} viewBox="0 0 96 96" aria-hidden="true">
      <rect width="96" height="96" rx="28" fill="#F8FAFF" />
      <path d="M26 35 16 22c-2-3-7-1-6 3l2 22z" fill="#F59E0B" />
      <path d="m70 35 10-13c2-3 7-1 6 3l-2 22z" fill="#F59E0B" />
      <circle cx="48" cy="50" r="28" fill="#FDBA74" />
      <circle cx="38" cy="47" r="4" fill="#111827" />
      <circle cx="58" cy="47" r="4" fill="#111827" />
      <path d="M43 59c3 4 7 4 10 0" fill="none" stroke="#111827" strokeWidth="4" strokeLinecap="round" />
      <path d="M33 71h30c5 0 9 4 9 9v2H24v-2c0-5 4-9 9-9z" fill="#3182F6" />
    </svg>
  );
}
