"use client";

import Link from "next/link";
import type { ReactNode } from "react";

type Variant = "primary" | "violet" | "ghost";

const SURFACE: Record<Variant, string> = {
  primary: "text-white",
  violet: "text-white",
  ghost: "border border-line bg-[rgba(20,22,29,0.5)] text-ink hover:border-white/25",
};

const GRADIENT: Record<Variant, string | undefined> = {
  primary: "linear-gradient(135deg,#3B82F6,#2563EB)",
  violet: "linear-gradient(135deg,#8B5CF6,#6D28D9)",
  ghost: undefined,
};

const GLOW: Record<Variant, string | undefined> = {
  primary: "0 10px 34px -6px rgba(37,99,235,0.55)",
  violet: "0 10px 34px -6px rgba(124,92,255,0.5)",
  ghost: undefined,
};

// Island pill CTA with the "button-in-button" trailing icon: the icon lives in
// its own nested circle that translates + scales on hover, while the whole pill
// presses in on :active. One component so every primary action feels identical.
type Props = {
  children: ReactNode;
  href?: string;
  onClick?: () => void;
  type?: "button" | "submit";
  variant?: Variant;
  icon?: ReactNode;
  disabled?: boolean;
  className?: string;
  "aria-label"?: string;
};

export function Cta({
  children,
  href,
  onClick,
  type = "button",
  variant = "primary",
  icon,
  disabled,
  className = "",
  ...rest
}: Props) {
  const inner = (
    <>
      <span>{children}</span>
      {icon && (
        <span
          aria-hidden
          className={`flex h-8 w-8 items-center justify-center rounded-full transition-transform duration-500 ease-spring group-hover:translate-x-0.5 group-hover:-translate-y-px group-hover:scale-105 ${
            variant === "ghost" ? "bg-white/10" : "bg-white/20"
          }`}
        >
          {icon}
        </span>
      )}
    </>
  );

  const cls = `group inline-flex cursor-pointer items-center gap-3 rounded-full ${
    icon ? "py-2 pl-6 pr-2" : "px-7 py-3.5"
  } text-[15px] font-semibold transition-all duration-500 ease-spring hover:brightness-[1.06] active:scale-[0.97] disabled:pointer-events-none disabled:opacity-40 ${SURFACE[variant]} ${className}`;

  const style = {
    backgroundImage: GRADIENT[variant],
    boxShadow: GLOW[variant],
  };

  if (href && !disabled) {
    return (
      <Link href={href} className={cls} style={style} {...rest}>
        {inner}
      </Link>
    );
  }
  return (
    <button type={type} onClick={onClick} disabled={disabled} className={cls} style={style} {...rest}>
      {inner}
    </button>
  );
}
