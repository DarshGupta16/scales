import { motion } from "framer-motion";
import { Plus } from "lucide-react";

interface AddDatasetFABProps {
  onClick: () => void;
}

export function AddDatasetFAB({ onClick }: AddDatasetFABProps) {
  return (
    <motion.button
      whileHover={{ scale: 1.05, y: -4 }}
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      className="fixed bottom-10 right-10 w-16 h-16 bg-brand text-white rounded-2xl flex items-center justify-center shadow-2xl shadow-brand/40 transition-all z-30"
      aria-label="Add new dataset"
    >
      <Plus className="w-8 h-8 stroke-[2.5]" />
    </motion.button>
  );
}
