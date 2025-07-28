"use client";
import { cn } from "@/lib/utils";
import { Slot } from "@radix-ui/react-slot";
import { type VariantProps, cva } from "class-variance-authority";
import { Loader2 } from "lucide-react";
import * as React from "react";
import { Tooltip } from "./tooltip";

const buttonVariants = cva(
  [
    "inline-flex items-center justify-center gap-1.5 whitespace-nowrap text-sm font-medium",
    "disabled:pointer-events-none disabled:opacity-50",
    "[&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 [&_svg]:shrink-0",
    "cursor-pointer relative select-none transform-gpu",
    "focus:!outline-none focus:!ring-0 active:!outline-none active:!ring-0",
    "after:pointer-events-none after:absolute after:-inset-[3px] after:border after:opacity-0 after:ring-2 after:ring-brand/20 after:transition-opacity focus-visible:after:opacity-100 active:after:opacity-0 after:border-brand after:rounded-[calc(var(--button-radius)+3px)]",
    "before:pointer-events-none before:absolute before:inset-0 before:z-[1] before:opacity-0 before:transition-opacity before:bg-gradient-to-b before:from-white/[0.12] before:rounded-[var(--button-radius)]",
  ],
  {
    variants: {
      variant: {
        default: [
          "bg-primary text-primary-foreground hover:bg-[var(--primary-hover)] active:bg-primary-active",
        ],
        destructive: [
          "bg-destructive text-destructive-foreground",
          "hover:before:opacity-100 active:before:opacity-30",
        ],
        outline: [
          "border border-input bg-background shadow-xs",
          "hover:bg-secondary hover:text-secondary-foreground",
          "active:bg-secondary-active",
        ],
        secondary: [
          "bg-secondary text-secondary-foreground",
          "hover:bg-secondary-hover active:bg-secondary-active",
        ],
        ghost: [
          "bg-transparent",
          "hover:bg-secondary hover:text-accent-foreground",
          "active:bg-secondary-active",
        ],
        link: [
          "text-primary bg-transparent p-0 h-auto",
          "underline-offset-4 hover:underline",
        ],
        brand: [
          "bg-brand text-brand-foreground",
          "hover:before:opacity-100 active:bg-brand-active",
          "shadow-shadow-accent",
        ],
      },
      size: {
        default: ["h-7.5 text-[14.01px] rounded-md px-2.5"],
        sm: ["h-6.5 text-[13.01px] rounded-md px-2"],
        lg: ["px-4.5 h-10 py-3 text-[15.01px] rounded-md"],
        icon: ["size-9 p-0 rounded-md"],
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

const buttonActiveVariants = cva("", {
  variants: {
    variant: {
      default: ["bg-primary/90 text-background", "before:opacity-0"],
      destructive: [
        "bg-destructive/90 text-destructive-foreground",
        "before:opacity-0",
      ],
      outline: [
        "bg-secondary-active text-secondary-foreground",
        "border border-input",
      ],
      secondary: ["bg-secondary-active text-secondary-foreground"],
      ghost: ["bg-secondary-active text-accent-foreground"],
      link: ["text-primary underline"],
      brand: ["bg-brand-active text-brand-foreground", "before:opacity-0"],
    },
  },
  defaultVariants: {
    variant: "default",
  },
});

const radiusMap = {
  "rounded-none": "0px",
  "rounded-sm": "2px",
  rounded: "4px",
  "rounded-md": "6px",
  "rounded-lg": "8px",
  "rounded-xl": "12px",
  "rounded-2xl": "16px",
  "rounded-3xl": "24px",
  "rounded-full": "9999px",
} as const;

interface ButtonProps
  extends React.ComponentProps<"button">,
    VariantProps<typeof buttonVariants> {
  active?: boolean;
  activeClassName?: string;
  asChild?: boolean;
  tooltip?: string | React.ReactNode;
  tooltipShortcut?: string[];
  loading?: boolean;
  loadingText?: string;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant,
      size,
      active = false,
      activeClassName,
      asChild = false,
      tooltip,
      tooltipShortcut,
      loading = false,
      loadingText,
      children,
      disabled,
      ...props
    },
    ref,
  ) => {
    const Comp = asChild ? Slot : "button";
    const allClasses = cn(buttonVariants({ variant, size }), className);

    const getButtonRadius = (classes: string) => {
      const radiusClasses = Object.keys(radiusMap) as Array<
        keyof typeof radiusMap
      >;
      const foundRadius = radiusClasses.find((radius) =>
        classes.includes(radius),
      );
      return foundRadius ? radiusMap[foundRadius] : radiusMap["rounded-md"];
    };

    const buttonRadius = getButtonRadius(allClasses);
    const isDisabled = loading || disabled;
    const buttonContent = loading ? (
      <>
        <Loader2 className="size-4 animate-spin" />
        {loadingText || children}
      </>
    ) : (
      children
    );

    const buttonElement = (
      <Comp
        ref={ref}
        data-slot="button"
        data-state={active ? "active" : "inactive"}
        data-loading={loading ? "true" : "false"}
        disabled={isDisabled}
        style={
          {
            "--button-radius": buttonRadius,
          } as React.CSSProperties
        }
        className={cn(
          buttonVariants({ variant, size }),
          active && buttonActiveVariants({ variant }),
          active && activeClassName,
          className,
        )}
        {...props}
      >
        {buttonContent}
      </Comp>
    );

    if (tooltip || tooltipShortcut) {
      return (
        <Tooltip title={tooltip} shortcut={tooltipShortcut}>
          {buttonElement}
        </Tooltip>
      );
    }

    return buttonElement;
  },
);

Button.displayName = "Button";

export { Button, buttonVariants, type ButtonProps };
