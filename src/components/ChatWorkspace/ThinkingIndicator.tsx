/** Three blue dots — opacity pulse only (decorative; hide from AT). */

export default function ThinkingIndicator() {
  return (
    <span className="thinking-indicator" aria-hidden="true">
      <span className="thinking-dot" />
      <span className="thinking-dot" />
      <span className="thinking-dot" />
    </span>
  );
}
