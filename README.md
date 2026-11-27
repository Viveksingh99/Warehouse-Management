# Warehouse Management System — Frontend (`warehouse-ui`)

Full-stack 5×5 Warehouse Management System built with **React 19 + TypeScript + Vite + Tailwind CSS + Recharts** and a **Django REST Framework** API.

- **Architecture & Design**: [DESIGN.md](./DESIGN.md)
- **AI Workflow & Verification**: [AI_USAGE.md](./AI_USAGE.md)
- **API Setup & Endpoints**: See [warehouse-api README](https://github.com/Viveksingh99/warehouse-api#readme) in the companion API repository (`https://github.com/Viveksingh99/warehouse-api`).
- **Hosted Demo**:
  - Hosted UI URL: `<HOSTED_UI_URL>` (replace after deploying)
  - Hosted API URL: `<HOSTED_API_URL>` (replace after deploying)
  - Browser Login URL: `<HOSTED_UI_URL>/login`

---

## Supported Runtimes

- **Node.js**: `>= 20.0.0` (verified on Node.js `v22.14.0`, npm `10.9.2`)
- **Python (API)**: `3.12` (verified on Python `3.12.10`)

---

## Local Setup & Execution

### 1. Start the API (`warehouse-api`)

```bash
cd warehouse-api
python -m venv .venv
# Linux/macOS: source .venv/bin/activate
# Windows PowerShell: .\.venv\Scripts\Activate.ps1

pip install -r requirements.txt

export SQLITE_PATH=./db.sqlite3
export DJANGO_ALLOWED_HOSTS=127.0.0.1,localhost
export CORS_ALLOWED_ORIGINS=http://127.0.0.1:5173
export EVAL_ADMIN_USERNAME=demo_admin
export EVAL_ADMIN_PASSWORD='<12-to-128-char-password>'
export EVAL_AUDITOR_USERNAME=demo_auditor
export EVAL_AUDITOR_PASSWORD='<12-to-128-char-password>'
export EVAL_TECHNICIAN_USERNAME=demo_technician
export EVAL_TECHNICIAN_PASSWORD='<12-to-128-char-password>'

python manage.py migrate --noinput
python manage.py seed_demo
python manage.py runserver 127.0.0.1:8000 --noreload
```

### 2. Start the UI (`warehouse-ui`)

```bash
cd warehouse-ui
npm install
HOST=127.0.0.1 PORT=5173 API_BASE_URL=http://127.0.0.1:8000 npm start
```

---

## Environment Variables

| Variable | Purpose |
| --- | --- |
| `VITE_API_BASE_URL` / `API_BASE_URL` / `REACT_APP_API_BASE_URL` | Backend API base URL mapped into Vite at startup |
| `HOST` | Dev server bind host (default `127.0.0.1`) |
| `PORT` | Dev server port (default `5173`) |
| `UI_BASE_URL` / `BASE_URL` | Target URL used by Playwright `baseURL` |
| `PLAYWRIGHT_JSON_OUTPUT_FILE` | Output path for the full Playwright JSON report |
| `EVAL_ADMIN_USERNAME` / `EVAL_ADMIN_PASSWORD` | Admin credentials used by Playwright tests |
| `EVAL_AUDITOR_USERNAME` / `EVAL_AUDITOR_PASSWORD` | Auditor credentials used by Playwright tests |
| `EVAL_TECHNICIAN_USERNAME` / `EVAL_TECHNICIAN_PASSWORD` | Technician credentials used by Playwright tests |

---

## Demo Accounts

Hosted passwords are submitted separately in the assessment form and are never committed to repositories or logs:

- **Admin**: `demo_admin`
- **Auditor**: `demo_auditor`
- **Technician**: `demo_technician`

---

## Automated Test Commands & Recorded Results

### Backend (`warehouse-api`)

```bash
python manage.py test
```

- **Recorded result**: `7` tests ran, `7` passed (`OK` in `19.191s`) covering `/health/`, role permissions, load/unload constraints, duplicate pallet rejection, token-version invalidation on password reset/role change, and `seed_demo` idempotency.

### End-to-End Playwright (`warehouse-ui`)

With both API and UI servers running and `EVAL_*` variables set:

```bash
npx playwright install chromium   # once on a fresh machine
npm test
```

- **Recorded result**: `4` Chromium tests ran, `4` passed (`20.0s`), producing a full JSON report at `PLAYWRIGHT_JSON_OUTPUT_FILE`:
  1. Technician load, inspect, duplicate-pallet rejection (`409`), and unload back to A1
  2. Cross-session real-time sync between Technician and Auditor browser contexts within 5 seconds
  3. Auditor read-only enforcement, Shuttle Status telemetry (`SH-01`), and 7-day Auditor Dashboard inspection
  4. Admin user creation, role reassignment, password reset, login verification, access removal, and `375×812` mobile viewport check

---

## Known Limitations

- Multi-session synchronization uses 2.5-second active-tab polling rather than WebSockets.
- Shuttle telemetry (`SH-01`) is database-backed and static; battery drain simulation and movement animation are out of scope.
- Free-tier hosted services may sleep after inactivity and experience a cold-start delay on first request.
