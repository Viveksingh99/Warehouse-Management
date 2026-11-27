import { useEffect, useState } from 'react';
import { Activity, BatteryCharging, Bot, MapPin } from 'lucide-react';
import { ApiError } from '../api/client';
import { fetchShuttleStatus } from '../api/warehouse';
import type { ShuttleInfo } from '../types/warehouse';

export function ShuttlePage() {
  const [shuttle, setShuttle] = useState<ShuttleInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchShuttleStatus()
      .then(setShuttle)
      .catch((err) => {
        setError(err instanceof ApiError ? err.message : 'Failed to load shuttle telemetry.');
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500">
        Loading shuttle status...
      </div>
    );
  }

  if (error || !shuttle) {
    return (
      <div
        role="alert"
        className="rounded-xl border border-rose-200 bg-rose-50 p-6 text-sm text-rose-800"
      >
        {error || 'Shuttle telemetry unavailable.'}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Shuttle Status</h1>
        <p className="text-sm text-slate-500">
          Database-backed unit telemetry for the automated floor shuttle.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium uppercase tracking-wider text-slate-500">
              Shuttle Identifier
            </span>
            <Bot className="h-5 w-5 text-slate-500" aria-hidden="true" />
          </div>
          <p className="mt-2 text-2xl font-bold text-slate-900" data-testid="shuttle-identifier">
            {shuttle.identifier}
          </p>
          <p className="mt-1 text-xs text-slate-500">
            Home dock: <span className="font-semibold text-slate-700">{shuttle.current_location}</span>
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium uppercase tracking-wider text-slate-500">
              Operational Status
            </span>
            <Activity className="h-5 w-5 text-emerald-600" aria-hidden="true" />
          </div>
          <div className="mt-2 flex items-center gap-2">
            <span
              data-testid="shuttle-status"
              className="inline-flex items-center rounded-full border border-emerald-300 bg-emerald-50 px-3 py-1 text-sm font-bold text-emerald-900"
            >
              {shuttle.status}
            </span>
          </div>
          <p className="mt-2 text-xs text-slate-500">
            Total logged transfers: <span className="font-semibold">{shuttle.total_movements ?? 0}</span>
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium uppercase tracking-wider text-slate-500">
              Battery Level
            </span>
            <BatteryCharging className="h-5 w-5 text-sky-600" aria-hidden="true" />
          </div>
          <p className="mt-2 text-2xl font-bold text-slate-900" data-testid="shuttle-battery">
            {shuttle.battery_percentage}%
          </p>
          <div
            className="mt-2 h-2.5 w-full overflow-hidden rounded-full bg-slate-100"
            role="progressbar"
            aria-valuenow={shuttle.battery_percentage}
            aria-valuemin={0}
            aria-valuemax={100}
          >
            <div
              className="h-full rounded-full bg-sky-600 transition-all"
              style={{ width: `${shuttle.battery_percentage}%` }}
            />
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-4 text-sm text-slate-600 shadow-sm">
        <MapPin className="h-4 w-4 text-slate-500 shrink-0" aria-hidden="true" />
        <span>
          Last telemetry update: <strong>{new Date(shuttle.updated_at).toLocaleString()}</strong>
        </span>
      </div>
    </div>
  );
}
