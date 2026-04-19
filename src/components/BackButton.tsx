import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface BackButtonProps {
  to?: string;
  label?: string;
  className?: string;
}

export default function BackButton({ to = '/dashboard', label, className = '' }: BackButtonProps) {
  const navigate = useNavigate();

  return (
    <button
      onClick={() => navigate(to)}
      className={`inline-flex items-center gap-2 text-zinc-400 hover:text-white transition-colors group ${className}`}
    >
      <span className="w-8 h-8 rounded-full bg-zinc-800 group-hover:bg-zinc-700 flex items-center justify-center transition-colors">
        <ArrowLeft size={16} />
      </span>
      {label && <span className="text-sm font-medium">{label}</span>}
    </button>
  );
}
