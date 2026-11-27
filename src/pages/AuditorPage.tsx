import { useEffect, useMemo, useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { CheckCircle2, Package, Search, TrendingUp } from 'lucide-react';
import { ApiError } from '../api/client';
import { fetchAuditorDashboard } from '../api/warehouse';
import type { AuditorDashboardResponse } from '../types/warehouse';

export function AuditorPage() {
  const [data, setData] = useState<AuditorDashboardResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchAuditorDashboard()
      .then(setData)
      .catch((err) => {
        setError(err instanceof ApiError ? err.message : 'Failed to load auditor dashboard.');
      })
      .finally(() => setLoading(false));
  }, []);

  const filteredPallets = useMemo(() => {
    if (!data) return [];
    const q = searchQuery.trim().toLowerCase();
    if (!q) return data.pallets;
    return data.pallets.filter(
      (p) =>
        p.pallet_number.toLowerCase().includes(q) ||
        p.barcode.toLowerCase().includes(q) ||
        p.item_name.toLowerCase().includes(q) ||
        p.location_code.toLowerCase().includes(q),
    );
  }, [data, searchQuery]);

  if (loading) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500">
        Loading auditor dashboard...
      </div>
    );
  }

  if (error || !data) {
    return (
      <div
        role="alert"
        className="rounded-xl border border-rose-200 bg-rose-50 p-6 text-sm text-rose-800"
      >
        {error || 'Dashboard data unavailable.'}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Auditor Dashboard</h1>
        <p className="text-sm text-slate-500">
          Current warehouse capacity, 7-day occupancy trend, active pallets, and transfer audit log.
        </p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-slate-500">
              Currently Occupied
            </p>
            <p className="mt-1 text-2xl font-bold text-rose-700" data-testid="auditor-occupied-count">
              {data.summary.occupied_count} / {data.summary.total_storage_locations}
            </p>
          </div>
          <Package className="h-7 w-7 text-rose-500" aria-hidden="true" />
        </div>

        <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-slate-500">
              Currently Free
            </p>
            <p className="mt-1 text-2xl font-bold text-emerald-700" data-testid="auditor-free-count">
              {data.summary.free_count} / {data.summary.total_storage_locations}
            </p>
          </div>
          <CheckCircle2 className="h-7 w-7 text-emerald-500" aria-hidden="true" />
        </div>

        <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-slate-500">
              Occupancy Rate
            </p>
            <p className="mt-1 text-2xl font-bold text-slate-900">
              {data.summary.occupancy_rate}%
            </p>
          </div>
          <TrendingUp className="h-7 w-7 text-slate-600" aria-hidden="true" />
        </div>
      </div>

      {/* 7-day Chart */}
      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-4">
          <h2 className="text-base font-semibold text-slate-900">
            7-Day Occupancy &amp; Free Capacity
          </h2>
          <p className="text-xs text-slate-500">
            Historical days (D-6 to D-1) show recorded end-of-day snapshots across 24 storage slots;
            Today reflects live current warehouse occupancy.
          </p>
        </div>

        <div className="h-72 w-full" data-testid="occupancy-chart">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data.history_7_days} margin={{ top: 8, right: 16, left: 0, bottom: 4 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="label" tick={{ fontSize: 12, fill: '#475569' }} />
              <YAxis domain={[0, 24]} allowDecimals={false} tick={{ fontSize: 12, fill: '#475569' }} />
              <Tooltip />
              <Legend />
              <Bar
                dataKey="occupied_count"
                name="Occupied Slots"
                stackId="capacity"
                fill="#e11d48"
                radius={[0, 0, 0, 0]}
              />
              <Bar
                dataKey="free_count"
                name="Free Capacity"
                stackId="capacity"
                fill="#10b981"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>

      {/* Active Pallet Table */}
      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-base font-semibold text-slate-900">
              Active Stored Pallets ({filteredPallets.length})
            </h2>
            <p className="text-xs text-slate-500">Inspect current pallet placement across A1–E5.</p>
          </div>
          <div className="relative w-full sm:w-64">
            <Search
              className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400"
              aria-hidden="true"
            />
            <input
              type="search"
              placeholder="Filter pallet, barcode, slot..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-lg border border-slate-300 py-2 pl-9 pr-3 text-sm focus:border-slate-900 focus:outline-none"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
            <thead className="bg-slate-50 text-xs font-semibold uppercase text-slate-500">
              <tr>
                <th className="px-3 py-2.5">Slot</th>
                <th className="px-3 py-2.5">Pallet #</th>
                <th className="px-3 py-2.5">Barcode</th>
                <th className="px-3 py-2.5">Item / Product</th>
                <th className="px-3 py-2.5">Qty</th>
                <th className="px-3 py-2.5">Loaded By</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredPallets.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-3 py-6 text-center text-slate-500">
                    No matching stored pallets.
                  </td>
                </tr>
              ) : (
                filteredPallets.map((pallet) => (
                  <tr key={pallet.id} className="hover:bg-slate-50">
                    <td className="px-3 py-2.5 font-bold text-slate-900">{pallet.location_code}</td>
                    <td className="px-3 py-2.5 font-medium text-slate-900">
                      {pallet.pallet_number}
                    </td>
                    <td className="px-3 py-2.5 font-mono text-xs text-slate-700">
                      {pallet.barcode}
                    </td>
                    <td className="px-3 py-2.5 text-slate-800">{pallet.item_name}</td>
                    <td className="px-3 py-2.5 font-semibold text-slate-900">{pallet.quantity}</td>
                    <td className="px-3 py-2.5 text-slate-600">{pallet.loaded_by || 'System'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Recent Movements */}
      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="mb-3 text-base font-semibold text-slate-900">Recent Transfer Activity</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
            <thead className="bg-slate-50 text-xs font-semibold uppercase text-slate-500">
              <tr>
                <th className="px-3 py-2.5">Action</th>
                <th className="px-3 py-2.5">Slot</th>
                <th className="px-3 py-2.5">Pallet #</th>
                <th className="px-3 py-2.5">Item</th>
                <th className="px-3 py-2.5">Qty</th>
                <th className="px-3 py-2.5">Operator</th>
                <th className="px-3 py-2.5">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {data.recent_movements.map((mov) => (
                <tr key={mov.id}>
                  <td className="px-3 py-2.5">
                    <span
                      className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${
                        mov.action === 'LOAD'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-rose-100 text-rose-800'
                      }`}
                    >
                      {mov.action}
                    </span>
                  </td>
                  <td className="px-3 py-2.5 font-semibold text-slate-900">{mov.location_code}</td>
                  <td className="px-3 py-2.5 text-slate-800">{mov.pallet_number}</td>
                  <td className="px-3 py-2.5 text-slate-700">{mov.item_name}</td>
                  <td className="px-3 py-2.5 text-slate-800">{mov.quantity}</td>
                  <td className="px-3 py-2.5 text-slate-600">{mov.performed_by}</td>
                  <td className="px-3 py-2.5 text-xs text-slate-500">
                    {new Date(mov.timestamp).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
