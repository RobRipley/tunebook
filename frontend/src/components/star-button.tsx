import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

type StarButtonProps = {
  starred: boolean;
  count?: number;
  onToggle: () => void;
  size?: "sm" | "md";
};

export function StarButton({ starred, count, onToggle, size = "md" }: StarButtonProps) {
  const iconSize = size === "sm" ? 14 : 18;

  return (
    <button
      type="button"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        onToggle();
      }}
      aria-label={starred ? "Unstar this tune" : "Star this tune"}
      className={cn(
        "inline-flex items-center gap-1 rounded-md transition-all duration-200 motion-reduce:transition-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-moss-500 focus-visible:ring-offset-1 cursor-pointer",
        size === "sm" ? "p-1" : "p-1.5",
        starred
          ? "text-moss-500 hover:text-moss-600 dark:text-moss-400 dark:hover:text-moss-300"
          : "text-stone-400 hover:text-stone-500 dark:text-stone-500 dark:hover:text-stone-400"
      )}
    >
      <Star
        size={iconSize}
        className={cn(
          "transition-all duration-200 motion-reduce:transition-none",
          starred && "fill-moss-500 dark:fill-moss-400"
        )}
      />
      {count !== undefined && count > 0 && (
        <span
          className={cn(
            "font-body tabular-nums",
            size === "sm" ? "text-xs" : "text-sm",
            starred ? "text-moss-600 dark:text-moss-400" : "text-stone-400 dark:text-stone-500"
          )}
        >
          {count}
        </span>
      )}
    </button>
  );
}
