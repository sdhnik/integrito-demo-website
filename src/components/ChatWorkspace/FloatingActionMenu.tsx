import { useLayoutEffect, useRef, type ReactNode, type RefObject } from 'react';
import { createPortal } from 'react-dom';

type Props = {
  anchor: RefObject<HTMLDivElement>;
  id: string;
  onClose: () => void;
  children: ReactNode;
};

/** Portal escapes the result's clipping and the crossfade stacking context. */
export default function FloatingActionMenu({ anchor, id, onClose, children }: Props) {
  const menu = useRef<HTMLDivElement>(null);
  const close = useRef(onClose);
  close.current = onClose;
  useLayoutEffect(() => {
    const element = menu.current;
    const trigger = anchor.current?.querySelector<HTMLButtonElement>('button');
    if (!element || !trigger) return;
    const dismiss = (restore = false) => {
      if (restore) trigger.focus({ preventScroll: true });
      close.current();
    };
    const position = () => {
      const rect = trigger.getBoundingClientRect();
      if (!trigger.getClientRects().length) { dismiss(); return; }
      const vv = window.visualViewport;
      const style = getComputedStyle(element);
      const left = (vv?.offsetLeft ?? 0) + Math.max(8, parseFloat(style.getPropertyValue('--menu-safe-left')) || 0);
      const top = (vv?.offsetTop ?? 0) + Math.max(8, parseFloat(style.getPropertyValue('--menu-safe-top')) || 0);
      const right = (vv?.offsetLeft ?? 0) + (vv?.width ?? innerWidth) - Math.max(8, parseFloat(style.getPropertyValue('--menu-safe-right')) || 0);
      const bottom = (vv?.offsetTop ?? 0) + (vv?.height ?? innerHeight) - Math.max(8, parseFloat(style.getPropertyValue('--menu-safe-bottom')) || 0);
      element.style.width = `${Math.min(240, right - left)}px`;
      const above = Math.max(0, rect.top - top - 6);
      const below = Math.max(0, bottom - rect.bottom - 6);
      const upward = below < element.scrollHeight && above > below;
      element.style.maxHeight = `${Math.max(1, upward ? above : below)}px`;
      const height = element.getBoundingClientRect().height;
      element.style.left = `${Math.max(left, Math.min(rect.left, right - element.offsetWidth))}px`;
      element.style.top = `${Math.max(top, Math.min(upward ? rect.top - height - 6 : rect.bottom + 6, bottom - height))}px`;
    };
    const items = () => [...element.querySelectorAll<HTMLButtonElement>('[role="menuitem"]:not(:disabled)')];
    const key = (event: KeyboardEvent) => {
      if (event.key === 'Escape') { event.preventDefault(); dismiss(true); return; }
      if (event.key === 'Tab') { dismiss(true); return; }
      if (!['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) return;
      event.preventDefault();
      const list = items();
      const i = list.indexOf(document.activeElement as HTMLButtonElement);
      const next = event.key === 'Home' ? 0 : event.key === 'End' ? list.length - 1 : (i + (event.key === 'ArrowUp' ? -1 : 1) + list.length) % list.length;
      list[next]?.focus();
    };
    const pointer = (event: PointerEvent) => {
      if (!element.contains(event.target as Node) && !anchor.current?.contains(event.target as Node)) dismiss(element.contains(document.activeElement));
    };
    position();
    items()[0]?.focus({ preventScroll: true });
    const observer = new ResizeObserver(position);
    observer.observe(element);
    const page = document.querySelector('.page');
    const navigation = new MutationObserver(() => {
      if (page?.getAttribute('data-transition')) dismiss();
    });
    if (page) navigation.observe(page, { attributes: true, attributeFilter: ['data-transition'] });
    document.addEventListener('pointerdown', pointer);
    document.addEventListener('keydown', key);
    window.addEventListener('resize', position);
    window.addEventListener('scroll', position, true);
    window.visualViewport?.addEventListener('resize', position);
    window.visualViewport?.addEventListener('scroll', position);
    return () => {
      observer.disconnect(); navigation.disconnect();
      document.removeEventListener('pointerdown', pointer);
      document.removeEventListener('keydown', key);
      window.removeEventListener('resize', position);
      window.removeEventListener('scroll', position, true);
      window.visualViewport?.removeEventListener('resize', position);
      window.visualViewport?.removeEventListener('scroll', position);
    };
  }, [anchor]);
  return createPortal(
    <div ref={menu} id={id} className="result-action-menu" role="menu" aria-label="Result actions"
      onClickCapture={event => {
        if ((event.target as HTMLElement).closest('button:not(:disabled)')) {
          anchor.current?.querySelector('button')?.focus({ preventScroll: true });
        }
      }}>{children}</div>, document.body,
  );
}
