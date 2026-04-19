import { ListMusic } from 'lucide-react';
import { motion } from 'framer-motion';

interface StatsCardsProps {
  totalTracks: number | null;
  totalPlaylists: number | null;
  loading: boolean;
}

export default function StatsCards({ totalTracks, totalPlaylists, loading }: StatsCardsProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-2 gap-4 mt-6">
        <div className="h-28 bg-zinc-800/50 rounded-2xl animate-pulse"></div>
        <div className="h-28 bg-zinc-800/50 rounded-2xl animate-pulse"></div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-4 mt-6">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-gradient-to-br from-zinc-800/80 to-zinc-900/80 p-6 rounded-2xl border border-zinc-700/50 shadow-lg relative overflow-hidden"
      >
        <div className="absolute top-[-20%] right-[-10%] w-24 h-24 bg-[#1DB954] blur-3xl opacity-10 rounded-full pointer-events-none" />
        <div className="flex items-center gap-3 text-zinc-400 mb-2">
          <ListMusic size={18} />
          <span className="font-semibold text-sm">Listas Creadas</span>
        </div>
        <h2 className="text-4xl font-extrabold text-white">{totalPlaylists?.toLocaleString() || '-'}</h2>
      </motion.div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-gradient-to-br from-zinc-800/80 to-zinc-900/80 p-6 rounded-2xl border border-zinc-700/50 shadow-lg relative overflow-hidden group"
      >
        <div className="absolute top-[-20%] right-[-10%] w-24 h-24 bg-[#1ed760] blur-3xl opacity-10 rounded-full pointer-events-none group-hover:opacity-30 transition-opacity" />
        <div className="flex items-center gap-3 text-zinc-400 mb-2">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-[#1ed760]" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
          </svg>
          <span className="font-semibold text-sm">Tus Liked Songs</span>
        </div>
        <h2 className="text-4xl font-extrabold text-white">{totalTracks?.toLocaleString() || '-'}</h2>
      </motion.div>
    </div>
  );
}
