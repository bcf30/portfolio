# Dependency Cleanup Plan

## Overview
This document outlines the plan to remove unused dependencies from the portfolio project.

## Current Usage Analysis

### ✅ Currently Used Dependencies:
| Package | Used In |
|---------|---------|
| `react`, `react-dom` | Core React |
| `next` | Next.js framework |
| `framer-motion` | `src/app/page.tsx` - motion, useScroll |
| `lucide-react` | `src/app/page.tsx` - Github icon |
| `socket.io-client` | `websocket/frontend.tsx` |

### ⚠️ Conditional/Partial Usage:
| Package | Notes |
|---------|-------|
| `tailwindcss` | Used via `@import "tailwindcss"` in globals.css |
| `typescript` | Required for type checking |
| `eslint` | Build/lint process |
| `sharp` | May be used by Next.js automatically for image optimization |

---

## Unused Dependencies by Category

### Category 1: UI Components (shadcn/ui Radix) - 23 packages
**Safe to remove entirely** - no components installed

```
@radix-ui/react-accordion
@radix-ui/react-alert-dialog
@radix-ui/react-aspect-ratio
@radix-ui/react-avatar
@radix-ui/react-checkbox
@radix-ui/react-collapsible
@radix-ui/react-context-menu
@radix-ui/react-dialog
@radix-ui/react-dropdown-menu
@radix-ui/react-hover-card
@radix-ui/react-label
@radix-ui/react-menubar
@radix-ui/react-navigation-menu
@radix-ui/react-popover
@radix-ui/react-progress
@radix-ui/react-radio-group
@radix-ui/react-scroll-area
@radix-ui/react-select
@radix-ui/react-separator
@radix-ui/react-slider
@radix-ui/react-slot
@radix-ui/react-switch
@radix-ui/react-tabs
@radix-ui/react-toast
@radix-ui/react-toggle
@radix-ui/react-toggle-group
@radix-ui/react-tooltip
```

### Category 2: Drag & Drop
**Safe to remove**

```
@dnd-kit/core
@dnd-kit/sortable
@dnd-kit/utilities
```

### Category 3: Forms & Validation
**Safe to remove**

```
react-hook-form
@hookform/resolvers
zod
```

### Category 4: Data Fetching & State
**Safe to remove**

```
@tanstack/react-query
@tanstack/react-table
zustand
```

### Category 5: Database (Prisma)
**Requires configuration file cleanup**
- Has `prisma/schema.prisma`
- Has `db/custom.db` database file
- Has `db/` and `prisma/` directories

```
@prisma/client
prisma
```

### Category 6: Authentication
**Safe to remove**

```
next-auth
```

### Category 7: Internationalization
**Safe to remove**

```
next-intl
```

### Category 8: Theming
**Safe to remove** (theme is hardcoded in globals.css)

```
next-themes
```

### Category 9: Content/Markdown
**Safe to remove**

```
@mdxeditor/editor
react-markdown
```

### Category 10: Charts & Visualization
**Safe to remove**

```
recharts
```

### Category 11: Carousels
**Safe to remove**

```
embla-carousel-react
```

### Category 12: Animations (CSS)
**Safe to remove**

```
tailwindcss-animate
tw-animate-css
```

### Category 13: UI Utilities (shadcn/ui helpers)
**Safe to remove** - No components installed

```
class-variance-authority
clsx
tailwind-merge
cmdk
vaul
input-otp
```

### Category 14: Date/Time
**Safe to remove**

```
date-fns
react-day-picker
```

### Category 15: Other UI
**Safe to remove**

```
react-resizable-panels
sonner
```

### Category 16: Syntax Highlighting
**Safe to remove**

```
react-syntax-highlighter
```

### Category 17: Utilities
**Safe to remove**

```
uuid
@reactuses/core
z-ai-web-dev-sdk
```

---

## Configuration Files to Clean Up

| File/Directory | Action |
|----------------|--------|
| `components.json` | Delete (shadcn/ui config, not used) |
| `prisma/` directory | Delete (schema not used) |
| `db/` directory | Delete (database not used) |
| `tailwind.config.ts` | Review - may still be needed for custom colors |

---

## Package.json Scripts to Remove

These scripts reference removed dependencies:

```json
"db:push": "prisma db push",
"db:generate": "prisma generate",
"db:migrate": "prisma migrate dev",
"db:reset": "prisma migrate reset"
```

---

## Recommended Removal Order

### Step 1: Remove dependencies with no config files
All except: `prisma`, `@prisma/client`

### Step 2: Remove Prisma-related
- Remove `@prisma/client`, `prisma`
- Delete `prisma/` directory
- Delete `db/` directory
- Remove `db:*` scripts from package.json

### Step 3: Clean up configuration files
- Delete `components.json`
- Review `tailwind.config.ts` for any needed customizations

### Step 4: Verify build works
- Run `bun run build`
- Fix any missing peer dependency errors if necessary

---

## Summary

| Category | Count |
|----------|-------|
| Radix UI (shadcn/ui) | 27 |
| DnD Kit | 3 |
| Forms | 3 |
| Data/State | 3 |
| Database | 2 |
| Auth | 1 |
| i18n | 1 |
| Theming | 1 |
| Markdown | 2 |
| Charts | 1 |
| Carousels | 1 |
| Animations | 2 |
| UI Utilities | 6 |
| Date/Time | 2 |
| Other UI | 2 |
| Syntax | 1 |
| Utilities | 3 |
| **Total** | **~60 packages** |

**Keep**: `react`, `react-dom`, `next`, `framer-motion`, `lucide-react`, `socket.io-client`, `typescript`, `eslint`, `eslint-config-next`, `tailwindcss`, `@tailwindcss/postcss`, `bun-types`, `sharp` (optional, used by Next.js)
