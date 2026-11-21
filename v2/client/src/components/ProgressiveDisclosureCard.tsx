import type { ReactNode } from "react";
import { useProgressiveDisclosure } from "../hooks/useProgressiveDisclosure";

interface ProgressiveDisclosureCardProps {
  label: string;
  summary: ReactNode;
  details: ReactNode;
  className?: string;
}

export function ProgressiveDisclosureCard({
  label,
  summary,
  details,
  className = "",
}: ProgressiveDisclosureCardProps) {
  const { ref, isTouchDevice, isInView } =
    useProgressiveDisclosure<HTMLElement>();

  return (
    <article
      aria-label={label}
      className={`progressive-card ${className}`}
      data-revealed={isInView}
      data-touch={isTouchDevice}
      ref={ref}
      tabIndex={0}
    >
      <div className="progressive-card__summary">{summary}</div>
      <div className="progressive-card__details">{details}</div>
    </article>
  );
}
