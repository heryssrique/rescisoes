import React from 'react';
import { useApp } from '../context/AppContext';
import { ExternalLink, Calculator, BookOpen, Globe, Search } from 'lucide-react';
import { motion } from 'framer-motion';

const categoryIcons = {
  'Cálculos': <Calculator size={24} />,
  'Legislação': <BookOpen size={24} />,
  'Portais': <Globe size={24} />,
  'Consultas': <Search size={24} />,
  'Geral': <ExternalLink size={24} />
};

const categoryColors = {
  'Cálculos': 'var(--accent-blue)',
  'Legislação': 'var(--accent-orange)',
  'Portais': 'var(--accent-purple)',
  'Consultas': 'var(--accent-teal)',
  'Geral': 'var(--accent-indigo)'
};

export function LinksView() {
  const { state } = useApp();
  const linksUteis = state.linksUteis || [];
  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };

  return (
    <div className="page-content">
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 24, fontWeight: 800, color: 'var(--text-primary)' }}>Links e Ferramentas Úteis</h1>
        <p style={{ color: 'var(--text-muted)' }}>Atalhos para sites e portais que auxiliam no processamento de rescisões e cálculos trabalhistas.</p>
      </div>

      <motion.div 
        variants={container}
        initial="hidden"
        animate="show"
        style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', 
          gap: 20 
        }}
      >
        {linksUteis.map((link) => (
          <motion.a
            key={link.id}
            variants={item}
            href={link.url}
            target="_blank"
            rel="noopener noreferrer"
            className="card"
            style={{ 
              display: 'flex', 
              flexDirection: 'column', 
              gap: 16, 
              padding: 24, 
              textDecoration: 'none',
              cursor: 'pointer',
              border: '1px solid var(--border)',
              transition: 'all 0.3s'
            }}
            whileHover={{ y: -5, borderColor: categoryColors[link.category] || 'var(--accent-blue)', boxShadow: '0 12px 24px rgba(0,0,0,0.1)' }}
          >
            <div style={{ 
              width: 48, 
              height: 48, 
              borderRadius: 12, 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              background: `${categoryColors[link.category]}15`,
              color: categoryColors[link.category]
            }}>
              {categoryIcons[link.category] || categoryIcons['Geral']}
            </div>
            
            <div style={{ flex: 1 }}>
              <div style={{ 
                fontSize: 10, 
                fontWeight: 800, 
                textTransform: 'uppercase', 
                color: 'var(--text-muted)', 
                marginBottom: 4,
                letterSpacing: 0.5
              }}>
                {link.category}
              </div>
              <h3 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                {link.label}
              </h3>
            </div>

            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: 8, 
              fontSize: 13, 
              fontWeight: 600, 
              color: categoryColors[link.category]
            }}>
              Acessar site <ExternalLink size={14} />
            </div>
          </motion.a>
        ))}
      </motion.div>

      {linksUteis.length === 0 && (
        <div style={{ textAlign: 'center', padding: '60px 0', border: '2px dashed var(--border)', borderRadius: 16, color: 'var(--text-muted)' }}>
          Nenhum link configurado. Adicione links nas Configurações.
        </div>
      )}
    </div>
  );
}
