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
    <div className="min-h-screen pb-24 bg-slate-50">
      {/* Top Bar */}
      <header className="sticky top-0 z-10 bg-white/80 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <img src="/icon.png" alt="logo" className="w-10 rounded-2xl" />
            <h1 className="text-xl font-bold text-slate-900 tracking-tight hidden sm:block">
              Scales
            </h1>
          </div>

          <SearchBar value={searchQuery} onChange={setSearchQuery} />

          <div className="flex items-center gap-2">
            <button className="hidden sm:flex items-center gap-2 px-4 py-2 text-slate-500 hover:text-slate-900 transition-colors font-medium text-sm">
              <LayoutGrid className="w-4 h-4" />
              <span>Grid</span>
            </button>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="flex flex-col gap-10">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6">
            <div className="max-w-xl">
              <h2 className="text-4xl font-extrabold text-slate-900 tracking-tight">
                Your Collections
              </h2>
              <p className="mt-3 text-lg text-slate-500 leading-relaxed">
                Beautifully simple data tracking. Monitor your metrics,
                visualize trends, and stay on top of your progress.
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
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ duration: 0.25, ease: "easeOut" }}
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
                className="text-center py-32 bg-white rounded-[2.5rem] border-2 border-dashed border-slate-200"
              >
                <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Info className="w-8 h-8 text-slate-300" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-1">
                  No datasets found
                </h3>
                <p className="text-slate-500">
                  Try a different search term or create a new collection.
                </p>
              </motion.div>
            )}
          </div>
        </div>
      </main>

      {/* Floating Action Button */}
      <motion.button
        whileHover={{ scale: 1.05, y: -2 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsAddModalOpen(true)}
        className="fixed bottom-10 right-10 w-16 h-16 bg-indigo-600 text-white rounded-full shadow-2xl shadow-indigo-300 flex items-center justify-center hover:bg-indigo-700 transition-all z-30 ring-4 ring-white"
        aria-label="Add new dataset"
      >
        <Plus className="w-8 h-8" />
      </motion.button>

      {/* Add Dataset Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Create New Collection"
      >
        <form onSubmit={handleAddDataset} className="flex flex-col gap-6">
          <div className="flex flex-col gap-2">
            <label className="text-sm font-bold text-slate-700">
              Collection Title
            </label>
            <input
              autoFocus
              type="text"
              required
              placeholder="e.g. Daily Steps, Weekly Sales"
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-sm font-bold text-slate-700">
              Description (Optional)
            </label>
            <textarea
              rows={3}
              placeholder="What are you tracking?"
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all resize-none"
              value={newDesc}
              onChange={(e) => setNewDesc(e.target.value)}
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-sm font-bold text-slate-700">
              Measurement Unit
            </label>
            <UnitSelector value={newUnit} onChange={setNewUnit} />
          </div>

          <button
            type="submit"
            className="mt-2 w-full py-4 bg-indigo-600 text-white rounded-2xl font-bold shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all active:scale-[0.98]"
          >
            Create Collection
          </button>
        </form>
      </Modal>
    </div>
  );
}
