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
        "inline-flex items-center gap-1 rounded-md transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-moss-500 focus-visible:ring-offset-1 cursor-pointer",
        size === "sm" ? "p-1" : "p-1.5",
        starred
          ? "text-moss-500 hover:text-moss-600"
          : "text-stone-400 hover:text-stone-500"
      )}
    >
      <Star
        size={iconSize}
        className={cn(
          "transition-all duration-200",
          starred && "fill-moss-500"
        )}
      />
      {count !== undefined && count > 0 && (
        <span
          className={cn(
            "font-body tabular-nums",
            size === "sm" ? "text-xs" : "text-sm",
            starred ? "text-moss-600" : "text-stone-400"
          )}
        >
          {count}
        </span>
      )}
    </button>
  );
}
