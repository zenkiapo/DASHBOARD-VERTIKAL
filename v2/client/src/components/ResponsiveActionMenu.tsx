import { useRef } from "react";
import { ChevronDown, Menu, type LucideIcon } from "lucide-react";

type ResponsiveAction = (
  | { label: string; href: string; onSelect?: never }
  | { label: string; onSelect: () => void; href?: never }
) & { icon?: LucideIcon };

interface ResponsiveActionMenuProps {
  actions: ResponsiveAction[];
  secondaryActions?: ResponsiveAction[];
  ariaLabel: string;
}

export function ResponsiveActionMenu({
  actions,
  secondaryActions = [],
  ariaLabel,
}: ResponsiveActionMenuProps) {
  const mobileMenuRef = useRef<HTMLDetailsElement>(null);
  const moreMenuRef = useRef<HTMLDetailsElement>(null);
  const closeMenus = () => {
    if (mobileMenuRef.current) mobileMenuRef.current.open = false;
    if (moreMenuRef.current) moreMenuRef.current.open = false;
  };
  const renderAction = (action: ResponsiveAction) => {
    const Icon = action.icon;
    if (action.href !== undefined) {
      return (
        <a href={action.href} key={action.label} onClick={closeMenus}>
          {Icon && <Icon aria-hidden="true" className="responsive-action-menu__icon" size={16} />}
          <span>{action.label}</span>
        </a>
      );
    }

    return (
      <button
        key={action.label}
        onClick={() => {
          action.onSelect();
          closeMenus();
        }}
        type="button"
      >
        {Icon && <Icon aria-hidden="true" className="responsive-action-menu__icon" size={16} />}
        <span>{action.label}</span>
      </button>
    );
  };

  return (
    <>
      <nav className="responsive-action-menu__desktop" aria-label={ariaLabel}>
        {actions.map(renderAction)}
      </nav>
      {secondaryActions.length > 0 && (
        <details className="responsive-action-menu__more" ref={moreMenuRef}>
          <summary>
            <span>Lainnya</span>
            <ChevronDown aria-hidden="true" size={15} />
          </summary>
          <nav className="responsive-action-menu__panel" aria-label={`${ariaLabel} lainnya`}>
            {secondaryActions.map(renderAction)}
          </nav>
        </details>
      )}
      <details className="responsive-action-menu__mobile" ref={mobileMenuRef}>
        <summary aria-label={`Buka ${ariaLabel}`}>
          <Menu aria-hidden="true" size={18} />
          <span>Menu</span>
        </summary>
        <nav className="responsive-action-menu__panel" aria-label={ariaLabel}>
          {[...actions, ...secondaryActions].map(renderAction)}
        </nav>
      </details>
    </>
  );
}
