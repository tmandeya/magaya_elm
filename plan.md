# Magaya Employee Lifecycle Management System (ELMS) — Build Plan

## Project Overview
Build a comprehensive, branded Employee Lifecycle Management dashboard webapp for Magaya Mining. Covers Onboarding, Offboarding, Transfer workflows + Employee Master Data + Role-based dashboards. 11 sites, multi-role RBAC. Frontend-only SPA (backend mocked) per sandbox constraints.

## Brand Identity
- **Logo**: Black mountain peaks + gold/yellow sun (magaya_logo.png)
- **Colors**: Extracted from logo — Primary black (#1A1A1A), Gold accent (#D4A017), White background
- **Font**: Plus Jakarta Sans
- **Style**: Modern, low-saturation, clean enterprise dashboard, card-based, clear hierarchy

## Tech Stack
- Node.js 20 · Tailwind CSS v3.4.19 · Vite v7.2.4 · React 19 + TypeScript · shadcn/ui
- react-router-dom (HashRouter)
- lucide-react icons
- date-fns for dates

## Application Structure (Mode A — Multi-Agent)

### Pages
1. **Login** — Role selector login (mock auth)
2. **Dashboard** — Role-based KPI cards, workflow status, pending tasks, notifications
3. **Employee Master Data** — Full CRUD table, filters by site/dept/status, search, bulk actions
4. **Employee Profile** — Detailed profile view with tabs (Personal, Employment, IT, Security, Admin, Documents, Photo)
5. **Onboarding Hub** — List of onboarding workflows + Create new onboarding + Detail workflow tracker
6. **Offboarding Hub** — List of offboarding workflows + Create new + Detail workflow tracker
7. **Transfer Hub** — List of transfer workflows + Create new + Detail workflow tracker
8. **Sites Management** — Configure 11 sites, assign key personnel per site
9. **Reports & Analytics** — Dashboard widgets, export functionality (PDF/CSV)
10. **Audit Logs** — Immutable action log table with filtering
11. **Settings** — Admin configuration (dropdowns, approval chains, retention policy)

### Shared Components
- Navbar (with Magaya logo, notifications bell, user role badge)
- Sidebar navigation (role-based menu items)
- Footer (branded)
- Layout wrapper (sidebar + main content)

### Mock Data
- 20+ realistic employee records across multiple sites
- 11 sites with key personnel assigned
- Sample onboarding/offboarding/transfer workflows at various stages
- Role-based view filtering

## Build Phases

### Phase 1: Init Project
- Run init-webapp.sh
- Copy logo to public/

### Phase 2: Design (Pro_Designer)
- Create design.md + per-page design files
- Extract brand colors from logo

### Phase 3: Read Design & Group Pages
- Read design.md
- Group pages into 4-5 parallel agents
- Create branches

### Phase 4: Scaffold
- Landing page (Dashboard) + shared infra (Navbar, Sidebar, Footer, Layout)
- Route stubs for all pages
- Tailwind theme config (brand colors, Plus Jakarta Sans)
- Generate media assets (logo placement)

### Phase 5: Merge Scaffold & Create Page Branches
- Merge scaffold into master
- Create page branches from merged master

### Phase 6: Parallel Page Agents (4 groups)
**Group A**: Employee Master Data + Employee Profile
**Group B**: Onboarding Hub + Offboarding Hub + Transfer Hub (all workflows)
**Group C**: Sites Management + Settings (admin/config pages)
**Group D**: Reports & Analytics + Audit Logs + Login page refinements

### Phase 7: Merge, Build & Deploy
- Octopus merge all branches
- Wire routes in App.tsx
- Build
- Deploy from dist/

## Constraints
- Frontend only — mock all API calls with realistic data
- All workflows simulated with state management
- Document uploads mocked (UI only, no real storage)
- Photo upload mocked (use placeholder)
- Email notifications mocked (UI notification bell)
