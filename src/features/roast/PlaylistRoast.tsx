import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getAuthToken } from '../../lib/api';
import { Flame, Loader2, Music, Sparkles, ArrowLeft } from 'lucide-react';
import { motion } from 'framer-motion';
import BackButton from '../../components/BackButton';

interface RoastResult {
  title: string;
  vibe: string;
  genres: string[];
  personality: string;
  roast: string;
  mood: string;
  suggestions: string[];
  score: number;
  scoreLabel: string;
}

export default function PlaylistRoast() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<RoastResult | null>(null);
  const [step, setStep] = useState<'fetching' | 'analyzing' | 'done'>('fetching');

  useState(() => {
    startRoast();
  });

  const startRoast = async () => {
    setLoading(true);
    setError(null);
    setStep('fetching');

    const token = await getAuthToken();
    if (!token) {
      navigate('/');
      return;
    }

    try {
      // 1. Fetch playlist info
      setStep('fetching');
      const pRes = await fetch(`https://api.spotify.com/v1/playlists/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const playlist = await pRes.json();

      // 2. Fetch all tracks (paginated)
      const allTracks: any[] = [];
      let nextUrl: string | null = `https://api.spotify.com/v1/playlists/${id}/tracks?limit=100`;

      while (nextUrl) {
        const tRes = await fetch(nextUrl, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const tData = await tRes.json();
        allTracks.push(...(tData.items || []));
        nextUrl = tData.next;
      }

      // 3. Fetch audio features (chunked, max 100 per request)
      const trackIds = allTracks
        .map((item: any) => item.track?.id)
        .filter(Boolean) as string[];
      const featuresMap: { [id: string]: any } = {};

      for (let i = 0; i < trackIds.length; i += 100) {
        const chunk = trackIds.slice(i, i + 100);
        const fRes = await fetch(
          `https://api.spotify.com/v1/audio-features?ids=${chunk.join(',')}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        const fData = await fRes.json();
        if (fData.audio_features) {
          fData.audio_features.forEach((f: any) => {
            if (f) featuresMap[f.id] = f;
          });
        }
      }

      // 4. Call our roast endpoint
      setStep('analyzing');
      const roastRes = await fetch(`${import.meta.env.VITE_API_URL || 'http://127.0.0.1:3000'}/api/roast`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          playlistName: playlist.name,
          playlistDescription: playlist.description,
          tracks: allTracks,
          audioFeatures: featuresMap
        })
      });

      if (!roastRes.ok) {
        const errData = await roastRes.json().catch(() => ({}));
        throw new Error(errData.error || 'Error al generar el roast');
      }

      const roastData = await roastRes.json();
      setResult(roastData);
      setStep('done');
    } catch (err: any) {
      console.error('Roast error:', err);
      setError(err.message || 'Ocurrió un error al analizar tu playlist');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#121212] text-white flex items-center justify-center p-6">
        <div className="text-center max-w-md">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            <Flame size={64} className="mx-auto mb-6 text-[#1DB954]" />
            <h2 className="text-2xl font-bold mb-3">
              {step === 'fetching' ? 'Obteniendo tus canciones...' : 'Analizando las vibes con AI...'}
            </h2>
            <p className="text-zinc-400 mb-8">
              {step === 'fetching'
                ? 'Estamos recopilando toda la info de tu playlist'
                : 'Gemini está preparando un análisis épico'}
            </p>
          </motion.div>

          <div className="flex flex-col items-center gap-4">
            <Loader2 size={40} className="animate-spin text-[#1DB954]" />
            <div className="w-full max-w-xs bg-zinc-800 rounded-full h-2 overflow-hidden">
              <motion.div
                className="h-full bg-[#1DB954] rounded-full"
                initial={{ width: step === 'fetching' ? '30%' : '70%' }}
                animate={{ width: step === 'done' ? '100%' : step === 'analyzing' ? '80%' : '30%' }}
                transition={{ duration: 0.8 }}
              />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#121212] text-white flex items-center justify-center p-6">
        <div className="text-center max-w-md">
          <Flame size={48} className="mx-auto mb-4 text-red-500" />
          <h2 className="text-2xl font-bold mb-3">Algo salió mal</h2>
          <p className="text-zinc-400 mb-6">{error}</p>
          <button
            onClick={() => navigate(`/playlist/${id}`)}
            className="px-6 py-3 rounded-full bg-zinc-800 hover:bg-zinc-700 font-semibold transition-colors"
          >
            Volver a la playlist
          </button>
        </div>
      </div>
    );
  }

  if (!result) return null;

  return (
    <div className="min-h-screen bg-[#121212] text-white">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-[#121212]/90 backdrop-blur-md border-b border-zinc-800">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-4">
          <BackButton to={`/playlist/${id}`} label="" />
          <Flame size={24} className="text-[#1DB954]" />
          <h1 className="text-xl font-bold">Playlist Roast</h1>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">
        {/* Score Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-zinc-900 to-zinc-800 border border-zinc-700 p-8 text-center"
        >
          <div className="absolute inset-0 bg-[#1DB954]/5" />
          <div className="relative">
            <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-[#1DB954]/20 border-2 border-[#1DB954] mb-4">
              <span className="text-4xl font-black text-[#1DB954]">{result.score}</span>
            </div>
            <p className="text-zinc-400 text-sm">{result.scoreLabel}</p>
            <h2 className="text-2xl font-bold mt-4">{result.title}</h2>
          </div>
        </motion.div>

        {/* Vibe */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="rounded-2xl bg-zinc-900 border border-zinc-800 p-6"
        >
          <div className="flex items-center gap-2 mb-3">
            <Sparkles size={18} className="text-[#1DB954]" />
            <h3 className="font-bold text-lg">La Vibra General</h3>
          </div>
          <p className="text-zinc-300 leading-relaxed">{result.vibe}</p>
        </motion.div>

        {/* Genres */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="rounded-2xl bg-zinc-900 border border-zinc-800 p-6"
        >
          <div className="flex items-center gap-2 mb-3">
            <Music size={18} className="text-[#1DB954]" />
            <h3 className="font-bold text-lg">Géneros Detectados</h3>
          </div>
          <div className="flex flex-wrap gap-2">
            {result.genres.map((genre, i) => (
              <span
                key={i}
                className="px-4 py-2 rounded-full bg-[#1DB954]/10 text-[#1DB954] text-sm font-medium border border-[#1DB954]/20"
              >
                {genre}
              </span>
            ))}
          </div>
        </motion.div>

        {/* Roast */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="rounded-2xl bg-zinc-900 border border-zinc-800 p-6"
        >
          <div className="flex items-center gap-2 mb-3">
            <Flame size={18} className="text-orange-500" />
            <h3 className="font-bold text-lg">El Roast 🔥</h3>
          </div>
          <p className="text-zinc-300 leading-relaxed italic">"{result.roast}"</p>
        </motion.div>

        {/* Personality */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="rounded-2xl bg-zinc-900 border border-zinc-800 p-6"
        >
          <div className="flex items-center gap-2 mb-3">
            <Sparkles size={18} className="text-purple-500" />
            <h3 className="font-bold text-lg">¿Qué dice tu música de ti?</h3>
          </div>
          <p className="text-zinc-300 leading-relaxed">{result.personality}</p>
        </motion.div>

        {/* Mood */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="rounded-2xl bg-zinc-900 border border-zinc-800 p-6"
        >
          <div className="flex items-center gap-2 mb-3">
            <Music size={18} className="text-blue-500" />
            <h3 className="font-bold text-lg">Momento Perfecto</h3>
          </div>
          <p className="text-zinc-300 leading-relaxed">{result.mood}</p>
        </motion.div>

        {/* Suggestions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="rounded-2xl bg-zinc-900 border border-zinc-800 p-6"
        >
          <div className="flex items-center gap-2 mb-3">
            <Sparkles size={18} className="text-yellow-500" />
            <h3 className="font-bold text-lg">Sugerencias para Mejorar</h3>
          </div>
          <ul className="space-y-3">
            {result.suggestions.map((s: string, i: number) => (
              <li key={i} className="flex items-start gap-3 text-zinc-300">
                <span className="mt-1.5 w-2 h-2 rounded-full bg-[#1DB954] flex-shrink-0" />
                {s}
              </li>
            ))}
          </ul>
        </motion.div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="flex flex-col sm:flex-row gap-3 justify-center pt-4 pb-12"
        >
          <button
            onClick={startRoast}
            className="px-6 py-3 rounded-full bg-zinc-800 hover:bg-zinc-700 font-semibold transition-colors flex items-center justify-center gap-2"
          >
            <Flame size={18} />
            Re-Roast
          </button>
          <button
            onClick={() => navigate(`/playlist/${id}`)}
            className="px-6 py-3 rounded-full bg-[#1DB954] text-black font-bold hover:bg-[#1ed760] transition-colors flex items-center justify-center gap-2"
          >
            <ArrowLeft size={18} />
            Volver a la Playlist
          </button>
        </motion.div>
      </div>
    </div>
  );
}
