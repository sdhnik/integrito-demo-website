export type HeaderAuthMode = 'guest' | 'preview-authenticated';

export type PreviewIdentity = {
  displayName: string;
  initials: string;
};

export const PREVIEW_IDENTITY: PreviewIdentity = {
  displayName: 'Preview account',
  initials: 'PA',
};

/**
 * Development-only Header auth preview (?headerPreview=authenticated).
 * Never treats this as a real session; production builds always return guest.
 */
export function readHeaderAuthPreview(): HeaderAuthMode {
  if (!import.meta.env.DEV) return 'guest';
  try {
    return new URLSearchParams(window.location.search).get('headerPreview') === 'authenticated'
      ? 'preview-authenticated'
      : 'guest';
  } catch {
    return 'guest';
  }
}
