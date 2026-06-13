# Doctor Hub — UI Redesign Prompt

Paste the section below ("THE PROMPT") into Claude Code, Cursor, or any AI coding
assistant working inside your project. It's written so the assistant can act on
your existing codebase directly. Sections 2 onward are the reference material the
prompt points to — keep this file in your repo (e.g. `/docs/design-system.md`) so
you can re-paste relevant parts whenever you redesign a new page.

---

## THE PROMPT (copy from here)

You are the design lead redesigning the frontend of **Doctor Hub**, a healthcare
consultation platform (patients book appointments with Allopathic, Homeopathic, and
Herbal doctors; assistants verify payments; doctors manage clinics, schedules,
prescriptions and medical history).

The current UI works functionally but looks like a generic AI-generated template —
default rounded cards, indigo/blue everywhere, Inter font, generic stat-card
dashboards, lucide icons in circles. Your job is to give it a real visual identity
without changing any functionality, routes, or data flow.

**Direction:** Implement the "Token & File" design system described below. It's
inspired by the real paper artifacts of a clinic visit — the numbered token slip you
get at reception, the patient file folder, the rubber ink stamp used to mark
"PAID" / "VERIFIED" / "CONFIRMED", and the prescription pad. This gives the product
a distinct, trustworthy, slightly tactile identity that's specific to a clinic
booking system — not a generic SaaS dashboard.

**Rules:**
1. Do not touch backend code, API calls, route names, or state logic — visual layer only.
2. Apply the design tokens (Section 4) globally first: Tailwind config, global CSS,
   font imports. Then move page by page.
3. The signature element is **the Stamp System** (Section 5.1) — use it for every
   status indicator in the app (appointment status, payment status, doctor approval
   status, "record locked" indicators). This is the one bold, memorable device —
   keep everything else calm and disciplined around it.
4. Border radius should be small (4–8px), not the generic `rounded-2xl` look.
   Shadows should feel like stacked paper, not floating glass.
5. Go through pages in this order: global tokens → navigation/sidebar → auth pages
   → patient dashboard & appointment cards → doctor search → booking flow →
   medical history timeline → prescriptions → doctor/assistant/admin dashboards.
6. After each page, take a screenshot (if you can) and self-critique against
   Section 2 (the anti-pattern list) before moving on.
7. Maintain responsiveness, visible keyboard focus states, and reduced-motion
   support throughout.

Use Sections 4–10 below as your exact specification for colors, type, components,
motion, and page-specific layout. Where something isn't specified, make a choice
consistent with the direction rather than falling back to defaults.

---

## 2. What to kill (the "vibe-coded" tells)

Remove or replace every instance of:

- Indigo/violet/blue (`#3B82F6`, `#6366F1`, `#8B5CF6`) as the primary color
- `rounded-2xl` + `shadow-sm` on every card with no variation
- Generic 4-stat-card dashboard grids (icon-in-circle + big number + label)
- Purple-to-blue gradient hero sections or buttons
- Lucide/Heroicons dropped into colored circles as the only iconography
- "Welcome back, {name} 👋" style generic greetings
- Centered hero with headline + subhead + two pill buttons + gradient blob
- Uniform spacing/radius with no hierarchy between primary and secondary actions

---

## 3. Design Concept: "Token & File"

**Subject grounding:** Every visit to a clinic in Pakistan involves the same
physical objects — a numbered token slip from reception, a manila patient file with
a tab, a rubber stamp marking payment as received, and a prescription pad with the
doctor's letterhead. These are the visual vocabulary of Doctor Hub.

**Signature:** Status everywhere (appointment, payment, approval, record-lock) is
shown as an ink stamp — a bordered, slightly rotated badge with letterspaced
uppercase text, like a real rubber stamp. This single device does real work: it
encodes the immutability rules (medical history is "stamped" not editable), the
payment workflow (PENDING → stamped VERIFIED), and appointment confirmation — all
core to the brief.

**Supporting devices (quieter):**
- Appointment/booking cards rendered as **token stubs** — a card with a dashed
  perforation line separating a "stub" (date/time/number) from the details
- Sidebar navigation styled as **file tabs** — the active section sits slightly
  forward with its own shadow, like a tab pulled out of a folder
- Prescriptions rendered on a **pad layout** — letterhead-style header, ruled lines

---

## 4. Design Tokens

### 4.1 Color Palette

