import { useEffect, useId, useRef } from 'react';
import ChevronIcon from './ChevronIcon';
import type { PreviewIdentity } from './authPreview';

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  identity: PreviewIdentity;
};

const PREVIEW_ITEMS = [
  { id: 'reports', label: 'My reports' },
  { id: 'settings', label: 'Account settings' },
  { id: 'logout', label: 'Log out' },
] as const;

/**
 * Profile menu for development-only authenticated Header preview.
 * Items stay disabled — no fake session actions.
 */
export default function ProfileDropdown({ open, onOpenChange, identity }: Props) {
  const menuId = useId();
  const wrap = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    const onPointer = (event: MouseEvent) => {
      if (!wrap.current?.contains(event.target as Node)) onOpenChange(false);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onOpenChange(false);
        trigger.current?.focus();
      }
    };
    document.addEventListener('mousedown', onPointer);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onPointer);
      document.removeEventListener('keydown', onKey);
    };
  }, [open, onOpenChange]);

  return (
    <div className="header-menu header-menu--profile" ref={wrap}>
      <button
        ref={trigger}
        type="button"
        className="header-profile-trigger"
        aria-expanded={open}
        aria-haspopup="menu"
        aria-controls={menuId}
        aria-label={`Account menu, ${identity.displayName}`}
        onClick={() => onOpenChange(!open)}
      >
        <span className="header-avatar" aria-hidden="true">
          {identity.initials}
        </span>
        <ChevronIcon open={open} />
      </button>
      {open && (
        <div id={menuId} className="header-dropdown header-dropdown--profile" role="menu">
          <div className="header-profile-identity">
            <span className="header-avatar" aria-hidden="true">
              {identity.initials}
            </span>
            <div>
              <p className="header-profile-name">{identity.displayName}</p>
              <p className="header-profile-hint">Preview only · not a real session</p>
            </div>
          </div>
          <ul className="header-profile-list">
            {PREVIEW_ITEMS.map(item => (
              <li key={item.id}>
                <button type="button" role="menuitem" className="header-profile-item" disabled>
                  {item.label}
                  <span className="header-product-status">Unavailable</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
