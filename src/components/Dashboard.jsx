import React, { useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import { User, Calendar, CheckCircle, TrendingUp, Briefcase } from 'lucide-react';
import { motion } from 'framer-motion';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444', '#f97316', '#14b8a6'];

export function Dashboard({ data: injectedData }) {
  const { state } = useApp();
  const desligamentos = injectedData || state.desligamentos;

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
      data.peloMotivo[d.motivo] = (data.peloMotivo[d.motivo] || 0) + 1;
      
      // Empresa
      const empresa = d.coligada || 'Outras';
      data.pelaEmpresa[empresa] = (data.pelaEmpresa[empresa] || 0) + 1;

      // Status
      data.peloStatus[d.status] = (data.peloStatus[d.status] || 0) + 1;

      // Por Mês (baseado na data de desligamento)
      if (d.dataDesligamento) {
        const mes = d.dataDesligamento.substring(0, 7); // yyyy-MM
        data.porMes[mes] = (data.porMes[mes] || 0) + 1;
      }
    });

    return data;
  }, [desligamentos]);

  const { motivoChartData, statusChartData, empresaChartData, mesChartData } = useMemo(() => ({
    motivoChartData: Object.entries(stats.peloMotivo).map(([name, value]) => ({ name, value })),
    statusChartData: Object.entries(stats.peloStatus).map(([name, value]) => ({ name, value })),
    empresaChartData: Object.entries(stats.pelaEmpresa).map(([name, value]) => ({ name, value })),
    mesChartData: Object.entries(stats.porMes)
      .sort()
      .map(([name, value]) => ({ name, value }))
  }), [stats]);

  const containerVariants = {
    hidden: {},
    visible: { transition: { staggerChildren: 0.09 } }
  };
  const cardVariants = {
    hidden: { opacity: 0, y: 28, scale: 0.94 },
    visible: { opacity: 1, y: 0, scale: 1, transition: { type: 'spring', stiffness: 240, damping: 20 } }
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
        style={{ marginBottom: 30 }}
      >
        <h1 style={{ fontSize: 24, fontWeight: 800, color: 'var(--text-primary)' }}>Dashboard Analítico</h1>
        <p style={{ color: 'var(--text-muted)' }}>Métricas e estatísticas em tempo real dos processos de desligamento.</p>
      </motion.div>

      <motion.div className="stats-grid" variants={containerVariants} initial="hidden" animate="visible">
        {[
          { color: 'blue',   label: 'Total Ativos',      value: stats.total, icon: <Briefcase size={48} /> },
          { color: 'green',  label: 'Concluídos (Pago)', value: stats.peloStatus['pago'] || 0, icon: <CheckCircle size={48} /> },
          { color: 'yellow', label: 'Em Documentação',   value: stats.peloStatus['documentacao'] || 0, icon: <Calendar size={48} /> },
          { color: 'purple', label: 'Taxa de Conclusão', value: `${stats.total > 0 ? Math.round(((stats.peloStatus['pago'] || 0) / stats.total) * 100) : 0}%`, icon: <TrendingUp size={48} /> },
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
          <h3 style={{ marginBottom: 20, fontSize: 14 }}>Volume Mensal</h3>
          <div style={{ flex: 1, minHeight: 150 }}>
            <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={150} debounce={100}>
            <LineChart data={mesChartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="name" stroke="var(--text-muted)" fontSize={11} />
              <YAxis stroke="var(--text-muted)" fontSize={11} />
              <Tooltip 
                contentStyle={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 10, fontSize: 12 }}
                itemStyle={{ color: 'var(--accent-blue-light)' }}
              />
              <Line type="monotone" dataKey="value" stroke="var(--accent-blue)" strokeWidth={3} dot={{ r: 6, fill: 'var(--accent-blue)' }} />
            </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card" style={{ height: 400, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <h3 style={{ marginBottom: 20, fontSize: 14 }}>Motivos de Desligamento</h3>
          <div style={{ flex: 1, minHeight: 150 }}>
            <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={150} debounce={100}>
            <PieChart>
              <Pie
                data={motivoChartData}
                innerRadius={60}
                outerRadius={100}
                paddingAngle={5}
                dataKey="value"
              >
                {motivoChartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 10, fontSize: 12 }}
              />
            </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 350px', gap: 24 }}>
        <div className="card" style={{ height: 350, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <h3 style={{ marginBottom: 20, fontSize: 14 }}>Status dos Processos</h3>
          <div style={{ flex: 1, minHeight: 150 }}>
            <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={150} debounce={100}>
            <BarChart data={statusChartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="name" stroke="var(--text-muted)" fontSize={11} />
              <YAxis stroke="var(--text-muted)" fontSize={11} />
              <Tooltip 
                contentStyle={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 10, fontSize: 12 }}
              />
              <Bar dataKey="value" fill="var(--accent-indigo)" radius={[4, 4, 0, 0]} />
            </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card" style={{ height: 350 }}>
          <h3 style={{ marginBottom: 20, fontSize: 14 }}>Distribuição por Empresa</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {empresaChartData.sort((a,b) => b.value - a.value).map((emp, i) => (
              <div key={emp.name} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 40, fontWeight: 800, color: 'var(--text-muted)', fontSize: 16 }}>{i+1}º</div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span style={{ fontSize: 12, fontWeight: 600 }}>C{emp.name}</span>
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
    </motion.div>
  );
}
