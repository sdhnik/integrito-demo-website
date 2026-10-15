# Integrito — landing prototype

React, TypeScript, Vite, custom CSS, and a lightweight Canvas 2D typography animation. Original SVG logo assets are preserved byte for byte: the default logo appears in light mode and the white logo in dark mode, without a background container.

## Run locally

```sh
npm install
npm run dev
```

Open the local URL printed by Vite. `npm run build` type-checks and builds to `dist/`; `npm run preview` serves that build.

## Visual review

Review at 1440 × 900, tablet, and mobile. Light and dark themes are saved locally. The small bottom-left developer control opens the design playground in development. For a production build, explicitly enable it with `?playground=1`; it is otherwise absent.

The decorative effect is a concentric typographic vortex, independently implemented after visually inspecting timed frames of the live Content Architecture reference. Twenty nested text paths (17–23 with density controls; 13 on mobile) use tangent-aligned phrases and progressively smaller lettering toward the center. The phrase list is configurable in `src/components/spiralGeometry.ts` or through the canvas component's `phrases` prop.

The spiral is a background of the full initial hero, including the header and composer. Its geometry fits within the hero, targeting approximately 92% of available desktop height and shrinking on narrow screens. A local stacking context places the canvas below hero copy, header, and composer. Gradient masks soften the spiral behind foreground text. Exposed canvas areas receive pointer events; foreground controls and text keep native click, focus, and selection behavior.

Text is rasterized into three cached layers when size, palette, density, or phrases change. Idle animation moves these layers at 30 FPS on desktop and 24 FPS on mobile using a 1× backing store. Pressing exposed background begins a localized deformation; holding increases pressure; release sends radial waves through the actual cached text. `RippleRaster` uses a bounded local pixel patch and reused radial geometry, avoiding per-frame glyph rendering and expensive clipping stacks. Reduced motion freezes the composition and disables pressure/ripple motion; hidden tabs stop rendering. Legacy style selections retain the vortex; accent, speed, and desktop density controls remain active.

The composer is bottom-anchored by CSS. Its textarea grows upward from two rows to 300px on desktop; mobile uses a dynamic-viewport limit. Only the editor scrolls at the limit, keeping the toolbar visible. Short viewports allow normal page scrolling. Window and visual-viewport resizing recalculate the editor's height and scroll the focused mobile composer into view. This adjusts scrolling, not the component's CSS position.

Text is browser-local, limited to 20,000 characters, and is never transmitted or persisted. Detect AI opens an honest prototype notice; no detector or fabricated result is included. Ctrl/Command + Enter also submits. Clipboard access may require browser permission; normal paste always works.

`Hero`, `GenerativeCanvas`, and `PromptInput` are independent components. A future workspace can replace the `PromptInput.onSubmit` handler without rewriting the landing canvas or editor. Informational dialogs use native focus trapping and Escape dismissal. Fonts load from Google Fonts with system fallbacks.

## V6 verification and captures

`npm run build` passes TypeScript and Vite checks. Production tests in headless Chrome and Firefox verified:

- Full-hero canvas bounds at 1440 × 900, exposed-background hit testing, and foreground button/textarea interaction.
- A stationary composer bottom at 800px before and after growth, for typing and the paste-button path with a supplied clipboard value.
- A 300px desktop editor limit with internal scrolling, and no overlap with navigation.
- Background press deformation and continued raster warping after release, both themes, and reduced motion.
- Layout and document-anchor stability at 1024 × 768, 390 × 844, 390 × 420, 844 × 390, and 320 × 568. The short-screen tests account for browser scrolling rather than mistaking it for anchor movement.

The final single-browser runs measured roughly 30 FPS while idle and held. Firefox's active-render callback had a 25ms 95th percentile; Chrome's was 20.8ms. These local headless timings include rendering submission and raster warping, but are not guarantees for other hardware. Real on-screen keyboard behavior still warrants review on a physical mobile device; reduced-height viewport and visual-viewport handling are implemented.

- [Light composition](artifacts/hero-v6/light.png)
- [Dark composition](artifacts/hero-v6/dark.png)
- [Expanded composer](artifacts/hero-v6/expanded.png)
- [Mobile composition](artifacts/hero-v6/mobile.png)
- [Ripple and composer interaction preview](artifacts/hero-v6/interaction.webm)

The vortex geometry was independently implemented from timed visual captures of the live Content Architecture reference; no proprietary source was copied. The earlier reference brief mentioned an attached screenshot, but only its text file was available.
