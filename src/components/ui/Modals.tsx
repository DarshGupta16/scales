import { useAppStore, useDatasetStore } from "../../store";
import { AddDatasetModal } from "../datasets/AddDatasetModal";
import { UnitsModal } from "./UnitsModal";
import type { Dataset } from "../../types/dataset";

export function Modals() {
  const { 
    isAddDatasetModalOpen, 
    setAddDatasetModalOpen,
    isUnitsModalOpen,
    setUnitsModalOpen
  } = useAppStore();
  
  const addDataset = useDatasetStore(state => state.addDataset);

  const handleAddDataset = (newDataset: Dataset) => {
    addDataset(newDataset);
    setAddDatasetModalOpen(false);
  };

  return (
    <>
      <AddDatasetModal
        isOpen={isAddDatasetModalOpen}
        onClose={() => setAddDatasetModalOpen(false)}
        onAdd={handleAddDataset}
      />
      <UnitsModal
        isOpen={isUnitsModalOpen}
        onClose={() => setUnitsModalOpen(false)}
        zIndex={200} // Ensure it shows over other modals if needed
      />
    </>
  );
}
