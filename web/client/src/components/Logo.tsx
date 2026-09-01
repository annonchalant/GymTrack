// RepDiary logo — a barbell resting above an open diary, drawn inline so it
// needs no asset pipeline and inherits crisp rendering at any size.
// Palette matches the app tokens: electric blue barbell, soft indigo diary,
// on the accent-soft circular badge the old icon used.

type Props = {
  size?: number;
  className?: string;
};

export default function Logo({ size = 80, className }: Props) {
  return (
    <svg
      viewBox="0 0 64 64"
      width={size}
      height={size}
      className={className}
      role="img"
      aria-label="RepDiary logo"
    >
      {/* Badge */}
      <circle cx="32" cy="32" r="31" fill="rgba(59, 130, 246, 0.15)" />
      <circle
        cx="32"
        cy="32"
        r="30.5"
        fill="none"
        stroke="rgba(59, 130, 246, 0.25)"
        strokeWidth="1.5"
      />

      {/* Barbell */}
      <rect x="12" y="23" width="40" height="3.5" rx="1.75" fill="#3B82F6" />
      <rect x="17" y="16" width="5" height="17.5" rx="2.5" fill="#3B82F6" />
      <rect x="42" y="16" width="5" height="17.5" rx="2.5" fill="#3B82F6" />
      <rect x="24" y="19" width="4" height="11.5" rx="2" fill="#60A5FA" />
      <rect x="36" y="19" width="4" height="11.5" rx="2" fill="#60A5FA" />

      {/* Open diary */}
      <path
        d="M14 41 C 20 37.5, 27 37.5, 32 41 C 37 37.5, 44 37.5, 50 41 L 50 50 C 44 46.5, 37 46.5, 32 50 C 27 46.5, 20 46.5, 14 50 Z"
        fill="none"
        stroke="#A5B4FC"
        strokeWidth="2.5"
        strokeLinejoin="round"
      />
      <line
        x1="32"
        y1="41"
        x2="32"
        y2="50"
        stroke="#A5B4FC"
        strokeWidth="2"
      />
    </svg>
  );
}
