import { useCallback, useEffect, useMemo, useState } from 'react';
import { Bot, CheckCircle2, Package, PlusCircle, RefreshCw } from 'lucide-react';
import { ApiError } from '../api/client';
import { fetchWarehouseState, unloadPallet } from '../api/warehouse';
import { LoadPalletModal } from '../components/LoadPalletModal';
import { LocationInspector } from '../components/LocationInspector';
import { WarehouseGrid } from '../components/WarehouseGrid';
import { useAuth } from '../context/AuthContext';
import type { WarehouseStateResponse } from '../types/warehouse';

const POLL_INTERVAL_MS = 2500;

export function FloorPage() {
  const { user } = useAuth();
  const [state, setState] = useState<WarehouseStateResponse | null>(null);
  const [selectedCode, setSelectedCode] = useState<string | null>('A1');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ kind: 'success' | 'error'; text: string } | null>(
    null,
  );
  const [loadModalOpen, setLoadModalOpen] = useState(false);
  const [preferredLoadLoc, setPreferredLoadLoc] = useState<string | undefined>(undefined);
  const [unloading, setUnloading] = useState(false);
  const [lastSync, setLastSync] = useState<Date | null>(null);

  const loadState = useCallback(async (showSpinner = false) => {
    if (showSpinner) setLoading(true);
    try {
      const data = await fetchWarehouseState();
      setState(data);
      setLastSync(new Date());
      setError(null);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to load warehouse floor state.');
    } finally {
      if (showSpinner) setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadState(true);

    const intervalId = window.setInterval(() => {
      if (document.visibilityState === 'visible') {
        void loadState(false);
      }
    }, POLL_INTERVAL_MS);

    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        void loadState(false);
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      window.clearInterval(intervalId);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [loadState]);

  const canOperate = user?.role === 'technician' || user?.role === 'admin';

  const selectedLocation = useMemo(
    () => state?.locations.find((loc) => loc.code === selectedCode) ?? null,
    [state, selectedCode],
  );

  const freeLocations = useMemo(
    () => state?.locations.filter((loc) => loc.state === 'FREE') ?? [],
    [state],
  );

  const handleOpenLoadDialog = (preferred?: string) => {
    setPreferredLoadLoc(preferred);
    setLoadModalOpen(true);
  };

  const handleLoadSuccess = async (message: string, locationCode: string) => {
    setLoadModalOpen(false);
    setSelectedCode(locationCode);
    setFeedback({ kind: 'success', text: message });
    await loadState(false);
  };

  const handleUnload = async (locationCode: string) => {
    setUnloading(true);
    setFeedback(null);
    try {
      const res = await unloadPallet(locationCode);
      setFeedback({ kind: 'success', text: res.message });
      await loadState(false);
    } catch (err) {
      setFeedback({
        kind: 'error',
        text: err instanceof ApiError ? err.message : 'Unable to unload pallet.',
      });
    } finally {
      setUnloading(false);
    }
  };

  if (loading && !state) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500">
        Loading 5×5 warehouse floor...
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Top KPI & Action Bar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Warehouse Floor</h1>
          <p className="text-sm text-slate-500">
            Live 5×5 grid state · Auto-syncs every 2.5 seconds
            {lastSync ? ` · Last updated ${lastSync.toLocaleTimeString()}` : ''}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => void loadState(false)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 cursor-pointer"
          >
            <RefreshCw className="h-4 w-4" aria-hidden="true" />
            Refresh
          </button>

          {canOperate && (
            <button
              type="button"
              data-testid="open-load-dialog-btn"
              onClick={() => handleOpenLoadDialog()}
              className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 cursor-pointer"
            >
              <PlusCircle className="h-4 w-4" aria-hidden="true" />
              Load Pallet
            </button>
          )}
        </div>
      </div>

      {/* Summary Cards */}
      {state && (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-slate-500">
                Occupied Slots
              </p>
              <p className="mt-1 text-2xl font-bold text-rose-700" data-testid="summary-occupied">
                {state.summary.occupied_count} / {state.summary.total_storage_locations}
              </p>
            </div>
            <Package className="h-7 w-7 text-rose-500" aria-hidden="true" />
          </div>

          <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-slate-500">
                Free Slots
              </p>
              <p className="mt-1 text-2xl font-bold text-emerald-700" data-testid="summary-free">
                {state.summary.free_count} / {state.summary.total_storage_locations}
              </p>
            </div>
            <CheckCircle2 className="h-7 w-7 text-emerald-500" aria-hidden="true" />
          </div>

          <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-slate-500">
                Shuttle Telemetry
              </p>
              <p className="mt-1 text-lg font-bold text-slate-900">
                {state.shuttle
                  ? `${state.shuttle.identifier} · ${state.shuttle.status} (${state.shuttle.battery_percentage}%)`
                  : 'Unavailable'}
              </p>
            </div>
            <Bot className="h-7 w-7 text-slate-600" aria-hidden="true" />
          </div>
        </div>
      )}

      {error && (
        <div
          role="alert"
          className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800"
        >
          {error}
        </div>
      )}

      {feedback && (
        <div
          role="status"
          data-testid="floor-feedback"
          className={`rounded-lg border px-4 py-3 text-sm font-medium ${
            feedback.kind === 'success'
              ? 'border-emerald-200 bg-emerald-50 text-emerald-900'
              : 'border-rose-200 bg-rose-50 text-rose-800'
          }`}
        >
          {feedback.text}
        </div>
      )}

      {/* Main Floor Grid + Inspector */}
      {state && user && (
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1fr)_22rem]">
          <WarehouseGrid
            locations={state.locations}
            selectedCode={selectedCode}
            onSelectLocation={setSelectedCode}
          />
          <LocationInspector
            location={selectedLocation}
            userRole={user.role}
            unloading={unloading}
            onOpenLoadDialog={handleOpenLoadDialog}
            onUnload={handleUnload}
          />
        </div>
      )}

      <LoadPalletModal
        open={loadModalOpen}
        freeLocations={freeLocations}
        initialLocationCode={preferredLoadLoc}
        onClose={() => setLoadModalOpen(false)}
        onSuccess={handleLoadSuccess}
      />
    </div>
  );
}
