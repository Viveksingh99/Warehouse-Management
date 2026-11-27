import { ArrowLeftRight, CheckCircle2, Lock, Package, PlusCircle, Trash2 } from 'lucide-react';
import type { UserRole, WarehouseLocation } from '../types/warehouse';

interface LocationInspectorProps {
  location: WarehouseLocation | null;
  userRole: UserRole;
  unloading: boolean;
  onOpenLoadDialog: (preferredLocation?: string) => void;
  onUnload: (locationCode: string) => void;
}

export function LocationInspector({
  location,
  userRole,
  unloading,
  onOpenLoadDialog,
  onUnload,
}: LocationInspectorProps) {
  const canOperate = userRole === 'technician' || userRole === 'admin';

  if (!location) {
    return (
      <aside className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <h3 className="text-base font-semibold text-slate-900">Location Inspector</h3>
        <p className="mt-2 text-sm text-slate-500">
          Select a location on the 5×5 warehouse grid to inspect pallet metadata or run shuttle
          operations.
        </p>
      </aside>
    );
  }

  return (
    <aside
      className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
      data-testid="location-inspector"
    >
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <div>
          <span className="text-xs font-medium uppercase tracking-wider text-slate-500">
            Selected Location
          </span>
          <h3 className="text-xl font-bold text-slate-900" data-testid="inspector-location-code">
            {location.code}
          </h3>
        </div>

        {location.state === 'TRANSFER' && (
          <span className="inline-flex items-center gap-1 rounded-full border border-amber-300 bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-900">
            <ArrowLeftRight className="h-3.5 w-3.5" aria-hidden="true" />
            Transfer Point
          </span>
        )}
        {location.state === 'FREE' && (
          <span className="inline-flex items-center gap-1 rounded-full border border-emerald-300 bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-900">
            <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
            FREE
          </span>
        )}
        {location.state === 'OCCUPIED' && (
          <span className="inline-flex items-center gap-1 rounded-full border border-rose-300 bg-rose-50 px-2.5 py-1 text-xs font-semibold text-rose-900">
            <Package className="h-3.5 w-3.5" aria-hidden="true" />
            OCCUPIED
          </span>
        )}
      </div>

      {location.state === 'TRANSFER' && (
        <div className="mt-4 space-y-4">
          <p className="text-sm text-slate-600">
            Location <strong>A1</strong> is the transient transfer dock where pallets are palletized
            for inbound storage and returned when unloaded from stock.
          </p>
          {canOperate ? (
            <button
              type="button"
              onClick={() => onOpenLoadDialog()}
              className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800 cursor-pointer"
            >
              <PlusCircle className="h-4 w-4" aria-hidden="true" />
              Load New Pallet via A1
            </button>
          ) : (
            <ReadOnlyNote />
          )}
        </div>
      )}

      {location.state === 'FREE' && (
        <div className="mt-4 space-y-4">
          <p className="text-sm text-slate-600">
            Storage slot <strong>{location.code}</strong> is currently free and ready to accept one
            pallet from transfer point A1.
          </p>
          {canOperate ? (
            <button
              type="button"
              data-testid="inspector-load-btn"
              onClick={() => onOpenLoadDialog(location.code)}
              className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-800 cursor-pointer"
            >
              <PlusCircle className="h-4 w-4" aria-hidden="true" />
              Load Pallet to {location.code}
            </button>
          ) : (
            <ReadOnlyNote />
          )}
        </div>
      )}

      {location.state === 'OCCUPIED' && location.pallet && (
        <div className="mt-4 space-y-4">
          <dl className="grid grid-cols-1 gap-2.5 rounded-lg bg-slate-50 p-3.5 text-sm">
            <div className="flex justify-between gap-2">
              <dt className="text-slate-500">Pallet Number</dt>
              <dd className="font-semibold text-slate-900" data-testid="pallet-detail-number">
                {location.pallet.pallet_number}
              </dd>
            </div>
            <div className="flex justify-between gap-2">
              <dt className="text-slate-500">Barcode</dt>
              <dd className="font-mono text-slate-900" data-testid="pallet-detail-barcode">
                {location.pallet.barcode}
              </dd>
            </div>
            <div className="flex justify-between gap-2">
              <dt className="text-slate-500">Item / Product</dt>
              <dd className="font-medium text-right text-slate-900" data-testid="pallet-detail-item">
                {location.pallet.item_name}
              </dd>
            </div>
            <div className="flex justify-between gap-2">
              <dt className="text-slate-500">Quantity</dt>
              <dd className="font-semibold text-slate-900" data-testid="pallet-detail-quantity">
                {location.pallet.quantity}
              </dd>
            </div>
            <div className="flex justify-between gap-2">
              <dt className="text-slate-500">Loaded By</dt>
              <dd className="text-slate-700">{location.pallet.loaded_by || 'System'}</dd>
            </div>
            <div className="flex justify-between gap-2">
              <dt className="text-slate-500">Loaded At</dt>
              <dd className="text-slate-700">
                {new Date(location.pallet.loaded_at).toLocaleString()}
              </dd>
            </div>
          </dl>

          {canOperate ? (
            <button
              type="button"
              data-testid="unload-pallet-btn"
              disabled={unloading}
              onClick={() => onUnload(location.code)}
              className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-rose-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-rose-700 disabled:opacity-50 cursor-pointer"
            >
              <Trash2 className="h-4 w-4" aria-hidden="true" />
              {unloading ? 'Unloading to A1...' : `Unload ${location.code} to A1`}
            </button>
          ) : (
            <ReadOnlyNote />
          )}
        </div>
      )}
    </aside>
  );
}

function ReadOnlyNote() {
  return (
    <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-600">
      <Lock className="h-3.5 w-3.5 shrink-0 text-slate-500" aria-hidden="true" />
      Auditor access is read-only. Stock load/unload operations are restricted to Technicians and
      Admins.
    </div>
  );
}
