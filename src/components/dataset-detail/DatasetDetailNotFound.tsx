import { Link } from "@tanstack/react-router";

export function DatasetDetailNotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8 text-center bg-[#050505] selection:bg-brand selection:text-white relative">
      <div className="bg-[#0a0a0a] p-16 border border-white/10 rounded-[3rem] shadow-2xl relative z-10">
        <h1 className="text-5xl font-display font-extrabold text-white mb-6 uppercase tracking-tighter">
          Records
          <br />
          <span className="text-red-500">Absent</span>
        </h1>
        <p className="text-zinc-500 font-sans uppercase tracking-[0.2em] mb-10 border-l-2 border-red-500/50 pl-6 text-left text-xs">
          The requested entity has been purged or never existed.
        </p>
        <Link
          to="/"
          className="inline-block brutal-btn-brand w-full text-center"
        >
          Return Home
        </Link>
      </div>
    </div>
  );
}
