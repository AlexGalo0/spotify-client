import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

interface PlaylistGridProps {
  playlists: any[];
  loading: boolean;
}

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.05 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, scale: 0.95, y: 20 },
  show: { opacity: 1, scale: 1, y: 0, transition: { type: 'spring' as const, stiffness: 200, damping: 20 } },
  exit: { opacity: 0, scale: 0.95, transition: { duration: 0.2 } }
};

export default function PlaylistGrid({ playlists, loading }: PlaylistGridProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
        {[...Array(12)].map((_, i) => (
           <div key={`sk-${i}`} className="animate-pulse flex flex-col bg-zinc-900/50 p-4 rounded-xl border border-zinc-800/50">
             <div className="bg-zinc-800 aspect-square rounded-md w-full mb-4"></div>
             <div className="h-4 bg-zinc-800 rounded w-3/4 mb-2"></div>
             <div className="h-3 bg-zinc-800 rounded w-1/2"></div>
           </div>
        ))}
      </div>
    );
  }

  if (playlists.length === 0) {
    return (
      <div className="text-center py-20">
        <h3 className="text-2xl text-zinc-400 font-semibold mb-2">Ninguna playlist coincide.</h3>
        <p className="text-zinc-600">Intenta buscar con otro nombre o limpiar los filtros.</p>
      </div>
    );
  }

  return (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6"
    >
      <AnimatePresence>
        {playlists.map((playlist) => (
          <motion.div key={playlist.id} variants={itemVariants} layoutId={playlist.id}>
            <Link 
              to={`/playlist/${playlist.id}`} 
              className="block flex-1 group bg-zinc-900/40 hover:bg-zinc-800 p-4 rounded-2xl cursor-pointer transition-colors duration-300 border border-transparent hover:border-zinc-700 focus:outline-none focus:ring-2 focus:ring-[#1DB954]"
            >
              <picture className="block mb-4 shadow-xl overflow-hidden rounded-lg aspect-square">
                {playlist.images && playlist.images.length > 0 ? (
                  <img src={playlist.images[0].url} alt={playlist.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                ) : (
                  <div className="w-full h-full bg-zinc-800 flex items-center justify-center text-3xl">🎵</div>
                )}
              </picture>
              <h2 className="font-bold text-base truncate text-white" title={playlist.name}>{playlist.name}</h2>
              <div className="flex justify-between items-center mt-1">
                 <p className="text-xs text-zinc-400 truncate">Por {playlist.owner?.display_name}</p>
                 {!playlist.public ? (
                    <span className="bg-zinc-800 text-[10px] px-2 py-0.5 rounded-full text-zinc-400 font-semibold uppercase tracking-wider">Privada</span>
                 ) : null}
              </div>
            </Link>
          </motion.div>
        ))}
      </AnimatePresence>
    </motion.div>
  );
}
