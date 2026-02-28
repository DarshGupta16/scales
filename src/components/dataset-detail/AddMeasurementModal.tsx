import { Modal } from "../Modal";
import { useState } from "react";

interface AddMeasurementModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (value: number, timestamp: string) => void;
  unit: string;
}

export function AddMeasurementModal({ isOpen, onClose, onAdd, unit }: AddMeasurementModalProps) {
  const [newValue, setNewValue] = useState("");
  const [newTimestamp, setNewTimestamp] = useState(
    new Date().toISOString().slice(0, 16),
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newValue || isNaN(Number(newValue))) return;
    onAdd(Number(newValue), new Date(newTimestamp).toISOString());
    setNewValue("");
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Record Measurement"
    >
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
            value={newValue}
            onChange={(e) => setNewValue(e.target.value)}
          />
        </div>
        <div className="flex flex-col gap-2">
          <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-[0.2em] ml-1">
            Timestamp
          </label>
          <input
            type="datetime-local"
            required
            className="brutal-input [color-scheme:dark]"
            value={newTimestamp}
            onChange={(e) => setNewTimestamp(e.target.value)}
          />
        </div>
        <button type="submit" className="mt-4 brutal-btn-brand py-4 w-full">
          Append Log
        </button>
      </form>
    </Modal>
  );
}
