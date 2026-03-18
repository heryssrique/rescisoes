import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { Bell, Check, Clock, AlertCircle, Info, X } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export function NotificationCenter() {
  const { state, actions } = useApp();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  const notifications = state.notifications || [];
  const unreadCount = notifications.filter(n => !n.read).length;

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getIcon = (severity) => {
    switch (severity) {
      case 'error': return <AlertCircle size={16} color="var(--accent-red)" />;
      case 'warning': return <Clock size={16} color="var(--accent-yellow)" />;
      default: return <Info size={16} color="var(--accent-blue)" />;
    }
  };

  const handleOpenDetail = (desligamentoId, notifId) => {
    actions.markNotificationRead(notifId);
    dispatch({ type: 'SET_SELECTED', id: desligamentoId });
    dispatch({ type: 'SET_VIEW', view: 'detalhe' });
    setIsOpen(false);
  };

  // Precisamos do dispatch do context para mudar a view
  const { dispatch } = useApp();

  return (
    <div className="notif-container" ref={dropdownRef}>
      <button 
        className={`notif-bell ${unreadCount > 0 ? 'has-unread' : ''}`}
        onClick={() => setIsOpen(!isOpen)}
        title="Notificações"
      >
        <Bell size={20} />
        {unreadCount > 0 && <span className="notif-badge">{unreadCount}</span>}
      </button>

      {isOpen && (
        <div className="notif-dropdown">
          <div className="notif-header">
            <h3>Notificações</h3>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              {Notification.permission !== 'granted' && (
                <button 
                  className="btn-icon-sm" 
                  onClick={actions.requestNotificationPermission}
                  title="Ativar notificações do navegador"
                >
                  <Bell size={14} />
                </button>
              )}
              {unreadCount > 0 && <span className="notif-count">{unreadCount} novas</span>}
            </div>
          </div>

          <div className="notif-list">
            {notifications.length === 0 ? (
              <div className="notif-empty">
                <Bell size={32} style={{ opacity: 0.2, marginBottom: 12 }} />
                <p>Nenhuma notificação no momento</p>
              </div>
            ) : (
              notifications.map(n => (
                <div 
                  key={n.id} 
                  className={`notif-item ${n.read ? 'read' : 'unread'} severity-${n.severity}`}
                  onClick={() => handleOpenDetail(n.desligamentoId, n.id)}
                >
                  <div className="notif-icon-wrapper">
                    {getIcon(n.severity)}
                  </div>
                  <div className="notif-body">
                    <p className="notif-message">{n.message}</p>
                    <span className="notif-time">Há {formatDistanceToNow(new Date(n.date), { locale: ptBR })}</span>
                  </div>
                  {!n.read && (
                    <button 
                      className="notif-mark-read"
                      onClick={(e) => {
                        e.stopPropagation();
                        actions.markNotificationRead(n.id);
                      }}
                      title="Marcar como lida"
                    >
                      <Check size={14} />
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
