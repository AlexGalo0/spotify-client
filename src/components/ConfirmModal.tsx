import { useEffect } from 'react';
import { X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
  isDestructive?: boolean;
}

export default function ConfirmModal({
  isOpen,
  title,
  message,
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  onConfirm,
  onCancel,
  isDestructive = false
}: ConfirmModalProps) {
  
  // Prevent scrolling when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => { document.body.style.overflow = 'unset'; };
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={onCancel}
          />
          
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: "spring", duration: 0.5, bounce: 0.3 }}
            className="relative w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden"
          >
             {/* Glowing accent border top */}
             <div className={`h-1 w-full ${isDestructive ? 'bg-red-500' : 'bg-[#1DB954]'}`} />
             
             <button 
               onClick={onCancel}
               className="absolute top-4 right-4 text-zinc-500 hover:text-white transition-colors"
             >
                <X size={20} />
             </button>

             <div className="p-6 sm:p-8">
               <h3 className="text-xl font-bold text-white mb-3 pr-6">{title}</h3>
               <p className="text-zinc-400 text-sm leading-relaxed mb-8">
                 {message}
               </p>

               <div className="flex flex-col sm:flex-row gap-3 justify-end mt-4">
                  <button
                    onClick={onCancel}
                    className="px-5 py-2.5 rounded-full text-zinc-300 font-semibold hover:bg-zinc-800 hover:text-white transition-colors text-sm"
                  >
                    {cancelText}
                  </button>
                  <button
                    onClick={() => { onConfirm(); onCancel(); }}
                    className={`px-6 py-2.5 rounded-full font-bold text-sm transition-all shadow-lg active:scale-95 ${
                      isDestructive 
                        ? 'bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white border border-red-500/50' 
                        : 'bg-[#1DB954] text-black hover:bg-[#1ed760] hover:shadow-[0_0_20px_rgba(29,185,84,0.3)]'
                    }`}
                  >
                    {confirmText}
                  </button>
               </div>
             </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
