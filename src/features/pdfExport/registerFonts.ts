import { Font } from '@react-pdf/renderer';
import dmSans400 from './fonts/DMSans-Regular.ttf?url';
import dmSans500 from './fonts/DMSans-Medium.ttf?url';
import ibm400 from './fonts/IBMPlexMono-Regular.ttf?url';
import ibm500 from './fonts/IBMPlexMono-Medium.ttf?url';
import notoSans400 from './fonts/NotoSans-Regular.ttf?url';

let registered = false;

/**
 * Embed product UI fonts + Noto Sans (Latin/Cyrillic/Greek) for document body.
 * TTF files are vendored under ./fonts — never fetched at export time.
 * Safe to call multiple times.
 */
export function registerReportFonts(): void {
  if (registered) return;
  registered = true;

  Font.register({
    family: 'DM Sans',
    fonts: [
      { src: dmSans400, fontWeight: 400 },
      { src: dmSans500, fontWeight: 500 },
    ],
  });

  Font.register({
    family: 'IBM Plex Mono',
    fonts: [
      { src: ibm400, fontWeight: 400 },
      { src: ibm500, fontWeight: 500 },
    ],
  });

  /* Full Noto Sans Regular covers Latin + Cyrillic + Greek in one face. */
  Font.register({
    family: 'Noto Sans',
    fonts: [{ src: notoSans400, fontWeight: 400 }],
  });
}
