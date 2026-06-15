import { cn } from "@/lib/utils";

interface PriceDisplayProps {
  amount: number;
  period?: "month" | "night" | "once";
  size?: "sm" | "md" | "lg";
  highlight?: boolean;
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
  lg: "text-xl",
};

export function PriceDisplay({
  amount,
  period = "month",
  size = "md",
  highlight = false,
  className,
}: PriceDisplayProps) {
  const formatted = new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(amount);

  const [whole, suffix] = formatted.split(/\s+([\s\S]*)/);

  return (
    <span className={cn("font-bold", sizeMap[size], highlight ? "text-[#1a2e4a]" : "text-ink-black", className)}>
      {whole}
      {suffix && (
        <span className="text-ash-gray font-normal ml-0.5 text-sm">
          {suffix}
        </span>
      )}
    </span>
  );
}
