import { useEffect, useId, useRef } from 'react';

export type AccountEntry = 'login' | 'signup';

type Props = {
  entry: AccountEntry | null;
  onClose: () => void;
};

/**
 * Honest preview dialog — no password fields, no fake auth success.
 */
export default function AccountAccessDialog({ entry, onClose }: Props) {
  const dialog = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const open = entry !== null;
  const title = entry === 'signup' ? 'Sign up' : 'Log in';

  useEffect(() => {
    const node = dialog.current;
    if (!node) return;
    if (open && !node.open) node.showModal();
    if (!open && node.open) node.close();
  }, [open]);

  return (
    <dialog
      ref={dialog}
      className="account-access-dialog"
      aria-labelledby={open ? titleId : undefined}
      onCancel={event => {
        event.preventDefault();
        onClose();
      }}
      onClick={event => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      {open && (
        <div className="account-access-panel">
          <button type="button" className="dialog-close" aria-label="Close dialog" onClick={onClose}>
            ×
          </button>
          <p className="account-access-kicker">Integrito / Account</p>
          <h2 id={titleId}>{title}</h2>
          <p>Account access is not available in this preview yet.</p>
          <p className="account-access-note">You can continue checking text without an account.</p>
          <button type="button" className="account-access-dismiss" onClick={onClose}>
            Continue without an account
          </button>
        </div>
      )}
    </dialog>
  );
}
