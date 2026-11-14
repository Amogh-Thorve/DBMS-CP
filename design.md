# Design System Specification (SAP Enterprise Web Surface)

## Overview

SAP's web surface is built like an application frame rather than a marketing site. A 60px bar in `{colors.chrome}` sits across the top, and on any product or services page a second rail drops beneath it carrying a breadcrumb and a row of tabs. That two-storey chrome is the first thing the design commits to: before a visitor reads a headline they have been told where they are in a very large catalogue, and the page below behaves like the content pane of that catalogue.

What fills the pane is mostly `{colors.canvas}`. White covers between 57 and 69 percent of every page, and the design separates content by dropping in **broad flat bands** rather than by bordering or elevating anything. There are four of them and each does a different job: `{colors.chrome}` for a neutral section, `{colors.band}` for the footer, `{colors.band-blue}` for a highlighted strip, and `{colors.band-lavender}` for a softer one. They run edge to edge with square corners, so the page reads as a stack of full-width horizontal zones.

Blue is the only colour that acts. `{colors.primary}` fills every button and every inline link; `{colors.primary-deep}` fills the solid hero band on interior pages and is also the label colour inside an outline button. The home page hero departs from both, running a deep navy gradient anchored on `{colors.navy}` behind a product lockup, which makes it the one surface on the site that is atmospheric rather than flat. Corners stay tight throughout: `{rounded.md}` on every control, `{rounded.lg}` on media, and nothing rounder anywhere.

**Key Characteristics:**
- A two-storey chrome — a `{colors.chrome}` global bar above a product tab rail — that frames the page like an application.
- White canvas broken by four full-width flat bands (`{colors.chrome}`, `{colors.band}`, `{colors.band-blue}`, `{colors.band-lavender}`) with square edges.
- One acting colour: `{colors.primary}` for controls and links, `{colors.primary-deep}` for the interior hero band.
- A five-tier text ladder (`{colors.ink}` → `{colors.ink-lead}` → `{colors.ink-body}` → `{colors.ink-list}` → `{colors.ink-meta}`) that shifts hue as it descends, from pure black through warm grey into slate.
- The brand's own variable typeface across a 350-to-700 weight range, so a 15px list item and a 15px nav link read as different classes at identical size.
- Depth carried by band and gradient rather than by shadow; controls sit flat on their ground.
- Corners capped at `{rounded.md}` for controls and `{rounded.lg}` for media — nothing on the site is a pill.

---

## Colors

### Brand & Accent
- **SAP Blue** (`{colors.primary}` — `#0057d2`): the acting colour. Every filled button, every inline text link, and the active product tab.
- **Deep Blue** (`{colors.primary-deep}` — `#0040b0`): the solid hero band on interior pages, and the label colour inside an outline button placed on white.
- **On Primary** (`{colors.on-primary}` — `#ffffff`): the label on every blue fill and all type inside the hero band.
- **Navy** (`{colors.navy}` — `#022879`): the anchor of the home page's hero gradient, the one atmospheric surface in the system.
- **Sky** (`{colors.sky}` — `#6bc0ff`): a light blue panel used inside the services layout.

### Surface
- **Canvas** (`{colors.canvas}` — `#ffffff`): the working ground. Content panes, cards and most sections sit on it unchanged.
- **Chrome** (`{colors.chrome}` — `#f5f6f7`): the global navigation bar, and the neutral band used to set a section apart.
- **Band** (`{colors.band}` — `#eaecee`): the footer ground, and the largest single non-white surface on the home page.
- **Band Blue** (`{colors.band-blue}` — `#ebf8ff`): a pale blue strip used to lift a section out of the white run.
- **Band Lavender** (`{colors.band-lavender}` — `#f7f4ff`): a softer wash serving the same role on product pages, with a curved upper edge rather than a square one.

