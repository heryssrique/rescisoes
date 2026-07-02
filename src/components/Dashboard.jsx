import React, { useState, useMemo, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, Legend, LabelList } from 'recharts';
import { User, Calendar, CheckCircle, TrendingUp, Briefcase, CalendarRange, RotateCcw, Download, FileSpreadsheet, Image as ImageIcon, Eye, EyeOff } from 'lucide-react';
import { motion } from 'framer-motion';
import html2canvas from 'html2canvas';
import * as XLSX from 'xlsx';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444', '#f97316', '#14b8a6'];

export function Dashboard({ data: injectedData }) {
  const { state } = useApp();
  const rawDesligamentos = injectedData || state.desligamentos || [];

  const [showValues, setShowValues] = useState(false);
  const [exportingImg, setExportingImg] = useState(false);
  const dashboardRef = useRef(null);

  // Estado de Filtro de Período / Data
  const [dateField, setDateField] = useState('dataDesligamento');
  const [preset, setPreset] = useState('todos');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const handlePresetChange = (newPreset) => {
    setPreset(newPreset);
    const now = new Date();
    const currentYear = now.getFullYear();

    if (newPreset === 'todos') {
      setStartDate('');
      setEndDate('');
    } else if (newPreset === 'ano_atual') {
      setStartDate(`${currentYear}-01-01`);
      setEndDate(`${currentYear}-12-31`);
    } else if (newPreset === 'ano_passado') {
      const lastYear = currentYear - 1;
      setStartDate(`${lastYear}-01-01`);
      setEndDate(`${lastYear}-12-31`);
    } else if (newPreset === 'ultimos_90') {
      const past = new Date();
      past.setDate(now.getDate() - 90);
      setStartDate(past.toISOString().split('T')[0]);
      setEndDate(now.toISOString().split('T')[0]);
    } else if (newPreset === 'ultimos_6m') {
      const past = new Date();
      past.setMonth(now.getMonth() - 6);
      setStartDate(past.toISOString().split('T')[0]);
      setEndDate(now.toISOString().split('T')[0]);
    } else if (newPreset === 'ultimos_12m') {
      const past = new Date();
      past.setFullYear(now.getFullYear() - 1);
      setStartDate(past.toISOString().split('T')[0]);
      setEndDate(now.toISOString().split('T')[0]);
    }
  };

  const handleDateInput = (field, value) => {
    if (field === 'start') setStartDate(value);
    if (field === 'end') setEndDate(value);
    setPreset('custom');
  };

  const clearFilter = () => {
    setPreset('todos');
    setStartDate('');
    setEndDate('');
  };

  const desligamentos = useMemo(() => {
    if (!startDate && !endDate) return rawDesligamentos;
    return rawDesligamentos.filter(d => {
      const dateVal = d[dateField] || d.dataDesligamento;
      if (!dateVal) return false;
      const dStr = dateVal.substring(0, 10);
      if (startDate && dStr < startDate) return false;
      if (endDate && dStr > endDate) return false;
      return true;
    });
  }, [rawDesligamentos, startDate, endDate, dateField]);

  const stats = useMemo(() => {
    const data = {
      total: desligamentos.length,
      peloMotivo: {},
      pelaEmpresa: {},
      peloStatus: {},
      porMes: {},
    };

    desligamentos.forEach(d => {
      // Motivo
      if (d.motivo) {
        data.peloMotivo[d.motivo] = (data.peloMotivo[d.motivo] || 0) + 1;
      }
      
      // Empresa
      const empresa = d.coligada || 'Outras';
      data.pelaEmpresa[empresa] = (data.pelaEmpresa[empresa] || 0) + 1;

      // Status
      if (d.status) {
        data.peloStatus[d.status] = (data.peloStatus[d.status] || 0) + 1;
      }

      // Por Mês
      const refDate = d[dateField] || d.dataDesligamento;
      if (refDate) {
        const mes = refDate.substring(0, 7); // yyyy-MM
        data.porMes[mes] = (data.porMes[mes] || 0) + 1;
      }
    });

    return data;
  }, [desligamentos, dateField]);

  const { motivoChartData, statusChartData, empresaChartData, mesChartData, growthPercent, yoyData, motivoComparisonData, primaryYear, compYear } = useMemo(() => {
    const sortedMeses = Object.entries(stats.porMes).sort();
    const data = sortedMeses.map(([name, value]) => ({ name, value }));

    // Identificar ano de referência
    const now = new Date();
    let primaryYear = now.getFullYear();
    if (startDate) {
      const y = parseInt(startDate.substring(0, 4), 10);
      if (!isNaN(y)) primaryYear = y;
    }
    const compYear = primaryYear - 1;

    const shiftDateString = (dateStr, yearsShift) => {
      if (!dateStr) return '';
      const y = parseInt(dateStr.substring(0, 4), 10) + yearsShift;
      return `${y}${dateStr.substring(4)}`;
    };

    const shiftedStart = shiftDateString(startDate, -1);
    const shiftedEnd = shiftDateString(endDate, -1);

    const monthNames = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    const yoyMap = monthNames.map((name) => ({
      month: name,
      currentYear: 0,
      lastYear: 0
    }));

    rawDesligamentos.forEach(d => {
      const dateVal = d[dateField] || d.dataDesligamento;
      if (!dateVal) return;
      const dStr = dateVal.substring(0, 10);
      const year = parseInt(dStr.substring(0, 4), 10);
      const month = parseInt(dStr.substring(5, 7), 10) - 1;
      if (month < 0 || month > 11) return;

      let matchesCurrent = (!startDate || dStr >= startDate) && (!endDate || dStr <= endDate);
      if (matchesCurrent && (year === primaryYear || (!startDate && !endDate && year === primaryYear))) {
        yoyMap[month].currentYear++;
      }

      let matchesPrev = (!shiftedStart || dStr >= shiftedStart) && (!shiftedEnd || dStr <= shiftedEnd);
      if (matchesPrev && (year === compYear || (!startDate && !endDate && year === compYear))) {
        yoyMap[month].lastYear++;
      }
    });
    
    // Crescimento vs Mês Anterior
    let growth = 0;
    if (data.length >= 2) {
      const current = data[data.length - 1].value;
      const previous = data[data.length - 2].value;
      if (previous > 0) {
        growth = ((current - previous) / previous) * 100;
      } else if (current > 0) {
        growth = 100;
      }
    } else if (data.length === 1) {
      const currentVal = data[0].value;
      const [yStr, mStr] = data[0].name.split('-');
      let prevY = parseInt(yStr, 10);
      let prevM = parseInt(mStr, 10) - 1;
      if (prevM < 1) {
        prevM = 12;
        prevY -= 1;
      }
      const prevMonthKey = `${prevY}-${String(prevM).padStart(2, '0')}`;
      let prevVal = 0;
      rawDesligamentos.forEach(d => {
        const dateVal = d[dateField] || d.dataDesligamento;
        if (dateVal && dateVal.substring(0, 7) === prevMonthKey) {
          prevVal++;
        }
      });
      if (prevVal > 0) {
        growth = ((currentVal - prevVal) / prevVal) * 100;
      } else if (currentVal > 0) {
        growth = 100;
      }
    }

    // Motivos Comparados YoY
    const currentMotivos = {};
    const previousMotivos = {};
    const todosMotivos = new Set();

    rawDesligamentos.forEach(d => {
      if (!d.motivo) return;
      const dateVal = d[dateField] || d.dataDesligamento;
      if (!dateVal) return;
      const dStr = dateVal.substring(0, 10);
      const year = parseInt(dStr.substring(0, 4), 10);

      let matchesCurrent = (!startDate || dStr >= startDate) && (!endDate || dStr <= endDate);
      if (matchesCurrent && (year === primaryYear || (!startDate && !endDate && year === primaryYear))) {
        todosMotivos.add(d.motivo);
        currentMotivos[d.motivo] = (currentMotivos[d.motivo] || 0) + 1;
      }

      let matchesPrev = (!shiftedStart || dStr >= shiftedStart) && (!shiftedEnd || dStr <= shiftedEnd);
      if (matchesPrev && (year === compYear || (!startDate && !endDate && year === compYear))) {
        todosMotivos.add(d.motivo);
        previousMotivos[d.motivo] = (previousMotivos[d.motivo] || 0) + 1;
      }
    });

    const motivoComparisonData = Array.from(todosMotivos).map(m => {
      const label = state.motivos?.find(mot => mot.value === m)?.label || m;
      return {
        name: label,
        current: currentMotivos[m] || 0,
        previous: previousMotivos[m] || 0
      };
    }).sort((a, b) => (b.current + b.previous) - (a.current + a.previous));

    return {
      motivoChartData: Object.entries(stats.peloMotivo).map(([name, value]) => ({ 
        name: state.motivos?.find(m => m.value === name)?.label || name, 
        value 
      })),
      statusChartData: Object.entries(stats.peloStatus).map(([name, value]) => ({ 
        name: state.statusFlow?.find(s => s.key === name)?.label || name, 
        value 
      })),
      empresaChartData: Object.entries(stats.pelaEmpresa).map(([id, value]) => ({ 
        name: state.coligadas?.[id]?.nome || id, 
        value 
      })),
      mesChartData: data,
      growthPercent: growth,
      yoyData: yoyMap,
      motivoComparisonData,
      primaryYear,
      compYear
    };
  }, [stats, rawDesligamentos, state.motivos, state.statusFlow, state.coligadas, startDate, endDate, dateField]);

  const containerVariants = {
    hidden: {},
    visible: { transition: { staggerChildren: 0.09 } }
  };
  const cardVariants = {
    hidden: { opacity: 0, y: 28, scale: 0.94 },
    visible: { opacity: 1, y: 0, scale: 1, transition: { type: 'spring', stiffness: 240, damping: 20 } }
  };

  const ativosCount = desligamentos.filter(d => d.status !== 'pago' && !d.arquivado).length;
  const pagosCount = desligamentos.filter(d => d.status === 'pago' || d.arquivado).length;

  const handleExportExcel = () => {
    const wb = XLSX.utils.book_new();
    
    // 1. Resumo KPIs
    const wsKPIs = XLSX.utils.json_to_sheet([
      { Métrica: 'Total Geral de Processos', Valor: stats.total },
      { Métrica: 'Processos Ativos em Trâmite', Valor: ativosCount },
      { Métrica: 'Finalizados (Pagos / Arquivados)', Valor: pagosCount },
      { Métrica: 'Taxa de Conclusão', Valor: `${stats.total > 0 ? Math.round((pagosCount / stats.total) * 100) : 0}%` },
      { Métrica: 'Crescimento vs Mês Anterior', Valor: `${growthPercent >= 0 ? '+' : ''}${growthPercent.toFixed(1)}%` },
    ]);
    XLSX.utils.book_append_sheet(wb, wsKPIs, 'Resumo_KPIs');

    // 2. Volume Mensal
    const wsMes = XLSX.utils.json_to_sheet(mesChartData.map(d => ({ Mês: d.name, 'Quantidade de Processos': d.value })));
    XLSX.utils.book_append_sheet(wb, wsMes, 'Volume_Mensal');

    // 3. Sazonalidade YoY
    const wsYoY = XLSX.utils.json_to_sheet(yoyData.map(d => ({ 
      Mês: d.month, 
      [`Ano Atual (${primaryYear})`]: d.currentYear, 
      [`Ano Anterior (${compYear})`]: d.lastYear 
    })));
    XLSX.utils.book_append_sheet(wb, wsYoY, 'Sazonalidade_YoY');

    // 4. Motivos Comparados
    const wsMotivos = XLSX.utils.json_to_sheet(motivoComparisonData.map(d => ({ 
      Motivo: d.name, 
      [`Ano Atual (${primaryYear})`]: d.current, 
      [`Ano Anterior (${compYear})`]: d.previous 
    })));
    XLSX.utils.book_append_sheet(wb, wsMotivos, 'Motivos_Comparados');

    // 5. Volume por Status
    const wsStatus = XLSX.utils.json_to_sheet(statusChartData.map(d => ({ 'Etapa de Status': d.name, 'Quantidade': d.value })));
    XLSX.utils.book_append_sheet(wb, wsStatus, 'Volume_por_Status');

    // 6. Empresas / Coligadas
    const wsEmpresa = XLSX.utils.json_to_sheet(empresaChartData.map(d => ({ 'Empresa / Coligada': d.name, 'Quantidade': d.value })));
    XLSX.utils.book_append_sheet(wb, wsEmpresa, 'Distribuicao_Empresa');

    XLSX.writeFile(wb, `Relatorio_Valores_Graficos_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  const handleExportPNG = async () => {
    if (!dashboardRef.current) return;
    setExportingImg(true);
    const wasShowing = showValues;
    if (!wasShowing) setShowValues(true);

    setTimeout(async () => {
      try {
        const canvas = await html2canvas(dashboardRef.current, {
          backgroundColor: window.getComputedStyle(document.body).backgroundColor || '#0f172a',
          scale: 2,
          useCORS: true,
          logging: false
        });
        const link = document.createElement('a');
        link.download = `Dashboard_Graficos_e_Valores_${new Date().toISOString().slice(0, 10)}.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();
      } catch (err) {
        console.error('Erro ao exportar PNG:', err);
      } finally {
        setExportingImg(false);
        if (!wasShowing) setShowValues(false);
      }
    }, 450);
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      className="page-content"
    >
      <motion.div 
        initial={{ opacity: 0, x: -12 }} 
        animate={{ opacity: 1, x: 0 }} 
        transition={{ duration: 0.4, ease: 'easeOut' }}
        style={{ marginBottom: 30, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}
      >
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: 'var(--text-primary)' }}>Dashboard Analítico</h1>
          <p style={{ color: 'var(--text-muted)' }}>Métricas e estatísticas consolidadas (Ativos + Arquivados).</p>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          {/* Ações de Exportação e Valores */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'var(--bg-card)', padding: 6, borderRadius: 12, border: '1px solid var(--border)' }}>
            <button
              type="button"
              onClick={() => setShowValues(!showValues)}
              title={showValues ? "Ocultar Valores dos Gráficos" : "Exibir Valores nos Gráficos"}
              style={{
                padding: '6px 12px',
                borderRadius: 8,
                fontSize: 12,
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                background: showValues ? 'rgba(59, 130, 246, 0.15)' : 'transparent',
                color: showValues ? 'var(--accent-blue)' : 'var(--text-secondary)',
                border: 'none',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
            >
              {showValues ? <Eye size={16} /> : <EyeOff size={16} />}
              <span>{showValues ? 'Valores Visíveis' : 'Exibir Valores'}</span>
            </button>

            <div style={{ width: 1, height: 20, background: 'var(--border)' }} />

            <button
              type="button"
              onClick={handleExportExcel}
              style={{
                padding: '6px 12px',
                borderRadius: 8,
                fontSize: 12,
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                background: 'rgba(16, 185, 129, 0.1)',
                color: 'var(--accent-green)',
                border: '1px solid rgba(16, 185, 129, 0.3)',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
            >
              <FileSpreadsheet size={15} />
              <span>Planilha de Valores (.xlsx)</span>
            </button>

            <button
              type="button"
              onClick={handleExportPNG}
              disabled={exportingImg}
              style={{
                padding: '6px 12px',
                borderRadius: 8,
                fontSize: 12,
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                background: 'linear-gradient(135deg, var(--accent-blue), var(--accent-indigo))',
                color: '#fff',
                border: 'none',
                cursor: exportingImg ? 'wait' : 'pointer',
                boxShadow: '0 4px 12px -2px rgba(59, 130, 246, 0.3)',
                transition: 'all 0.2s ease'
              }}
            >
              <ImageIcon size={15} />
              <span>{exportingImg ? 'Gerando Imagem...' : 'Exportar Gráficos (PNG)'}</span>
            </button>
          </div>

          {/* Indicador de Crescimento Mensal */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            style={{ 
              background: 'var(--bg-card)', padding: '8px 16px', borderRadius: 12, border: '1px solid var(--border)',
              display: 'flex', alignItems: 'center', gap: 10
            }}
          >
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
              <span style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>vs Mês Anterior</span>
              <span style={{ fontSize: 18, fontWeight: 900, color: growthPercent >= 0 ? 'var(--accent-green)' : 'var(--accent-red)' }}>
                {growthPercent >= 0 ? '+' : ''}{growthPercent.toFixed(1)}%
              </span>
            </div>
            <div style={{ 
              padding: 8, borderRadius: 10, 
              background: growthPercent >= 0 ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
              color: growthPercent >= 0 ? 'var(--accent-green)' : 'var(--accent-red)'
            }}>
              <TrendingUp size={20} style={{ transform: growthPercent < 0 ? 'rotate(180deg)' : 'none' }} />
            </div>
          </motion.div>
        </div>
      </motion.div>

      {/* Painel de Filtro de Período / Data */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.35 }}
        style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border)',
          borderRadius: 16,
          padding: '16px 20px',
          marginBottom: 24,
          boxShadow: '0 4px 20px -4px rgba(0,0,0,0.1)'
        }}
      >
        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: 16, marginBottom: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ padding: 6, borderRadius: 8, background: 'rgba(59, 130, 246, 0.1)', color: 'var(--accent-blue)', display: 'flex' }}>
                <CalendarRange size={18} />
              </div>
              <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>Filtro de Período</span>
            </div>

            <div style={{ width: 1, height: 20, background: 'var(--border)', margin: '0 4px' }} />

            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600 }}>Filtrar por:</span>
              <select
                value={dateField}
                onChange={e => setDateField(e.target.value)}
                style={{
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--border)',
                  borderRadius: 8,
                  padding: '4px 10px',
                  fontSize: 12,
                  fontWeight: 600,
                  color: 'var(--text-primary)',
                  cursor: 'pointer',
                  outline: 'none'
                }}
              >
                <option value="dataDesligamento">Data de Desligamento</option>
                <option value="dataPagamento">Data de Pagamento</option>
                <option value="dataComunicado">Data de Comunicado</option>
                <option value="dataAdmissao">Data de Admissão</option>
              </select>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontSize: 12, color: 'var(--text-muted)', background: 'var(--bg-secondary)', padding: '4px 10px', borderRadius: 20, fontWeight: 600, border: '1px solid var(--border)' }}>
              Exibindo <strong style={{ color: 'var(--text-primary)' }}>{desligamentos.length}</strong> de {rawDesligamentos.length} processos
            </span>

            {(startDate || endDate || preset !== 'todos') && (
              <motion.button
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={clearFilter}
                style={{
                  background: 'rgba(239, 68, 68, 0.1)',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  color: 'var(--accent-red)',
                  padding: '4px 10px',
                  borderRadius: 8,
                  fontSize: 11,
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                  cursor: 'pointer'
                }}
              >
                <RotateCcw size={12} />
                Limpar Filtro
              </motion.button>
            )}
          </div>
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 16, paddingTop: 12, borderTop: '1px dashed var(--border)' }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {[
              { id: 'todos', label: 'Todos os Períodos' },
              { id: 'ano_atual', label: `Este Ano (${new Date().getFullYear()})` },
              { id: 'ano_passado', label: `Ano Anterior (${new Date().getFullYear() - 1})` },
              { id: 'ultimos_90', label: 'Últimos 90 Dias' },
              { id: 'ultimos_6m', label: 'Últimos 6 Meses' },
              { id: 'ultimos_12m', label: 'Últimos 12 Meses' },
            ].map(p => {
              const isActive = preset === p.id;
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => handlePresetChange(p.id)}
                  style={{
                    padding: '6px 12px',
                    borderRadius: 8,
                    fontSize: 12,
                    fontWeight: isActive ? 700 : 600,
                    background: isActive ? 'linear-gradient(135deg, var(--accent-blue), var(--accent-indigo))' : 'var(--bg-secondary)',
                    color: isActive ? '#fff' : 'var(--text-secondary)',
                    border: isActive ? 'none' : '1px solid var(--border)',
                    boxShadow: isActive ? '0 4px 12px -2px rgba(59, 130, 246, 0.4)' : 'none',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                >
                  {p.label}
                </button>
              );
            })}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', background: 'var(--bg-secondary)', padding: '4px 10px', borderRadius: 10, border: '1px solid var(--border)' }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)' }}>Período:</span>
            <input
              type="date"
              value={startDate}
              onChange={e => handleDateInput('start', e.target.value)}
              style={{
                background: 'var(--bg-card)',
                border: '1px solid var(--border)',
                borderRadius: 6,
                padding: '3px 8px',
                fontSize: 11,
                color: 'var(--text-primary)',
                outline: 'none',
                fontWeight: 600
              }}
            />
            <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>até</span>
            <input
              type="date"
              value={endDate}
              onChange={e => handleDateInput('end', e.target.value)}
              style={{
                background: 'var(--bg-card)',
                border: '1px solid var(--border)',
                borderRadius: 6,
                padding: '3px 8px',
                fontSize: 11,
                color: 'var(--text-primary)',
                outline: 'none',
                fontWeight: 600
              }}
            />
          </div>
        </div>
      </motion.div>

      <div ref={dashboardRef} style={{ padding: exportingImg ? 20 : 0, background: exportingImg ? 'var(--bg-primary)' : 'transparent', borderRadius: 16 }}>
        <motion.div className="stats-grid" variants={containerVariants} initial="hidden" animate="visible">
          {[
            { color: 'blue',   label: 'Total Geral',        value: stats.total, icon: <Briefcase size={48} /> },
            { color: 'purple', label: 'Processos Ativos',   value: ativosCount, icon: <Calendar size={48} /> },
            { color: 'green',  label: 'Finalizados (Pagos)',value: pagosCount,  icon: <CheckCircle size={48} /> },
            { color: 'yellow', label: 'Taxa de Conclusão',  value: `${stats.total > 0 ? Math.round((pagosCount / stats.total) * 100) : 0}%`, icon: <TrendingUp size={48} /> },
          ].map(({ color, label, value, icon }) => (
            <motion.div
              key={label}
              className={`stat-card ${color}`}
              variants={cardVariants}
              whileHover={{ y: -5, boxShadow: '0 16px 40px -8px rgba(0,0,0,0.3)', transition: { duration: 0.18 } }}
              whileTap={{ scale: 0.98 }}
            >
              <div className="stat-label">{label}</div>
              <motion.div 
                className="stat-value"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.35, duration: 0.35, type: 'spring', stiffness: 300 }}
              >
                {value}
              </motion.div>
              <div className="stat-icon">{icon}</div>
            </motion.div>
          ))}
        </motion.div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 24 }}>
          <div className="card" style={{ height: 400, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h3 style={{ margin: 0, fontSize: 14 }}>Volume Mensal Comparativo</h3>
              <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Tendência de desligamentos</span>
            </div>
            <div style={{ flex: 1, minHeight: 150 }}>
              <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={150} debounce={100}>
              <BarChart data={mesChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="name" stroke="var(--text-muted)" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="var(--text-muted)" fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip 
                  contentStyle={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 10, fontSize: 12 }}
                  cursor={{ fill: 'rgba(255,255,255,0.03)' }}
                />
                <Bar dataKey="value" fill="var(--accent-blue)" radius={[4, 4, 0, 0]} barSize={40}>
                  {(showValues || exportingImg) && <LabelList dataKey="value" position="top" fill="var(--text-primary)" fontSize={11} fontWeight={700} />}
                  {mesChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={index === mesChartData.length - 1 ? 'var(--accent-blue)' : 'rgba(59, 130, 246, 0.4)'} />
                  ))}
                </Bar>
              </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="card" style={{ height: 400, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h3 style={{ margin: 0, fontSize: 14 }}>Sazonalidade: Ano Atual vs Anterior</h3>
              <div style={{ display: 'flex', gap: 12 }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 10, color: 'var(--text-muted)' }}>
                  <span style={{ width: 8, height: 8, borderRadius: 2, background: 'var(--accent-blue)' }} /> {primaryYear}
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 10, color: 'var(--text-muted)' }}>
                  <span style={{ width: 8, height: 8, borderRadius: 2, background: 'var(--accent-purple)', opacity: 0.5 }} /> {compYear}
                </span>
              </div>
            </div>
            <div style={{ flex: 1, minHeight: 150 }}>
              <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={150} debounce={100}>
              <LineChart data={yoyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="month" stroke="var(--text-muted)" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="var(--text-muted)" fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip 
                  contentStyle={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 10, fontSize: 12 }}
                />
                <Line type="monotone" dataKey="currentYear" name={`Ano ${primaryYear}`} stroke="var(--accent-blue)" strokeWidth={3} dot={{ r: 4, strokeWidth: 2 }}>
                  {(showValues || exportingImg) && <LabelList dataKey="currentYear" position="top" fill="var(--accent-blue)" fontSize={11} fontWeight={700} />}
                </Line>
                <Line type="monotone" dataKey="lastYear" name={`Ano ${compYear}`} stroke="var(--accent-purple)" strokeWidth={2} strokeDasharray="5 5" dot={{ r: 3 }} opacity={0.6}>
                  {(showValues || exportingImg) && <LabelList dataKey="lastYear" position="bottom" fill="var(--accent-purple)" fontSize={10} fontWeight={600} />}
                </Line>
              </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 350px', gap: 24, marginBottom: 24 }}>
          <div className="card" style={{ height: 400, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h3 style={{ margin: 0, fontSize: 14 }}>Motivos Comparados: Este Ano vs Anterior</h3>
              <div style={{ display: 'flex', gap: 12 }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 10, color: 'var(--text-muted)' }}>
                  <span style={{ width: 8, height: 8, borderRadius: 2, background: 'var(--accent-blue)' }} /> {primaryYear}
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 10, color: 'var(--text-muted)' }}>
                  <span style={{ width: 8, height: 8, borderRadius: 2, background: 'var(--accent-purple)', opacity: 0.5 }} /> {compYear}
                </span>
              </div>
            </div>
            <div style={{ flex: 1, minHeight: 150 }}>
              <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={150} debounce={100}>
              <BarChart data={motivoComparisonData} layout="vertical" margin={{ left: 20, right: 30 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={true} vertical={false} />
                <XAxis type="number" stroke="var(--text-muted)" fontSize={11} hide />
                <YAxis 
                  type="category" 
                  dataKey="name" 
                  stroke="var(--text-primary)" 
                  fontSize={10} 
                  width={120} 
                  tickLine={false} 
                  axisLine={false} 
                  tick={{ fontWeight: 600 }}
                />
                <Tooltip 
                  contentStyle={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 10, fontSize: 12 }}
                  cursor={{ fill: 'rgba(255,255,255,0.02)' }}
                />
                <Bar dataKey="current" name="Ano Atual" fill="var(--accent-blue)" radius={[0, 4, 4, 0]} barSize={12}>
                  {(showValues || exportingImg) && <LabelList dataKey="current" position="right" fill="var(--accent-blue)" fontSize={10} fontWeight={700} />}
                </Bar>
                <Bar dataKey="previous" name="Ano Anterior" fill="var(--accent-purple)" opacity={0.5} radius={[0, 4, 4, 0]} barSize={12}>
                  {(showValues || exportingImg) && <LabelList dataKey="previous" position="right" fill="var(--accent-purple)" fontSize={10} fontWeight={700} />}
                </Bar>
              </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="card" style={{ height: 400 }}>
            <h3 style={{ marginBottom: 20, fontSize: 14 }}>Distribuição por Empresa</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {empresaChartData.sort((a,b) => b.value - a.value).slice(0, 6).map((emp, i) => (
                <div key={emp.name} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 40, fontWeight: 800, color: 'var(--text-muted)', fontSize: 16 }}>{i+1}º</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                      <span style={{ fontSize: 12, fontWeight: 600 }}>{emp.name}</span>
                      <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{emp.value} proc.</span>
                    </div>
                    <div style={{ height: 6, background: 'var(--bg-secondary)', borderRadius: 3, overflow: 'hidden' }}>
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${(emp.value / stats.total) * 100}%` }}
                        transition={{ duration: 1, delay: i * 0.1 }}
                        style={{ height: '100%', background: COLORS[i % COLORS.length] }} 
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 24 }}>
          <div className="card" style={{ height: 350, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <h3 style={{ marginBottom: 20, fontSize: 14 }}>Volume por Etapa de Status</h3>
            <div style={{ flex: 1, minHeight: 150 }}>
              <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={150} debounce={100}>
              <BarChart data={statusChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="name" stroke="var(--text-muted)" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="var(--text-muted)" fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip 
                  contentStyle={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 10, fontSize: 12 }}
                  cursor={{ fill: 'rgba(255,255,255,0.02)' }}
                />
                <Bar dataKey="value" fill="var(--accent-indigo)" radius={[4, 4, 0, 0]} barSize={60}>
                  {(showValues || exportingImg) && <LabelList dataKey="value" position="top" fill="var(--text-primary)" fontSize={11} fontWeight={700} />}
                </Bar>
              </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
