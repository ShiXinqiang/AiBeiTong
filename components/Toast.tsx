import React, { useEffect } from 'react';
import { CheckCircle, AlertCircle, X } from 'lucide-react';

interface ToastProps {
  message: string;
  type?: 'success' | 'error';
  onClose: () => void;
}

const Toast: React.FC<ToastProps> = ({ message, type = 'success', onClose }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className="fixed top-4 left-4 right-4 z-[100] flex justify-center pointer-events-none">
      <div className={`
        pointer-events-auto shadow-lg rounded-xl px-4 py-3 flex items-center gap-3 min-w-[300px] max-w-md animate-in slide-in-from-top-5 fade-in duration-300
        ${type === 'success' ? 'bg-slate-900 text-white' : 'bg-red-500 text-white'}
      `}>
        {type === 'success' ? <CheckCircle size={20} className="text-emerald-400" /> : <AlertCircle size={20} />}
        <span className="text-sm font-medium flex-1">{message}</span>
        <button onClick={onClose}><X size={16} className="opacity-70" /></button>
      </div>
    </div>
  );
};

export default Toast;