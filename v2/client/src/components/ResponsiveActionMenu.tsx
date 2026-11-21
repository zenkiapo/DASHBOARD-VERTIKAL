import { Menu } from "lucide-react";

interface ResponsiveActionMenuProps {
  actions: Array<{ label: string; onSelect: () => void }>;
  ariaLabel: string;
}

export function ResponsiveActionMenu({
  actions,
  ariaLabel,
}: ResponsiveActionMenuProps) {
  return (
    <>
      <nav className="responsive-action-menu__desktop" aria-label={ariaLabel}>
        {actions.map((action) => (
          <button key={action.label} onClick={action.onSelect} type="button">
            {action.label}
          </button>
        ))}
      </nav>
      <details className="responsive-action-menu__mobile">
        <summary aria-label={`Buka ${ariaLabel}`}>
          <Menu aria-hidden="true" size={18} />
          <span>Menu</span>
        </summary>
        <nav className="responsive-action-menu__panel" aria-label={ariaLabel}>
          {actions.map((action) => (
            <button key={action.label} onClick={action.onSelect} type="button">
              {action.label}
            </button>
          ))}
        </nav>
      </details>
    </>
  );
}
