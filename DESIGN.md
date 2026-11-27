# Architecture & Design Decisions

This document explains how the brief was translated into a persistent full-stack Warehouse Management System (`warehouse-api` + `warehouse-ui`), covering architecture, data modeling, permissions, concurrency safeguards, the 7-day occupancy chart, and engineering trade-offs.

---

## 1. System Architecture

The application is split into two independent repositories:

1. **Backend API (`warehouse-api`)**: Django 5.1 + Django REST Framework + SimpleJWT, backed by SQLite in local evaluation (`SQLITE_PATH`) and PostgreSQL (`DATABASE_URL`) in hosted deployment.
2. **Frontend SPA (`warehouse-ui`)**: React 19 + TypeScript + Vite + Tailwind CSS + Recharts, tested end-to-end with Playwright (Chromium).

All business rules, role checks, uniqueness constraints, and state transitions are enforced on the backend. The frontend mirrors role permissions in navigation and action buttons for usability, but never acts as the security boundary.

---

## 2. Data Model & Relationships

```
User (AbstractUser + role + token_version)
  ├── loaded_pallets ──< Pallet >── location (OneToOne -> Location)
  ├── unloaded_pallets ─┘    │
  └── movements ────────< MovementLog

Location (A1..E5; A1 has is_transfer_point=True)
Shuttle (identifier='SH-01', status, battery_percentage, current_location)
DailyOccupancySnapshot (date, occupied_count, free_count, total_capacity=24, loads_count, unloads_count)
SeedMeta (key='initial_sample_data')
```

### Key Modeling Decisions

- **5×5 Floor & Transfer Point (`Location`)**:
  - Columns `A–E` and rows `1–5` define 25 deterministic cells (`A1`..`E5`).
  - `A1` has `is_transfer_point = True` and is excluded from the 24 storage slots.
  - Both `/api/warehouse/load/` and `/api/warehouse/unload/` explicitly reject `A1` (`400 Bad Request`) because `A1` is transient and holds no stock.
- **Pallet Lifecycle & Historical Traceability (`Pallet` + `MovementLog`)**:
  - Unloading a pallet marks `status = "UNLOADED"`, clears `location = None`, and records `unloaded_by` / `unloaded_at` rather than deleting the row.
  - Partial unique constraints (`unique_active_pallet_number` and `unique_active_pallet_barcode`, conditional on `status="STORED"`) prevent duplicate pallet numbers or barcodes among currently stored stock while allowing the same pallet ID/barcode to be legitimately re-loaded in the future after being unloaded.
  - Every Load and Unload appends an immutable `MovementLog` entry storing a `performed_by_username` snapshot so audit history stays intact even if an admin later removes a user account.

---

## 3. Authentication & Role-Based Access Control

| Capability | Admin | Auditor | Technician |
| --- | :---: | :---: | :---: |
| View 5×5 warehouse map & pallet details | Yes | Yes | Yes |
| View shuttle status page | Yes | Yes | Yes |
| Load & unload pallets | Yes | No (`403`) | Yes |
| View auditor dashboard & 7-day chart | Yes | Yes | No (`403`) |
| Create/edit users, reset passwords, remove access | Yes | No (`403`) | No (`403`) |

### JWT Session & Immediate Revocation (`token_version`)

- Cross-origin hosted deployments (for example Vercel UI calling Render API) frequently face third-party cookie blocking with cookie-based sessions. Stateless JWT Bearer authentication (`Authorization: Bearer <access>`) avoids CSRF complexity and works identically on `http://127.0.0.1` and cross-origin HTTPS.
- **Immediate token invalidation**: Each `User` carries an integer `token_version` embedded in both access and refresh JWT claims. Custom `VersionedJWTAuthentication` verifies `user.is_active` and `token.token_version == user.token_version` on every request. Whenever an admin resets a user's password, changes their role, or disables their account, `token_version` is incremented—revoking previously issued tokens immediately without requiring Redis or a token blacklist table.
- **Self-lockout guard**: Admins cannot delete, deactivate, or demote their own active account (`400 Bad Request`).
- **XSS Trade-off**: Tokens are stored in `localStorage` so sessions survive page refreshes and work across tabs; this relies on React's default output escaping and strict input validation to mitigate XSS. Moving to an `HttpOnly` refresh cookie behind a shared apex domain would harden token storage further in production.

