import React, { useState, useMemo, useCallback } from 'react';
import { useApp } from '../context/AppContext';
import { 
  format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, 
  eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, 
  parseISO 
} from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, CheckCircle2, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const isResolvido = (d) => d.status === 'pago' || d.arquivado === true;

/* Card premium para processos pagos/arquivados */
function ResolvidoCard({ event, onClick }) {
  const [hovered, setHovered] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.85 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ scale: 1.04, y: -1 }}
      transition={{ type: 'spring', stiffness: 400, damping: 20 }}
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        position: 'relative',
        fontSize: 10,
        padding: '4px 7px',
        borderRadius: 5,
        cursor: 'pointer',
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        fontWeight: 700,
        background: hovered
          ? 'linear-gradient(90deg, rgba(16,185,129,0.18), rgba(20,184,166,0.14))'
          : 'linear-gradient(90deg, rgba(16,185,129,0.10), rgba(20,184,166,0.07))',
        borderLeft: '3px solid transparent',
        borderImage: 'linear-gradient(180deg, #10b981, #14b8a6) 1',
        color: '#34d399',
        boxShadow: hovered
          ? '0 0 12px rgba(16,185,129,0.3), 0 2px 6px rgba(0,0,0,0.1)'
          : '0 1px 3px rgba(0,0,0,0.07)',
        transition: 'box-shadow 0.2s, background 0.2s',
      }}
      title={`${event.nome} — ${event.arquivado ? 'Arquivado' : 'Pago'}`}
    >
      {/* Shimmer */}
      <motion.div
        animate={hovered ? { x: ['−100%', '200%'] } : { x: '-100%' }}
        transition={{ duration: 0.7, ease: 'easeInOut' }}
        style={{
          position: 'absolute',
          top: 0, left: 0, bottom: 0,
          width: '60%',
          background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.12), transparent)',
          pointerEvents: 'none',
        }}
      />

      {/* Glow pulse dot */}
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
        <motion.span
          animate={{ opacity: [1, 0.4, 1], scale: [1, 1.3, 1] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          style={{
            width: 5, height: 5, borderRadius: '50%',
            background: '#10b981',
            boxShadow: '0 0 6px #10b981',
            display: 'inline-block',
            flexShrink: 0,
          }}
        />
        {event.nome}
      </span>
    </motion.div>
  );
}

