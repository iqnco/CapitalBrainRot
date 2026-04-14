// Inline HUD-corner wrapper — wraps children in a div with orange bracket corners.
// Usage: <HUDCorner><div>content</div></HUDCorner>
// For standalone corners on a parent that already has position:relative, use the
// .hud-corner CSS class + <span className="hud-br" /> as last child instead.

interface Props {
  children: React.ReactNode;
  className?: string;
}

export default function HUDCorner({ children, className = '' }: Props) {
  return (
    <div className={`hud-corner ${className}`}>
      {children}
      <span className="hud-br" />
    </div>
  );
}
