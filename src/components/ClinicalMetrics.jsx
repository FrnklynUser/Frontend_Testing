import React from 'react';

const ClinicalMetrics = ({ casoId, umbral, tiempoMs, metadata }) => {
  return (
    <div className="clinical-metrics-container">
      <style>{`
        .clinical-metrics-container {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 0.75rem;
          margin-top: 1.25rem;
        }
        .metric-box {
          background: #ffffff;
          border: 1px solid var(--border-color);
          border-radius: 10px;
          padding: 0.85rem;
          text-align: center;
          transition: transform 0.2s;
        }
        .metric-box:hover {
          transform: translateY(-2px);
          box-shadow: var(--shadow-sm);
        }
        .metric-tag {
          font-size: 0.7rem;
          font-weight: 800;
          color: var(--text-secondary);
          text-transform: uppercase;
          letter-spacing: 0.04em;
          margin-bottom: 0.25rem;
        }
        .metric-value {
          font-size: 1.1rem;
          font-weight: 800;
          color: var(--text-primary);
        }
        .metric-value.highlight {
          color: var(--primary);
        }
        .metric-sub {
          font-size: 0.68rem;
          color: var(--text-muted);
          margin-top: 0.2rem;
        }
        @media (max-width: 900px) {
          .clinical-metrics-container {
            grid-template-columns: repeat(2, 1fr);
          }
        }
      `}</style>

      {/* 1. ID de Caso */}
      <div className="metric-box">
        <div className="metric-tag">ID Caso Clínico</div>
        <div className="metric-value" style={{ fontSize: '0.95rem' }}>
          {casoId || 'CASO-20260803-00001'}
        </div>
        <div className="metric-sub">Registro Trazable</div>
      </div>

      {/* 2. Umbral Clínico */}
      <div className="metric-box">
        <div className="metric-tag">Umbral de Decisión</div>
        <div className="metric-value highlight">
          {typeof umbral === 'number' ? umbral.toFixed(2) : (umbral || '0.25')}
        </div>
        <div className="metric-sub">Criterio Tesis (Cost-Sensitive)</div>
      </div>

      {/* 3. Sensibilidad */}
      <div className="metric-box">
        <div className="metric-tag">Sensibilidad (Recall)</div>
        <div className="metric-value" style={{ color: '#059669' }}>
          90.54%
        </div>
        <div className="metric-sub">Detección de Melanoma</div>
      </div>

      {/* 4. Tiempo de Inferencia */}
      <div className="metric-box">
        <div className="metric-tag">Tiempo Procesamiento</div>
        <div className="metric-value" style={{ color: '#0284c7' }}>
          {tiempoMs ? `${Math.round(tiempoMs)} ms` : '< 850 ms'}
        </div>
        <div className="metric-sub">Pipeline Multimodal</div>
      </div>
    </div>
  );
};

export default ClinicalMetrics;
