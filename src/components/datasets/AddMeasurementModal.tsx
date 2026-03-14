import { useState } from "react";
import { Modal } from "../ui/Modal";
import type { Measurement } from "../../types/dataset";

interface AddMeasurementModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (measurement: Measurement) => void;
  unit: string;
}

export function AddMeasurementModal({
  isOpen,
  onClose,
  onAdd,
  unit,
}: AddMeasurementModalProps) {
  const getLocalDatetimeLocal = () => {
    const now = new Date();
    const offset = now.getTimezoneOffset(); // in minutes
    const local = new Date(now.getTime() - offset * 60000);
    return local.toISOString().slice(0, 16);
  };

  const [value, setValue] = useState("");
  const [timestamp, setTimestamp] = useState(getLocalDatetimeLocal());

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!value || isNaN(Number(value))) return;

    const newMeasurement = {
      id: Math.random().toString(36).substring(7),
      timestamp: new Date(timestamp).getTime(),
      value: Number(value),
    } as Measurement;

    onAdd(newMeasurement);

    // Reset and close
    setValue("");
    setTimestamp(getLocalDatetimeLocal());
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Record Measurement">
      <form onSubmit={handleSubmit} className="flex flex-col gap-8">
        <div className="flex flex-col gap-2">
          <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-[0.2em] ml-1">
            Magnitude ({unit})
          </label>
          <input
            autoFocus
            type="number"
            step="any"
            required
            placeholder="0.00"
            className="brutal-input text-2xl"
            value={value}
            onChange={(e) => setValue(e.target.value)}
          />
        </div>
        <div className="flex flex-col gap-2">
          <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-[0.2em] ml-1">
            Timestamp
          </label>
          <input
            type="datetime-local"
            required
            className="brutal-input scheme-dark"
            value={timestamp}
            onChange={(e) => setTimestamp(e.target.value)}
          />
        </div>
        <button type="submit" className="mt-4 brutal-btn-brand py-4 w-full">
          Append Log
        </button>
      </form>
    </Modal>
  );
}
