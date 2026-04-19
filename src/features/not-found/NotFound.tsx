import { Link } from 'react-router-dom';

function NotFound() {
  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white flex flex-col relative overflow-hidden selection:bg-[#1DB954] selection:text-white font-sans">
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-[#1DB954] rounded-full blur-[150px] opacity-10 pointer-events-none mix-blend-screen" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-[#1ed760] rounded-full blur-[150px] opacity-10 pointer-events-none mix-blend-screen" />

      <main className="flex-1 flex flex-col items-center justify-center p-6 z-10 w-full max-w-4xl mx-auto text-center space-y-8">
        <div className="mb-4 relative group cursor-default">
          <div className="absolute inset-0 bg-[#1DB954] blur-2xl opacity-20 group-hover:opacity-40 transition-opacity duration-700 animate-pulse rounded-full" />
          <div className="relative bg-[#121212] p-8 rounded-[2rem] border border-zinc-800 shadow-[0_0_40px_rgba(0,0,0,0.8)]">
            <h1 className="text-8xl md:text-9xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-br from-[#1DB954] to-zinc-400 drop-shadow-sm">
              404
            </h1>
          </div>
        </div>

        <div className="space-y-4 max-w-2xl px-4">
          <h2 className="text-3xl md:text-4xl font-bold text-zinc-100">
            Página no encontrada
          </h2>
          <p className="text-lg md:text-xl text-zinc-400 leading-relaxed font-medium">
            Parece que te has perdido en el ritmo. La sección que buscas no existe o ha sido movida.
          </p>
        </div>

        <div className="pt-6">
          <Link 
            to="/"
            className="group relative inline-flex items-center justify-center gap-3 bg-[#121212] border border-zinc-800 hover:border-[#1DB954] text-white font-bold text-lg md:text-xl px-10 py-4 rounded-full transition-all duration-300 hover:scale-105 shadow-lg hover:shadow-[0_0_30px_rgba(29,185,84,0.3)] active:scale-95"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-[#1DB954]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
            Volver al inicio
          </Link>
        </div>
      </main>
    </div>
  );
}

export default NotFound;
