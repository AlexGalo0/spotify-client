import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAuthToken } from '../../lib/api';
import BackButton from '../../components/BackButton';
import { motion } from 'framer-motion';
import {
  Music, Heart, Users, Globe, Mail, Crown, ExternalLink,
  Play, Clock, Star, TrendingUp, Loader2, UserPlus
} from 'lucide-react';

type TimeRange = 'short_term' | 'medium_term' | 'long_term';

export default function ProfilePage() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<any>(null);
  const [topArtists, setTopArtists] = useState<any[]>([]);
  const [topTracks, setTopTracks] = useState<any[]>([]);
  const [recentlyPlayed, setRecentlyPlayed] = useState<any[]>([]);
  const [followedArtists, setFollowedArtists] = useState<any[]>([]);
  const [playlists, setPlaylists] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'top' | 'recent' | 'following'>('overview');
  const [timeRange, setTimeRange] = useState<TimeRange>('medium_term');
  const [loadingTab, setLoadingTab] = useState(false);

  const fetchProfile = useCallback(async () => {
    const token = await getAuthToken();
    if (!token) return navigate('/');

    try {
      // Profile
      const profileRes = await fetch('https://api.spotify.com/v1/me', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const profileData = await profileRes.json();
      setProfile(profileData);

      // Playlists count
      let allPlaylists: any[] = [];
      let nextUrl = 'https://api.spotify.com/v1/me/playlists?limit=50';
      while (nextUrl) {
        const res = await fetch(nextUrl, { headers: { Authorization: `Bearer ${token}` } });
        const data = await res.json();
        allPlaylists = [...allPlaylists, ...(data.items || [])];
        nextUrl = data.next;
      }
      setPlaylists(allPlaylists);

      // Top artists (medium_term)
      const artistsRes = await fetch('https://api.spotify.com/v1/me/top/artists?limit=10&time_range=medium_term', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const artistsData = await artistsRes.json();
      setTopArtists(artistsData.items || []);

      // Top tracks (medium_term)
      const tracksRes = await fetch('https://api.spotify.com/v1/me/top/tracks?limit=10&time_range=medium_term', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const tracksData = await tracksRes.json();
      setTopTracks(tracksData.items || []);

      // Recently played
      const recentRes = await fetch('https://api.spotify.com/v1/me/player/recently-played?limit=10', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const recentData = await recentRes.json();
      setRecentlyPlayed(recentData.items || []);

      // Followed artists
      const followedRes = await fetch('https://api.spotify.com/v1/me/following?type=artist&limit=20', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const followedData = await followedRes.json();
      setFollowedArtists(followedData.artists?.items || []);

    } catch (err) {
      console.error('Profile fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const fetchTimeRange = async (range: TimeRange) => {
    setLoadingTab(true);
    setTimeRange(range);
    const token = await getAuthToken();
    if (!token) return;

    try {
      const [artistsRes, tracksRes] = await Promise.all([
        fetch(`https://api.spotify.com/v1/me/top/artists?limit=20&time_range=${range}`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        fetch(`https://api.spotify.com/v1/me/top/tracks?limit=20&time_range=${range}`, {
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);
      const artistsData = await artistsRes.json();
      const tracksData = await tracksRes.json();
      setTopArtists(artistsData.items || []);
      setTopTracks(tracksData.items || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingTab(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#121212] flex items-center justify-center">
        <Loader2 size={40} className="animate-spin text-[#1DB954]" />
      </div>
    );
  }

  if (!profile) return null;

  const followerCount = profile.followers?.total || 0;
  const ownedPlaylists = playlists.filter(p => p.owner?.id === profile.id);
  const collabPlaylists = playlists.filter(p => p.collaborative);

  const timeRangeLabels: Record<TimeRange, string> = {
    short_term: 'Últimas 4 semanas',
    medium_term: 'Últimos 6 meses',
    long_term: 'Todo el tiempo'
  };

  const formatTime = (ms: number) => {
    const totalSec = Math.floor(ms / 1000);
    const min = Math.floor(totalSec / 60);
    const sec = totalSec % 60;
    return `${min}:${sec.toString().padStart(2, '0')}`;
  };

  const timeAgo = (isoDate: string) => {
    const date = new Date(isoDate);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMin = Math.floor(diffMs / 60000);
    if (diffMin < 60) return `hace ${diffMin} min`;
    const diffHr = Math.floor(diffMin / 60);
    if (diffHr < 24) return `hace ${diffHr}h`;
    const diffDays = Math.floor(diffHr / 24);
    return `hace ${diffDays}d`;
  };

  return (
    <div className="min-h-screen bg-[#121212] text-white">
      {/* Hero Header */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-[#1DB954]/20 to-transparent" />
        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 pt-8 pb-6">
          <BackButton label="Dashboard" />

          <div className="flex flex-col sm:flex-row items-center sm:items-end gap-6 mt-6">
            {/* Avatar */}
            {profile.images?.[0]?.url ? (
              <img
                src={profile.images[0].url}
                alt={profile.display_name}
                className="w-32 h-32 sm:w-40 sm:h-40 rounded-full shadow-2xl object-cover border-2 border-white/10"
              />
            ) : (
              <div className="w-32 h-32 sm:w-40 sm:h-40 rounded-full bg-zinc-800 flex items-center justify-center border-2 border-zinc-700">
                <Music size={48} className="text-zinc-500" />
              </div>
            )}

            {/* Info */}
            <div className="text-center sm:text-left flex-1">
              <div className="flex items-center gap-2 justify-center sm:justify-start">
                <h1 className="text-3xl sm:text-5xl font-black text-white">{profile.display_name}</h1>
                {profile.product === 'premium' && <Crown size={20} className="text-[#1DB954]" />}
              </div>
              <p className="text-zinc-400 mt-1">@{profile.id}</p>

              {/* Badges */}
              <div className="flex flex-wrap gap-2 mt-3 justify-center sm:justify-start">
                <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                  profile.product === 'premium'
                    ? 'bg-[#1DB954]/20 text-[#1DB954] border border-[#1DB954]/30'
                    : 'bg-zinc-800 text-zinc-400 border border-zinc-700'
                }`}>
                  {profile.product === 'premium' ? 'Premium' : 'Free'}
                </span>
                {profile.country && (
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-zinc-800 text-zinc-400 border border-zinc-700 flex items-center gap-1">
                    <Globe size={12} /> {profile.country}
                  </span>
                )}
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-zinc-800 text-zinc-400 border border-zinc-700 flex items-center gap-1">
                  <Users size={12} /> {followerCount.toLocaleString()} seguidores
                </span>
              </div>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-8">
            <div className="bg-zinc-900/80 backdrop-blur border border-zinc-800 rounded-xl p-4 text-center">
              <p className="text-2xl font-black text-white">{playlists.length}</p>
              <p className="text-xs text-zinc-500 font-medium">Playlists</p>
            </div>
            <div className="bg-zinc-900/80 backdrop-blur border border-zinc-800 rounded-xl p-4 text-center">
              <p className="text-2xl font-black text-white">{ownedPlaylists.length}</p>
              <p className="text-xs text-zinc-500 font-medium">Creadas</p>
            </div>
            <div className="bg-zinc-900/80 backdrop-blur border border-zinc-800 rounded-xl p-4 text-center">
              <p className="text-2xl font-black text-white">{collabPlaylists.length}</p>
              <p className="text-xs text-zinc-500 font-medium">Colaborativas</p>
            </div>
            <div className="bg-zinc-900/80 backdrop-blur border border-zinc-800 rounded-xl p-4 text-center">
              <p className="text-2xl font-black text-white">{followedArtists.length}</p>
              <p className="text-xs text-zinc-500 font-medium">Artistas seguidos</p>
            </div>
          </div>
        </div>
      </div>

      {/* Detail Section */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 pb-12">
        {/* Tabs */}
        <div className="flex items-center gap-1 border-b border-zinc-800 mb-6 overflow-x-auto">
          {[
            { id: 'overview' as const, label: 'Overview', icon: TrendingUp },
            { id: 'top' as const, label: 'Top', icon: Star },
            { id: 'recent' as const, label: 'Recientes', icon: Clock },
            { id: 'following' as const, label: 'Siguiendo', icon: UserPlus },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => { setActiveTab(tab.id); if (tab.id === 'top') fetchTimeRange(timeRange); }}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-semibold border-b-2 transition-colors whitespace-nowrap ${
                activeTab === tab.id
                  ? 'border-[#1DB954] text-[#1DB954]'
                  : 'border-transparent text-zinc-500 hover:text-zinc-300'
              }`}
            >
              <tab.icon size={16} />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Top 5 Artists */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
              <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                <Star size={18} className="text-[#1DB954]" /> Top 5 Artistas (6 meses)
              </h3>
              <div className="space-y-3">
                {topArtists.slice(0, 5).map((artist, i) => (
                  <div key={artist.id} className="flex items-center gap-3">
                    <span className="text-zinc-600 font-bold text-sm w-6">{i + 1}</span>
                    {artist.images?.[0] && (
                      <img src={artist.images[0].url} className="w-10 h-10 rounded-full object-cover" alt="" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-white font-semibold text-sm truncate">{artist.name}</p>
                      <p className="text-zinc-500 text-xs">{artist.followers?.total?.toLocaleString()} seguidores</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Top 5 Tracks */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
              <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                <Music size={18} className="text-[#1DB954]" /> Top 5 Canciones (6 meses)
              </h3>
              <div className="space-y-3">
                {topTracks.slice(0, 5).map((track, i) => (
                  <div key={track.id} className="flex items-center gap-3">
                    <span className="text-zinc-600 font-bold text-sm w-6">{i + 1}</span>
                    {track.album?.images?.[2] && (
                      <img src={track.album.images[2].url} className="w-10 h-10 rounded object-cover" alt="" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-white font-semibold text-sm truncate">{track.name}</p>
                      <p className="text-zinc-500 text-xs truncate">{track.artists?.map((a: any) => a.name).join(', ')}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Profile Details */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
              <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                <Users size={18} className="text-[#1DB954]" /> Detalles del Perfil
              </h3>
              <div className="space-y-3 text-sm">
                {profile.email && (
                  <div className="flex items-center justify-between py-2 border-b border-zinc-800">
                    <span className="text-zinc-500 flex items-center gap-2"><Mail size={14} /> Email</span>
                    <span className="text-white font-medium">{profile.email}</span>
                  </div>
                )}
                {profile.country && (
                  <div className="flex items-center justify-between py-2 border-b border-zinc-800">
                    <span className="text-zinc-500 flex items-center gap-2"><Globe size={14} /> País</span>
                    <span className="text-white font-medium">{profile.country}</span>
                  </div>
                )}
                <div className="flex items-center justify-between py-2 border-b border-zinc-800">
                  <span className="text-zinc-500 flex items-center gap-2"><Crown size={14} /> Plan</span>
                  <span className="text-white font-medium capitalize">{profile.product}</span>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-zinc-800">
                  <span className="text-zinc-500 flex items-center gap-2"><Users size={14} /> Seguidores</span>
                  <span className="text-white font-medium">{followerCount.toLocaleString()}</span>
                </div>
                {profile.external_urls?.spotify && (
                  <div className="flex items-center justify-between py-2">
                    <span className="text-zinc-500 flex items-center gap-2"><ExternalLink size={14} /> Perfil Spotify</span>
                    <a
                      href={profile.external_urls.spotify}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[#1DB954] hover:underline font-medium text-xs truncate ml-4"
                    >
                      Abrir en Spotify
                    </a>
                  </div>
                )}
              </div>
            </div>

            {/* Recently Played */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
              <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                <Clock size={18} className="text-[#1DB954]" /> Escuchado Recientemente
              </h3>
              <div className="space-y-3">
                {recentlyPlayed.slice(0, 5).map((item: any, i: number) => (
                  <div key={`${item.track?.id}-${i}`} className="flex items-center gap-3">
                    {item.track?.album?.images?.[2] && (
                      <img src={item.track.album.images[2].url} className="w-10 h-10 rounded object-cover" alt="" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-white font-semibold text-sm truncate">{item.track?.name}</p>
                      <p className="text-zinc-500 text-xs truncate">{item.track?.artists?.map((a: any) => a.name).join(', ')}</p>
                    </div>
                    <span className="text-zinc-600 text-xs whitespace-nowrap">{timeAgo(item.played_at)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'top' && (
          <div>
            {/* Time Range Selector */}
            <div className="flex gap-2 mb-6">
              {(Object.keys(timeRangeLabels) as TimeRange[]).map(range => (
                <button
                  key={range}
                  onClick={() => fetchTimeRange(range)}
                  className={`px-4 py-2 rounded-full text-sm font-semibold transition-colors ${
                    timeRange === range
                      ? 'bg-[#1DB954] text-black'
                      : 'bg-zinc-800 text-zinc-400 hover:text-white'
                  }`}
                >
                  {timeRangeLabels[range]}
                </button>
              ))}
            </div>

            {loadingTab ? (
              <div className="flex justify-center py-20"><Loader2 className="animate-spin text-[#1DB954]" size={40} /></div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Top Artists */}
                <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
                  <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                    <Star size={18} className="text-[#1DB954]" /> Top Artistas
                  </h3>
                  <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2">
                    {topArtists.map((artist, i) => (
                      <motion.div
                        key={artist.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.03 }}
                        className="flex items-center gap-3 p-2 rounded-lg hover:bg-zinc-800/50 transition-colors"
                      >
                        <span className="text-zinc-600 font-bold text-sm w-8 text-center">{i + 1}</span>
                        {artist.images?.[0] ? (
                          <img src={artist.images[0].url} className="w-12 h-12 rounded-full object-cover" alt="" />
                        ) : (
                          <div className="w-12 h-12 rounded-full bg-zinc-800" />
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-white font-semibold truncate">{artist.name}</p>
                          <p className="text-zinc-500 text-xs">{artist.genres?.slice(0, 2).join(', ')}</p>
                        </div>
                        <span className="text-zinc-600 text-xs">{artist.followers?.total?.toLocaleString()}</span>
                      </motion.div>
                    ))}
                  </div>
                </div>

                {/* Top Tracks */}
                <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
                  <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                    <Music size={18} className="text-[#1DB954]" /> Top Canciones
                  </h3>
                  <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2">
                    {topTracks.map((track, i) => (
                      <motion.div
                        key={track.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.03 }}
                        className="flex items-center gap-3 p-2 rounded-lg hover:bg-zinc-800/50 transition-colors"
                      >
                        <span className="text-zinc-600 font-bold text-sm w-8 text-center">{i + 1}</span>
                        {track.album?.images?.[2] ? (
                          <img src={track.album.images[2].url} className="w-12 h-12 rounded object-cover" alt="" />
                        ) : (
                          <div className="w-12 h-12 rounded bg-zinc-800" />
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-white font-semibold truncate">{track.name}</p>
                          <p className="text-zinc-500 text-xs truncate">{track.artists?.map((a: any) => a.name).join(', ')}</p>
                        </div>
                        <span className="text-zinc-600 text-xs">{formatTime(track.duration_ms)}</span>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'recent' && (
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
              <Clock size={18} className="text-[#1DB954]" /> Historial Reciente
            </h3>
            <div className="space-y-2">
              {recentlyPlayed.map((item: any, i: number) => (
                <div key={`recent-${i}`} className="flex items-center gap-4 p-3 rounded-lg hover:bg-zinc-800/50 transition-colors">
                  <Play size={16} className="text-zinc-600" />
                  {item.track?.album?.images?.[2] && (
                    <img src={item.track.album.images[2].url} className="w-10 h-10 rounded object-cover" alt="" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-semibold text-sm truncate">{item.track?.name}</p>
                    <p className="text-zinc-500 text-xs truncate">{item.track?.artists?.map((a: any) => a.name).join(', ')}</p>
                  </div>
                  <span className="text-zinc-500 text-xs whitespace-nowrap">{timeAgo(item.played_at)}</span>
                </div>
              ))}
              {recentlyPlayed.length === 0 && (
                <p className="text-zinc-500 text-center py-8">No hay historial reciente disponible</p>
              )}
            </div>
          </div>
        )}

        {activeTab === 'following' && (
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
              <UserPlus size={18} className="text-[#1DB954]" /> Artistas que Sigues ({followedArtists.length})
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {followedArtists.map(artist => (
                <div key={artist.id} className="flex items-center gap-3 p-3 rounded-xl bg-zinc-950 border border-zinc-800 hover:border-zinc-700 transition-colors">
                  {artist.images?.[0] ? (
                    <img src={artist.images[0].url} className="w-14 h-14 rounded-full object-cover" alt="" />
                  ) : (
                    <div className="w-14 h-14 rounded-full bg-zinc-800 flex items-center justify-center">
                      <Music size={20} className="text-zinc-600" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-semibold text-sm truncate">{artist.name}</p>
                    <p className="text-zinc-500 text-xs">{artist.followers?.total?.toLocaleString()} seguidores</p>
                    <p className="text-zinc-600 text-xs truncate">{artist.genres?.slice(0, 2).join(', ') || ''}</p>
                  </div>
                </div>
              ))}
            </div>
            {followedArtists.length === 0 && (
              <p className="text-zinc-500 text-center py-8">No sigues a ningún artista aún</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
