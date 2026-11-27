import { ArrowLeftRight, CheckCircle2, Package } from 'lucide-react';
import type { WarehouseLocation } from '../types/warehouse';

const COLUMNS = ['A', 'B', 'C', 'D', 'E'] as const;
const ROWS = [1, 2, 3, 4, 5] as const;

interface WarehouseGridProps {
  locations: WarehouseLocation[];
  selectedCode: string | null;
  onSelectLocation: (code: string) => void;
}

export function WarehouseGrid({
  locations,
  selectedCode,
  onSelectLocation,
}: WarehouseGridProps) {
  const byCode = new Map(locations.map((loc) => [loc.code, loc]));

  return (
    <section
      aria-label="5 by 5 warehouse floor map"
      className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5"
    >
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-base font-semibold text-slate-900">Warehouse Floor (A1–E5)</h2>
          <p className="text-xs text-slate-500">
            Select any cell to inspect pallet details or perform stock actions.
          </p>
        </div>

        <div
          className="flex flex-wrap items-center gap-2 text-xs font-medium"
          aria-label="Floor state legend"
        >
          <span className="inline-flex items-center gap-1.5 rounded-md border border-amber-400 bg-amber-50 px-2 py-1 text-amber-950">
            <ArrowLeftRight className="h-3.5 w-3.5 text-amber-700" aria-hidden="true" />
            A1 Transfer Point
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-md border border-emerald-500 bg-emerald-50 px-2 py-1 text-emerald-950">
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-700" aria-hidden="true" />
            Free
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-md border border-rose-500 bg-rose-50 px-2 py-1 text-rose-950">
            <Package className="h-3.5 w-3.5 text-rose-700" aria-hidden="true" />
            Occupied
          </span>
        </div>
      </div>

      {/* Column Headers */}
      <div className="grid grid-cols-[1.5rem_repeat(5,minmax(0,1fr))] gap-1.5 sm:gap-2.5 mb-1.5 sm:mb-2">
        <div aria-hidden="true" />
        {COLUMNS.map((col) => (
          <div
            key={col}
            className="text-center text-xs font-bold uppercase tracking-wider text-slate-500"
          >
            {col}
          </div>
        ))}
      </div>

      {/* 5x5 Grid */}
      <div className="space-y-1.5 sm:space-y-2.5">
        {ROWS.map((row) => (
          <div
            key={row}
            className="grid grid-cols-[1.5rem_repeat(5,minmax(0,1fr))] items-stretch gap-1.5 sm:gap-2.5"
          >
            <div className="flex items-center justify-center text-xs font-bold text-slate-500">
              {row}
            </div>

            {COLUMNS.map((col) => {
              const code = `${col}${row}`;
              const loc = byCode.get(code);
              const isSelected = selectedCode === code;
              const state = loc?.state ?? (code === 'A1' ? 'TRANSFER' : 'FREE');

              if (state === 'TRANSFER') {
                return (
                  <button
                    key={code}
                    type="button"
                    data-testid={`cell-${code}`}
                    data-state="TRANSFER"
                    aria-label={`${code}, Transfer Point, entry and exit`}
                    aria-pressed={isSelected}
                    onClick={() => onSelectLocation(code)}
                    className={`group flex min-h-[4.5rem] sm:min-h-[5.5rem] flex-col justify-between rounded-lg border-2 border-dashed border-amber-500 bg-amber-50/90 p-1.5 sm:p-2.5 text-left transition cursor-pointer hover:bg-amber-100/80 ${
                      isSelected ? 'ring-2 ring-slate-900 ring-offset-2' : ''
                    }`}
                  >
                    <div className="flex items-center justify-between gap-1">
                      <span className="text-xs sm:text-sm font-bold text-amber-950">{code}</span>
                      <ArrowLeftRight
                        className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-amber-700 shrink-0"
                        aria-hidden="true"
                      />
                    </div>
                    <div>
                      <span className="block text-[10px] sm:text-xs font-bold uppercase tracking-wide text-amber-900">
                        TRANSFER
                      </span>
                      <span className="hidden sm:block text-[11px] text-amber-800">
                        Entry / Exit
                      </span>
                    </div>
                  </button>
                );
              }

              if (state === 'OCCUPIED') {
                return (
                  <button
                    key={code}
                    type="button"
                    data-testid={`cell-${code}`}
                    data-state="OCCUPIED"
                    aria-label={`${code}, Occupied, Pallet ${loc?.pallet?.pallet_number ?? ''}`}
                    aria-pressed={isSelected}
                    onClick={() => onSelectLocation(code)}
                    className={`group flex min-h-[4.5rem] sm:min-h-[5.5rem] flex-col justify-between rounded-lg border-2 border-rose-500 bg-rose-50 p-1.5 sm:p-2.5 text-left transition cursor-pointer hover:bg-rose-100/80 ${
                      isSelected ? 'ring-2 ring-slate-900 ring-offset-2' : ''
                    }`}
                  >
                    <div className="flex items-center justify-between gap-1">
                      <span className="text-xs sm:text-sm font-bold text-rose-950">{code}</span>
                      <Package
                        className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-rose-700 shrink-0"
                        aria-hidden="true"
                      />
                    </div>
                    <div className="min-w-0">
                      <span className="block text-[10px] sm:text-[11px] font-bold uppercase tracking-wide text-rose-800">
                        OCCUPIED
                      </span>
                      <span className="block truncate text-[10px] sm:text-xs font-medium text-rose-950">
                        {loc?.pallet?.pallet_number}
                      </span>
                    </div>
                  </button>
                );
              }

              return (
                <button
                  key={code}
                  type="button"
                  data-testid={`cell-${code}`}
                  data-state="FREE"
                  aria-label={`${code}, Free storage slot`}
                  aria-pressed={isSelected}
                  onClick={() => onSelectLocation(code)}
                  className={`group flex min-h-[4.5rem] sm:min-h-[5.5rem] flex-col justify-between rounded-lg border-2 border-emerald-500 bg-emerald-50 p-1.5 sm:p-2.5 text-left transition cursor-pointer hover:bg-emerald-100/80 ${
                    isSelected ? 'ring-2 ring-slate-900 ring-offset-2' : ''
                  }`}
                >
                  <div className="flex items-center justify-between gap-1">
                    <span className="text-xs sm:text-sm font-bold text-emerald-950">{code}</span>
                    <CheckCircle2
                      className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-emerald-700 shrink-0"
                      aria-hidden="true"
                    />
                  </div>
                  <div>
                    <span className="block text-[10px] sm:text-[11px] font-bold uppercase tracking-wide text-emerald-800">
                      FREE
                    </span>
                    <span className="hidden sm:block text-[11px] text-emerald-700">Available</span>
                  </div>
                </button>
              );
            })}
          </div>
        ))}
      </div>
    </section>
  );
}
