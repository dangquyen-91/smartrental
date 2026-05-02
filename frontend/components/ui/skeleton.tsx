import { cn } from "@/lib/utils";

export function Skeleton({ className }: { className?: string }) {
  return (
    <div className={cn("animate-pulse rounded-md bg-soft-cloud", className)} />
  );
}

export function PropertyCardSkeleton() {
  return (
    <div className="flex flex-col gap-3">
      <Skeleton className="aspect-[4/3] w-full rounded-[14px]" />
      <div className="flex flex-col gap-2">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3.5 w-1/2" />
        <Skeleton className="h-3.5 w-1/3" />
        <Skeleton className="h-4 w-2/5 mt-1" />
      </div>
    </div>
  );
}

export function ContractCardSkeleton() {
  return (
    <div className="animate-pulse flex gap-4 border border-[#dddddd] rounded-card p-4 sm:p-5 bg-white">
      <div className="size-25 sm:size-30 rounded-[10px] bg-[#ebebeb] shrink-0" />
      <div className="flex-1 space-y-2.5">
        <div className="flex justify-between items-start gap-2">
          <div className="h-4 bg-[#ebebeb] rounded w-2/3" />
          <div className="h-5 w-20 bg-[#ebebeb] rounded-full shrink-0" />
        </div>
        <div className="h-3.5 bg-[#ebebeb] rounded w-1/2" />
        <div className="h-3.5 bg-[#ebebeb] rounded w-3/4" />
        <div className="flex gap-2 mt-1">
          <div className="h-6 w-24 bg-[#ebebeb] rounded-lg" />
          <div className="h-6 w-24 bg-[#ebebeb] rounded-lg" />
        </div>
        <div className="flex justify-end pt-3 border-t border-[#ebebeb] mt-auto">
          <div className="h-8 bg-[#ebebeb] rounded-lg w-28" />
        </div>
      </div>
    </div>
  );
}

export function ListItemSkeleton() {
  return (
    <div className="flex items-center gap-4 p-4 border-b border-hairline-gray">
      <Skeleton className="size-16 rounded-[8px] shrink-0" />
      <div className="flex flex-col gap-2 flex-1">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3.5 w-1/2" />
        <Skeleton className="h-3.5 w-1/3" />
      </div>
      <Skeleton className="h-8 w-20 rounded-full shrink-0" />
    </div>
  );
}