| Token | Hex | Use |
|---|---|---|
| `--bg` | `#F5F6F3` | Page background — cool paper white, faint green undertone |
| `--surface` | `#FFFFFF` | Cards, panels, modals |
| `--ink` | `#1D2420` | Primary text — warm near-black |
| `--ink-soft` | `#5C6660` | Secondary text, captions |
| `--primary` | `#23534A` | Deep clinical teal-green — buttons, links, active states |
| `--primary-soft` | `#E3ECE8` | Tints, hover backgrounds, selected rows |
| `--accent` | `#D1502B` | CTAs, the stamp-ink color, key highlights |
| `--accent-soft` | `#FBE7DE` | Accent tints |
| `--line` | `#DDE1DC` | Borders, dividers, the dashed "perforation" |
| `--success` | `#3D7A5C` | Verified / confirmed stamps |
| `--pending` | `#C8932E` | Pending stamps, awaiting action |
| `--danger` | `#B6453A` | Rejected / cancelled stamps |

**Treatment-type accents** (used as small tags/borders on doctor cards — never as
full backgrounds):

| Type | Hex | Notes |
|---|---|---|
| Allopathic | `#3B6E8F` | Slate blue |
| Homeopathic | `#8B6FB0` | Soft violet |
| Herbal | `#5B8A52` | Leaf green |

### 4.2 Typography

