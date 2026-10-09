import React, { useState } from 'react';
import { X } from 'lucide-react';

export function DocumentoMotivoModal({ onClose, onSave, initialMotivo = '' }) {
  const [motivo, setMotivo] = useState(initialMotivo);

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h3>Motivo da não assinatura</h3>
        <textarea
          className="form-input"
          value={motivo}
          onChange={(e) => setMotivo(e.target.value)}
          placeholder="Informe o motivo..."
          rows={4}
        />
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 16 }}>
          <button className="btn btn-secondary" onClick={onClose}>Cancelar</button>
          <button className="btn btn-primary" onClick={() => onSave(motivo)}>Salvar</button>
        </div>
      </div>
    </div>
  );
}
