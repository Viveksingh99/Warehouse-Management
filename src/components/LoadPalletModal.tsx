import { useEffect, useState, type FormEvent } from 'react';
import { X } from 'lucide-react';
import { ApiError } from '../api/client';
import { loadPallet } from '../api/warehouse';
import type { WarehouseLocation } from '../types/warehouse';

interface LoadPalletModalProps {
  open: boolean;
  freeLocations: WarehouseLocation[];
  initialLocationCode?: string;
  onClose: () => void;
  onSuccess: (message: string, locationCode: string) => void;
}

export function LoadPalletModal({
  open,
  freeLocations,
  initialLocationCode,
  onClose,
  onSuccess,
}: LoadPalletModalProps) {
  const [palletNumber, setPalletNumber] = useState('');
  const [barcode, setBarcode] = useState('');
  const [itemName, setItemName] = useState('');
  const [quantity, setQuantity] = useState('10');
  const [locationCode, setLocationCode] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setError(null);
    const defaultLoc =
      initialLocationCode && freeLocations.some((l) => l.code === initialLocationCode)
        ? initialLocationCode
        : (freeLocations[0]?.code ?? '');
    setLocationCode(defaultLoc);
  }, [open, initialLocationCode, freeLocations]);

  if (!open) return null;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    const qty = Number(quantity);
    if (!palletNumber.trim() || !barcode.trim() || !itemName.trim() || !locationCode) {
      setError('All fields are required.');
      return;
    }
    if (!Number.isInteger(qty) || qty < 1) {
      setError('Quantity must be a positive whole number.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await loadPallet({
        pallet_number: palletNumber.trim(),
        barcode: barcode.trim(),
        item_name: itemName.trim(),
        quantity: qty,
        location_code: locationCode,
      });
      setPalletNumber('');
      setBarcode('');
      setItemName('');
      setQuantity('10');
      onSuccess(res.message, locationCode);
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError('Unable to load pallet. Please try again.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="load-pallet-title"
    >
      <div className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-6 shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h2 id="load-pallet-title" className="text-lg font-bold text-slate-900">
              Load Pallet via A1
            </h2>
            <p className="text-xs text-slate-500">
              Palletize at A1 and dispatch shuttle to storage slot.
            </p>
          </div>
          <button
            type="button"
            aria-label="Close load pallet dialog"
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-900 cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          {error && (
            <div
              role="alert"
              data-testid="load-modal-error"
              className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-800"
            >
              {error}
            </div>
          )}

          <div>
            <label htmlFor="load-pallet-number" className="block text-sm font-medium text-slate-700">
              Pallet number
            </label>
            <input
              id="load-pallet-number"
              type="text"
              required
              placeholder="e.g. PLT-2045"
              value={palletNumber}
              onChange={(e) => setPalletNumber(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-slate-900 focus:outline-none"
            />
          </div>

          <div>
            <label htmlFor="load-barcode" className="block text-sm font-medium text-slate-700">
              Barcode
            </label>
            <input
              id="load-barcode"
              type="text"
              required
              placeholder="e.g. 890100204500"
              value={barcode}
              onChange={(e) => setBarcode(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-slate-900 focus:outline-none"
            />
          </div>

          <div>
            <label htmlFor="load-item-name" className="block text-sm font-medium text-slate-700">
              Item / product name
            </label>
            <input
              id="load-item-name"
              type="text"
              required
              placeholder="e.g. Pneumatic Actuator"
              value={itemName}
              onChange={(e) => setItemName(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-slate-900 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="load-quantity" className="block text-sm font-medium text-slate-700">
                Quantity
              </label>
              <input
                id="load-quantity"
                type="number"
                min={1}
                step={1}
                required
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-slate-900 focus:outline-none"
              />
            </div>

            <div>
              <label htmlFor="load-destination" className="block text-sm font-medium text-slate-700">
                Destination slot
              </label>
              <select
                id="load-destination"
                required
                value={locationCode}
                onChange={(e) => setLocationCode(e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-slate-900 focus:outline-none"
              >
                {freeLocations.length === 0 ? (
                  <option value="">No free slots</option>
                ) : (
                  freeLocations.map((loc) => (
                    <option key={loc.code} value={loc.code}>
                      {loc.code}
                    </option>
                  ))
                )}
              </select>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              data-testid="load-submit-btn"
              disabled={submitting || freeLocations.length === 0}
              className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-50 cursor-pointer"
            >
              {submitting ? 'Transferring...' : 'Submit Load'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
