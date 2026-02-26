````markdown
# PLAN.md

# Project Plan — Dataset Visualization UI (Frontend-Only)

---

## 0. Project Overview

This project is a **frontend-only implementation** of a Dataset Visualization application.

The purpose of this phase is to:

- Build a complete, production-quality UI
- Use hardcoded data (NO backend calls)
- Structure everything for future integration with:
  - Prisma
  - SQLite
  - tRPC
  - TanStack Query
- Ensure state shape matches future DB schema
- Focus on clean architecture and extensibility

⚠️ IMPORTANT:
- The agent executing this plan is **not allowed to perform any backend work**
- No API routes
- No database
- No mock servers
- No persistence
- Everything must be driven from hardcoded objects/arrays
- The UI must load all displayed data from structured data objects
- The design skill MUST be used for layout, spacing, visual hierarchy, typography, animation, and micro-interactions

Non-deterministic only for:
- Visual design decisions
- Layout styling
- Animation details
- Micro-interactions

Deterministic for:
- Architecture
- Routing
- Data structure
- Component structure
- State management
- Enums
- File structure

---

# 1. Tech Stack (Frontend Only)

- React
- TypeScript
- TanStack Router
- Recharts (for charts)
- React state (structured for TanStack Query compatibility)
- No backend
- No API calls

Routing convention:
- `/`
- `/datasets/$datasetId`

---

# 2. Data Models (Frontend Representation of Future DB Schema)

## Dataset

```ts
type Dataset = {
  id: string // used as slug in URL
  title: string
  description?: string
  unit: Unit
  views: ViewType[] // persisted configuration
  measurements: Measurement[]
}
````

## Measurement

```ts
type Measurement = {
  id: string
  timestamp: string // ISO string
  value: number
}
```

---

# 3. Enums

## Unit Enum

Must include common units across categories:

* seconds
* minutes
* hours
* days
* weeks
* months
* years
* meters
* kilometers
* miles
* grams
* kilograms
* pounds
* celsius
* fahrenheit
* percentage
* bytes
* kilobytes
* megabytes
* gigabytes
* terabytes
* dollars
* euros
* rupees
* count

Represent as:

```ts
type Unit =
  | "seconds"
  | "minutes"
  ...
```

The unit selector must be:

* Typable dropdown
* Filters suggestions while typing
* Looks clean and modern
* Fully controlled component

## ViewType Enum

Supported views:

* line
* bar
* area
* pie
* scatter

```ts
type ViewType =
  | "line"
  | "bar"
  | "area"
  | "pie"
  | "scatter"
```

---

# 4. Hardcoded Data

Create a `mockDatasets.ts` file.

Export an array:

```ts
export const datasets: Dataset[] = [...]
```

Include at least 3 realistic datasets with:

* 10–20 measurements each
* Different units
* Different view configurations

All UI must consume this array.

No inline hardcoded values inside components.

---

# 5. Application Structure

```
/src
  /routes
    index.tsx
    datasets.$datasetId.tsx
  /components
    DatasetCard.tsx
    DatasetGraph.tsx
    DatasetTable.tsx
    ViewSwitcher.tsx
    Modal.tsx
    ConfirmDialog.tsx
    SearchBar.tsx
    UnitSelector.tsx
  /data
    mockDatasets.ts
  /types
    dataset.ts
