"use client";

import { useState } from "react";
import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

// ─── Display-only: show filled/half/empty stars ───────────────────────────────

interface StarDisplayProps {
  rating: number;         // 0–5, supports decimals
  size?: "sm" | "md" | "lg";
  showNumber?: boolean;
  className?: string;
}

const SIZES = { sm: "size-3.5", md: "size-4", lg: "size-5" };

export function StarDisplay({ rating, size = "md", showNumber = false, className }: StarDisplayProps) {
  const sizeClass = SIZES[size];

  return (
    <span className={cn("inline-flex items-center gap-0.5", className)}>
      {[1, 2, 3, 4, 5].map((star) => {
        const fill    = Math.min(1, Math.max(0, rating - (star - 1)));
        const percent = Math.round(fill * 100);
        return (
          <span key={star} className="relative inline-flex">
            <Star className={cn(sizeClass, "text-hairline-gray fill-hairline-gray")} />
            {percent > 0 && (
              <span
                className="absolute inset-0 overflow-hidden"
                style={{ width: `${percent}%` }}
              >
                <Star className={cn(sizeClass, "text-amber-400 fill-amber-400")} />
              </span>
            )}
          </span>
        );
      })}
      {showNumber && (
        <span className="ml-1 text-sm font-semibold text-ink-black">
          {rating.toFixed(1)}
        </span>
      )}
    </span>
  );
}

// ─── Interactive: pick 1–5 stars ─────────────────────────────────────────────
//
// Fix giật:
//  - scale đặt trên <Star> icon (không phải button) → hit-area button không đổi
//    → tránh vòng lặp mouseLeave ↔ mouseEnter khi button scale
//  - label luôn chiếm chỗ (opacity-0 thay vì unmount) → không shift layout

interface StarInputProps {
  value: number;          // 0 = none selected
  onChange: (val: number) => void;
  size?: "sm" | "md" | "lg";
  className?: string;
  disabled?: boolean;
}

const STAR_LABELS = ["", "Rất tệ", "Tệ", "Bình thường", "Tốt", "Tuyệt vời"];
const INPUT_SIZES = { sm: "size-5", md: "size-6", lg: "size-8" };

export function StarInput({ value, onChange, size = "lg", className, disabled }: StarInputProps) {
  const [hover, setHover] = useState(0);
  const sizeClass = INPUT_SIZES[size];
  const current   = hover || value;

  return (
    <div className={cn("flex flex-col items-center gap-2", className)}>
      {/* Stars row — buttons có fixed size, scale chỉ trên icon bên trong */}
      <div
        className="flex gap-1"
        onMouseLeave={() => !disabled && setHover(0)}
      >
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            disabled={disabled}
            onClick={() => !disabled && onChange(star)}
            onMouseEnter={() => !disabled && setHover(star)}
            aria-label={`${star} sao — ${STAR_LABELS[star]}`}
            // Không đặt hover:scale trên button — hit-area phải ổn định
            className={cn(
              "p-1 rounded focus:outline-none",
              disabled ? "cursor-default" : "cursor-pointer",
            )}
          >
            <Star
              className={cn(
                sizeClass,
                // Scale chỉ trên icon, không ảnh hưởng layout button
                "transition-all duration-100",
                star <= current
                  ? "text-amber-400 fill-amber-400 scale-110"
                  : "text-[#dddddd] fill-[#dddddd] scale-100",
                !disabled && "group-hover:scale-110",
              )}
            />
          </button>
        ))}
      </div>

      {/* Label — luôn chiếm chỗ, chỉ ẩn bằng opacity → không shift chiều cao */}
      <span
        className={cn(
          "text-sm font-medium text-ash-gray transition-opacity duration-100 h-5 flex items-center",
          current > 0 ? "opacity-100" : "opacity-0 select-none",
        )}
        aria-live="polite"
      >
        {STAR_LABELS[current] || STAR_LABELS[1]}
      </span>
    </div>
  );
}
