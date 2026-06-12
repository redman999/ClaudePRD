# Maersk PRD Studio — Web (apps/web)

React 18 + Vite + TypeScript frontend for Maersk PRD Studio. Talks to the API
(`apps/api`) over REST; no business logic lives here.

## Local dev

```bash
npm install
npm run dev      # Vite on :5182 (proxies /api to the API on :4003)
npm run check    # tsc --noEmit
npm run build    # type-check + production bundle to dist/
npm run test     # vitest
```

## Maersk Design refresh

The UI is a **Tailwind replica of Maersk Design** — there is **no `@maersk-global` /
MDS npm dependency**. The official MDS packages are not on a reachable registry and
would not build on Railway, so the look is reproduced with the existing Tailwind +
React + Vite stack. Everything below is implemented in plain Tailwind utilities and a
small set of local primitives.

### Palette

Brand tokens live under `theme.extend.colors.maersk` in `tailwind.config.ts`
(`maersk-blue`, `maersk-slate`, etc.) with a `primary` scale aliased to Maersk Blue:

| Token | Hex | Use |
|---|---|---|
| `maersk-blue` | `#42b0d5` | Primary actions, accents, focus rings |
| `maersk-blue-deep` | `#00a3e0` | Deeper blue accent |
| `maersk-steel` | `#b0c4d8` | Borders, dividers, skeletons |
| `maersk-slate` | `#6b7b8d` | Secondary / meta text |
| `maersk-amber` | `#f0b429` | Required-field markers, warning badges |
| `maersk-ink` | `#141b25` | Primary body text |
| `maersk-surface` | `#f0f4f8` | Page background |

### Fonts

- **Inter** (UI, weights 400/500/600/700) and **Fira Code** (mono, 400).
- Self-hosted via `@fontsource/inter` + `@fontsource/fira-code`, imported in
  `src/main.tsx` and bundled by Vite — **no runtime Google Fonts request**
  (Maersk-network friendly, offline-safe). Exposed as `font-sans` / `font-mono`.

### Primitives

Reusable, typed components in `src/ui/` (barrel `src/ui/index.ts`):

- `Button` — primary (Maersk Blue solid), secondary (steel outline), ghost; sizes
  sm/md; built-in loading spinner.
- `Card` — white surface, `rounded-mds` + `shadow-mds`, optional header.
- `Input` / `Textarea` / `Label` — steel border, Maersk Blue focus ring, error state.
- `Badge` — status colors (blue / green / amber / slate).
- `Spinner` — `role=status`, `currentColor`.
- `cn()` — dependency-free class-merge helper (no `clsx` dep, offline-safe).

Global state components live in `src/components/feedback/`
(`Skeleton`/`SkeletonCard`, `EmptyState`, `ErrorBanner`, `InlineStatus`).

### Shell & global styles

- `src/index.css` base layer sets `bg-maersk-surface` / `text-maersk-ink` / `font-sans`,
  a global Maersk Blue `*:focus-visible` ring, and a `prefers-reduced-motion` block.
- `src/components/AppShell.tsx` + `Navbar.tsx` provide the Maersk header (brand bar
  with the `/pmark.svg` logo mark + a thin Maersk Blue accent) and a max-width
  page container.

### Scope

This refresh is **frontend-only** — it does not touch the API, the Prisma schema, the
contracts package, or the anonymous share-link / name+role join flow.
