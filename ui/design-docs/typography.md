# Typography Spec

Source references:

- `app/globals.css`
- `app/page.tsx`
- `components/landing/navbar.tsx`
- `components/landing/site-footer.tsx`

## Type System

The app has two font roles defined in `app/globals.css`.

```css
--font-sans: "Avenir Next", "Segoe UI", "Helvetica Neue", sans-serif;
--font-heading:
  "Iowan Old Style", "Palatino Linotype", "Book Antiqua", Georgia, serif;
```

- Use `font-sans` for body copy, buttons, navigation, labels, form controls, chips, and operational UI.
- Use `font-heading` for `h1` through `h6`. Global CSS already applies this. Do not override headings back to sans unless the element is a compact data label, row title, or dense workspace control.
- Keep the two-font contrast visible: serif for major page meaning, sans for action and detail.

## Landing Page Tone

Landing typography is large, editorial, and restrained. It uses serif headings with tight leading, compact sans-serif support copy, small uppercase labels, and semibold action text.

Target qualities:

- Big serif headings with short lines.
- Tight heading line-height, usually `leading-[0.95]`, `leading-[0.96]`, or `leading-none`.
- Sans body copy at `text-base` to `text-lg` with `leading-7` for marketing copy.
- Small uppercase eyebrow labels with wide tracking.
- Buttons in sans, `text-sm`, `font-semibold`, no uppercase.

Avoid:

- Mixing many font weights in one component.
- Using uppercase for primary buttons.
- Adding negative tracking to body, buttons, labels, or chips.
- Making product pages look like generic dashboard cards with small same-weight headings everywhere.

## Scale

Use these sizes as defaults when adapting non-landing pages.

| Role           | Classes                                                 | Notes                                                                    |
| -------------- | ------------------------------------------------------- | ------------------------------------------------------------------------ |
| Hero h1        | `text-6xl sm:text-7xl lg:text-[5.15rem] leading-[0.95]` | Landing-only or very prominent marketing/product intro. Keep copy short. |
| Page h1        | `text-4xl sm:text-6xl leading-[0.95]`                   | Good for authenticated workspace headers and archive empty states.       |
| Section h2     | `text-4xl sm:text-5xl lg:text-[3.2rem] leading-[0.96]`  | Use for major page sections.                                             |
| Card/figure h3 | `text-2xl` to `text-3xl leading-none`                   | Use for visual modules, receipt figures, and archive rows.               |
| Large metric   | `text-4xl` to `text-5xl font-semibold leading-none`     | Use for totals, counts, and status numbers.                              |
| Body lead      | `text-base sm:text-lg leading-7`                        | Marketing or page-level supporting copy.                                 |
| Body compact   | `text-sm sm:text-base leading-6`                        | Product workspace supporting copy.                                       |
| Fine print     | `text-xs` or `text-[0.68rem] leading-4`                 | Helper copy, proof details, metadata.                                    |

## Headings

Headings should stay serif and tight.

Recommended classes:

```tsx
<h1 className="text-4xl leading-[0.95] text-[var(--foreground)] sm:text-6xl">
  Saved splits
</h1>

<h2 className="text-4xl leading-[0.96] text-[var(--foreground)] sm:text-5xl">
  Turn receipt into clean line items.
</h2>

<h3 className="text-3xl leading-none text-[var(--foreground)]">
  Receipt scan
</h3>
```

Rules:

- Use `text-[var(--foreground)]` for headings unless placed on a colored surface.
- Keep heading copy direct and short.
- Prefer `leading-[0.95]`, `leading-[0.96]`, or `leading-none`.
- Do not add `font-semibold` to normal headings. The serif face carries weight by default. Add `font-semibold` only for numeric metrics or row titles that need stronger data emphasis.
- Global heading `letter-spacing: -0.03em` already applies. Avoid additional `tracking-tight` unless matching an existing component.

## Body Copy

Landing support copy is sans-serif, calm, and readable.

Recommended classes:

```tsx
<p className="max-w-md text-base leading-7 text-[#273246] sm:text-lg">
  Parse receipt data. Make groups. Save clean splits.
</p>

<p className="max-w-sm text-sm leading-6 text-[var(--muted-foreground)] sm:text-base">
  Pull totals, tax, tip, and items into a format ready for assigning.
</p>
```

Rules:

