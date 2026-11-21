import { useRef } from "react";
import { Menu } from "lucide-react";

type ResponsiveAction =
  | { label: string; href: string; onSelect?: never }
  | { label: string; onSelect: () => void; href?: never };

interface ResponsiveActionMenuProps {
  actions: ResponsiveAction[];
  ariaLabel: string;
}

export function ResponsiveActionMenu({
  actions,
  ariaLabel,
}: ResponsiveActionMenuProps) {
  const mobileMenuRef = useRef<HTMLDetailsElement>(null);
  const closeMobileMenu = () => {
    if (mobileMenuRef.current) mobileMenuRef.current.open = false;
  };
  const renderAction = (action: ResponsiveAction) => {
    if (action.href !== undefined) {
      return (
        <a href={action.href} key={action.label} onClick={closeMobileMenu}>
          {action.label}
        </a>
      );
    }

    return (
      <button
        key={action.label}
        onClick={() => {
          action.onSelect();
          closeMobileMenu();
        }}
        type="button"
      >
        {action.label}
      </button>
    );
  };

  return (
    <>
      <nav className="responsive-action-menu__desktop" aria-label={ariaLabel}>
        {actions.map(renderAction)}
      </nav>
      <details className="responsive-action-menu__mobile" ref={mobileMenuRef}>
        <summary aria-label={`Buka ${ariaLabel}`}>
          <Menu aria-hidden="true" size={18} />
          <span>Menu</span>
        </summary>
        <nav className="responsive-action-menu__panel" aria-label={ariaLabel}>
          {actions.map(renderAction)}
        </nav>
      </details>
    </>
  );
}
