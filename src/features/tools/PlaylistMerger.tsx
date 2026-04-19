import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAuthToken } from '../../lib/api';
import { Layers, Loader2, Check, Plus, ListMusic, ArrowDownToLine } from 'lucide-react';
import ConfirmModal from '../../components/ConfirmModal';

type MergeMode = 'new' | 'existing' | 'first';

export default function PlaylistMerger() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<any>(null);
  const [playlists, setPlaylists] = useState<any[]>([]);
  const [selectedPlaylists, setSelectedPlaylists] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Merge config
  const [mergeMode, setMergeMode] = useState<MergeMode>('new');
  const [newPlaylistName, setNewPlaylistName] = useState('Mi Playlist Fusionada');
  const [newPlaylistDescription, setNewPlaylistDescription] = useState('');
  const [newPlaylistPublic, setNewPlaylistPublic] = useState(false);
  const [targetPlaylistId, setTargetPlaylistId] = useState<string>('');
  const [isMerging, setIsMerging] = useState(false);
  const [progress, setProgress] = useState(0);

  const [modalConfig, setModalConfig] = useState<{isOpen: boolean; title: string; message: string; onConfirm?: () => void}>({ isOpen: false, title: '', message: '' });

  useEffect(() => {
    const fetchData = async () => {
      const token = await getAuthToken();
      if (!token) return navigate('/');

      try {
        const userRes = await fetch('https://api.spotify.com/v1/me', { headers: { 'Authorization': `Bearer ${token}` } });
        setProfile(await userRes.json());

        let allPlaylists: any[] = [];
        let nextUrl = 'https://api.spotify.com/v1/me/playlists?limit=50';

        while (nextUrl) {
           const res = await fetch(nextUrl, { headers: { 'Authorization': `Bearer ${token}` } });
           const data = await res.json();
           allPlaylists = [...allPlaylists, ...(data.items || [])];
           nextUrl = data.next;
        }

        setPlaylists(allPlaylists.filter(p => p !== null));
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [navigate]);

  const toggleSelection = (id: string) => {
      setSelectedPlaylists(prev =>
         prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]
      );
  };

  const handleMerge = async () => {
      if (selectedPlaylists.length < 2) return;

      const token = await getAuthToken();
      if (!token || !profile) return;

      setIsMerging(true);
      setProgress(10);
      try {
         // 1. Fetch all tracks from selected playlists (deduplicated)
         let allTracks: string[] = [];
         const seenUris = new Set<string>();

         for (const pId of selectedPlaylists) {
            let nextUrl = `https://api.spotify.com/v1/playlists/${pId}/tracks?limit=100`;
            while (nextUrl) {
               const res = await fetch(nextUrl, { headers: { 'Authorization': `Bearer ${token}` } });
               const data = await res.json();
               if (data.items) {
                  data.items.forEach((item: any) => {
                     if (item.track && !item.track.is_local && !seenUris.has(item.track.uri)) {
                        seenUris.add(item.track.uri);
                        allTracks.push(item.track.uri);
                     }
                  });
               }
               nextUrl = data.next;
            }
         }

         setProgress(40);

         let finalTargetId: string;
         let resultName: string;

         // 2. Determine target based on mode
         if (mergeMode === 'new') {
            // Create a brand new playlist
            const createRes = await fetch(`https://api.spotify.com/v1/users/${profile.id}/playlists`, {
               method: 'POST',
               headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
               body: JSON.stringify({
                  name: newPlaylistName || 'Mi Playlist Fusionada',
                  description: newPlaylistDescription || 'Generada automáticamente por SpotifyHelper',
                  public: newPlaylistPublic
               })
            });
            const newPlaylist = await createRes.json();
            finalTargetId = newPlaylist.id;
            resultName = newPlaylist.name;
         } else if (mergeMode === 'existing') {
            // Add to an existing playlist (user picks one)
            if (!targetPlaylistId) throw new Error('No se seleccionó una playlist destino');
            finalTargetId = targetPlaylistId;
            const targetPl = playlists.find(p => p.id === finalTargetId);
            resultName = targetPl?.name || 'Playlist';
         } else {
            // Add to the first selected playlist
            finalTargetId = selectedPlaylists[0];
            const firstPl = playlists.find(p => p.id === finalTargetId);
            resultName = firstPl?.name || 'Playlist';
         }

         setProgress(60);

         // 3. Add tracks in chunks of 100
         for (let i = 0; i < allTracks.length; i += 100) {
            const chunk = allTracks.slice(i, i + 100);
            await fetch(`https://api.spotify.com/v1/playlists/${finalTargetId}/tracks`, {
               method: 'POST',
               headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
               body: JSON.stringify({ uris: chunk })
            });
         }

         setProgress(100);
         setModalConfig({
            isOpen: true,
            title: '🎉 Fusión Completada',
            message: `Se agregaron ${allTracks.length} canciones a "${resultName}" sin duplicados. Las playlists originales no fueron modificadas.`,
            onConfirm: () => {
               setModalConfig(prev => ({ ...prev, isOpen: false }));
               if (mergeMode === 'new') {
                  navigate(`/playlist/${finalTargetId}`);
               } else {
                  navigate(`/playlist/${finalTargetId}`);
               }
            }
         });

         setSelectedPlaylists([]);
      } catch (err) {
         console.error(err);
         setModalConfig({ isOpen: true, title: 'Error', message: 'Hubo un error al fusionar las playlists.' });
      } finally {
         setIsMerging(false);
      }
  };

  const selectedPlData = playlists.filter(p => selectedPlaylists.includes(p.id));
  const totalTracksSelected = selectedPlData.reduce((sum, p) => sum + (p.tracks?.total || 0), 0);

  // For "existing" mode, exclude selected playlists from target options
  const availableTargets = playlists.filter(p => !selectedPlaylists.includes(p.id));

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-zinc-200 p-4 sm:p-8 font-sans selection:bg-[#1DB954] selection:text-white pb-20">

      <ConfirmModal
         isOpen={modalConfig.isOpen}
         title={modalConfig.title}
         message={modalConfig.message}
         confirmText={modalConfig.onConfirm ? 'Ir a la Playlist' : 'Entendido'}
         onConfirm={() => { setModalConfig(prev => ({ ...prev, isOpen: false })); if (modalConfig.onConfirm) modalConfig.onConfirm(); }}
         onCancel={() => setModalConfig(prev => ({ ...prev, isOpen: false }))}
      />

      <button onClick={() => navigate('/dashboard')} className="text-zinc-500 hover:text-white mb-6 flex items-center gap-2 transition-colors focus:outline-none">
         <ArrowDownToLine size={16} /> Volver al Dashboard
      </button>

      <div className="max-w-6xl mx-auto space-y-10 mt-4">
         <div className="text-center space-y-4">
            <h1 className="text-4xl md:text-5xl font-black text-white tracking-tight flex items-center justify-center gap-4">
               Merge <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-500 to-pink-500">Mágico</span>
            </h1>
            <p className="text-zinc-400 max-w-2xl mx-auto text-lg">
               Selecciona varias playlists y combínalas. Las listas originales <strong className="text-white">no se modifican</strong>.
            </p>
         </div>

         {isLoading ? (
            <div className="flex justify-center py-20"><Loader2 className="animate-spin text-[#1DB954]" size={40} /></div>
         ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

               {/* Selection Panel */}
               <div className="lg:col-span-2 bg-zinc-900 border border-zinc-800 rounded-3xl p-6 shadow-xl">
                  <div className="flex items-center justify-between mb-4">
                     <h3 className="text-xl font-bold text-white">Tus Playlists</h3>
                     <span className="text-sm text-zinc-500">{playlists.length} totales</span>
                  </div>
                  <div className="overflow-y-auto pr-2 space-y-2 custom-scrollbar" style={{ maxHeight: '500px' }}>
                     {playlists.map(p => (
                        <div
                           key={p.id}
                           onClick={() => toggleSelection(p.id)}
                           className={`flex items-center gap-4 p-3 rounded-xl border transition-all cursor-pointer ${selectedPlaylists.includes(p.id) ? 'bg-[#1DB954]/10 border-[#1DB954] shadow-inner' : 'bg-zinc-950 border-zinc-800 hover:border-zinc-700'}`}
                        >
                           <div className={`w-6 h-6 rounded border flex items-center justify-center transition-colors ${selectedPlaylists.includes(p.id) ? 'bg-[#1DB954] border-[#1DB954] text-black' : 'border-zinc-600'}`}>
                              {selectedPlaylists.includes(p.id) && <Check size={14} strokeWidth={4} />}
                           </div>
                           {p.images?.[0] ? <img src={p.images[0].url} className="w-10 h-10 rounded shadow-md object-cover" alt="cover"/> : <div className="w-10 h-10 bg-zinc-800 rounded"></div>}
                           <div className="flex-1 overflow-hidden">
                              <p className="text-white font-bold truncate">{p.name}</p>
                              <p className="text-zinc-500 text-xs truncate">{p.tracks?.total || 0} canciones</p>
                           </div>
                        </div>
                     ))}
                  </div>
               </div>

               {/* Action Panel */}
               <div className="bg-gradient-to-b from-zinc-900 to-zinc-950 border border-zinc-800 rounded-3xl p-6 sm:p-8 shadow-2xl flex flex-col">
                  <div className="w-16 h-16 bg-purple-500/10 rounded-full flex items-center justify-center mb-5">
                     <Layers className="text-purple-500" size={28} />
                  </div>

                  <h2 className="text-2xl font-black text-white mb-1">Configurar Fusión</h2>
                  <p className="text-zinc-400 text-sm mb-6">
                     <strong className="text-white">{selectedPlaylists.length}</strong> playlists seleccionadas · <strong className="text-white">~{totalTracksSelected}</strong> canciones
                  </p>

                  {/* Mode Selector */}
                  <div className="space-y-3 mb-6">
                     <label className="block text-zinc-400 text-xs font-bold uppercase tracking-wider">Modo de fusión</label>

                     {/* Mode: New Playlist */}
                     <button
                        onClick={() => setMergeMode('new')}
                        className={`w-full flex items-center gap-3 p-3 rounded-xl border transition-all text-left ${mergeMode === 'new' ? 'bg-purple-500/10 border-purple-500' : 'bg-zinc-950 border-zinc-800 hover:border-zinc-700'}`}
                     >
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${mergeMode === 'new' ? 'border-purple-500' : 'border-zinc-600'}`}>
                           {mergeMode === 'new' && <div className="w-2.5 h-2.5 rounded-full bg-purple-500" />}
                        </div>
                        <div>
                           <p className="text-white text-sm font-semibold flex items-center gap-2">
                              <Plus size={14} /> Crear playlist nueva
                           </p>
                           <p className="text-zinc-500 text-xs">Se crea una playlist independiente</p>
                        </div>
                     </button>

                     {/* Mode: Add to Existing */}
                     <button
                        onClick={() => setMergeMode('existing')}
                        className={`w-full flex items-center gap-3 p-3 rounded-xl border transition-all text-left ${mergeMode === 'existing' ? 'bg-purple-500/10 border-purple-500' : 'bg-zinc-950 border-zinc-800 hover:border-zinc-700'}`}
                     >
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${mergeMode === 'existing' ? 'border-purple-500' : 'border-zinc-600'}`}>
                           {mergeMode === 'existing' && <div className="w-2.5 h-2.5 rounded-full bg-purple-500" />}
                        </div>
                        <div>
                           <p className="text-white text-sm font-semibold flex items-center gap-2">
                              <ListMusic size={14} /> Agregar a existente
                           </p>
                           <p className="text-zinc-500 text-xs">Agrega las canciones a una playlist que ya tienes</p>
                        </div>
                     </button>

                     {/* Mode: Add to First Selected */}
                     <button
                        onClick={() => setMergeMode('first')}
                        className={`w-full flex items-center gap-3 p-3 rounded-xl border transition-all text-left ${mergeMode === 'first' ? 'bg-purple-500/10 border-purple-500' : 'bg-zinc-950 border-zinc-800 hover:border-zinc-700'}`}
                     >
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${mergeMode === 'first' ? 'border-purple-500' : 'border-zinc-600'}`}>
                           {mergeMode === 'first' && <div className="w-2.5 h-2.5 rounded-full bg-purple-500" />}
                        </div>
                        <div>
                           <p className="text-white text-sm font-semibold flex items-center gap-2">
                              <ArrowDownToLine size={14} /> Agregar a la primera
                           </p>
                           <p className="text-zinc-500 text-xs">Mezcla todo en la primera playlist seleccionada</p>
                        </div>
                     </button>
                  </div>

                  {/* Mode-specific options */}
                  {mergeMode === 'new' && (
                     <div className="w-full space-y-3 mb-6 animate-fade-in">
                        <label className="block text-zinc-400 text-xs font-bold uppercase tracking-wider">Nombre de la nueva playlist</label>
                        <input
                           type="text"
                           value={newPlaylistName}
                           onChange={e => setNewPlaylistName(e.target.value)}
                           placeholder="Nombre genial aquí"
                           className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-purple-500 transition-colors text-sm"
                        />
                        <label className="block text-zinc-400 text-xs font-bold uppercase tracking-wider">Descripción (opcional)</label>
                        <textarea
                           value={newPlaylistDescription}
                           onChange={e => setNewPlaylistDescription(e.target.value)}
                           placeholder="Descripción de la playlist..."
                           rows={2}
                           className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-purple-500 transition-colors text-sm resize-none"
                        />
                        <label className="flex items-center gap-2 cursor-pointer">
                           <input
                              type="checkbox"
                              checked={newPlaylistPublic}
                              onChange={e => setNewPlaylistPublic(e.target.checked)}
                              className="w-4 h-4 accent-purple-500"
                           />
                           <span className="text-zinc-400 text-sm">Playlist pública</span>
                        </label>
                     </div>
                  )}

                  {mergeMode === 'existing' && (
                     <div className="w-full space-y-3 mb-6 animate-fade-in">
                        <label className="block text-zinc-400 text-xs font-bold uppercase tracking-wider">Playlist destino</label>
                        <select
                           value={targetPlaylistId}
                           onChange={e => setTargetPlaylistId(e.target.value)}
                           className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-purple-500 transition-colors text-sm appearance-none"
                        >
                           <option value="">Selecciona una playlist...</option>
                           {availableTargets.map(p => (
                              <option key={p.id} value={p.id}>{p.name} ({p.tracks?.total || 0} canciones)</option>
                           ))}
                        </select>
                     </div>
                  )}

                  {mergeMode === 'first' && selectedPlData.length > 0 && (
                     <div className="w-full mb-6 p-3 bg-zinc-950 border border-zinc-800 rounded-xl">
                        <p className="text-zinc-400 text-xs mb-1">Playlist destino:</p>
                        <p className="text-white font-semibold text-sm truncate">{selectedPlData[0]?.name}</p>
                     </div>
                  )}

                  {isMerging ? (
                     <div className="w-full space-y-3">
                        <div className="flex items-center justify-center gap-2 text-purple-400 font-bold text-sm">
                           <Loader2 size={18} className="animate-spin" /> Fusionando...
                        </div>
                        <div className="w-full h-2 bg-zinc-800 rounded-full overflow-hidden">
                           <div className="h-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-300" style={{ width: `${progress}%` }}></div>
                        </div>
                     </div>
                  ) : (
                     <button
                        onClick={handleMerge}
                        disabled={
                           selectedPlaylists.length < 2 ||
                           (mergeMode === 'new' && !newPlaylistName.trim()) ||
                           (mergeMode === 'existing' && !targetPlaylistId)
                        }
                        className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:opacity-90 disabled:opacity-50 disabled:hover:opacity-50 text-white font-extrabold px-6 py-4 rounded-xl transition-all shadow-xl active:scale-95 flex items-center justify-center gap-2 text-sm"
                     >
                        <Plus size={18} />
                        Fusionar Playlists
                     </button>
                  )}

                  <p className="text-xs text-zinc-600 mt-4 text-center">
                     * Las playlists originales no se modifican
                  </p>
               </div>

            </div>
         )}
      </div>
    </div>
  );
}
