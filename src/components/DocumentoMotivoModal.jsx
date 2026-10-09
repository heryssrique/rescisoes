import React, { useState } from 'react';
import { X, Check, FileX } from 'lucide-react';

export function DocumentoMotivoModal({ onClose, onSave, initialMotivo = '' }) {
  const [motivo, setMotivo] = useState(initialMotivo);
  const [signed, setSigned] = useState(true);

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h3>Status do Documento</h3>

        <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
          <button
            className={`btn ${signed ? 'btn-success' : 'btn-secondary'}`}
            onClick={() => setSigned(true)}
            style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
          >
            <Check size={16} /> Assinado
          </button>
          <button
            className={`btn ${!signed ? 'btn-danger' : 'btn-secondary'}`}
            onClick={() => setSigned(false)}
            style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
          >
            <FileX size={16} /> Não Assinado
          </button>
        </div>

        {!signed && (
          <>
            <label style={{ display: 'block', marginBottom: 8, color: 'var(--text-secondary)', fontSize: 14 }}>
              Motivo da não assinatura
            </label>
            <textarea
              className="form-input"
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              placeholder="Informe o motivo..."
              rows={3}
              style={{ marginBottom: 16 }}
            />
          </>
        )}

        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <button className="btn btn-secondary" onClick={onClose}>Cancelar</button>
          <button
            className="btn btn-primary"
            onClick={() => onSave(signed, motivo)}
            disabled={!signed && !motivo.trim()}
          >
            Salvar
          </button>
        </div>
      </div>
    </div>
  );
}