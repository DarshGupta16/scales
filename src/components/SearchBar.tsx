import { Search } from "lucide-react";

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
}

export function SearchBar({ value, onChange }: SearchBarProps) {
  return (
    <div className="relative w-full group">
      <div className="absolute inset-y-0 left-0 pl-3 sm:pl-4 flex items-center pointer-events-none">
        <Search className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-zinc-500 group-focus-within:text-brand transition-colors" />
      </div>
      <input
        type="text"
        className="block w-full pl-9 sm:pl-11 pr-4 py-2 sm:py-3 bg-zinc-900/50 border border-white/10 text-white placeholder-zinc-600 focus:outline-none focus:border-brand focus:ring-2 focus:ring-brand/20 transition-all font-sans uppercase tracking-widest text-[10px] sm:text-xs rounded-xl"
        placeholder="Search..."
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}
