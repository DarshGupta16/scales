import { Search } from "lucide-react";

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
}

export function SearchBar({ value, onChange }: SearchBarProps) {
  return (
    <div className="relative max-w-md w-full">
      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
        <Search className="h-5 w-5 text-brand" />
      </div>
      <input
        type="text"
        className="block w-full pl-12 pr-4 py-3 border-2 border-white bg-black text-white placeholder-zinc-600 focus:outline-none focus:border-brand focus:shadow-[4px_4px_0_0_var(--color-brand)] transition-all font-sans uppercase tracking-widest text-sm rounded-none"
        placeholder="LOCATE DATA..."
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}
