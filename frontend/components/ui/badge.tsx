import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium whitespace-nowrap",
  {
    variants: {
      variant: {
        // Property status
        available: "bg-green-100 text-green-700",
        rented: "bg-blue-100 text-blue-700",
        maintenance: "bg-yellow-100 text-yellow-700",
        // Booking status
        pending: "bg-yellow-100 text-yellow-700",
        confirmed: "bg-blue-100 text-blue-700",
        active: "bg-green-100 text-green-700",
        completed: "bg-stone-gray/20 text-ash-gray",
        cancelled: "bg-red-100 text-red-600",
        rejected: "bg-red-100 text-red-600",
        // Payment status
        paid: "bg-green-100 text-green-700",
        unpaid: "bg-orange-100 text-orange-700",
        refunded: "bg-purple-100 text-purple-700",
        // Contract status
        draft: "bg-stone-gray/20 text-ash-gray",
        awaiting_signatures: "bg-yellow-100 text-yellow-700",
        signed: "bg-green-100 text-green-700",
        // Service order status
        in_progress: "bg-blue-100 text-blue-700",
        // Generic
        default: "bg-soft-cloud text-ash-gray",
        featured: "bg-ink-black text-white",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

type BadgeVariant = NonNullable<VariantProps<typeof badgeVariants>["variant"]>;

interface BadgeProps {
  variant?: BadgeVariant;
  children: React.ReactNode;
  className?: string;
}

export function Badge({ variant = "default", children, className }: BadgeProps) {
  return (
    <span className={cn(badgeVariants({ variant }), className)}>
      {children}
    </span>
  );
}

export { badgeVariants };
