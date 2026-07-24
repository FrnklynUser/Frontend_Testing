import React, { createContext, useContext, useState, useCallback } from 'react';
import { X, CheckCircle, XCircle, AlertTriangle, Info } from 'lucide-react';

const ToastContext = createContext(null);

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const removeToast = useCallback((id) => {
    setToasts((prevToasts) => prevToasts.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback((message, type = 'success', duration = 4000) => {
    const id = Date.now() + Math.random().toString(36).substr(2, 9);
    
    let title = 'Información';
    if (type === 'success') title = 'Éxito';
    if (type === 'error') title = 'Error';
    if (type === 'warning') title = 'Advertencia';

    const newToast = { id, message, type, title, duration };
    setToasts((prevToasts) => [...prevToasts, newToast]);

    setTimeout(() => {
      removeToast(id);
    }, duration);
  }, [removeToast]);

  const toast = {
    success: (msg, dur) => showToast(msg, 'success', dur),
    error: (msg, dur) => showToast(msg, 'error', dur),
    warning: (msg, dur) => showToast(msg, 'warning', dur),
    info: (msg, dur) => showToast(msg, 'info', dur),
  };

  return (
    <ToastContext.Provider value={toast}>
      {children}
      
      {/* Contenedor de Toasts en pantalla */}
      <div className="toast-container">
        <style>{`
          .toast-container {
            position: fixed;
            top: 24px;
            right: 24px;
            z-index: 10000;
            display: flex;
            flex-direction: column;
            gap: 12px;
            max-width: 380px;
            width: calc(100% - 48px);
            pointer-events: none;
          }
          
          .modern-toast {
            display: flex;
            position: relative;
            background: rgba(15, 23, 42, 0.85); /* Slate 900 con opacidad */
            backdrop-filter: blur(12px);
            -webkit-backdrop-filter: blur(12px);
            border: 1px solid rgba(255, 255, 255, 0.08);
            border-radius: 12px;
            padding: 16px;
            color: #f8fafc;
            box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.3), 0 8px 10px -6px rgba(0, 0, 0, 0.3);
            pointer-events: auto;
            overflow: hidden;
            animation: toastSlideIn 0.35s cubic-bezier(0.16, 1, 0.3, 1) forwards;
          }
          
          @keyframes toastSlideIn {
            from {
              transform: translateX(120%);
              opacity: 0;
            }
            to {
              transform: translateX(0);
              opacity: 1;
            }
          }
          
          .toast-icon-wrapper {
            display: flex;
            align-items: center;
            justify-content: center;
            margin-right: 14px;
            flex-shrink: 0;
          }
          
          .toast-icon-bg {
            display: flex;
            align-items: center;
            justify-content: center;
            width: 32px;
            height: 32px;
            border-radius: 50%;
          }
          
          .toast-content {
            flex: 1;
            padding-right: 12px;
            display: flex;
            flex-direction: column;
            justify-content: center;
          }
          
          .toast-title {
            font-weight: 700;
            font-size: 14px;
            line-height: 20px;
            margin-bottom: 2px;
            letter-spacing: 0.2px;
          }
          
          .toast-message {
            font-size: 13px;
            line-height: 18px;
            color: #cbd5e1; /* Slate 300 */
          }
          
          .toast-close-btn {
            background: none;
            border: none;
            color: #94a3b8;
            cursor: pointer;
            padding: 0;
            display: flex;
            align-items: center;
            justify-content: center;
            height: 20px;
            width: 20px;
            border-radius: 4px;
            transition: all 0.2s;
            flex-shrink: 0;
            align-self: flex-start;
          }
          
          .toast-close-btn:hover {
            color: #f1f5f9;
            background: rgba(255, 255, 255, 0.08);
          }
          
          .toast-progress-bar {
            position: absolute;
            bottom: 0;
            left: 0;
            height: 3px;
            border-bottom-left-radius: 12px;
            animation: toastProgress linear forwards;
          }
          
          @keyframes toastProgress {
            from {
              width: 100%;
            }
            to {
              width: 0%;
            }
          }
          
          /* Modificadores de tipo */
          .toast-success .toast-icon-bg {
            background: rgba(16, 185, 129, 0.15);
            color: #10b981;
          }
          .toast-success .toast-progress-bar {
            background: #10b981;
          }
          
          .toast-error .toast-icon-bg {
            background: rgba(239, 68, 68, 0.15);
            color: #ef4444;
          }
          .toast-error .toast-progress-bar {
            background: #ef4444;
          }
          
          .toast-warning .toast-icon-bg {
            background: rgba(245, 158, 11, 0.15);
            color: #f59e0b;
          }
          .toast-warning .toast-progress-bar {
            background: #f59e0b;
          }
          
          .toast-info .toast-icon-bg {
            background: rgba(59, 130, 246, 0.15);
            color: #3b82f6;
          }
          .toast-info .toast-progress-bar {
            background: #3b82f6;
          }
        `}</style>
        
        {toasts.map((t) => {
          const IconComponent = {
            success: CheckCircle,
            error: XCircle,
            warning: AlertTriangle,
            info: Info
          }[t.type];
          
          return (
            <div key={t.id} className={`modern-toast toast-${t.type}`}>
              <div className="toast-icon-wrapper">
                <div className="toast-icon-bg">
                  <IconComponent size={18} strokeWidth={2.5} />
                </div>
              </div>
              <div className="toast-content">
                <div className="toast-title">{t.title}</div>
                <div className="toast-message">{t.message}</div>
              </div>
              <button className="toast-close-btn" onClick={() => removeToast(t.id)}>
                <X size={14} strokeWidth={2.5} />
              </button>
              <div 
                className="toast-progress-bar" 
                style={{ animationDuration: `${t.duration}ms` }}
              />
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
};