### Text
- **Ink** (`{colors.ink}` — `#000000`): headings at every level. SAP sets its headlines in true black, not a softened near-black.
- **Ink Lead** (`{colors.ink-lead}` — `#3c3c3c`): the 28px lead paragraph that follows a display headline.
- **Ink Body** (`{colors.ink-body}` — `#223548`): body copy. A slate rather than a grey, which is what separates the paragraph tier from the lead tier.
- **Ink List** (`{colors.ink-list}` — `#354a5f`): list items, set one step lighter than body.
- **Ink Meta** (`{colors.ink-meta}` — `#475e75`): captions and footnotes, the quietest legible tier.
- **Ink Nav** (`{colors.ink-nav}` — `#545454`): navigation links, breadcrumbs and tab labels. The only text colour that is a neutral grey rather than a slate, which is how the chrome stays visually separate from the content.

### Semantic
- **Hairline** (`{colors.hairline}` — `#475e75`): the rule on an outline button. The same value as `{colors.ink-meta}`, used as a border rather than as type.
- **Hairline Subtle** (`#d0d7de`): subtle table borders and dividers on white ground.
- **Status Emerald** (`#107e3e`): positive status and operational indicator.
- **Status Amber** (`#b26b00`): warning and degraded indicator.
- **Status Rose** (`#c92a2a`): critical and violation alert indicator.

---

## Typography

### Font Family
Set in Inter Variable / Source Sans 3 Variable with a full weight axis (300, 350, 400, 500, 700). Headings are black and tight (~1.1 line-height); body copy is slate and open (~1.5 line-height). Tracking is zero everywhere.

### Hierarchy

| Token | Size | Weight | Line Height | Letter Spacing | Use |
|---|---|---|---|---|---|
| `{typography.display}` | 57px | 700 | 62.7px | 0 | Home page display headline |
| `{typography.hero-title}` | 36px | 500 | 39.6px | 0 | Interior page hero title |
| `{typography.section-title}` | 32px | 500 | 35.2px | 0 | Section headings |
| `{typography.lead}` | 28px | 400 | 30.8px | 0 | Lead paragraph |
| `{typography.subhead}` | 20px | 500 | 22px | 0 | Feature titles, active tab |
| `{typography.body-lg}` | 20px | 400 | 30px | 0 | Large body copy |
| `{typography.body}` | 18px | 400 | 27px | 0 | Body copy |
| `{typography.button}` | 16px | 500 | 17.6px | 0 | Button labels |
| `{typography.link}` | 16px | 400 | 24px | 0 | Inline text links |
| `{typography.nav-link}` | 15px | 400 | 21px | 0 | Navigation, breadcrumb |
| `{typography.list-item}` | 15px | 350 | 21px | 0 | List items |
| `{typography.caption}` | 14px | 400 | 21px | 0 | Captions, tab labels, footnotes |

---

## Layout

### Spacing System
- **Base unit**: 8px.
- **Tokens**:
  - `{spacing.xxs}`: 2px
  - `{spacing.xs}`: 3px
  - `{spacing.sm}`: 8px
  - `{spacing.md}`: 9px
  - `{spacing.lg}`: 10px
  - `{spacing.xl}`: 12px
  - `{spacing.xxl}`: 15px
  - `{spacing.wide}`: 16px
  - `{spacing.section}`: 20px
  - `{spacing.giant}`: 24px
  - `{spacing.max}`: 32px
  - `{spacing.huge}`: 40px
  - `{spacing.hero}`: 48px
  - `{spacing.band}`: 56px
  - `{spacing.page}`: 72px

### Grid & Container
The content column is centred and capped (1440px max-width), with the chrome running full-bleed above it. The home page hero runs a full-bleed navy gradient, interior pages a solid `{colors.primary-deep}` band, and product sections clean white canvas. Bands run edge-to-edge with square corners.

### Responsive Strategy
- **Small mobile** (< 480px): Single column; tab rail scrolls horizontally; hero type drops to 36px tier.
- **Mobile** (480–767px): Single column; nav collapses to a menu; two-column features stack.
- **Tablet** (768–1023px): Two-column holds; breadcrumb truncates; hero image moves below text.
- **Laptop** (1024–1279px): Full grid; tab rail shows all tabs; hero returns to side-by-side.
- **Desktop** (1280–1439px): Centred content column at full width.
- **Wide** (≥ 1440px): Gutters absorb extra width; bands stay full-bleed.

---

## Elevation & Depth

