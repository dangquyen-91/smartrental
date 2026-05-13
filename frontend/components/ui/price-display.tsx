import { cn } from "@/lib/utils";

interface PriceDisplayProps {
  amount: number;
  period?: "month" | "night" | "once";
  size?: "sm" | "md" | "lg";
  className?: string;
}

const periodLabel: Record<string, string> = {
  month: "/ tháng",
  night: "/ đêm",
  once: "",
};

const sizeMap = {
  sm: "text-sm",
  md: "text-base",
  lg: "text-lg",
};

export function PriceDisplay({
  amount,
  period = "month",
  size = "md",
  className,
}: PriceDisplayProps) {
  const formatted = new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(amount);

  return (
    <span className={cn("font-medium text-ink-black", sizeMap[size], className)}>
      {formatted}
      {period !== "once" && (
        <span className="text-ash-gray font-normal ml-0.5 text-sm">
          {periodLabel[period]}
        </span>
      )}
    </span>
  );
}