- Use `text-[#273246]` for stronger landing-style lead copy on light backgrounds.
- Use `text-[var(--muted-foreground)]` for secondary product descriptions and metadata.
- Keep line height open: `leading-7` for `text-base`/`text-lg`, `leading-6` for compact product copy.
- Keep paragraphs short. Landing page copy usually fits in one or two lines on desktop.

## Eyebrows And Labels

Landing page labels use small uppercase sans type with wide tracking.

Primary eyebrow:

```tsx
<p className="text-[0.68rem] font-semibold uppercase tracking-[0.28em] text-[#53607e]">
  Receipt workspace
</p>
```

Compact product labels:

```tsx
<p className="text-[0.62rem] font-semibold uppercase tracking-[0.18em] text-[var(--muted-foreground)]">
  Split total
</p>
```

Rules:

- Use `font-semibold` for landing/marketing eyebrows.
- Use `font-medium` only in denser workspace labels where many labels appear together.
- Use tracking between `tracking-[0.18em]` and `tracking-[0.28em]`.
- Keep labels short, usually one to three words.
- Do not use eyebrow styling for normal sentences.

## Buttons

Landing buttons are sans-serif, semibold, and sentence/title case. This is the biggest difference from some product pages, where buttons often use `font-medium`.

Primary marketing CTA:

```tsx
<Button className="h-12 rounded-[0.85rem] bg-[#050506] px-5 text-sm font-semibold text-white shadow-none hover:bg-primary/80 hover:text-white focus-visible:bg-primary/80 focus-visible:text-white">
  Get started now
</Button>
```

Navbar CTA:

```tsx
<Button className="h-10 rounded-[0.8rem] bg-[#050506] px-4 text-sm font-semibold text-white shadow-none hover:bg-primary/80 hover:text-white focus-visible:bg-primary/80 focus-visible:text-white">
  Sign up
</Button>
```

Secondary/ghost nav button:

```tsx
<Button
  variant="ghost"
  className="h-10 rounded-[0.8rem] px-3 text-sm font-semibold text-[var(--foreground)] hover:bg-[#86dcae] hover:text-[#052113] focus-visible:bg-[#86dcae] focus-visible:text-[#052113]"
>
  Log in
</Button>
```

Rules:

- Prefer `text-sm font-semibold` for main actions when matching landing typography.
- Use `font-medium` only for routine workspace controls where lower emphasis is intentional.
- Do not uppercase button text.
- Do not add letter spacing to button text.
- Keep button labels short and action-led.
- Use `h-12` for page CTAs, `h-10` for navbar CTAs, and `h-11` for dense product toolbar actions.

## Links And Navigation

Landing nav uses sans-serif `text-sm font-medium`; auth CTAs use `font-semibold`.

Recommended classes:

```tsx
<nav className="text-sm font-medium text-[var(--foreground)]">...</nav>
```

Rules:

- Keep nav labels plain, no uppercase tracking.
- Use `font-medium` for low-emphasis navigation links.
- Use `font-semibold` for account/auth actions that behave like buttons.
- Footer links use `text-sm text-[var(--muted-foreground)]` with hover to foreground.

## Metrics And Data

Numeric emphasis on the landing page is sans-serif semibold, not serif.

Recommended classes:

```tsx
<p className="text-5xl font-semibold leading-none">$189</p>
<p className="text-xl font-semibold">$84.20</p>
```

Rules:

- Use `font-semibold` for totals, counters, amounts, and status badges.
- Use `leading-none` for large numbers.
- Pair large numbers with uppercase compact labels.

## Application Guidance

When making other pages more like the landing page:

1. Keep global font tokens unchanged.
2. Upgrade major page headings to serif scale first.
3. Convert primary buttons from `font-medium` to `font-semibold` where they are main calls to action.
4. Keep dense workspace controls at `font-medium` if every button being semibold would create noise.
5. Use the landing eyebrow pattern for section labels and empty states, but use compact labels for tables, rows, and metrics.
6. Prefer fewer, larger type levels over many small local variations.

## Quick Checks

- Headings read as serif and tight.
- Primary actions are `text-sm font-semibold`, not uppercase, no tracking.
- Body copy is sans-serif with enough leading.
- Labels are uppercase only when they are metadata or section eyebrows.
- Metrics use semibold sans type and tight line-height.
- No component introduces a third font family.
