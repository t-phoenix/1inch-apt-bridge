'use client';

import { AlertCircle, CheckCircle, Info, X } from 'lucide-react';
import { useEffect } from 'react';

interface CustomNotificationProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  message: string;
  type?: 'success' | 'info' | 'warning' | 'error';
  duration?: number;
}

export function CustomNotification({ 
  isOpen, 
  onClose, 
  title,
  message, 
  type = 'info',
  duration = 4000 
}: CustomNotificationProps) {
  useEffect(() => {
    if (isOpen && duration > 0) {
      const timer = setTimeout(() => {
        onClose();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [isOpen, duration, onClose]);

  if (!isOpen) return null;

  const getIcon = () => {
    switch (type) {
      case 'success':
        return <CheckCircle size={24} className="text-green-400" />;
      case 'warning':
        return <AlertCircle size={24} className="text-yellow-400" />;
      case 'error':
        return <AlertCircle size={24} className="text-red-400" />;
      default:
        return <Info size={24} className="text-blue-400" />;
    }
  };

  const getBorderColor = () => {
    switch (type) {
      case 'success':
        return 'border-green-500/30';
      case 'warning':
        return 'border-yellow-500/30';
      case 'error':
        return 'border-red-500/30';
      default:
        return 'border-blue-500/30';
    }
  };

  return (
    <div className="fixed top-6 right-6 z-[60] animate-in slide-in-from-right-4 fade-in duration-300">
      <div className={`bg-gray-900/95 backdrop-blur-xl border ${getBorderColor()} rounded-2xl p-6 min-w-[320px] max-w-[450px] shadow-2xl`}>
        <div className="flex items-start space-x-4">
          <div className="flex-shrink-0 mt-0.5">
            {getIcon()}
          </div>
          
          <div className="flex-1 space-y-2">
            {title && (
              <div className="text-white font-semibold text-lg">
                {title}
              </div>
            )}
            <div className="text-gray-300 text-sm leading-relaxed">
              {message}
            </div>
          </div>
          
          <button
            onClick={onClose}
            className="flex-shrink-0 text-gray-400 hover:text-white transition-colors p-1 hover:bg-white/10 rounded-lg"
          >
            <X size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}