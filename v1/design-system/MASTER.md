# DWDS Design System

## Product Fit
- Product type: water utility operations SaaS
- Pattern: hero-led public marketing with data-dense internal workspace
- Style direction: trust-first civic utility, mixing minimal enterprise structure with restrained glass surfaces

## Visual Rules
- Primary palette: deep navy `#163154`, infrastructure blue `#15527A`, utility teal `#10938D`
- Highlight palette: aqua tint for success/info surfaces, amber only for emphasis and queue pressure
- Backgrounds: layered cool neutrals with atmospheric radial glows, never flat white
- Cards: high-opacity white in light surfaces; dark hero panels use subtle glass overlays only
- Border treatment: visible, cool-toned borders; avoid ultra-faint white borders on light surfaces

## Typography
- Heading stack: `Sora`, `Lexend`, `Aptos Display`, sans-serif
- Body stack: `Lexend`, `Aptos`, `Segoe UI Variable`, sans-serif
- Tone: compact, operational, credible; no playful or consumer-fintech typography

## Layout System
- Marketing shell uses a floating header with top spacing and a 7xl content width
- Dashboard uses a persistent left navigation and generous content gutters
- Standard panel radius: `1.75rem` to `1.9rem`
- Hover feedback: color, border, and shadow shifts only; no layout-jumping scale effects

## Accessibility
- Maintain visible active states in navigation
- Respect reduced motion by keeping transitions short and non-essential
- Use pointer cursors and clear affordances on every interactive card or module tile
- Keep body copy at readable contrast with `muted-foreground` no lighter than utility gray-blue
