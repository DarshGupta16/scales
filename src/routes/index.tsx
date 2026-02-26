import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { mockDatasets } from "../data/mockDatasets";
import { DatasetCard } from "../components/DatasetCard";
import { SearchBar } from "../components/SearchBar";
import { Modal } from "../components/Modal";
import { UnitSelector } from "../components/UnitSelector";
import { Plus, LayoutGrid, Info, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import type { Dataset, Unit } from "../types/dataset";
import { useTRPC } from "../trpc/client";

export const Route = createFileRoute("/")({
  component: Index,
});

function Index() {
  const [datasets, setDatasets] = useState<Dataset[]>(mockDatasets);
  const [searchQuery, setSearchQuery] = useState("");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // tRPC Test using Query Options (tRPC 11 pattern)
  const trpc = useTRPC();
  const hello = useQuery(trpc.hello.queryOptions({ name: "Builder" }));

  // Form State
  const [newTitle, setNewTitle] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newUnit, setNewUnit] = useState<Unit>("count");

  const filteredDatasets = useMemo(() => {
    return datasets.filter(
      (dataset) =>
        dataset.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        dataset.unit.toLowerCase().includes(searchQuery.toLowerCase()),
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
    <div className="min-h-screen pb-24 bg-[#050505] relative selection:bg-brand selection:text-white">
      {/* Subtle Grain Overlay */}
      <div
        className="fixed inset-0 pointer-events-none opacity-[0.03] z-[100]"
        style={{
          backgroundImage:
            'url("https://grainy-gradients.vercel.app/noise.svg")',
        }}
      ></div>

      {/* Top Bar */}
      <header className="sticky top-0 z-50 bg-[#050505]/80 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-brand/10 border border-brand/20 rounded-xl flex items-center justify-center overflow-hidden">
              <img
                src="/icon.png"
                alt="Scales Logo"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="flex flex-col">
              <h1 className="text-xl font-display font-bold text-white tracking-tight uppercase leading-tight">
                Scales
              </h1>
              <div className="flex items-center gap-2 text-[10px] font-mono text-zinc-500 uppercase tracking-widest">
                {hello.isLoading ? (
                  <Loader2 className="w-2 h-2 animate-spin" />
                ) : (
                  <span className="text-brand">●</span>
                )}
                {hello.data?.greeting ?? "Connecting..."}
              </div>
            </div>
          </div>

          <SearchBar value={searchQuery} onChange={setSearchQuery} />

          <div className="flex items-center gap-2">
            <button className="hidden sm:flex items-center gap-2 px-4 py-2 text-zinc-400 hover:text-white transition-colors font-bold uppercase tracking-widest text-xs h-full">
              <LayoutGrid className="w-4 h-4" />
              <span>Grid</span>
            </button>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 relative z-0">
        <div className="flex flex-col gap-16">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6">
            <div className="max-w-2xl">
              <h2 className="text-4xl md:text-6xl font-display font-extrabold text-white tracking-tighter uppercase leading-none mb-6">
                Your
                <br />
                <span className="text-brand">Collections</span>
              </h2>
              <p className="text-sm text-zinc-500 font-sans uppercase tracking-[0.2em] border-l border-brand/50 pl-4">
                Refined metrics. Elegant tracking.
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
                    transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
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
                className="text-center py-32 bg-white/5 border border-white/10 rounded-[2rem]"
              >
                <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <Info className="w-8 h-8 text-zinc-600" />
                </div>
                <h3 className="text-xl font-display font-bold text-white mb-2 uppercase tracking-tight">
                  No records found
                </h3>
                <p className="text-zinc-500 font-sans uppercase tracking-widest text-xs">
                  The void remains silent.
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
        className="fixed bottom-10 right-10 w-16 h-16 bg-brand text-white rounded-2xl flex items-center justify-center shadow-2xl shadow-brand/40 transition-all z-30"
        aria-label="Add new dataset"
      >
        <Plus className="w-8 h-8 stroke-[2.5]" />
      </motion.button>

      {/* Add Dataset Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Create Collection"
      >
        <form onSubmit={handleAddDataset} className="flex flex-col gap-6">
          <div className="flex flex-col gap-2">
            <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-[0.2em] ml-1">
              Title
            </label>
            <input
              autoFocus
              type="text"
              required
              placeholder="e.g. Daily Momentum"
              className="brutal-input"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-[0.2em] ml-1">
              Description
            </label>
            <textarea
              rows={3}
              placeholder="What defines this metric?"
              className="brutal-input resize-none"
              value={newDesc}
              onChange={(e) => setNewDesc(e.target.value)}
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-[0.2em] ml-1">
              Unit
            </label>
            <UnitSelector value={newUnit} onChange={setNewUnit} />
          </div>

          <button type="submit" className="mt-4 brutal-btn-brand py-4 w-full">
            Create Tracker
          </button>
        </form>
      </Modal>
    </div>
  );
}
