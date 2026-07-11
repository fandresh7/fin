---
name: frontend-design
description: Create distinctive, production-grade frontend interfaces with high design quality. Use this skill when the user asks to build web components, pages, artifacts, posters, or applications (examples include websites, landing pages, dashboards, React components, HTML/CSS layouts, or when styling/beautifying any web UI), and when the user asks to create or update a project's design system, style guide, or brand/visual foundation. Generates creative, polished code and UI design that avoids generic AI aesthetics.
---
This skill guides creation of distinctive, production-grade frontend interfaces that avoid generic "AI slop" aesthetics. Implement real working code with exceptional attention to aesthetic details and creative choices.
The user provides frontend requirements: a component, page, application, or interface to build. They may include context about the purpose, audience, or technical constraints.
## Design Thinking
Before coding, understand the context and commit to a BOLD aesthetic direction:
- **Purpose**: What problem does this interface solve? Who uses it?
- **Tone**: Default to a modern, elegant aesthetic — clean, refined, contemporary — unless the request clearly calls for something else. Within that direction still commit fully: refined minimalism, soft luxury, editorial elegance, etc. Use these for inspiration but design one that is true to the aesthetic direction.
- **Constraints**: Technical requirements (framework, performance, accessibility).
- **Differentiation**: What makes this UNFORGETTABLE? What's the one thing someone will remember?
**CRITICAL**: Choose a clear conceptual direction and execute it with precision. Bold maximalism and refined minimalism both work - the key is intentionality, not intensity.
Then implement working code (HTML/CSS/JS, React, Vue, etc.) that is:
- Production-grade and functional
- Visually striking and memorable
- Cohesive with a clear aesthetic point-of-view
- Meticulously refined in every detail
## Frontend Aesthetics Guidelines
Focus on:
- **Typography**: Choose fonts that are beautiful, unique, and interesting. Avoid generic fonts like Arial and Inter; opt instead for distinctive choices that elevate the frontend's aesthetics; unexpected, characterful font choices. Pair a distinctive display font with a refined body font.
- **Color & Theme**: Commit to a cohesive aesthetic. Use CSS variables for consistency. Dominant colors with sharp accents outperform timid, evenly-distributed palettes.
- **Motion**: Use animations for effects and micro-interactions. Prioritize CSS-only solutions for HTML. Use Motion library for React when available. Focus on high-impact moments: one well-orchestrated page load with staggered reveals (animation-delay) creates more delight than scattered micro-interactions. Use scroll-triggering and hover states that surprise.
- **Spatial Composition**: Unexpected layouts. Asymmetry. Overlap. Diagonal flow. Grid-breaking elements. Generous negative space OR controlled density.
- **Backgrounds & Visual Details**: Create atmosphere and depth rather than defaulting to solid colors. Add contextual effects and textures that match the overall aesthetic. Apply creative forms like gradient meshes, noise textures, geometric patterns, layered transparencies, dramatic shadows, decorative borders, custom cursors, and grain overlays.
NEVER use generic AI-generated aesthetics like overused font families (Inter, Roboto, Arial, system fonts), cliched color schemes (particularly purple gradients on white backgrounds), predictable layouts and component patterns, and cookie-cutter design that lacks context-specific character.
Interpret creatively and make unexpected choices that feel genuinely designed for the context. No design should be the same. Vary between light and dark themes, different fonts, different aesthetics. NEVER converge on common choices (Space Grotesk, for example) across generations.
**IMPORTANT**: Match implementation complexity to the aesthetic vision. Maximalist designs need elaborate code with extensive animations and effects. Minimalist or refined designs need restraint, precision, and careful attention to spacing, typography, and subtle details. Elegance comes from executing the vision well.
Remember: Claude is capable of extraordinary creative work. Don't hold back, show what can truly be created when thinking outside the box and committing fully to a distinctive vision.

## Design Systems

Trigger this section instead of (in addition to) the single-surface flow above whenever the request is to establish the visual foundation for a project — "design system", "style guide", "sistema de diseño", or a first request for an app/site that has no existing design language yet. The difference from a one-off component: the output must be reusable tokens plus a way to see them all together, not just one polished screen.

**1. Confirm the direction before writing code — with concrete choices, not open questions.**
Don't ask "what style do you like?" in prose. Use `AskUserQuestion` with 2-4 fully-specified, distinct directions the user can compare directly:
- If the user names a reference (another project, an existing brand, a site they like), read its actual tokens first (CSS variables, Tailwind config, a design-system doc if one exists) — don't guess at a vibe from memory.
- If the reference belongs to a *different* product/brand than the one being designed, don't silently clone its palette — ask whether to reuse it as-is or generate a fresh palette that keeps the same structural language (typography, radii, shadow depth, component shapes) but its own colors. Offer 2-3 concrete palette directions as the options, each with real hex values and a short rationale, shown via the `preview` field so they render as comparable swatches.
- Typography, tone, and scope (tokens only vs. tokens + reusable components) are also worth confirming up front the same way — as concrete options, not abstract questions — when they meaningfully change the amount of work or the result.

**2. Build the tokens**, expressed in whatever mechanism the project already uses (Tailwind `@theme`/config, CSS custom properties, a JS/TS theme object, etc.) — don't introduce a second styling system alongside an existing one. Cover at minimum: brand color(s), semantic colors (success/error/warning if the domain needs them), neutrals (background/surface/border/muted text), a type scale, and the radius/shadow language that gives the system its shape.

**3. Build a living showcase page**, not just a written spec — a real page in the project (or a standalone HTML file if there's no app to host it yet) that renders every token category so the whole system can be reviewed at once before anything else consumes it: color swatches (name + hex + variable), the type scale, buttons in their real states, cards/metrics, and a sample form. Mirror the project's real component patterns (e.g. this project's Angular/Tailwind conventions in `CLAUDE.md`) rather than inventing throwaway markup.

**4. Verify it renders** — run the project's build, then actually load the showcase page (dev server + browser/screenshot, or open the static file) and look at it before calling the system done. A design system that only exists as unverified code isn't done.
