## Project Summary
A high-density, "Foundry Amber" community website for AI Collective Seattle. The design emphasizes a "technical-luxe" aesthetic with warm amber accents against deep stone/charcoal backgrounds. It focuses on engineering depth, community metrics, and a sense of shared frontier innovation.

## Tech Stack
- **Framework:** Next.js 15 (App Router)
- **Styling:** Tailwind CSS 4
- **Animations:** Framer Motion
- **Icons:** Lucide React
- **Fonts:** Playfair Display (Serif), Inter (Sans-serif), JetBrains Mono (Monospace)

## Architecture
- `src/app/page.tsx`: Single-page implementation featuring a dense Bento-grid Hero, Live Pulse metrics, Ecosystem Density charts, and a Curated Assembly schedule.
- `src/app/globals.css`: Defines the "Stone & Amber" palette, noise textures, and grid backgrounds.
- `src/app/layout.tsx`: Root layout with font and global background configuration.

## User Preferences
- **Aesthetic:** High-density, technical, "Foundry" industrial, structured with blueprint lines.
- **Typography:** Serif (Playfair Display) for narrative weight, Monospace (JetBrains Mono) for all system-level data.
- **Colors:** Deep Stone background (#0c0a09), Amber accent (#f59e0b) for highlights and primary CTAs.
- **Tone:** Technical, sophisticated, high-bandwidth, "Faces > Logos".

## Project Guidelines
- Use `framer-motion` for subtle system-style reveals and hover-based grid interactions.
- Prioritize high information density; minimize white space while maintaining structural clarity.
- Use monospace labels for all technical metrics, metadata, and "system logs".
- Maintain a subtle "grid background" and "grain texture" for depth.
- Navigation should be sticky and minimalist.

## Common Patterns
- `Mono` component for consistent technical labeling (uppercase, tracked out).
- `ConsoleSystem` for dynamic "live" status updates.
- `MetricsTicker` for real-time numeric visualizations.
- Dense grid layouts (bento-style) for multi-faceted information delivery.