```

---

# 6. UI / UX Requirements

## Design Goals

The UI must be:

* Sleek
* Minimalist
* Elegant
* Professional
* Calm
* Easy on the eyes
* Responsive (mobile + desktop)
* Rich with subtle micro-interactions
* Animated (not flashy)

Use design skill to decide:

* Color palette
* Spacing system
* Card styles
* Shadows
* Motion curves
* Typography scale
* Layout grid

Avoid visual clutter.

---

# 7. Home Page (`/`)

## Required Elements

* Top bar

  * App title
  * Search input (filters datasets by title)
* Grid of dataset cards
* Floating "+" button (bottom-right)

## Dataset Card

Must include:

* Dataset title
* Small preview chart (Recharts)
* Unit label
* Subtle hover animation
* Click navigates to `/datasets/$datasetId`

Card layout design is up to agent.

---

# 8. Dataset Detail Page (`/datasets/$datasetId`)

Must:

* Retrieve dataset by id from mock array
* If not found, show minimal error state

## Page Layout Requirements

Top section:

* Primary graph component
* Default active view = first view in dataset.views

Below graph:

* ViewSwitcher

  * Add view (modal)
  * Remove view (confirmation required)
* Table of measurements

Bottom or contextual controls:

* Add measurement (modal)
* Delete measurement (confirmation dialog)

---

# 9. Graph System

Use Recharts.

Graph must adapt to selected ViewType.

Switch dynamically between:

* LineChart
* BarChart
* AreaChart
* PieChart
* ScatterChart

Animation enabled.

Smooth transitions between chart types.

---

# 10. Table

Must show:

* Timestamp
* Value (with unit displayed clearly)
* Delete button per row

Add measurement:

* Modal overlay
* Input fields:

  * Date/time picker
  * Numeric input
* Validation required

---

# 11. View Management

ViewSwitcher must:

* Display active views
* Allow adding new ViewType
* Prevent duplicates
* Remove view with confirmation dialog

UI behavior:

* Add = modal with enum options
* Remove = confirm dialog
* Changes update React state only

---

# 12. State Architecture

Use local React state.

Structure state as if fetched via query:

```ts
const [datasets, setDatasets] = useState<Dataset[]>(...)
```

Operations must:

* Be immutable
* Be structured so that replacing with `useQuery` later is trivial
* Avoid prop drilling (use context if needed)

Do not introduce global state libraries.

---

# 13. Modal System

All create/edit/delete actions use modal overlays.

Modal must:

* Animate in/out
* Blur or dim background
* Trap focus
* Close on escape
* Close on outside click (optional if design supports it)

Use design skill for visual polish.

---

# 14. Micro-Interactions

Include:

* Button hover animations
* Card hover elevation
* Smooth route transitions
* Subtle chart animations
* Modal transitions
* Input focus states
* Success feedback animations

Do NOT make flashy or aggressive animations.

Keep everything calm and professional.

---

# 15. Responsiveness

Must:

* Stack layout vertically on mobile
* Grid adjust automatically
* Charts resize fluidly
* Table scroll horizontally if needed
* Floating button accessible on mobile

---

# 16. Accessibility

Ensure:

* Semantic HTML
* Keyboard navigation works
* Buttons are accessible
* Inputs labeled
* Modals trap focus

---

# 17. Phased Implementation

---

## Phase 1 — Project Setup

* Initialize project
* Install dependencies
* Setup TanStack Router
* Setup folder structure
* Add type definitions
* Add mock data

Commit message:

```
chore: initialize project structure with routing and mock dataset models
```

---

## Phase 2 — Home Page

* Implement top bar
* Implement search filter
* Implement dataset grid
* Implement dataset cards with preview charts
* Add floating action button

Commit message:

```
feat: implement home page with dataset cards and search functionality
```

---

## Phase 3 — Dataset Detail Page

* Implement dynamic route `/datasets/$datasetId`
* Load dataset by id
* Implement main graph
* Implement view switching logic

Commit message:

```
feat: implement dataset detail page with dynamic graph rendering
```

---

## Phase 4 — Table + CRUD UI

* Implement measurement table
* Add measurement modal
* Delete measurement with confirmation

Commit message:

```
feat: add measurement table with add and delete functionality
```

---

## Phase 5 — View Management

* Add ViewSwitcher component
* Add modal for adding views
* Add removal with confirmation
* Prevent duplicates

Commit message:

```
feat: implement persistent view configuration management UI
```

---

## Phase 6 — Polish & UX

* Add animations
* Add micro-interactions
* Improve responsiveness
* Improve visual consistency
* Refine spacing and typography

Commit message:

```
style: refine UI with animations, responsiveness, and design polish
```

---

# 18. Final Constraints

* No backend
* No data fetching
* No external state libraries
* All data must originate from mockDatasets.ts
* Design must use frontend design skill
* Architecture must remain deterministic and clean

---

# End of Plan

```
```
