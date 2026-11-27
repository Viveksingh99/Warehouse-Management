# AI Usage & Technical Ownership

## Tools Used

- **Antigravity (Gemini 4 Hydrogen)** was used as an interactive coding and verification assistant during development.

## Tasks Supported

- Designing the relational Django models (`User`, `Location`, `Pallet`, `MovementLog`, `Shuttle`, `DailyOccupancySnapshot`, `SeedMeta`), partial unique constraints, and `token_version`-based JWT revocation.
- Scaffolding the React + TypeScript + Tailwind CSS + Recharts frontend components (`WarehouseGrid`, `LocationInspector`, `LoadPalletModal`, `FloorPage`, `ShuttlePage`, `AuditorPage`, `UsersPage`).
- Writing the Django `APIClient` test suite and the Playwright Chromium end-to-end tests.
- Drafting documentation (`README.md`, `DESIGN.md`, `AI_USAGE.md`).

## Verification & Concrete Corrections

All generated code was executed and verified locally against real databases and running servers:

1. **Django migrations & backend tests**: Ran `python manage.py makemigrations`, `migrate --noinput`, and `python manage.py test` against SQLite (`7/7` tests passed).
2. **Idempotency verification**: Executed `python manage.py seed_demo` twice in succession on a fresh `SQLITE_PATH` database and verified via unit tests and CLI output that demo accounts were updated without duplicating records or wiping modified warehouse stock.
3. **TypeScript build fix**: Initial `npm run build` failed with `TS2339` (`ImportMeta.env`) and `TS2580` (`process` missing in `vite.config.ts` / `playwright.config.ts`). Added `src/vite-env.d.ts`, installed `@types/node`, configured `tsconfig.node.json` `"types": ["node"]`, and re-verified `tsc -b && vite build` passed with zero errors.
4. **Playwright E2E selector refinement**: Initial Playwright run failed on test #4 (`getByLabel('Role')` matched both table row role selects `Role for ...` and the modal's `Role` select). Scoped the test selectors to `getByRole('dialog')` and added explicit password-reset verification; re-ran the full suite against live Django (`runserver --noreload`) and Vite (`npm start`) servers (`4/4` Chromium tests passed in `20.0s`, full JSON report written).

## Remaining Uncertainty / Notes

- Production deployment on external free-tier hosting (database provisioning, environment secret configuration, and HTTPS smoke verification) is performed when publishing the two public repositories and setting up hosting providers.
