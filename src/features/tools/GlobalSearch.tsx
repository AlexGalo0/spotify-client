import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAuthToken } from '../../lib/api';
import { Search, Loader2, Music, ListMusic, ChevronLeft } from 'lucide-react';

export default function GlobalSearch() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [results, setResults] = useState<any[]>([]);
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const [errorError, setErrorError] = useState('');

  const handleGlobalSearch = async () => {
    if (!searchTerm.trim()) return;
    
    const token = await getAuthToken();
    if (!token) {
       navigate('/');
       return;
    }

    setIsSearching(true);
    setResults([]);
    setErrorError('');
    setProgress({ current: 0, total: 0 });

    try {
      // 1. Obtener todas las playlists del usuario
      let playlists: any[] = [];
      let nextUrl = 'https://api.spotify.com/v1/me/playlists?limit=50';
      
      while (nextUrl) {
         const res = await fetch(nextUrl, { headers: { 'Authorization': `Bearer ${token}` } });
         const data = await res.json();
         playlists = [...playlists, ...(data.items || [])];
         nextUrl = data.next;
      }

      const validPlaylists = playlists.filter(p => p !== null);
      setProgress({ current: 0, total: validPlaylists.length });

      // 2. Buscar en cada playlist
      const lowerSearch = searchTerm.toLowerCase();
      const foundMatches: any[] = [];

      for (let i = 0; i < validPlaylists.length; i++) {
         const playlist = validPlaylists[i];
         setProgress(prev => ({ ...prev, current: i + 1 }));

         // Solo si la playlist tiene canciones
         if (playlist.tracks.total > 0 && playlist.tracks.href) {
            // Para no abrumar la red, hacemos una búsqueda rápida con limite 100
            // Solo busca en los primeros 100 tracks por velocidad en este MVP
            const tRes = await fetch(`${playlist.tracks.href}?limit=100`, { headers: { 'Authorization': `Bearer ${token}` } });
            const tData = await tRes.json();
            
            if (tData.items) {
               for (const item of tData.items) {
                  if (!item.track) continue;
                  
                  const titleAcc = item.track.name.toLowerCase().includes(lowerSearch);
                  const artistAcc = item.track.artists.some((a:any) => a.name.toLowerCase().includes(lowerSearch));
                  
                  if (titleAcc || artistAcc) {
                     foundMatches.push({
                        track: item.track,
                        playlist: { id: playlist.id, name: playlist.name, images: playlist.images }
                     });
                  }
               }
            }
         }
      }

      setResults(foundMatches);
    } catch (err) {
      console.error(err);
      setErrorError('Hubo un error al buscar en tus playlists.');
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className="relative min-h-screen bg-[#0a0a0a] text-zinc-200 p-8 font-sans selection:bg-[#1DB954] selection:text-white pb-20">
      
      <button onClick={() => navigate('/dashboard')} className="text-zinc-500 hover:text-white mb-6 flex items-center gap-2 transition-colors focus:outline-none">
         <ChevronLeft size={16} />
         Volver al Dashboard
      </button>

      <div className="max-w-4xl mx-auto space-y-10 mt-4">
         <div className="text-center space-y-4">
            <h1 className="text-4xl md:text-5xl font-black text-white tracking-tight">
               Buscador <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#1DB954] to-blue-500">Multi-Playlist</span>
            </h1>
            <p className="text-zinc-400 max-w-2xl mx-auto text-lg">
               ¿Olvidaste en qué playlist guardaste una canción? Busca por título o artista en todas tus listas al mismo tiempo.
            </p>
         </div>

         {/* Search Input Area */}
         <div className="relative group max-w-2xl mx-auto">
            <div className="absolute inset-0 bg-[#1DB954] blur-xl opacity-10 group-hover:opacity-20 transition-opacity duration-500 rounded-full" />
            <div className="relative flex items-center bg-zinc-900 border border-zinc-800 rounded-full p-2 pl-6 shadow-2xl focus-within:border-[#1DB954]/50 transition-all">
               <Search className="text-zinc-400 mr-2" size={24} />
               <input 
                 type="text" 
                 placeholder="Ej. 'Daft Punk' o 'Get Lucky'"
                 value={searchTerm}
                 onChange={(e) => setSearchTerm(e.target.value)}
                 onKeyDown={(e) => e.key === 'Enter' && handleGlobalSearch()}
                 className="flex-1 bg-transparent border-none focus:outline-none text-white text-lg py-3 placeholder:text-zinc-600"
               />
               <button 
                 onClick={handleGlobalSearch}
                 disabled={isSearching || !searchTerm.trim()}
                 className="bg-[#1DB954] hover:bg-[#1ed760] disabled:opacity-50 text-black font-bold px-8 py-3 rounded-full transition-transform active:scale-95 ml-2"
               >
                 Buscar
               </button>
            </div>
         </div>

         {/* Progress Bar */}
         {isSearching && (
            <div className="max-w-2xl mx-auto space-y-2 animate-fade-in">
               <div className="flex items-center justify-between text-sm font-medium text-zinc-400">
                  <span className="flex items-center gap-2"><Loader2 size={16} className="animate-spin text-[#1DB954]" /> Escaneando playlists...</span>
                  <span>{progress.current} / {progress.total}</span>
               </div>
               <div className="w-full bg-zinc-900 rounded-full h-2 overflow-hidden border border-zinc-800">
                  <div 
                     className="bg-gradient-to-r from-[#1DB954] to-blue-500 h-full transition-all duration-300 rounded-full"
                     style={{ width: `${progress.total > 0 ? (progress.current / progress.total) * 100 : 0}%` }}
                  />
               </div>
            </div>
         )}
         
         {errorError && <div className="text-red-400 text-center max-w-2xl mx-auto bg-red-400/10 p-4 rounded-lg border border-red-400/20">{errorError}</div>}

         {/* Results */}
         {results.length > 0 && (
            <div className="max-w-4xl mx-auto bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6 shadow-xl animate-fade-in">
               <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                  <Music className="text-[#1DB954]" /> {results.length} coincidencias encontradas
               </h3>
               
               <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                  {results.map((item, idx) => (
                     <div key={idx} className="flex items-center gap-4 bg-zinc-950/50 hover:bg-zinc-800 p-4 rounded-xl border border-zinc-900 hover:border-zinc-700 transition-colors cursor-pointer"
                          onClick={() => navigate(`/playlist/${item.playlist.id}`)}>
                        {item.track.album?.images?.[2] ? (
                           <img src={item.track.album.images[2].url} className="w-14 h-14 object-cover rounded shadow-md" alt="Cover" />
                        ) : <div className="w-14 h-14 bg-zinc-800 rounded flex-shrink-0 shadow-md"></div>}
                        
                        <div className="flex-1 overflow-hidden">
                           <p className="text-white font-bold truncate text-lg">{item.track.name}</p>
                           <p className="text-zinc-400 text-sm truncate">{item.track.artists?.map((a:any) => a.name).join(', ')}</p>
                        </div>

                        <div className="hidden sm:flex flex-col items-end border-l border-zinc-800 pl-4 ml-2">
                           <span className="text-xs text-zinc-500 font-bold uppercase tracking-wider mb-1 flex items-center gap-1">
                              <ListMusic size={12} /> Encontrada en
                           </span>
                           <span className="text-zinc-200 text-sm font-medium hover:text-[#1DB954] transition-colors truncate max-w-[200px]" title={item.playlist.name}>
                              {item.playlist.name}
                           </span>
                        </div>
                     </div>
                  ))}
               </div>
            </div>
         )}

         {!isSearching && results.length === 0 && searchTerm && progress.total > 0 && (
            <div className="text-center py-12 text-zinc-500 font-medium">
               No se encontraron coincidencias para "{searchTerm}" en tus {progress.total} playlists.
            </div>
         )}
      </div>
    </div>
  );
}
