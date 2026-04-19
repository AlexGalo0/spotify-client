import { LogOut, User } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { logout } from '../../../lib/api';

interface ProfileHeaderProps {
  profile: any;
  loading: boolean;
}

export default function ProfileHeader({ profile, loading }: ProfileHeaderProps) {
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    window.location.href = '/';
  };

  if (loading) {
    return (
      <div className="flex justify-between items-center animate-pulse">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-zinc-800 rounded-full"></div>
          <div>
            <div className="w-32 h-6 bg-zinc-800 rounded mb-2"></div>
            <div className="w-20 h-4 bg-zinc-800 rounded"></div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 bg-zinc-800 rounded-full"></div>
          <div className="w-10 h-10 bg-zinc-800 rounded-full"></div>
        </div>
      </div>
    );
  }

  if (!profile) return null;

  return (
    <div className="flex justify-between items-center bg-zinc-900/40 p-4 sm:p-6 rounded-2xl border border-zinc-800/80 shadow-md">
       <div className="flex items-center gap-4 sm:gap-5">
         <button
            onClick={() => navigate('/profile')}
            className="relative group"
         >
           <img
              src={profile.images?.[0]?.url || 'https://via.placeholder.com/150'}
              alt="User profile"
              className="w-14 h-14 sm:w-16 sm:h-16 rounded-full shadow-lg border-2 border-zinc-800 group-hover:border-[#1DB954]/50 transition-colors object-cover"
           />
           <div className="absolute inset-0 rounded-full bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
             <User size={20} className="text-white" />
           </div>
         </button>
         <div>
           <div className="flex items-center gap-2 mb-1">
             <span className="text-[#1DB954] text-xs font-bold tracking-widest uppercase">
               {profile.product === 'premium' ? 'Premium' : 'Free'}
             </span>
             {profile.country && (
               <span className="text-zinc-600 text-xs">·</span>
             )}
             {profile.country && (
               <span className="text-zinc-500 text-xs font-medium">{profile.country}</span>
             )}
           </div>
           <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-white tracking-tight">
             {profile.display_name}
           </h1>
           <button
              onClick={() => navigate('/profile')}
              className="text-zinc-500 hover:text-[#1DB954] text-xs font-medium transition-colors mt-0.5"
           >
             Ver perfil completo →
           </button>
         </div>
       </div>
       <div className="flex items-center gap-1">
         <button
            onClick={() => navigate('/profile')}
            title="Ver Perfil"
            className="p-2.5 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-full transition-colors"
         >
           <User size={18} />
         </button>
         <button
           onClick={handleLogout}
           title="Cerrar Sesión"
           className="p-2.5 text-zinc-400 hover:text-red-400 hover:bg-zinc-800 rounded-full transition-colors"
         >
           <LogOut size={18} />
         </button>
       </div>
    </div>
  );
}
