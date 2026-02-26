import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { mockDatasets } from "../data/mockDatasets";
import { DatasetCard } from "../components/DatasetCard";
import { SearchBar } from "../components/SearchBar";
import { Modal } from "../components/Modal";
import { UnitSelector } from "../components/UnitSelector";
import { Plus, LayoutGrid, Info } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import type { Dataset, Unit } from "../types/dataset";

export const Route = createFileRoute("/")({
  component: Index,
});

function Index() {
  const [datasets, setDatasets] = useState<Dataset[]>(mockDatasets);
  const [searchQuery, setSearchQuery] = useState("");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Form State
  const [newTitle, setNewTitle] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newUnit, setNewUnit] = useState<Unit>("count");

  const filteredDatasets = useMemo(() => {
    return datasets.filter(
      (dataset) =>
        dataset.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        dataset.unit.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [datasets, searchQuery]);

  const handleAddDataset = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle) return;

    const newId = newTitle.toLowerCase().replace(/\s+/g, "-");
    const newDataset: Dataset = {
      id: `${newId}-${Math.random().toString(36).substring(7)}`,
      title: newTitle,
      description: newDesc,
      unit: newUnit,
      views: ["line"],
      measurements: [],
    };

    setDatasets([newDataset, ...datasets]);
    setIsAddModalOpen(false);
    setNewTitle("");
    setNewDesc("");
    setNewUnit("count");
  };

  return (
    <div className="min-h-screen pb-24 bg-black relative selection:bg-brand selection:text-black">
      {/* Brutalist Grid Background overlay */}
      <div className="fixed inset-0 pointer-events-none opacity-20" style={{ backgroundImage: 'linear-gradient(#333 1px, transparent 1px), linear-gradient(90deg, #333 1px, transparent 1px)', backgroundSize: '40px 40px' }}></div>
      
      {/* Top Bar */}
      <header className="sticky top-0 z-10 bg-black border-b-2 border-white brutal-shadow mb-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-brand border-2 border-white flex items-center justify-center brutal-shadow-brand">
              <span className="font-display font-bold text-black text-xl">S</span>
            </div>
            <h1 className="text-2xl font-display font-extrabold text-white tracking-tighter uppercase hidden sm:block">
              Scales
            </h1>
          </div>

          <SearchBar value={searchQuery} onChange={setSearchQuery} />

          <div className="flex items-center gap-2">
            <button className="hidden sm:flex items-center gap-2 px-4 py-2 text-white border-2 border-white hover:bg-white hover:text-black transition-colors font-bold uppercase tracking-widest text-xs h-full">
              <LayoutGrid className="w-4 h-4" />
              <span>Grid</span>
            </button>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 relative z-0">
        <div className="flex flex-col gap-12">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6">
            <div className="max-w-2xl">
              <h2 className="text-5xl md:text-7xl font-display font-extrabold text-white tracking-tighter uppercase leading-none mb-6">
                Data<br/><span className="text-brand">Collections</span>
              </h2>
              <p className="text-lg text-zinc-400 font-sans uppercase tracking-widest border-l-4 border-brand pl-4">
                Raw metrics. Unfiltered truth.
              </p>
            </div>
          </div>

          <div className="relative">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              <AnimatePresence mode="popLayout">
                {filteredDatasets.map((dataset) => (
                  <motion.div
                    key={dataset.id}
                    layout
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ duration: 0.3, ease: "easeOut" }}
                  >
                    <DatasetCard dataset={dataset} />
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>

            {filteredDatasets.length === 0 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-32 bg-[#111] border-2 border-white brutal-shadow mt-8"
              >
                <div className="w-20 h-20 bg-black border-2 border-white flex items-center justify-center mx-auto mb-6 brutal-shadow">
                  <Info className="w-10 h-10 text-white" />
                </div>
                <h3 className="text-2xl font-display font-bold text-white mb-2 uppercase">
                  Void Detected
                </h3>
                <p className="text-zinc-500 font-sans uppercase tracking-wider">
                  No datasets match your query.
                </p>
              </motion.div>
            )}
          </div>
        </div>
      </main>

      {/* Floating Action Button */}
      <motion.button
        whileHover={{ scale: 1.05, y: -4 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsAddModalOpen(true)}
        className="fixed bottom-10 right-10 w-20 h-20 bg-brand text-black border-4 border-white flex items-center justify-center brutal-shadow transition-all z-30"
        aria-label="Add new dataset"
      >
        <Plus className="w-10 h-10 stroke-[3]" />
      </motion.button>

      {/* Add Dataset Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="INITIALIZE NEW TRACKER"
      >
        <form onSubmit={handleAddDataset} className="flex flex-col gap-6">
          <div className="flex flex-col gap-2">
            <label className="text-xs font-bold text-brand uppercase tracking-widest">
              Identifier
            </label>
            <input
              autoFocus
              type="text"
              required
              placeholder="E.G. CALORIES, WORKOUTS"
              className="brutal-input"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-xs font-bold text-brand uppercase tracking-widest">
              Parameters (Optional)
            </label>
            <textarea
              rows={3}
              placeholder="DEFINE THE METRIC..."
              className="brutal-input resize-none"
              value={newDesc}
              onChange={(e) => setNewDesc(e.target.value)}
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-xs font-bold text-brand uppercase tracking-widest">
              Measurement Unit
            </label>
            <UnitSelector value={newUnit} onChange={setNewUnit} />
          </div>

          <button
            type="submit"
            className="mt-4 brutal-btn-brand text-lg py-4 w-full"
          >
            EXECUTE CREATION
          </button>
        </form>
      </Modal>
    </div>
  );
}