| Role | Font | Source | Notes |
|---|---|---|---|
| Display / Headings | **Space Grotesk** | [Google Fonts](https://fonts.google.com/specimen/Space+Grotesk) | Weights 500 & 700. Geometric but warm — feels official without being cold. |
| Body | **Source Sans 3** | [Google Fonts](https://fonts.google.com/specimen/Source+Sans+3) | Weights 400 & 600. Clean, highly legible at small sizes. |
| Data / IDs / Codes | **IBM Plex Mono** | [Google Fonts](https://fonts.google.com/specimen/IBM+Plex+Mono) | For PMDC numbers, appointment IDs, transaction refs, timestamps. |

Type scale (rem): `0.75 / 0.875 / 1 / 1.125 / 1.5 / 2 / 2.75 / 3.5`
Headings use Space Grotesk 700 with slightly tight letter-spacing (`-0.01em`).
Eyebrows/labels use Source Sans 3 600, uppercase, `letter-spacing: 0.08em`.

### 4.3 Spacing, Radius, Elevation

- Radius: `4px` (inputs, small badges), `8px` (cards, buttons), `12px` (modals only)
- Spacing scale: 4 / 8 / 12 / 16 / 24 / 32 / 48 / 64px — stick to it everywhere
- Elevation ("paper stack" — use instead of generic `shadow-sm`):
  ```css
  --shadow-card: 0 1px 2px rgba(29,36,32,0.04), 0 2px 8px rgba(29,36,32,0.06);
  --shadow-raised: 0 2px 4px rgba(29,36,32,0.06), 0 8px 24px rgba(29,36,32,0.08);
  ```
- Borders: 1px solid `--line` on cards instead of relying purely on shadow —
  gives the "card stock" feel

---

## 5. Signature & Supporting Elements

### 5.1 The Stamp System (signature — use everywhere status appears)

A stamp is a bordered badge, rotated -3° to -4°, uppercase, letterspaced,
double-ring border (outer 1px solid, inner 1px solid with 2px gap), using the
status color for both border and text on a transparent/soft background.

```
┌ ─ ─ ─ ─ ─ ┐
│ ╔═══════╗ │
│ ║VERIFIED║ │   ← rotated -3deg, success color, double border
│ ╚═══════╝ │
└ ─ ─ ─ ─ ─ ┘
```

Apply to:
- Appointment status (`PENDING`, `CONFIRMED`, `COMPLETED`, `CANCELLED`)
- Payment status (`PENDING`, `VERIFIED`, `REJECTED`)
- Doctor approval status (`PENDING APPROVAL`, `ACTIVE`, `SUSPENDED`)
- Medical history / prescription entries → small `LOCKED` stamp in the corner of
  each record, reinforcing the "cannot be edited" rule from the brief
- On confirmation actions (assistant verifying a payment), animate the stamp
  "landing" — scale from 1.4→1 with the rotation settling, ~200ms, once

### 5.2 Token-Stub Cards (appointments, bookings)

```
┌──────────────┬ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ┐
│  #A-0231     │  Dr. Ahmed Raza               │
│  MON         │  General Physician · Allopathic
│  09:30 AM    │  City Care Clinic, Karachi    │
│              │                    [CONFIRMED]│ ← stamp
└──────────────┴ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ┘
   ↑ stub (mono font,        ↑ dashed perforation
   primary-soft bg)             (--line, dashed)
```

The stub block uses `--primary-soft` background and IBM Plex Mono for the
number/time. The perforation is a `border-left: 1px dashed var(--line)`.

### 5.3 File-Tab Navigation (sidebar)

Sidebar items render as folder tabs: inactive items sit flush against the sidebar
edge with no shadow; the active item extends 4–8px past the sidebar edge into the
content area with `--shadow-raised` and `--surface` background, visually "pulled
forward" like a tab sticking out of a folder.

---

## 6. Component Direction

**Buttons** — Primary: `--primary` background, white text, 8px radius, Space
Grotesk 600. Secondary: transparent with 1px `--primary` border. Destructive
actions use `--danger` text on transparent with `--danger` border — never a solid
red fill (keep solid fills for primary actions only).

**Forms & Inputs** — 4px radius, 1px `--line` border, `--surface` background.
Focus state: border becomes `--primary`, plus a 2px `--primary-soft` outline (for
visible keyboard focus). Labels: Source Sans 3 600, small, `--ink-soft`. Error
text: `--danger`, with a small stamp-style "✕" mark rather than a generic icon.

**Tables** (admin/doctor lists) — No zebra striping. Use a 1px `--line` bottom
border per row, header row in Space Grotesk 600 uppercase small with
`letter-spacing: 0.06em`. Row hover: `--primary-soft` background.

**Cards** — `--surface`, 1px `--line` border, `--shadow-card`, 8px radius. Doctor
profile cards get a 3px left border in the treatment-type accent color (Section
4.1) — this is the only place those accent colors appear as a solid block.

**Modals/Dialogs** — 12px radius, `--shadow-raised`, max-width constrained, with a
subtle top accent bar (4px, `--primary`) instead of a colored header band.

**Status badges** — always the stamp style (5.1). Never use solid-fill colored
pills for status.

---

## 7. Page-by-Page Notes

**Auth (Login/Register/Forgot Password)** — Split layout: left panel `--primary`
background with the Doctor Hub wordmark in Space Grotesk and one line of
supporting copy; right panel `--bg` with the form card. Role selector (for
register) styled as a row of small file-tabs, not a dropdown.

**Patient Dashboard** — Lead with "Your file" — a horizontal scroll of upcoming
token-stub cards (5.2), not a stat-card grid. Below: two columns — recent
prescriptions (pad-style preview, 7.9) and a condensed medical history timeline
(7.8) showing the last 2–3 entries with a "View full file" link.

**Doctor Search & Filters** — Filter sidebar uses file-tab styling for treatment
type (Allopathic/Homeopathic/Herbal) as three tabs, each showing its accent color
as a small dot. Results render as a grid of doctor cards with the left-border
accent (Section 6). Sort/filter controls in IBM Plex Mono for counts ("24 doctors").

**Doctor Profile** — Header block resembles an ID card: photo, name (Space
Grotesk), PMDC number (mono), specialization, and a stamp showing `ACTIVE` status.
Schedule shown as a simple weekly grid, available slots in `--primary-soft` boxes.

**Book Appointment Flow** — As the user selects date/time, build a live preview of
the token-stub card on the right side ("This is your token") so the stub concept
is introduced before the booking is even confirmed.

**Payment Upload** — Drag-and-drop zone with dashed `--line` border (echoes the
perforation motif). On upload, show the screenshot thumbnail with a `PENDING`
stamp overlay; once an assistant verifies it (their side), it becomes `VERIFIED`.

**My Appointments** — A vertical list of token-stub cards grouped by Upcoming /
Past, each with its stamp. Cancelled appointments: stub desaturates to greyscale,
stamp shows `CANCELLED`.

**Medical History (Timeline)** — A real chronological timeline is the one place
numbered/dated markers are justified (per the content itself being a sequence).
Left rail with dates in mono type, connecting line in `--line`, each entry a card
with a small `LOCKED` stamp (top-right corner, rotated -2°) reflecting the
immutability rule.

**Prescriptions (Rx Pad)** — Styled like a real prescription: letterhead block
(doctor name, specialization, clinic) at top with a thin double rule beneath (echo
of a pad's printed header), medicines listed in a simple table, `LOCKED` stamp at
bottom-right alongside the date.

**Doctor Dashboard** — "Today's tokens" as a horizontal stub-card row (mirrors
patient dashboard but doctor-facing), then a clinic/schedule quick-glance panel
using file-tabs for each clinic.

**Manage Clinics & Schedules** — Each clinic as a card with file-tab-styled days of
the week; clicking a day expands the schedule editor inline rather than a modal.

**Assistant Dashboard (Payment Queue)** — A queue list of payment screenshots
awaiting verification, each row showing the thumbnail, amount (mono), and two
actions: "Verify" (applies the success stamp with landing animation) and "Reject"
(applies danger stamp + reason field).

**Admin / Super Admin** — Data-table heavy. Use the table direction in Section 6.
Analytics charts: keep to `--primary`, `--accent`, and the three treatment-type
colors as the chart palette — no default chart-library blues/greens.

---

## 8. Motion & Micro-interactions

- Card hover: `translateY(-2px)` + shift from `--shadow-card` to `--shadow-raised`,
  150ms ease-out
- Stamp landing animation (on verify/confirm actions only): scale 1.3 → 1, opacity
  0 → 1, settling into its -3° rotation, ~200ms
- Tab switch (file-tab nav): active tab slides forward 6px, 120ms
- Respect `prefers-reduced-motion`: disable the stamp landing animation and card
  lift, keep instant state changes
- No floating gradient blobs, no scroll-triggered parallax, no animated
  background patterns — motion is functional, not ambient

---

## 9. Voice & Microcopy

- Buttons describe the action in active voice: "Book appointment", "Verify
  payment", "Add prescription" — not "Submit" or "Confirm"
- Empty states are invitations, not apologies: "No appointments yet — search for a
  doctor to get started" rather than "Sorry, nothing here"
- Errors state what happened and what to do, in the interface's voice: "Payment
  screenshot couldn't be uploaded — try a JPG or PNG under 5MB" rather than
  "Error: upload failed"
- A locked/immutable record should say so plainly: "Added by Dr. Ahmed Raza on 12
  June — locked" rather than hiding the edit button silently

---

## 10. Technical Notes

**Tailwind config additions:**
```js
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      colors: {
        bg: '#F5F6F3',
        surface: '#FFFFFF',
        ink: '#1D2420',
        'ink-soft': '#5C6660',
        primary: { DEFAULT: '#23534A', soft: '#E3ECE8' },
        accent: { DEFAULT: '#D1502B', soft: '#FBE7DE' },
        line: '#DDE1DC',
        success: '#3D7A5C',
        pending: '#C8932E',
        danger: '#B6453A',
        allopathic: '#3B6E8F',
        homeopathic: '#8B6FB0',
        herbal: '#5B8A52',
      },
      fontFamily: {
        display: ['"Space Grotesk"', 'sans-serif'],
        body: ['"Source Sans 3"', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'monospace'],
      },
      borderRadius: { sm: '4px', DEFAULT: '8px', lg: '12px' },
      boxShadow: {
        card: '0 1px 2px rgba(29,36,32,0.04), 0 2px 8px rgba(29,36,32,0.06)',
        raised: '0 2px 4px rgba(29,36,32,0.06), 0 8px 24px rgba(29,36,32,0.08)',
      },
    },
  },
};
```

**Font import** (add to `index.html` `<head>`):
```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;700&family=Source+Sans+3:wght@400;600&family=IBM+Plex+Mono:wght@400;500&display=swap" rel="stylesheet">
```

**Accessibility baseline:** visible focus rings on all interactive elements
(`outline: 2px solid var(--primary-soft)` + border color change), AA contrast for
all text/background pairs (test `--accent` on white for button text — use white
text only if contrast passes, otherwise use `--ink` on `--accent-soft`), and
`prefers-reduced-motion` support as noted in Section 8.

---

## 11. Implementation Order

1. Global tokens — Tailwind config, font imports, base CSS (colors, type scale, radius, shadow vars)
2. Stamp component (Section 5.1) — build once, reuse everywhere
3. Token-stub card component (5.2)
4. Navigation shell (file-tab sidebar, 5.3)
5. Auth pages
6. Patient dashboard + appointments
7. Doctor search, profile, booking flow
8. Medical history + prescriptions
9. Doctor / assistant / admin dashboards
10. Final pass: screenshot every page, check against Section 2's anti-pattern list
