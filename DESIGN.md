---
theme: "Linear & Apple Minimalist White"
canvas: "#FFFFFF"
canvas_subtle: "#FAFAFA"
canvas_muted: "#F4F4F5"
ink: "#09090B"
ink_secondary: "#52525B"
ink_muted: "#71717A"
ink_subtle: "#A1A1AA"
border: "#E4E4E7"
border_subtle: "#F4F4F5"
border_focus: "#18181B"
accent:
  primary: "#18181B"
  indigo: "#4F46E5"
  emerald: "#059669"
  amber: "#D97706"
  rose: "#E11D48"
typography:
  font_sans: "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
  font_mono: "'Geist Mono', 'SF Mono', Menlo, monospace"
  scale:
    h1: "20px / 1.25 / font-semibold / tracking-tight (-0.02em)"
    h2: "15px / 1.35 / font-semibold / tracking-tight (-0.015em)"
    body: "13px / 1.5 / font-normal / normal"
    caption: "12px / 1.4 / font-medium / text-zinc-500"
    micro: "11px / 1.3 / font-medium / uppercase tracking-wider text-zinc-400"
radii:
  sm: "6px"
  md: "8px"
  lg: "12px"
  full: "9999px"
shadows:
  subtle: "0 1px 2px 0 rgba(0, 0, 0, 0.04)"
  card: "0 1px 3px 0 rgba(0, 0, 0, 0.05), 0 1px 2px -1px rgba(0, 0, 0, 0.05)"
  popover: "0 10px 15px -3px rgba(0, 0, 0, 0.08), 0 4px 6px -4px rgba(0, 0, 0, 0.04)"
---

# Design Manifesto: Instagram Outreach OS

A clean, executive-grade information architecture inspired by Linear, Apple, and OpenAI internal tooling. Designed for focused, frictionless human execution.

---

## 1. Design Philosophy: The Restraint Doctrine

1. **Quiet Authority**: The interface steps back so the creator content and outreach message stand forward. No glowing gradients, no neon dark-mode artifacts, no multicolored tag confetti.
2. **Apple & Linear Precision**:
   - Single-pixel hairline dividers (`#E4E4E7`).
   - Pure white surfaces on crisp zinc canvas (`#FAFAFA`).
   - High typographic legibility with `-0.015em` to `-0.02em` tracking for headings and crisp `13px` body text.
3. **Information Density without Chaos**:
   - Leads are displayed as calm, structured rows with clear visual hierarchy: Identity → Quality Signal → Metric → Status.
   - Zero redundant text. No repetitive `"Tier A · Role + Niche + 8.4k followers"` banners when individual chips and data fields already communicate that.
4. **Ergonomic Speed**:
   - A single primary action per state: `Open & Copy` (`Key: O`).
   - Single-tap secondary actions: `Mark Sent` (`S`), `Replied` (`R`), `Skip` (`X`), `Snooze` (`Z`).
   - Instant keyboard navigation with zero latency.

---

## 2. Color Palette & Token Hierarchy

| Token | Hex | Role |
| :--- | :--- | :--- |
| `canvas` | `#FFFFFF` | Primary surface for cards, detail panels, and modals |
| `canvas-subtle` | `#FAFAFA` | Page background canvas |
| `canvas-muted` | `#F4F4F5` | Hover backgrounds, input fills, subtle pills |
| `ink` | `#09090B` | Primary headings, creator handles, active icons |
| `ink-secondary` | `#52525B` | Creator bios, message previews, description copy |
| `ink-muted` | `#71717A` | Labels, counters, secondary metrics |
| `ink-subtle` | `#A1A1AA` | Hairlines, shortcuts, placeholders |
| `border` | `#E4E4E7` | Card borders, table dividers, input borders |
| `accent-dark` | `#18181B` | Primary action button (`Open & Copy`) |
| `tier-a` | `#4F46E5` / `#EEF2FF` | Soft indigo chip for Tier A (Creator-Operators) |
| `tier-b` | `#0284C7` / `#F0F9FF` | Soft sky chip for Tier B (Knowledge Creators) |
| `tier-c` | `#D97706` / `#FFFBEB` | Soft amber chip for Tier C (Niche Experts) |
| `status-sent` | `#059669` / `#ECFDF5` | Soft emerald chip for contacted leads |
| `status-reply` | `#E11D48` / `#FFF1F2` | Soft rose chip for prospects who replied |

---

## 3. Typography Architecture

- **Primary Typeface**: Inter / Geist via Next.js Google Fonts with anti-aliasing.
- **Monospace Typeface**: Geist Mono for counts, scores, timestamps, and shortcut keys.
- **Hierarchy Scale**:
  - **Screen Header**: `text-lg font-semibold tracking-tight text-zinc-900`
  - **Card Title / Handle**: `text-[13px] font-semibold text-zinc-900`
  - **Body / Bios**: `text-[13px] leading-relaxed text-zinc-700`
  - **Meta / Followers**: `text-[12px] font-normal text-zinc-500`
  - **Micro Label / Category**: `text-[11px] font-medium uppercase tracking-wider text-zinc-400`

---

## 4. Layout & Grid Rhythm

- **Top Navbar**: 48px height, hairline bottom border, discrete tabs with pill indicator.
- **Today's Outreach**:
  - Two-column workbench: 42% left column (Lead Queue List), 58% right column (Focused Lead Inspection & Action).
  - Left Queue: Scrollable list of structured lead tiles with smooth hover and clean 2px selected indicator.
  - Right Workspace: Sticky card with complete creator context, objective signals, editable personalized copy, and prominent primary action.
- **Bottom Helper Bar**: Ultra-minimalist 36px bar displaying keyboard hotkeys with clean zinc keycaps.

---

## 5. Anti-Patterns (Eliminating AI Slop)

- **NO** multicolor tag dumps (e.g. 10 colored pills side-by-side). Replace with an elegant 3-attribute metadata list: `Role`, `Signals`, `Niche`.
- **NO** neon glowing gradients or dark-mode blur effects.
- **NO** redundant strings like repeating `"Tier A · ..."` three times on the same card.
- **NO** generic mock data in production builds. Start with a clean database ready for real Apify runs.
- **NO** clumsy ellipsis truncation cutting off words mid-character. Use balanced card widths and structured rows.

---

## 6. Do's and Don'ts

### Do:
- Use generous 16px–24px internal card padding.
- Keep border radius consistent: `rounded-lg` (8px) for buttons/inputs, `rounded-xl` (12px) for cards.
- Highlight matched research signals (`save this`, `hooks`, `swipe file`) cleanly with a single subtle badge.
- Make the primary button (`Open & Copy`) immediately obvious as the centerpiece of the workflow.

### Don't:
- Don't use heavy colored buttons for secondary actions. Use subtle gray or muted border buttons.
- Don't clutter the creator card with unnecessary decorative icons.
- Don't overwhelm the user with complicated CRM forms. Keep actions binary: Open & Copy → Mark Sent → Mark Replied.
