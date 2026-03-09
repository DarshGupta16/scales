import { useState } from "react";
import { Modal } from "../Modal";
import { useMeasurements } from "@/hooks/useMeasurements";

interface AddMeasurementModalProps {
  isOpen: boolean;
  onClose: () => void;
  unit: string;
  datasetSlug: string;
}

export function AddMeasurementModal({
  isOpen,
  onClose,
  unit,
  datasetSlug,
}: AddMeasurementModalProps) {
  const { addMeasurement } = useMeasurements(datasetSlug);
  const [value, setValue] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const numValue = Number(value);
    if (isNaN(numValue) || value === "") return;

    void addMeasurement({
      value: numValue,
      timestamp: new Date().toISOString(),
    });

    setValue("");
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Log Entry">
      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        <div className="flex flex-col gap-2">
          <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-[0.2em] ml-1">
            Value ({unit})
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

        <button type="submit" className="mt-4 brutal-btn-brand py-4 w-full">
          Confirm Entry
        </button>
      </form>
    </Modal>
  );
}
