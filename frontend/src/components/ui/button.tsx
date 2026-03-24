import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium font-body transition-colors motion-reduce:transition-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-moss-500 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 cursor-pointer",
  {
    variants: {
      variant: {
        default:
          "bg-moss-600 text-white hover:bg-moss-700 active:bg-moss-800 dark:bg-moss-700 dark:hover:bg-moss-600 dark:active:bg-moss-500",
        secondary:
          "bg-parchment-200 text-stone-800 hover:bg-parchment-300 active:bg-parchment-400 dark:bg-stone-800 dark:text-parchment-100 dark:hover:bg-stone-700",
        outline:
          "border border-stone-300 dark:border-stone-600 bg-transparent text-stone-700 dark:text-stone-300 hover:bg-parchment-100 dark:hover:bg-stone-800 active:bg-parchment-200 dark:active:bg-stone-700",
        ghost:
          "text-stone-700 dark:text-stone-300 hover:bg-parchment-100 dark:hover:bg-stone-800 active:bg-parchment-200 dark:active:bg-stone-700",
        link: "text-moss-600 dark:text-moss-400 underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8 text-base",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
