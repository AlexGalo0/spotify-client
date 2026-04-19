import { useState } from 'react';
import { Search, SlidersHorizontal } from 'lucide-react';

type FilterType = 'all' | 'public' | 'private' | 'owned';

interface SearchBarProps {
  onSearch: (term: string) => void;
  onFilterChange: (filter: FilterType) => void;
}

export default function SearchBar({ onSearch, onFilterChange }: SearchBarProps) {
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');

  const handleFilter = (f: FilterType) => {
    setActiveFilter(f);
    onFilterChange(f);
  };

  const buttonClass = (match: FilterType) => 
    `px-4 py-2 rounded-full text-sm font-semibold transition-all ${
      activeFilter === match 
        ? 'bg-[#1DB954] text-black shadow-md' 
        : 'bg-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-700'
    }`;

  return (
    <div className="flex flex-col md:flex-row justify-between items-center gap-4 mt-10 mb-8 border-b border-zinc-800 pb-6">
      
      {/* Input de Búsqueda */}
      <div className="relative w-full md:w-96 group">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 group-focus-within:text-[#1DB954] transition-colors" size={20} />
        <input 
          type="text"
          placeholder="Buscar una playlist..."
          onChange={(e) => onSearch(e.target.value)}
          className="w-full bg-zinc-900 border border-zinc-800 text-white rounded-full py-3 pl-12 pr-6 outline-none focus:border-[#1DB954] focus:ring-1 focus:ring-[#1DB954] transition-all"
        />
      </div>

      {/* Píldoras de Filtros */}
      <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-2 md:pb-0 scrollbar-hide">
        <div className="text-zinc-600 mr-2"><SlidersHorizontal size={20} /></div>
        <button onClick={() => handleFilter('all')} className={buttonClass('all')}>Todas</button>
        <button onClick={() => handleFilter('owned')} className={buttonClass('owned')}>Mis Listas</button>
        <button onClick={() => handleFilter('public')} className={buttonClass('public')}>Públicas</button>
        <button onClick={() => handleFilter('private')} className={buttonClass('private')}>Privadas</button>
      </div>

    </div>
  );
}
