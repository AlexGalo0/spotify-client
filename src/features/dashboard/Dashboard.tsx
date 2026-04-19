import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import ProfileHeader from './components/ProfileHeader';
import StatsCards from './components/StatsCards';
import SearchBar from './components/SearchBar';
import PlaylistGrid from './components/PlaylistGrid';
import { getAuthToken } from '../../lib/api';
import { useDebouncedValue } from '../../lib/hooks';

export default function Dashboard() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<any>(null);
  const [loadingProfile, setLoadingProfile] = useState(true);

  const [playlists, setPlaylists] = useState<any[]>([]);
  const [totalPlaylists, setTotalPlaylists] = useState<number | null>(null);
  const [totalTracks, setTotalTracks] = useState<number | null>(null);
  const [loadingPlaylists, setLoadingPlaylists] = useState(true);

  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearch = useDebouncedValue(searchTerm, 250); // 250ms debounce
  const [filterType, setFilterType] = useState<'all' | 'public' | 'private' | 'owned'>('all');


  useEffect(() => {
    const loadDashboard = async () => {
      const token = await getAuthToken();
      if (!token) {
        window.location.href = '/';
        return;
      }

      try {
        // Fetch profile
        const profileRes = await fetch('https://api.spotify.com/v1/me', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const profileData = await profileRes.json();
        setProfile(profileData);
        setLoadingProfile(false);

        // Fetch playlists and total tracks
        const [pData, tData] = await Promise.all([
          fetch('https://api.spotify.com/v1/me/playlists?limit=50', { 
            headers: { 'Authorization': `Bearer ${token}` } 
          }).then(r => r.json()),
          fetch('https://api.spotify.com/v1/me/tracks?limit=1', { 
            headers: { 'Authorization': `Bearer ${token}` } 
          }).then(r => r.json())
        ]);

        let allPlaylists = pData.items || [];
        setTotalPlaylists(pData.total);
        setTotalTracks(tData.total);
        setPlaylists(allPlaylists);

        // Fetch all pages if needed
        let nextUrl = pData.next;
        while (nextUrl) {
          const nextRes = await fetch(nextUrl, { 
            headers: { 'Authorization': `Bearer ${token}` } 
          });
          const nextData = await nextRes.json();
          allPlaylists = [...allPlaylists, ...(nextData.items || [])];
          setPlaylists([...allPlaylists]);
          nextUrl = nextData.next;
        }

        setLoadingPlaylists(false);
      } catch (err) {
        console.error("Error loading dashboard:", err);
        setLoadingProfile(false);
        setLoadingPlaylists(false);
      }
    };

    loadDashboard();
  }, []);

  // Search and filter engine — runs against debouncedSearch so it only fires 250ms after typing stops
  const filteredPlaylists = useMemo(() => {
    return playlists.filter(p => {
      const matchesSearch = p.name.toLowerCase().includes(debouncedSearch.toLowerCase());
      if (!matchesSearch) return false;

      if (filterType === 'public') return p.public === true;
      if (filterType === 'private') return p.public === false;
      if (filterType === 'owned') return profile && p.owner.id === profile.id;

      return true; // 'all'
    });
  }, [playlists, debouncedSearch, filterType, profile]);

  return (
    <div className="min-h-screen bg-[#060606] text-white p-6 md:p-12 font-sans selection:bg-[#1DB954] selection:text-white">
      <div className="max-w-7xl mx-auto">
        <ProfileHeader profile={profile} loading={loadingProfile} />
        <StatsCards totalTracks={totalTracks} totalPlaylists={totalPlaylists} loading={loadingProfile} />

         {/* Advanced Tools Banner */}
         <div className="my-8 bg-gradient-to-r from-zinc-900 to-zinc-900/50 border border-zinc-800 rounded-3xl p-8 flex flex-col md:flex-row items-center justify-between gap-6 shadow-2xl">
            <div className="space-y-2">
               <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-[#1DB954]">Radar de Canciones</span>
               </h2>
               <p className="text-zinc-400 font-medium max-w-md">Busca una canción o artista a través de todas tus playlists al mismo tiempo.</p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
               <button 
                  onClick={() => navigate('/search')}
                  className="bg-[#1DB954] hover:bg-[#1ed760] text-black font-extrabold px-6 py-4 rounded-full transition-all hover:scale-105 active:scale-95 shadow-[0_0_30px_rgba(29,185,84,0.3)] whitespace-nowrap"
               >
                  Buscador Global
               </button>
               <button 
                  onClick={() => navigate('/merger')}
                  className="bg-transparent border border-zinc-600 hover:border-purple-500 hover:bg-purple-500/10 text-white font-extrabold px-6 py-4 rounded-full transition-all active:scale-95 whitespace-nowrap"
               >
                  Merge Mágico
               </button>
               <button 
                  onClick={() => window.dispatchEvent(new Event('open-chat'))}
                  className="bg-zinc-800 hover:bg-zinc-700 text-white font-extrabold px-6 py-4 rounded-full transition-all active:scale-95 flex items-center gap-2 whitespace-nowrap"
               >
                  ✨ AI Chat
               </button>
            </div>
         </div>

        <SearchBar onSearch={setSearchTerm} onFilterChange={setFilterType as any} />

        <PlaylistGrid playlists={filteredPlaylists} loading={loadingPlaylists} />
      </div>
    </div>
  );
}
