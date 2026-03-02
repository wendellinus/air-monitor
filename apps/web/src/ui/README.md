# UI Directory Structure

This folder is organized by feature domain to improve readability and onboarding.

## Current layout

- `admin/`
  - `layout/`: admin shell and sidebar/navigation components
  - `pages/`: route pages under `/admin/*`
  - `index.ts`: admin public exports for router imports
- `screen/`
  - `screen-page.tsx`: large-screen monitoring page
  - `widgets/`: screen-only visual/map widgets
  - `index.ts`: screen public export
- `plan/`
  - `plan-page.tsx`: planning page
  - `index.ts`: plan public export

## Import conventions

- Prefer module-level entrypoints in route setup:
  - `@/ui/admin`
  - `@/ui/screen`
  - `@/ui/plan`
- Prefer absolute aliases for shared code:
  - `@/shared/api`
  - `@/shared/types`
  - `@/shared/auth`