---

## 4. Concurrency, Validation & Failure Handling

- **Atomic Stock Mutations**: `load_pallet_to_location` and `unload_pallet_from_location` wrap all checks and writes in `@transaction.atomic` with `select_for_update()` on the target `Location` (and `Pallet` during unload). In PostgreSQL this acquires row-level locks; in SQLite writes are serialized at the database level.
- **Conflict Detection (`409 Conflict`)**:
  - Loading into an occupied slot returns `409 Conflict`.
  - Loading a duplicate active `pallet_number` or `barcode` returns `409 Conflict` with field context, keeping modal inputs intact so the technician can correct the typo.
  - Unloading an already-free slot returns `409 Conflict`.
- **Input Validation (`400 Bad Request`)**: Rejects blank trimmed strings, non-positive quantities (`quantity < 1`), unknown grid coordinates (`404`), and operations targeting `A1` (`400`).

---

## 5. Multi-Session Synchronization (< 5 Seconds)

- `FloorPage` polls `GET /api/warehouse/state/` every **2,500 ms** while `document.visibilityState === 'visible'` and refreshes immediately upon returning to the tab (`visibilitychange`) as well as immediately after any local Load or Unload mutation.
- This guarantees that changes performed in one browser session appear in any other active browser session well within the 5-second requirement without introducing WebSocket/Redis broker infrastructure.
- **Trade-off**: Polling every 2.5s is simple and reliable over free-tier HTTP hosting, though at larger fleet scales Server-Sent Events or WebSockets would reduce redundant reads.

---

## 6. Historical 7-Day Chart Definition

- Capacity is fixed at **24 storage locations** (`A1` excluded). For every day, `occupied_count + free_count = 24`.
- **Historical Days (`D-6` through `D-1`)**: Seeded reproducibly once (`SeedMeta`) as `DailyOccupancySnapshot` rows representing end-of-day warehouse occupancy over the prior six days (`[10, 12, 11, 14, 13, 9]` occupied out of 24).
- **Current Day (`Today`)**: Computed dynamically from live active `STORED` pallets and synced whenever any Load or Unload occurs. Consequently, loading or unloading a pallet immediately updates both the KPI cards and today's stacked bar in the 7-day chart.
- **Idempotent Seeding**: `python manage.py seed_demo` updates the three demo accounts (`EVAL_*` credentials) idempotently, ensures the 25 locations and shuttle `SH-01` exist, and seeds sample pallets/history only on the first run (`SeedMeta` guard) so repeated setup preserves non-demo accounts and live stock changes.

---

## 7. Accessibility & Mobile Responsiveness

- **Non-color state indicators**: Free cells display green styling + check icon + `"FREE"` text; occupied cells display red styling + package icon + `"OCCUPIED"` text + pallet number; `A1` displays dashed amber styling + transfer icon + `"TRANSFER"` text.
- **Responsive layout**: The 5×5 grid scales cleanly down to `375px` mobile viewports with a collapsible mobile navigation drawer and stacked Location Inspector below the grid.

---

## 8. Deferred Work & Known Limitations

- **Shuttle hardware integration & simulation**: `Shuttle` (`SH-01`) is database-backed as requested; battery drain and travel-time animation are intentionally out of scope.
- **Real-time push**: Uses 2.5s HTTP polling rather than WebSockets/SSE to keep free-tier deployment stateless and simple.
- **Free-tier cold starts**: Hosted free-tier API instances sleep after inactivity, which may cause an initial cold-start delay on the first login request.
