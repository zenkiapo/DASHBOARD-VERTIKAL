import { useRef } from "react";
import { ChevronDown, Menu, MoreHorizontal, type LucideIcon } from "lucide-react";

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
        <a
          aria-label={action.label}
          href={action.href}
          key={action.label}
          onClick={closeMenus}
          title={action.label}
        >
          {Icon && <Icon aria-hidden="true" className="responsive-action-menu__icon" size={16} />}
          <span className="responsive-action-menu__label">{action.label}</span>
        </a>
      );
    }

    return (
      <button
        aria-label={action.label}
        key={action.label}
        onClick={() => {
          action.onSelect();
          closeMenus();
        }}
        title={action.label}
        type="button"
      >
        {Icon && <Icon aria-hidden="true" className="responsive-action-menu__icon" size={16} />}
        <span className="responsive-action-menu__label">{action.label}</span>
      </button>
    );
  };

  return (
    <div className="responsive-action-menu">
      <nav className="responsive-action-menu__desktop" aria-label={ariaLabel}>
        {actions.map(renderAction)}
      </nav>
      {secondaryActions.length > 0 && (
        <details className="responsive-action-menu__more" ref={moreMenuRef}>
          <summary aria-label="Lainnya" title="Lainnya">
            <span className="responsive-action-menu__label">Lainnya</span>
            <MoreHorizontal aria-hidden="true" className="responsive-action-menu__more-icon" size={18} />
            <ChevronDown aria-hidden="true" className="responsive-action-menu__more-chevron" size={15} />
          </summary>
          <nav className="responsive-action-menu__panel" aria-label={`${ariaLabel} lainnya`}>
            {secondaryActions.map(renderAction)}
          </nav>
        </details>
      )}
      <details className="responsive-action-menu__mobile" ref={mobileMenuRef}>
        <summary aria-label={`Buka ${ariaLabel}`}>
          <Menu aria-hidden="true" size={18} />
          <span className="responsive-action-menu__label">Menu</span>
        </summary>
        <nav className="responsive-action-menu__panel" aria-label={ariaLabel}>
          {[...actions, ...secondaryActions].map(renderAction)}
        </nav>
      </details>
    </div>
  );
}
