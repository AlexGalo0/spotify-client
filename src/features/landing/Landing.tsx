import { API_URL } from '../../lib/api';

function Landing() {
  const handleLogin = () => {
    window.location.href = `${API_URL}/auth/login`;
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white flex flex-col relative overflow-hidden selection:bg-[#1DB954] selection:text-white font-sans">
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-[#1DB954] rounded-full blur-[150px] opacity-20 pointer-events-none mix-blend-screen" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-[#1ed760] rounded-full blur-[150px] opacity-10 pointer-events-none mix-blend-screen" />

      <main className="flex-1 flex flex-col items-center justify-center p-6 z-10 w-full max-w-4xl mx-auto">
        <div className="mb-10 relative group cursor-default">
          <div className="absolute inset-0 bg-[#1DB954] blur-2xl opacity-30 group-hover:opacity-60 transition-opacity duration-700 animate-pulse rounded-full" />
          <div className="relative bg-[#121212] p-6 rounded-[2rem] border border-zinc-800 shadow-[0_0_40px_rgba(0,0,0,0.8)] transform group-hover:-translate-y-2 transition-all duration-500">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-[#1DB954]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
            </svg>
          </div>
        </div>

        <div className="text-center space-y-6 max-w-3xl">
          <h1 className="pb-4 text-5xl md:text-7xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-br from-white via-zinc-200 to-zinc-600 drop-shadow-sm px-4">
            SpotifyHelper
          </h1>
          <p className="text-lg md:text-2xl text-zinc-400 font-medium leading-relaxed max-w-2xl mx-auto">
            Tus canciones favoritas, <span className="text-zinc-100 font-semibold">organizadas a tu manera.</span> <br className="hidden md:block mt-2"/>
            Ordena, sincroniza y toma el control total de tus playlists fácilmente.
          </p>
        </div>

        <div className="mt-14 flex flex-col items-center gap-5 w-full">
          <button 
            onClick={handleLogin}
            className="group relative w-full sm:w-auto flex items-center justify-center gap-3 bg-[#1DB954] hover:bg-[#1ed760] text-black font-bold text-lg md:text-xl px-10 py-5 rounded-full transition-all duration-300 hover:scale-105 hover:shadow-[0_0_40px_rgba(29,185,84,0.4)] active:scale-95"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 md:h-7 md:w-7" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.24 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15.001 10.62 18.6 12.84c.361.181.54.84.36 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.6.18-1.2.72-1.38 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/>
            </svg>
            Conectar con Spotify
          </button>
        </div>
      </main>
    </div>
  );
}

export default Landing;
