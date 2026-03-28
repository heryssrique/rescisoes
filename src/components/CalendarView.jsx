import React, { useState, useMemo, useCallback } from 'react';
import { useApp } from '../context/AppContext';
import { 
  format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, 
  eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, 
  parseISO 
} from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, CheckCircle2 } from 'lucide-react';
import { motion } from 'framer-motion';

const isResolvido = (d) => d.status === 'pago' || d.arquivado === true;

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
          {/* Legenda */}
          <div style={{ display: 'flex', gap: 12, marginLeft: 8 }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: 'var(--text-muted)' }}>
              <span style={{ width: 10, height: 10, borderRadius: 2, background: 'var(--accent-blue)', display: 'inline-block' }}></span>
              Ativos ({totalAtivos})
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: 'var(--text-muted)' }}>
              <span style={{ width: 10, height: 10, borderRadius: 2, background: 'var(--accent-green)', display: 'inline-block' }}></span>
              Pagos/Arquivados ({totalResolvidos})
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

            return (
              <div key={idx} style={{ 
                background: isSelectedMonth ? 'var(--bg-card)' : 'rgba(0,0,0,0.01)', 
                padding: 8, display: 'flex', flexDirection: 'column', gap: 4,
                position: 'relative'
              }}>
                <div style={{ 
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center', 
                  marginBottom: 2 
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
                  {resolvidos.length > 0 && (
                    <CheckCircle2 size={12} color="var(--accent-green)" style={{ opacity: 0.7 }} />
                  )}
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 3, overflowY: 'auto' }}>
                  {/* Ativos em azul */}
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
                  {/* Resolvidos em verde com ✓ */}
                  {resolvidos.map(event => (
                    <motion.div
                      key={event.id}
                      whileHover={{ scale: 1.02, x: 2 }}
                      onClick={() => openDetail(event.id)}
                      style={{
                        fontSize: 10, padding: '3px 6px', borderRadius: 4,
                        background: 'rgba(16, 185, 129, 0.08)', borderLeft: '3px solid var(--accent-green)',
                        color: 'var(--accent-green)', cursor: 'pointer', whiteSpace: 'nowrap',
                        overflow: 'hidden', textOverflow: 'ellipsis', fontWeight: 600,
                        opacity: 0.85
                      }}
                      title={`${event.nome} — ${event.arquivado ? 'Arquivado' : 'Pago'}`}
                    >
                      ✓ {event.nome}
                    </motion.div>
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