export function CalendarView({ data }) {
  const { dispatch } = useApp();
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const days = useMemo(() => {
    const start = startOfWeek(startOfMonth(currentMonth));
    const end = endOfWeek(endOfMonth(currentMonth));
    return eachDayOfInterval({ start, end });
  }, [currentMonth]);

  const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
  const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));

  const eventsByDay = useMemo(() => {
    const map = {};
    (data || []).forEach(d => {
      if (!d.dataPagamento) return;
      try {
        const dateKey = format(parseISO(d.dataPagamento), 'yyyy-MM-dd');
        if (!map[dateKey]) map[dateKey] = [];
        map[dateKey].push(d);
      } catch (_) {}
    });
    return map;
  }, [data]);

  const openDetail = useCallback((id) => {
    dispatch({ type: 'SET_SELECTED', id });
    dispatch({ type: 'SET_VIEW', view: 'detalhe' });
  }, [dispatch]);

  const weekDays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

  const totalAtivos = (data || []).filter(d => !isResolvido(d) && d.dataPagamento).length;
  const totalResolvidos = (data || []).filter(d => isResolvido(d) && d.dataPagamento).length;

  return (
    <div className="calendar-view" style={{ 
      display: 'flex', flexDirection: 'column', height: '100%', gap: 16,
      background: 'var(--bg-primary)', padding: 1, borderRadius: 'var(--radius-lg)'
    }}>
      {/* Calendar Header */}
      <div style={{ 
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', 
        background: 'var(--bg-card)', padding: '12px 20px', borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ 
            padding: 8, background: 'rgba(59, 130, 246, 0.1)', color: 'var(--accent-blue)', 
            borderRadius: 10, display: 'flex' 
          }}>
            <CalendarIcon size={18} />
          </div>
          <h2 style={{ fontSize: 18, fontWeight: 800, margin: 0, textTransform: 'capitalize' }}>
            {format(currentMonth, 'MMMM yyyy', { locale: ptBR })}
          </h2>

          {/* Legenda premium */}
          <div style={{ display: 'flex', gap: 14, marginLeft: 8 }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: 'var(--text-muted)' }}>
              <span style={{ width: 3, height: 14, borderRadius: 2, background: 'var(--accent-blue)', display: 'inline-block' }}></span>
              Ativos ({totalAtivos})
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: '#34d399' }}>
              <motion.span
                animate={{ opacity: [1, 0.5, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
                style={{ width: 3, height: 14, borderRadius: 2, background: 'linear-gradient(180deg,#10b981,#14b8a6)', display: 'inline-block' }}
              />
              <Sparkles size={11} style={{ color: '#10b981' }} />
              Pagos ({totalResolvidos})
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={prevMonth} className="btn-icon" style={{ 
            background: 'var(--bg-card)', border: '1px solid var(--border)', 
            borderRadius: 'var(--radius-md)', padding: 6, cursor: 'pointer',
            color: 'var(--text-secondary)'
          }}>
            <ChevronLeft size={18} />
          </button>
          <button onClick={() => setCurrentMonth(new Date())} className="btn-secondary" style={{
            fontSize: 12, fontWeight: 700, padding: '4px 12px', borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border)', cursor: 'pointer', background: 'var(--bg-card)',
            color: 'var(--text-primary)'
          }}>
            Hoje
          </button>
          <button onClick={nextMonth} className="btn-icon" style={{ 
            background: 'var(--bg-card)', border: '1px solid var(--border)', 
            borderRadius: 'var(--radius-md)', padding: 6, cursor: 'pointer',
            color: 'var(--text-secondary)'
          }}>
            <ChevronRight size={18} />
          </button>
        </div>
      </div>

      <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        {/* WeekDays Header */}
        <div style={{ 
          display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', 
          background: 'var(--bg-secondary)', borderTop: '1px solid var(--border)',
          borderLeft: '1px solid var(--border)', borderRight: '1px solid var(--border)',
          borderRadius: 'var(--radius-lg) var(--radius-lg) 0 0'
        }}>
          {weekDays.map(day => (
            <div key={day} style={{ 
              padding: '10px 0', textAlign: 'center', fontSize: 11, fontWeight: 700, 
              color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px'
            }}>
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Grid */}
        <div style={{ 
          display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', 
          gridTemplateRows: 'repeat(6, 1fr)',
          background: 'var(--border)', flex: 1, border: '1px solid var(--border)',
          borderRadius: '0 0 var(--radius-lg) var(--radius-lg)', overflow: 'hidden', gap: '1px'
        }}>
          {days.map((day, idx) => {
            const dateKey = format(day, 'yyyy-MM-dd');
            const dayEvents = eventsByDay[dateKey] || [];
            const isSelectedMonth = isSameMonth(day, currentMonth);
            const isToday = isSameDay(day, new Date());

            const ativos = dayEvents.filter(d => !isResolvido(d));
            const resolvidos = dayEvents.filter(d => isResolvido(d));
            const hasResolvidos = resolvidos.length > 0;

            return (
              <div key={idx} style={{ 
                background: isSelectedMonth
                  ? hasResolvidos
                    ? 'linear-gradient(135deg, var(--bg-card) 70%, rgba(16,185,129,0.04))'
                    : 'var(--bg-card)'
                  : 'rgba(0,0,0,0.01)', 
                padding: 8, display: 'flex', flexDirection: 'column', gap: 4,
                position: 'relative',
                transition: 'background 0.3s',
              }}>
                {/* Glow overlay para dias com resolvidos */}
                {hasResolvidos && isSelectedMonth && (
                  <motion.div
                    animate={{ opacity: [0.03, 0.08, 0.03] }}
                    transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                    style={{
                      position: 'absolute', inset: 0,
                      background: 'radial-gradient(circle at bottom right, rgba(16,185,129,0.2), transparent 70%)',
                      pointerEvents: 'none', borderRadius: 'inherit',
                    }}
                  />
                )}

                <div style={{ 
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center', 
                  marginBottom: 2, position: 'relative', zIndex: 1
                }}>
                  <span style={{ 
                    fontSize: 12, fontWeight: isToday ? 800 : 500,
                    color: isToday ? 'var(--accent-blue)' : (isSelectedMonth ? 'var(--text-primary)' : 'var(--text-muted)'),
                    background: isToday ? 'rgba(59, 130, 246, 0.1)' : 'transparent',
                    width: 24, height: 24, display: 'flex', alignItems: 'center', 
                    justifyContent: 'center', borderRadius: '50%'
                  }}>
                    {format(day, 'd')}
                  </span>
                  {hasResolvidos && (
                    <motion.div
                      animate={{ scale: [1, 1.15, 1], opacity: [0.7, 1, 0.7] }}
                      transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
                    >
                      <CheckCircle2 size={12} color="#10b981" />
                    </motion.div>
                  )}
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 3, overflowY: 'auto', position: 'relative', zIndex: 1 }}>
                  {/* Ativos em azul — estilo padrão */}
                  {ativos.map(event => (
                    <motion.div
                      key={event.id}
                      whileHover={{ scale: 1.02, x: 2 }}
                      onClick={() => openDetail(event.id)}
                      style={{
                        fontSize: 10, padding: '3px 6px', borderRadius: 4,
                        background: 'var(--bg-secondary)', borderLeft: '3px solid var(--accent-blue)',
                        color: 'var(--text-primary)', cursor: 'pointer', whiteSpace: 'nowrap',
                        overflow: 'hidden', textOverflow: 'ellipsis', fontWeight: 600,
                        boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
                      }}
                      title={`${event.nome} — Ativo`}
                    >
                      {event.nome}
                    </motion.div>
                  ))}

                  {/* Resolvidos — card premium */}
                  {resolvidos.map(event => (
                    <ResolvidoCard
                      key={event.id}
                      event={event}
                      onClick={() => openDetail(event.id)}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
