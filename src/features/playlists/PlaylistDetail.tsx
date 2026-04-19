import { useEffect, useState, useMemo, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getAuthToken } from '../../lib/api';
import { useDebouncedValue } from '../../lib/hooks';
import { Search, Loader2, Trash2, SlidersHorizontal, Activity, Zap, Flame, Pencil, Image as ImageIcon, Lock, Globe, ChevronDown, SortAsc, Sparkles } from 'lucide-react';
import ConfirmModal from '../../components/ConfirmModal';
import BackButton from '../../components/BackButton';

export default function PlaylistDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [tracks, setTracks] = useState<any[]>([]);
  const [playlist, setPlaylist] = useState<any>(null);
  
  // Pagination State
  const [nextUrl, setNextUrl] = useState<string | null>(null);
  const [fetchingMore, setFetchingMore] = useState(false);

  // UI States
  const [loading, setLoading] = useState(true);
  const [organizing, setOrganizing] = useState(false);
  const [removingDuplicates, setRemovingDuplicates] = useState(false);

  // Modal State
  const [modalConfig, setModalConfig] = useState<{
     isOpen: boolean;
     title: string;
     message: string;
     isDestructive?: boolean;
     confirmText?: string;
     onConfirm: () => void;
  }>({
     isOpen: false, title: '', message: '', onConfirm: () => {}
  });

  // Editable header state
  const [editingName, setEditingName] = useState(false);
  const [editingDescription, setEditingDescription] = useState(false);
  const [nameValue, setNameValue] = useState('');
  const [descriptionValue, setDescriptionValue] = useState('');
  const [savingChanges, setSavingChanges] = useState(false);

  // Image upload
  const imageInputRef = useRef<HTMLInputElement>(null);

  // Audio Features State
  const [audioFeatures, setAudioFeatures] = useState<{ [id: string]: any }>({});
  const [loadingFeatures, setLoadingFeatures] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
     minTempo: 0, maxTempo: 250,
     minEnergy: 0, maxEnergy: 100,
     minDanceability: 0, maxDanceability: 100
  });

  // Sort dropdown state
  const [sortOption, setSortOption] = useState<'original' | 'title' | 'artist' | 'album' | 'energy' | 'tempo'>('original');
  const [sortOpen, setSortOpen] = useState(false);

  const closeModal = () => setModalConfig(prev => ({ ...prev, isOpen: false }));

  // Helper para mostrar mensajes simples (reemplaza alert)
  const showNotification = (title: string, message: string) => {
      setModalConfig({
         isOpen: true,
         title,
         message,
         confirmText: 'Entendido',
         onConfirm: () => {}, // Solo cierra
      });
  };

  // Search — debounced to avoid heavy filtering on every keystroke (especially important on Safari)
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearch = useDebouncedValue(searchTerm, 250);

  // Intersection Observer element
  const observerTarget = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchInitialData = async () => {
      const token = await getAuthToken();
      if (!token) return navigate('/');

      try {
        const pRes = await fetch(`https://api.spotify.com/v1/playlists/${id}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const pData = await pRes.json();
        setPlaylist(pData);

        let initialUrl = `https://api.spotify.com/v1/playlists/${id}/tracks?limit=100`;
        const tRes = await fetch(initialUrl, { headers: { 'Authorization': `Bearer ${token}` } });
        const tData = await tRes.json();
        
        setTracks([...(tData.items || [])]);
        setNextUrl(tData.next);
        setLoading(false);
      } catch (err) {
        console.error("Error fetching tracks:", err);
        setLoading(false);
      }
    };
    fetchInitialData();
  }, [id, navigate]);

  // Sync editable values when playlist loads
  useEffect(() => {
    if (playlist) {
      setNameValue(playlist.name || '');
      setDescriptionValue(playlist.description || '');
    }
  }, [playlist]);

  // Save playlist name
  const saveName = async () => {
    if (!nameValue.trim() || !playlist) return;
    const token = await getAuthToken();
    if (!token) return;
    setSavingChanges(true);
    try {
      await fetch(`https://api.spotify.com/v1/playlists/${id}`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: nameValue.trim(), description: descriptionValue })
      });
      setPlaylist({ ...playlist, name: nameValue.trim(), description: descriptionValue });
    } catch (e) { console.error(e); }
    finally { setSavingChanges(false); setEditingName(false); setEditingDescription(false); }
  };

  // Upload playlist image
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !playlist) return;

    // Spotify requires base64 JPEG, max 256KB
    const reader = new FileReader();
    reader.onload = async () => {
      const base64 = (reader.result as string).replace(/^data:image\/\w+;base64,/, '');
      const token = await getAuthToken();
      if (!token) return;
      setSavingChanges(true);
      try {
        await fetch(`https://api.spotify.com/v1/playlists/${id}/images`, {
          method: 'PUT',
          headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'image/jpeg' },
          body: base64
        });
        // Refresh playlist to get new image
        const pRes = await fetch(`https://api.spotify.com/v1/playlists/${id}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        setPlaylist(await pRes.json());
      } catch (err) { console.error(err); }
      finally { setSavingChanges(false); }
    };
    reader.readAsDataURL(file);
  };

  // Toggle playlist privacy
  const togglePrivacy = async () => {
    if (!playlist) return;
    const token = await getAuthToken();
    if (!token) return;
    setSavingChanges(true);
    try {
      await fetch(`https://api.spotify.com/v1/playlists/${id}`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ public: !playlist.public, name: playlist.name, description: playlist.description })
      });
      setPlaylist({ ...playlist, public: !playlist.public });
    } catch (e) { console.error(e); }
    finally { setSavingChanges(false); }
  };

  // Generate AI Description
  const generateAIDescription = async () => {
    if (!playlist || tracks.length === 0) return;
    setSavingChanges(true);
    try {
      const token = await getAuthToken();
      if (!token) return;
      
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://127.0.0.1:3000'}/api/ai/describe-playlist`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({
          playlistName: playlist.name,
          tracks: tracks
        })
      });
      
      if (!res.ok) throw new Error('Error al generar descripción');
      
      const data = await res.json();
      const newDesc = data.description;
      
      // Save it to Spotify
      await fetch(`https://api.spotify.com/v1/playlists/${id}`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ description: newDesc, name: playlist.name, public: playlist.public })
      });
      
      setPlaylist({ ...playlist, description: newDesc });
      showNotification('¡Magia aplicada! ✨', 'La IA ha generado y guardado una nueva descripción para tu playlist.');
    } catch (e) {
      console.error(e);
      showNotification('Error', 'No pudimos generar la descripción con IA.');
    } finally {
      setSavingChanges(false);
    }
  };

  // INFINITE SCROLL LOGIC
  const fetchMoreTracks = useCallback(async () => {
    if (!nextUrl || fetchingMore) return;
    
    setFetchingMore(true);
    const token = await getAuthToken();
    try {
      const tRes = await fetch(nextUrl, { headers: { 'Authorization': `Bearer ${token}` } });
      const tData = await tRes.json();
      
      setTracks(prev => [...prev, ...(tData.items || [])]);
      setNextUrl(tData.next);
    } catch (err) {
      console.error("Error fetching more tracks:", err);
    } finally {
      setFetchingMore(false);
    }
  }, [nextUrl, fetchingMore]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting && nextUrl && !fetchingMore) {
          fetchMoreTracks();
        }
      },
      { threshold: 0.5, rootMargin: '200px' } // Safari-safe: lower threshold
    );

    // Capture the ref value at effect time — required for safe Safari cleanup
    const currentTarget = observerTarget.current;
    if (currentTarget) {
      observer.observe(currentTarget);
    }

    return () => {
      if (currentTarget) {
        observer.unobserve(currentTarget);
      }
      observer.disconnect(); // Fully clean up on Safari
    };
  }, [nextUrl, fetchingMore, fetchMoreTracks]);

  // AUDIO FEATURES HELPER
  const loadAudioFeatures = async () => {
     if (loadingFeatures || Object.keys(audioFeatures).length === tracks.length) return;
     
     const token = await getAuthToken();
     if (!token) return;

     setLoadingFeatures(true);
     try {
       // Only fetch features for tracks we haven't fetched yet
       const tracksToFetch = tracks
          .filter(item => item.track && !item.track.is_local && !audioFeatures[item.track.id])
          .map(item => item.track.id);
       
       const newFeatures = { ...audioFeatures };
       for (let i = 0; i < tracksToFetch.length; i += 100) {
          const chunk = tracksToFetch.slice(i, i + 100).join(',');
          if (!chunk) continue;
          
          const res = await fetch(`https://api.spotify.com/v1/audio-features?ids=${chunk}`, {
             headers: { 'Authorization': `Bearer ${token}` }
          });
          const data = await res.json();
          if (data.audio_features) {
             data.audio_features.forEach((feat: any) => {
                if (feat) newFeatures[feat.id] = feat;
             });
          }
       }
       setAudioFeatures(newFeatures);
     } catch (err) {
        console.error("Error fetching audio features:", err);
     } finally {
        setLoadingFeatures(false);
     }
  };

  // FULL SYNC HELPER
  const fetchAllRemainingTracks = async (token: string) => {
     let tempNextUrl = nextUrl;
     let allLoadedTracks = [...tracks];
     
     while (tempNextUrl) {
        const tRes = await fetch(tempNextUrl, { headers: { 'Authorization': `Bearer ${token}` } });
        const tData = await tRes.json();
        allLoadedTracks = [...allLoadedTracks, ...(tData.items || [])];
        tempNextUrl = tData.next;
     }
     return allLoadedTracks;
  };

  const syncToSpotify = async (sortedUris: string[], token: string) => {
      if (sortedUris.length > 0) {
        await fetch(`https://api.spotify.com/v1/playlists/${id}/tracks`, {
          method: 'PUT',
          headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ uris: sortedUris.slice(0, 100) })
        });
        for (let i = 100; i < sortedUris.length; i += 100) {
          const chunk = sortedUris.slice(i, i + 100);
          await fetch(`https://api.spotify.com/v1/playlists/${id}/tracks`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ uris: chunk })
          });
        }
      }
  }

  // TOOLS LOGIC EXECUTION
  const executeOrganizeByAlbum = async () => {
    const token = await getAuthToken();
    if (!token) return;

    setOrganizing(true);
    try {
      const fullList = await fetchAllRemainingTracks(token);
      const validItems = fullList.filter(item => item.track && item.track.type === 'track');
      
      const albumGroups: { [albumId: string]: any[] } = {};
      validItems.forEach(item => {
        const albumId = item.track.album.id;
        if (!albumGroups[albumId]) albumGroups[albumId] = [];
        albumGroups[albumId].push(item.track);
      });

      const sortedUris: string[] = [];
      const processedAlbums = new Set<string>();

      validItems.forEach(item => {
        const albumId = item.track.album.id;
        if (!processedAlbums.has(albumId)) {
          processedAlbums.add(albumId);
          const group = albumGroups[albumId];
          group.sort((a, b) => {
             if (a.disc_number === b.disc_number) return a.track_number - b.track_number;
             return a.disc_number - b.disc_number;
          });
          group.forEach(track => sortedUris.push(track.uri));
        }
      });

      await syncToSpotify(sortedUris, token);
      window.location.reload();
    } catch (e) {
      console.error(e);
      showNotification('Hubo un error', 'No pudimos organizar la playlist. Intenta nuevamente.');
    } finally {
      setOrganizing(false);
    }
  };

  const executeOrganizeAlphabetically = async (type: 'title' | 'artist') => {
      const token = await getAuthToken();
      if (!token) return;

      setOrganizing(true);
      try {
        const fullList = await fetchAllRemainingTracks(token);
        const validItems = fullList.filter(item => item.track && item.track.type === 'track');
        
        validItems.sort((a, b) => {
           if (type === 'title') {
              return (a.track?.name || '').localeCompare(b.track?.name || '');
           } else {
              const artistA = a.track?.artists?.[0]?.name || '';
              const artistB = b.track?.artists?.[0]?.name || '';
              return artistA.localeCompare(artistB);
           }
        });

        const sortedUris = validItems.map(item => item.track.uri);
        await syncToSpotify(sortedUris, token);
        window.location.reload();
      } catch (e) {
        console.error(e);
        showNotification('Hubo un error', 'No pudimos organizar la playlist. Intenta nuevamente.');
      } finally {
        setOrganizing(false);
      }
  };

  const executeRemoveDuplicates = async () => {
     const token = await getAuthToken();
     if (!token) return;

     setRemovingDuplicates(true);
     try {
       const fullList = await fetchAllRemainingTracks(token);
       const seenTrackIds = new Set<string>();
       const duplicatesToRemove: { uri: string }[] = [];

       for (const item of fullList) {
         if (!item.track || item.track.is_local) continue;
         
         const trackId = item.track.id;
         if (seenTrackIds.has(trackId)) {
           duplicatesToRemove.push({ uri: item.track.uri });
         } else {
           seenTrackIds.add(trackId);
         }
       }

       if (duplicatesToRemove.length === 0) {
         setRemovingDuplicates(false);
         showNotification('Sin cambios', 'No se encontraron canciones duplicadas en toda la playlist.');
         return;
       }

       for (let i = 0; i < duplicatesToRemove.length; i += 100) {
         const chunk = duplicatesToRemove.slice(i, i + 100);
         await fetch(`https://api.spotify.com/v1/playlists/${id}/tracks`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ tracks: chunk })
         });
       }

       showNotification('¡Limpieza Completa!', `${duplicatesToRemove.length} duplicados eliminados correctamente en Spotify.`);
       setTimeout(() => window.location.reload(), 2000); // Reload after 2s
     } catch (e) {
        console.error(e);
        showNotification('Hubo un error', 'No se pudieron eliminar los duplicados.');
     } finally {
        setRemovingDuplicates(false);
     }
  };

  // 4. Limpieza Avanzada (Purga Acústica / Baja Energía)
  const executeSmartPurge = async () => {
    const token = await getAuthToken();
    if (!token) return;

    setOrganizing(true);
    try {
      const fullList = await fetchAllRemainingTracks(token);
      
      // Asegurarnos de que tenemos las audio features cargadas primeramente si usamos filtros agresivos,
      // pero para simplificar la llamada API y no agotar rate limits de golpe, limitaremos a buscar acústicas
      // si tenemos la info cargada. Como requerimos que cargue features, lo simulamos pidiendo features si no hay.
      if (Object.keys(audioFeatures).length === 0) {
        await loadAudioFeatures();
      }

      const tracksToDelete: { uri: string }[] = [];
      const currentFeatures = { ...audioFeatures }; // Asumimos que loadAudioFeatures se resolvió

      for (const item of fullList) {
         if (!item.track || item.track.is_local) continue;
         const feat = currentFeatures[item.track.id];
         if (feat) {
            // Ejemplo de métrica de "Baja Energía y Acústico" (Cosas aburridas para una fiesta)
            if (feat.energy < 0.4 && feat.acousticness > 0.6) {
               tracksToDelete.push({ uri: item.track.uri });
            }
         }
      }

      if (tracksToDelete.length === 0) {
         showNotification('Sin Cambios', 'No se detectaron canciones lentas/acústicas para purgar.');
         setOrganizing(false);
         return;
      }

      for (let i = 0; i < tracksToDelete.length; i += 100) {
         const chunk = tracksToDelete.slice(i, i + 100);
         await fetch(`https://api.spotify.com/v1/playlists/${id}/tracks`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ tracks: chunk })
         });
      }

      showNotification('Purga Inteligente Exitosa', `Se eliminaron ${tracksToDelete.length} canciones excesivamente relajadas/acústicas.`);
      setTimeout(() => window.location.reload(), 2000);
    } catch (e) {
      console.error(e);
      showNotification('Error', 'No logramos realizar la purga inteligente.');
    } finally {
      setOrganizing(false);
    }
  };

  // 5. Smart Curator (DJ Set / Energy Escalation)
  const executeSmartCurator = async () => {
    const token = await getAuthToken();
    if (!token) return;

    setOrganizing(true);
    try {
      const fullList = await fetchAllRemainingTracks(token);
      if (Object.keys(audioFeatures).length === 0) {
        await loadAudioFeatures();
      }

      const validItems = fullList.filter(item => item.track && item.track.type === 'track' && audioFeatures[item.track.id]);
      
      // Ordenamos las pistas creando una curva ascendente de energía y ritmo (DJ intro -> climax)
      validItems.sort((a, b) => {
         const featA = audioFeatures[a.track.id];
         const featB = audioFeatures[b.track.id];
         // Fórmula: Tempo + Energia (Normalizado). Prioriza una escalada.
         const scoreA = featA.energy * 100 + featA.tempo;
         const scoreB = featB.energy * 100 + featB.tempo;
         return scoreA - scoreB;
      });

      const sortedUris = validItems.map(item => item.track.uri);
      await syncToSpotify(sortedUris, token);
      
      showNotification('Curador Inteligente', 'La playlist ha sido curada matemáticamente para ir de menos a más (Escalada DJ).');
      setTimeout(() => window.location.reload(), 2000);
    } catch(e) {
      console.error(e);
      showNotification('Error', 'Fallo el curador inteligente.');
    } finally {
      setOrganizing(false);
    }
  };

  const executeRemoveSingleTrack = async (uri: string) => {
    const token = await getAuthToken();
    if (!token) return;

    try {
      await fetch(`https://api.spotify.com/v1/playlists/${id}/tracks`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ tracks: [{ uri }] })
      });

      // Update UI silently
      setTracks(prev => prev.filter(t => !t.track || t.track.uri !== uri));
      showNotification('Borrado', 'Canción eliminada correctamente de tu playlist.');
    } catch (e) {
      console.error(e);
      showNotification('Hubo un error', 'No pudimos eliminar la canción.');
    }
  };


  // MODAL TRIGGERS
  const confirmOrganizeAlbum = () => {
    setModalConfig({
       isOpen: true,
       title: '¿Agrupar por Álbumes?',
       message: 'Esta acción unirá todas las pistas que pertenecen al mismo álbum y las reordenará respetando su tracklist original dentro de la cuenta de Spotify.',
       onConfirm: executeOrganizeByAlbum,
       confirmText: 'Agrupar',
       isDestructive: false
    });
  };

  const confirmOrganizeAlphabetically = (type: 'title' | 'artist') => {
    setModalConfig({
       isOpen: true,
       title: '¿Ordenar Alfabéticamente?',
       message: `¿Estás seguro de alterar tu lista oficial de Spotify y ordenarla alfabéticamente por ${type === 'title' ? 'Título' : 'Artista'}? Esta acción moverá todas las canciones de la lista actual.`,
       onConfirm: () => executeOrganizeAlphabetically(type),
       confirmText: 'Ordenar en Spotify',
       isDestructive: false
    });
  };

  const confirmRemoveDuplicates = () => {
    setModalConfig({
       isOpen: true,
       title: '¿Quitar Duplicados?',
       message: 'Esta acción buscará canciones repetidas en TODA tu playlist y las borrará de tu cuenta de Spotify mediante la API oficial. Podríamos tardar unos segundos.',
       onConfirm: executeRemoveDuplicates,
       confirmText: 'Eliminar Repetidas',
       isDestructive: true
    });
  };

  const confirmSmartPurge = () => {
    setModalConfig({
       isOpen: true,
       title: '¿Purga Inteligente (Anti-Relax)?',
       message: 'Escanearemos las "vibras" de todas las pistas y eliminaremos matemáticamente aquellas con menos de 40% de energía y alto contenido acústico. Ideal para limpiar playlists de fiesta. (Precaución: Borrará canciones reais de tu lista).',
       onConfirm: executeSmartPurge,
       confirmText: 'Purgar Lentas',
       isDestructive: true
    });
  };

  const confirmSmartCurator = () => {
    setModalConfig({
       isOpen: true,
       title: '¿Activar DJ Curator?',
       message: 'Ordenaremos tu playlist usando un algoritmo matemático que combina el BPM y Energía para crear una escalada perfecta de inicio calmado a clímax total.',
       onConfirm: executeSmartCurator,
       confirmText: 'Aplicar Setlist',
       isDestructive: false
    });
  };

  const confirmRemoveSingleTrack = (uri: string, name: string) => {
    setModalConfig({
       isOpen: true,
       title: '¿Eliminar Canción?',
       message: `¿Estás seguro de que deseas eliminar permanentemente "${name}" de esta playlist en tu cuenta de Spotify?`,
       onConfirm: () => executeRemoveSingleTrack(uri),
       confirmText: 'Eliminar',
       isDestructive: true
    });
  };


  // Local Search & Audio Features rendering — uses debouncedSearch to avoid recomputing on every keystroke
  const processedTracks = useMemo(() => {
     let result = [...tracks];
     
     // 1. Text Search (debounced)
     if (debouncedSearch) {
        const lowerSearched = debouncedSearch.toLowerCase();
        result = result.filter(item => {
           if (!item.track) return false;
           const titleAcc = item.track.name.toLowerCase().includes(lowerSearched);
           const artistAcc = item.track.artists.some((a:any) => a.name.toLowerCase().includes(lowerSearched));
           return titleAcc || artistAcc;
        });
     }
     
     // 2. Audio Features Filter
     if (showFilters && Object.keys(audioFeatures).length > 0) {
        result = result.filter(item => {
           if (!item.track || item.track.is_local) return false;
           const feat = audioFeatures[item.track.id];
           if (!feat) return false;
           
           const energyPercent = feat.energy * 100;
           const dancePercent = feat.danceability * 100;
           
           return (
              feat.tempo >= filters.minTempo && feat.tempo <= filters.maxTempo &&
              energyPercent >= filters.minEnergy && energyPercent <= filters.maxEnergy &&
              dancePercent >= filters.minDanceability && dancePercent <= filters.maxDanceability
           );
        });
     }
     
     return result;
  }, [tracks, debouncedSearch, showFilters, audioFeatures, filters]);


  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] text-white p-8 font-sans selection:bg-[#1DB954] selection:text-white pb-20">
         <div className="animate-pulse flex flex-col md:flex-row items-end gap-6 border-b border-zinc-800 pb-8 mb-8 mt-10">
            <div className="w-48 h-48 bg-zinc-800/80 rounded-sm"></div>
            <div className="flex-1 space-y-4">
              <div className="h-4 bg-zinc-800/80 rounded w-24"></div>
              <div className="h-14 bg-zinc-800/80 rounded w-3/4"></div>
              <div className="h-4 bg-zinc-800/80 rounded w-1/2"></div>
            </div>
         </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-[#0a0a0a] text-zinc-200 p-8 font-sans selection:bg-[#1DB954] selection:text-white pb-20 overflow-hidden">
      
      {/* Custom Confirm Modal */}
      <ConfirmModal 
         isOpen={modalConfig.isOpen}
         title={modalConfig.title}
         message={modalConfig.message}
         confirmText={modalConfig.confirmText}
         isDestructive={modalConfig.isDestructive}
         onConfirm={modalConfig.onConfirm}
         onCancel={closeModal}
      />

      <BackButton />

      {playlist && (
        <header className="flex flex-col md:flex-row items-end gap-6 border-b border-zinc-800 pb-8 mb-8">
          {playlist.images && playlist.images[0] ? (
            <img src={playlist.images[0].url} alt="Cover" className="w-48 h-48 shadow-2xl rounded-sm object-cover" />
          ) : (
             <div className="w-48 h-48 shadow-2xl rounded-sm bg-zinc-800 flex items-center justify-center">
                 <Loader2 size={40} className="text-zinc-500" />
             </div>
          )}
          <div className="flex-1">
            <span className="text-xs uppercase font-bold tracking-widest text-zinc-500">Playlist Pública</span>
            <h1 className="text-5xl md:text-7xl font-black mt-2 mb-4 tracking-tighter text-white">{playlist.name}</h1>
            <div className="flex items-center gap-3">
               <p className="text-zinc-400 font-medium">{playlist.description}</p>
               <button 
                  onClick={generateAIDescription}
                  disabled={savingChanges || tracks.length === 0}
                  title="Generar descripción con IA"
                  className="p-1.5 rounded-full hover:bg-zinc-800 text-zinc-500 hover:text-[#1DB954] transition-colors disabled:opacity-50"
               >
                  {savingChanges ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
               </button>
            </div>
            <div className="flex items-center gap-2 mt-2 text-sm">
              <span className="text-white font-bold">{playlist.owner.display_name}</span>
              <span className="text-zinc-600">•</span>
              <span>{playlist.tracks.total} canciones</span>
            </div>
          </div>
        </header>
      )}

      {/* Smart Tools Bar */}
      <div className="mb-8 p-6 bg-zinc-900/50 rounded-2xl border border-zinc-800/80 flex flex-col xl:flex-row xl:items-center justify-between gap-6 relative z-10">
        <div className="flex-1 min-w-[300px]">
           <div className="relative">
             <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" size={18} />
             <input 
               type="text" 
               placeholder={`Filtrar en las ${tracks.length} canciones cargadas...`}
               value={searchTerm}
               onChange={(e) => setSearchTerm(e.target.value)}
               className="w-full bg-zinc-950 border border-zinc-800 rounded-full py-3 pl-12 pr-4 text-white focus:outline-none focus:border-[#1DB954]/50 focus:ring-1 focus:ring-[#1DB954]/50 transition-all placeholder:text-zinc-600 font-medium shadow-inner"
             />
           </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-2">
           <button
              onClick={() => {
                 if (!showFilters) loadAudioFeatures();
                 setShowFilters(!showFilters);
              }}
              className={`flex items-center gap-2 px-4 py-3 rounded-full font-bold transition-all text-sm shadow-sm border ${showFilters ? 'bg-[#1DB954]/20 border-[#1DB954] text-[#1DB954]' : 'border-zinc-700 text-zinc-300 hover:bg-zinc-800'}`}
           >
              <SlidersHorizontal size={16} />
              Filtros Avanzados
           </button>
           
           <div className="flex gap-2 w-full sm:w-auto">
             <button
               onClick={() => confirmOrganizeAlphabetically('title')}
               disabled={organizing}
               className="flex-1 sm:flex-none border border-zinc-700 hover:bg-zinc-800 hover:border-zinc-500 disabled:opacity-50 text-zinc-300 font-bold px-4 py-3 rounded-full transition-colors whitespace-nowrap text-sm shadow-sm"
             >
               Sort A-Z Título
             </button>
             
             <button
               onClick={() => confirmOrganizeAlphabetically('artist')}
               disabled={organizing}
               className="flex-1 sm:flex-none border border-zinc-700 hover:bg-zinc-800 hover:border-zinc-500 disabled:opacity-50 text-zinc-300 font-bold px-4 py-3 rounded-full transition-colors whitespace-nowrap text-sm shadow-sm"
             >
               Sort A-Z Artista
             </button>
           </div>

           <div className="flex gap-2 w-full sm:w-auto">
             <button
               onClick={confirmOrganizeAlbum}
               disabled={organizing || tracks.length === 0}
               className="flex-1 sm:flex-none bg-[#1DB954] hover:bg-[#1ed760] disabled:opacity-50 text-black font-extrabold px-6 py-3 rounded-full transition-transform active:scale-95 whitespace-nowrap text-sm shadow-lg shadow-[#1DB954]/20"
             >
               {organizing ? 'Aplicando en Spotify...' : 'Agrupar por Álbum'}
             </button>

             <button
               onClick={confirmRemoveDuplicates}
               disabled={removingDuplicates || organizing || tracks.length === 0}
               className="flex-1 sm:flex-none bg-zinc-800 hover:bg-red-500/10 border border-transparent hover:border-red-500/30 disabled:opacity-50 text-red-400 hover:text-red-500 font-extrabold px-6 py-3 rounded-full transition-all active:scale-95 whitespace-nowrap text-sm"
             >
               {removingDuplicates ? 'Eliminando...' : 'Quitar Duplicados'}
             </button>
             
             <button
               onClick={confirmSmartPurge}
               disabled={removingDuplicates || organizing || tracks.length === 0}
               className="flex-1 sm:flex-none bg-zinc-900 border border-red-900/50 hover:bg-red-500/20 disabled:opacity-50 text-red-400 hover:text-red-500 font-extrabold px-6 py-3 rounded-full transition-all active:scale-95 whitespace-nowrap text-sm"
             >
               Purga Inteligente
             </button>
           </div>

           <div className="flex gap-2 w-full sm:w-auto mt-2 sm:mt-0 xl:ml-2">
             <button
               onClick={confirmSmartCurator}
               disabled={organizing || tracks.length === 0}
               className="w-full bg-gradient-to-r from-purple-500 to-indigo-500 hover:opacity-90 disabled:opacity-50 text-white font-black px-6 py-3 rounded-full transition-all active:scale-95 whitespace-nowrap text-sm shadow-lg shadow-purple-500/20"
             >
               ✨ DJ Curator
             </button>

             <button
               onClick={() => navigate(`/roast/${id}`)}
               className="w-full bg-gradient-to-r from-orange-500 to-red-500 hover:opacity-90 text-white font-black px-6 py-3 rounded-full transition-all active:scale-95 whitespace-nowrap text-sm shadow-lg shadow-orange-500/20 flex items-center justify-center gap-2"
             >
               <Flame size={18} />
               Roast
             </button>
           </div>
        </div>
      </div>

      {/* Audio Features Extended Filters Panel */}
      {showFilters && (
         <div className="mb-8 p-6 bg-zinc-900/30 rounded-2xl border border-zinc-800/50 relative z-10 animate-fade-in text-sm">
            {loadingFeatures ? (
               <div className="flex items-center gap-3 text-zinc-400 justify-center">
                  <Loader2 className="animate-spin text-[#1DB954]" size={20} />
                  <span>Analizando vibras e investigando IDs con Spotify API...</span>
               </div>
            ) : (
               <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  {/* Tempo / BPM */}
                  <div className="space-y-4">
                     <div className="flex items-center justify-between">
                        <label className="text-zinc-300 font-bold flex items-center gap-2"><Activity size={16} className="text-blue-400"/> Ritmo (BPM)</label>
                        <span className="text-zinc-500 font-mono text-xs">{filters.minTempo} - {filters.maxTempo}</span>
                     </div>
                     <div className="flex space-x-4">
                        <input type="range" min="0" max="250" value={filters.minTempo} onChange={e => setFilters(f => ({ ...f, minTempo: Number(e.target.value) }))} className="w-full accent-blue-500" />
                        <input type="range" min="0" max="250" value={filters.maxTempo} onChange={e => setFilters(f => ({ ...f, maxTempo: Number(e.target.value) }))} className="w-full accent-blue-500" />
                     </div>
                  </div>
                  {/* Energy */}
                  <div className="space-y-4">
                     <div className="flex items-center justify-between">
                        <label className="text-zinc-300 font-bold flex items-center gap-2"><Zap size={16} className="text-yellow-400" /> Energía %</label>
                        <span className="text-zinc-500 font-mono text-xs">{filters.minEnergy}% - {filters.maxEnergy}%</span>
                     </div>
                     <div className="flex space-x-4">
                        <input type="range" min="0" max="100" value={filters.minEnergy} onChange={e => setFilters(f => ({ ...f, minEnergy: Number(e.target.value) }))} className="w-full accent-yellow-500" />
                        <input type="range" min="0" max="100" value={filters.maxEnergy} onChange={e => setFilters(f => ({ ...f, maxEnergy: Number(e.target.value) }))} className="w-full accent-yellow-500" />
                     </div>
                  </div>
                  {/* Danceability */}
                  <div className="space-y-4">
                     <div className="flex items-center justify-between">
                        <label className="text-zinc-300 font-bold flex items-center gap-2"><span className="text-[#1DB954]">●</span> Bailabilidad %</label>
                        <span className="text-zinc-500 font-mono text-xs">{filters.minDanceability}% - {filters.maxDanceability}%</span>
                     </div>
                     <div className="flex space-x-4">
                        <input type="range" min="0" max="100" value={filters.minDanceability} onChange={e => setFilters(f => ({ ...f, minDanceability: Number(e.target.value) }))} className="w-full accent-[#1DB954]" />
                        <input type="range" min="0" max="100" value={filters.maxDanceability} onChange={e => setFilters(f => ({ ...f, maxDanceability: Number(e.target.value) }))} className="w-full accent-[#1DB954]" />
                     </div>
                  </div>
               </div>
            )}
         </div>
      )}

      {/* Tracklist Output */}
      <div className="w-full overflow-x-auto pb-4 relative z-0">
         <div className="grid grid-cols-[auto_1fr_1fr_auto_40px] gap-4 px-4 py-2 border-b border-zinc-800 text-xs uppercase tracking-wider text-zinc-500 mb-4 min-w-[700px] xl:min-w-[800px]">
            <div className="w-8 text-center">#</div>
            <div>Título</div>
            <div>Álbum</div>
            <div className="text-right pr-2">Detalles</div>
            <div className="text-center"></div>
         </div>
         <div className="min-w-[700px] xl:min-w-[800px]">
           {processedTracks.map((item, idx) => {
             if (!item.track) return null;
             const isLocal = item.track.is_local;
             return (
               <div key={`track-${item.track.id}-${idx}`} className="grid grid-cols-[auto_1fr_1fr_auto_40px] gap-4 items-center px-4 py-3 hover:bg-zinc-800/40 rounded-lg group transition-colors">
                  <div className="w-8 text-center text-zinc-500 text-sm group-hover:text-white">{idx + 1}</div>
                  <div className="flex items-center gap-3 overflow-hidden pr-4">
                    {!isLocal && item.track.album?.images?.[2] ? (
                      <img src={item.track.album.images[2].url} className="w-10 h-10 object-cover flex-shrink-0 rounded-sm" alt="Cover" />
                    ) : <div className="w-10 h-10 bg-zinc-800 flex-shrink-0 rounded-sm"></div>}
                    <div className="truncate">
                      <p className="text-white text-base truncate">{item.track.name}</p>
                      <p className="text-zinc-500 text-sm truncate">{item.track.artists?.map((a:any) => a.name).join(', ') || 'Unknown Artist'}</p>
                    </div>
                  </div>
                  <div className="text-zinc-400 text-sm truncate pr-4">{item.track.album?.name || '-'}</div>
                  <div className="text-zinc-500 text-xs text-right pr-2 shrink-0 flex flex-col items-end gap-1">
                     <span>N° {item.track.track_number || '-'}</span>
                     {audioFeatures[item.track.id] && (
                        <div className="flex items-center gap-2 mt-1">
                           <span className="bg-blue-500/10 text-blue-400 px-1.5 py-0.5 rounded font-mono" title="BPM (Ritmo)">
                              {Math.round(audioFeatures[item.track.id].tempo)}
                           </span>
                           <span className="bg-yellow-500/10 text-yellow-400 px-1.5 py-0.5 rounded font-mono" title="Energy %">
                              {Math.round(audioFeatures[item.track.id].energy * 100)}%
                           </span>
                        </div>
                     )}
                  </div>
                  <div className="flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                     <button 
                       onClick={() => confirmRemoveSingleTrack(item.track.uri, item.track.name)}
                       title="Eliminar este track de la playlist"
                       className="p-2 text-zinc-500 hover:text-red-500 hover:bg-red-500/10 rounded-full transition-colors"
                     >
                        <Trash2 size={16} />
                     </button>
                  </div>
               </div>
             )
           })}
           {processedTracks.length === 0 && !loading && (
             <div className="text-center py-12 text-zinc-500">No se encontraron resultados en esta lista.</div>
           )}
           
           {/* Intersection Observer Anchor & Loader */}
           {nextUrl && !searchTerm && (
             <div ref={observerTarget} className="mt-8 mb-4 flex justify-center items-center gap-3 text-zinc-400 py-4">
                {fetchingMore ? (
                  <>
                     <Loader2 size={18} className="animate-spin text-[#1DB954]" />
                     <span className="text-sm font-medium">Cargando más canciones de Spotify...</span>
                  </>
                ) : (
                  <div className="h-6 w-full rounded-lg animate-pulse bg-zinc-900/30"></div>
                )}
             </div>
           )}

         </div>
      </div>
    </div>
  );
}
