import { ArrowDown, ArrowUp, Equal } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Property } from '@/types';

const CONFIG = {
  below_market: {
    icon: ArrowDown,
    text: (diff: number) => `Rẻ hơn thị trường ~${Math.abs(diff)}%`,
    cls: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  },
  above_market: {
    icon: ArrowUp,
    text: (diff: number) => `Cao hơn thị trường ~${diff}%`,
    cls: 'bg-orange-50 text-orange-700 border-orange-200',
  },
  fair: {
    icon: Equal,
    text: () => 'Giá phù hợp thị trường',
    cls: 'bg-gray-50 text-gray-600 border-gray-200',
  },
} as const;

interface MarketComparisonBadgeProps {
  marketComparison: NonNullable<Property['marketComparison']>;
  className?: string;
}

export function MarketComparisonBadge({ marketComparison, className }: MarketComparisonBadgeProps) {
  const { label, diffPercent } = marketComparison;
  const { icon: Icon, text, cls } = CONFIG[label];

  return (
    <span className={cn('inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full border', cls, className)}>
      <Icon className="size-3" />
      {text(diffPercent)}
    </span>
  );
}
