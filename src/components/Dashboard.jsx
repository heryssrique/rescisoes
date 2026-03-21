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

  const motivoChartData = Object.entries(stats.peloMotivo).map(([name, value]) => ({ name, value }));
  const statusChartData = Object.entries(stats.peloStatus).map(([name, value]) => ({ name, value }));
  const empresaChartData = Object.entries(stats.pelaEmpresa).map(([name, value]) => ({ name, value }));
  const mesChartData = Object.entries(stats.porMes)
    .sort()
    .map(([name, value]) => ({ name, value }));

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="page-content"
    >
      <div style={{ marginBottom: 30 }}>
        <h1 style={{ fontSize: 24, fontWeight: 800, color: 'var(--text-primary)' }}>Dashboard Analítico</h1>
        <p style={{ color: 'var(--text-muted)' }}>Métricas e estatísticas em tempo real dos processos de desligamento.</p>
      </div>

      <div className="stats-grid">
        <div className="stat-card blue">
          <div className="stat-label">Total Ativos</div>
          <div className="stat-value">{stats.total}</div>
          <div className="stat-icon"><Briefcase size={48} /></div>
        </div>
        <div className="stat-card green">
          <div className="stat-label">Concluídos (Pago)</div>
          <div className="stat-value">{stats.peloStatus['pago'] || 0}</div>
          <div className="stat-icon"><CheckCircle size={48} /></div>
        </div>
        <div className="stat-card yellow">
          <div className="stat-label">Em Documentação</div>
          <div className="stat-value">{stats.peloStatus['documentacao'] || 0}</div>
          <div className="stat-icon"><Calendar size={48} /></div>
        </div>
        <div className="stat-card purple">
          <div className="stat-label">Taxa de Conclusão</div>
          <div className="stat-value">{stats.total > 0 ? Math.round(((stats.peloStatus['pago'] || 0) / stats.total) * 100) : 0}%</div>
          <div className="stat-icon"><TrendingUp size={48} /></div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 24 }}>
        <div className="card" style={{ height: 400 }}>
          <h3 style={{ marginBottom: 20, fontSize: 14 }}>Volume Mensal</h3>
          <ResponsiveContainer width="100%" height="85%">
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

        <div className="card" style={{ height: 400 }}>
          <h3 style={{ marginBottom: 20, fontSize: 14 }}>Motivos de Desligamento</h3>
          <ResponsiveContainer width="100%" height="85%">
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

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 350px', gap: 24 }}>
        <div className="card" style={{ height: 350 }}>
          <h3 style={{ marginBottom: 20, fontSize: 14 }}>Status dos Processos</h3>
          <ResponsiveContainer width="100%" height="85%">
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
