import type { ReactNode } from "react";

interface ChartCardProps {
  eyebrow?: string;
  title: string;
  description: string;
  children: ReactNode;
  className?: string;
}

export function ChartCard({
  eyebrow,
  title,
  description,
  children,
  className = "",
}: ChartCardProps) {
  return (
    <section className={`panel chart-card ${className}`}>
      <header className="panel-heading">
        <div>
          {eyebrow && <span className="eyebrow">{eyebrow}</span>}
          <h2>{title}</h2>
          <p>{description}</p>
        </div>
        <span className="panel-mark" aria-hidden="true">
          ↗
        </span>
      </header>
      {children}
    </section>
  );
}
