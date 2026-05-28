/**
 * SmartRental Logo Components — inline SVG để font Nunito Black render đúng.
 * Dùng thay cho <img src="/logo*.svg"> để đảm bảo font bo tròn hiển thị đúng.
 */

interface LogoProps {
  className?: string;
}

const LOGO_FONT = "var(--font-logo), 'Nunito', 'Arial Rounded MT Bold', 'Varela Round', Arial, sans-serif";

/** Logo dọc màu nâu (#933a12) — dùng trên nền trắng/sáng */
export function LogoVertical({ className }: LogoProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 200 225"
      fill="none"
      className={className}
      aria-label="SmartRental"
      role="img"
    >
      {/* Mái trái + hook dọc */}
      <polyline
        points="13,97 86,50 86,30"
        stroke="#933a12"
        strokeWidth="13"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      {/* Mái phải */}
      <line x1="114" y1="50" x2="187" y2="97" stroke="#933a12" strokeWidth="13" strokeLinecap="round" fill="none" />
      {/* Cửa sổ 2×2 */}
      <rect x="88"  y="55" width="9" height="9" rx="1.8" fill="#933a12" />
      <rect x="100" y="55" width="9" height="9" rx="1.8" fill="#933a12" />
      <rect x="88"  y="67" width="9" height="9" rx="1.8" fill="#933a12" />
      <rect x="100" y="67" width="9" height="9" rx="1.8" fill="#933a12" />
      {/* Chữ */}
      <text
        x="100" y="147"
        style={{ fontFamily: LOGO_FONT, fontWeight: 900 }}
        fontSize="50"
        textAnchor="middle"
        fill="#933a12"
      >
        SMART
      </text>
      <text
        x="100" y="205"
        style={{ fontFamily: LOGO_FONT, fontWeight: 900 }}
        fontSize="50"
        textAnchor="middle"
        fill="#933a12"
      >
        RENTAL
      </text>
    </svg>
  );
}

/** Logo dọc màu trắng — dùng trên nền tối */
export function LogoWhite({ className }: LogoProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 200 225"
      fill="none"
      className={className}
      aria-label="SmartRental"
      role="img"
    >
      <polyline
        points="13,97 86,50 86,30"
        stroke="#ffffff"
        strokeWidth="13"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      <line x1="114" y1="50" x2="187" y2="97" stroke="#ffffff" strokeWidth="13" strokeLinecap="round" fill="none" />
      <rect x="88"  y="55" width="9" height="9" rx="1.8" fill="#ffffff" />
      <rect x="100" y="55" width="9" height="9" rx="1.8" fill="#ffffff" />
      <rect x="88"  y="67" width="9" height="9" rx="1.8" fill="#ffffff" />
      <rect x="100" y="67" width="9" height="9" rx="1.8" fill="#ffffff" />
      <text
        x="100" y="147"
        style={{ fontFamily: LOGO_FONT, fontWeight: 900 }}
        fontSize="50"
        textAnchor="middle"
        fill="#ffffff"
      >
        SMART
      </text>
      <text
        x="100" y="205"
        style={{ fontFamily: LOGO_FONT, fontWeight: 900 }}
        fontSize="50"
        textAnchor="middle"
        fill="#ffffff"
      >
        RENTAL
      </text>
    </svg>
  );
}

/** Logo ngang — icon nhà + "Smart Rental" text — dùng trong navbar */
export function LogoHorizontal({ className }: LogoProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 300 60"
      fill="none"
      className={className}
      aria-label="SmartRental"
      role="img"
    >
      {/* Icon nhà nhỏ */}
      <polyline
        points="4,46 23,25 23,14"
        stroke="#933a12"
        strokeWidth="6.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      <line x1="33" y1="25" x2="52" y2="46" stroke="#933a12" strokeWidth="6.5" strokeLinecap="round" fill="none" />
      <rect x="24"   y="29"   width="5" height="5" rx="1" fill="#933a12" />
      <rect x="30.5" y="29"   width="5" height="5" rx="1" fill="#933a12" />
      <rect x="24"   y="35.5" width="5" height="5" rx="1" fill="#933a12" />
      <rect x="30.5" y="35.5" width="5" height="5" rx="1" fill="#933a12" />
      {/* Text "Smart Rental" */}
      <text
        x="64" y="44"
        style={{ fontFamily: LOGO_FONT, fontWeight: 900 }}
        fontSize="32"
      >
        <tspan fill="#222222">Smart</tspan>
        <tspan fill="#933a12"> Rental</tspan>
      </text>
    </svg>
  );
}
