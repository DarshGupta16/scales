import { Check, Edit2, Plus, Trash2, X } from "lucide-react";
import { useState } from "react";
import { useDatasetStore } from "@/store";
import type { Unit } from "../../types/dataset";
import { generatePbId } from "../../utils/id";
import { Modal } from "./Modal";

interface UnitsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function UnitsModal({ isOpen, onClose }: UnitsModalProps) {
  const { units, addUnit, updateUnit, removeUnit } = useDatasetStore();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editSymbol, setEditSymbol] = useState("");
  const [isAdding, setIsAdding] = useState(false);
  const [newName, setNewName] = useState("");
  const [newSymbol, setNewSymbol] = useState("");

  const handleAdd = async () => {
    if (!newName || !newSymbol) return;
    const unit: Unit = {
      id: generatePbId(),
      name: newName,
      symbol: newSymbol,
      created: Date.now(),
      updated: Date.now(),
    };
    await addUnit(unit);
    setNewName("");
    setNewSymbol("");
    setIsAdding(false);
  };

  const handleUpdate = async (id: string) => {
    if (!editName || !editSymbol) return;
    await updateUnit({
      id,
      name: editName,
      symbol: editSymbol,
      created: Date.now(), // This will be handled by the slice but added for type safety if needed
      updated: Date.now(),
    });
    setEditingId(null);
  };

  const startEditing = (unit: Unit) => {
    setEditingId(unit.id);
    setEditName(unit.name);
    setEditSymbol(unit.symbol);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Manage Units">
      <div className="flex flex-col gap-4 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
        {units.map((unit) => (
          <div
            key={unit.id}
            className="group flex items-center justify-between p-4 bg-zinc-900/50 border border-white/5 rounded-2xl hover:border-white/10 transition-all"
          >
            {editingId === unit.id ? (
              <div className="flex items-center gap-3 w-full">
                <input
                  type="text"
                  value={editSymbol}
                  onChange={(e) => setEditSymbol(e.target.value)}
                  placeholder="Sym"
                  className="w-16 brutal-input text-[10px] font-bold py-2 px-3"
                />
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  placeholder="Name"
                  className="flex-1 brutal-input text-[10px] font-bold py-2 px-3"
                />
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => handleUpdate(unit.id)}
                    className="p-2 text-emerald-500 hover:bg-emerald-500/10 rounded-lg transition-colors"
                  >
                    <Check className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditingId(null)}
                    className="p-2 text-zinc-500 hover:bg-white/10 rounded-lg transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 flex items-center justify-center bg-brand/10 border border-brand/20 text-brand font-bold text-xs rounded-xl uppercase tracking-wider">
                    {unit.symbol}
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-white uppercase tracking-widest">
                      {unit.name}
                    </p>
                    <p className="text-[8px] text-zinc-500 uppercase font-medium tracking-widest mt-0.5">
                      {unit.id.startsWith("unit000") ? "Default" : "Custom"}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    type="button"
                    onClick={() => startEditing(unit)}
                    className="p-2 text-zinc-500 hover:text-white hover:bg-white/10 rounded-lg transition-all"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (confirm("Are you sure you want to delete this unit?")) {
                        removeUnit(unit.id);
                      }
                    }}
                    className="p-2 text-zinc-500 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </>
            )}
          </div>
        ))}

        {isAdding ? (
          <div className="flex flex-col gap-4 p-4 bg-brand/5 border border-brand/20 rounded-2xl animate-in fade-in slide-in-from-top-2">
            <div className="flex items-center gap-3">
              <input
                type="text"
                value={newSymbol}
                onChange={(e) => setNewSymbol(e.target.value)}
                placeholder="Sym (e.g. kg)"
                className="w-24 brutal-input text-[10px] font-bold py-2 px-3"
                autoFocus
              />
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Unit Name (e.g. Kilograms)"
                className="flex-1 brutal-input text-[10px] font-bold py-2 px-3"
              />
            </div>
            <div className="flex items-center gap-2 justify-end">
              <button
                type="button"
                onClick={() => setIsAdding(false)}
                className="px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-zinc-500 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleAdd}
                disabled={!newName || !newSymbol}
                className="px-6 py-2 bg-brand text-white text-[10px] font-bold uppercase tracking-widest rounded-xl hover:brightness-110 disabled:opacity-50 transition-all"
              >
                Save Unit
              </button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setIsAdding(true)}
            className="w-full flex items-center justify-center gap-2 p-4 border border-dashed border-white/10 text-zinc-500 hover:text-brand hover:border-brand/50 hover:bg-brand/5 transition-all rounded-2xl"
          >
            <Plus className="w-4 h-4" />
            <span className="text-[10px] font-bold uppercase tracking-widest">Add New Unit</span>
          </button>
        )}
      </div>
    </Modal>
  );
}
