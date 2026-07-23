"use client";

import Link from "next/link";

type BackLinkProps = {
  label: string;
  className?: string;
} & (
  | { href: string; onClick?: never }
  | { href?: never; onClick: () => void }
);

const classNames =
  "group flex w-max items-center gap-2.5 rounded-lg py-1 text-[14px] font-medium text-muted outline-none transition-colors hover:text-ink focus-visible:ring-2 focus-visible:ring-primary/70 focus-visible:ring-offset-4 focus-visible:ring-offset-[#0B0D13]";

function Arrow() {
  return (
    <svg
      aria-hidden="true"
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="transition-transform duration-300 ease-spring group-hover:-translate-x-0.5"
    >
      <path d="M15 18l-6-6 6-6" />
    </svg>
  );
}

export function BackLink({ label, className = "", ...props }: BackLinkProps) {
  const content = (
    <>
      <Arrow />
      {label}
    </>
  );
  const classes = `${classNames} ${className}`;

  if (props.href) {
    return (
      <Link href={props.href} className={classes}>
        {content}
      </Link>
    );
  }

  return (
    <button type="button" onClick={props.onClick} className={classes}>
      {content}
    </button>
  );
}