| Level | Treatment | Use |
|---|---|---|
| 0 | Canvas, no border | Content panes, most sections |
| 1 | Flat band (`{colors.chrome}`, `{colors.band}`, `{colors.band-blue}`, `{colors.band-lavender}`) | Section separation, footer |
| 2 | Solid colour band (`{colors.primary-deep}`) | Interior page hero |
| 3 | Gradient (navy anchored on `{colors.navy}`) | Home hero, atmospheric header |
| 4 | Soft drop shadow | Floating UI cards inside product illustrations |

Controls sit flat on their ground. Shadow is reserved for depicting an interface, not for building one.

---

## Shapes

| Token | Value | Use |
|---|---|---|
| `{rounded.none}` | 0px | Every band, the chrome, the tab rail, the footer |
| `{rounded.sm}` | 4px | Inline anchor surfaces |
| `{rounded.md}` | 8px | Every button and control (inputs, selects, toasts) |
| `{rounded.lg}` | 12px | Media frames, illustration surfaces, modal cards |

**Nothing on the site is a pill.**

---

## Components

### Chrome
- **`nav-bar`**: 60px height, background `{colors.chrome}`, text `{colors.ink-nav}`, type `{typography.nav-link}`, rounded `{rounded.none}`.
- **`nav-link`**: text `{colors.ink-nav}`, type `{typography.nav-link}`.
- **`breadcrumb`**: 17px height, text `{colors.ink-nav}`, type `{typography.nav-link}`.
- **`product-tab`**: 32px height, text `{colors.ink-nav}`, type `{typography.caption}`, rounded `{rounded.none}`.
- **`product-tab-active`**: 44px height, text `{colors.primary}`, type `{typography.subhead}`, rounded `{rounded.none}`, 3px blue bottom border.

### Heroes
- **`hero-band`**: Solid interior hero, background `{colors.primary-deep}`, text `{colors.on-primary}`, rounded `{rounded.none}`.
- **`hero-title`**: Headline inside interior hero, `{typography.hero-title}`, text `{colors.on-primary}`.
- **`hero-display`**: Home headline on white or navy, `{typography.display}`, weight 700.
- **`navy-hero`**: Atmospheric gradient anchored on `{colors.navy}` to `{colors.primary-deep}`.

### Buttons
- **`button-primary`**: Background `{colors.primary}`, text `{colors.on-primary}`, `{typography.button}`, `{rounded.md}`, padding `12px 14px`, height 44px. Flat!
- **`button-outline`**: Background `{colors.canvas}`, text `{colors.primary-deep}`, `{typography.button}`, `{rounded.md}`, padding `8px 9px`, border 1px solid `{colors.hairline}`.
- **`button-floating`**: Pinned bottom-right affordance, height 58px, padding `16px 20px`, background `{colors.primary}`, text `{colors.on-primary}`, `{rounded.md}`.

### Bands
- **`band-neutral`**: Background `{colors.chrome}`, text `{colors.ink-body}`, rounded `{rounded.none}`.
- **`band-blue`**: Background `{colors.band-blue}`, text `{colors.ink-body}`, rounded `{rounded.none}`.
- **`band-lavender`**: Background `{colors.band-lavender}`, text `{colors.ink-body}`, curved upper edge!
- **`footer`**: Background `{colors.band}`, text `{colors.ink-nav}`, type `{typography.nav-link}`, rounded `{rounded.none}`.

---

## Do's and Don'ts

### Do
- Keep `{colors.primary}` for things that act — buttons, inline links, the active tab.
- Separate sections with a full-width band rather than a border or a shadow.
- Run every band square (`{rounded.none}`).
- Use the weight axis at small sizes: 350 for lists, 400 for nav, 500 for headers/buttons.
- Set headings in true `{colors.ink}` black and step body copy down into `{colors.ink-body}` slate.
- Cap controls at `{rounded.md}` (8px) and media at `{rounded.lg}` (12px).

### Don't
- Don't elevate a button or a card. Depth is band and gradient, not shadow.
- Don't round a full-width region.
- Don't introduce a second accent hue.
- Don't set body copy in `{colors.ink-nav}`.
- Don't flatten the weight range to 400 and 700.
- Don't add letter-spacing.
- Don't create pills.
- Don't let a hero band and a content band sit adjacent without a white interval.
