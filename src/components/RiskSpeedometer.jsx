import React from 'react';

const RiskSpeedometer = ({ clase, diagnostico, probabilidadNum }) => {
  const isMelanoma = clase === 1 || diagnostico?.toLowerCase().includes('melanoma');

  const prob = typeof probabilidadNum === 'number' 
    ? probabilidadNum 
    : parseFloat(probabilidadNum) || 0;

  let activeCount = 1;
  let riskClass = 'risk-low';
  let riskLabel = 'Riesgo Mínimo (Lesión Benigna)';
  let riskColor = '#059669';

  if (isMelanoma) {
    if (prob >= 70) {
      activeCount = 5;
      riskClass = 'risk-high';
      riskLabel = 'Riesgo Alto (Melanoma Acral)';
      riskColor = '#e11d48';
    } else {
      activeCount = 3;
      riskClass = 'risk-medium';
      riskLabel = 'Riesgo Moderado (Sospecha Oncológica)';
      riskColor = '#d97706';
    }
  } else {
    activeCount = 1;
    riskClass = 'risk-low';
    riskLabel = 'Riesgo Bajo (Patrón Benigno)';
    riskColor = '#059669';
  }

  return (
    <div className="risk-speedometer-card">
      <style>{`
        .risk-speedometer-card {
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 12px;
          padding: 1.25rem;
          margin-top: 1rem;
        }
        .speedometer-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 0.75rem;
        }
        .speedometer-title {
          font-size: 0.75rem;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: var(--text-secondary);
        }
        .speedometer-status {
          font-size: 0.8rem;
          font-weight: 700;
          padding: 0.15rem 0.6rem;
          border-radius: 20px;
        }
        .speedometer-blocks {
          display: grid;
          grid-template-columns: repeat(5, 1fr);
          gap: 6px;
          margin-bottom: 0.5rem;
        }
        .speed-block {
          height: 10px;
          border-radius: 4px;
          background: #e2e8f0;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .speed-block.active.risk-low {
          background: #10b981;
          box-shadow: 0 0 8px rgba(16, 185, 129, 0.4);
        }
        .speed-block.active.risk-medium {
          background: #f59e0b;
          box-shadow: 0 0 8px rgba(245, 158, 11, 0.4);
        }
        .speed-block.active.risk-high {
          background: #f43f5e;
          box-shadow: 0 0 8px rgba(244, 63, 94, 0.4);
        }
        .speedometer-labels {
          display: flex;
          justify-content: space-between;
          font-size: 0.7rem;
          font-weight: 600;
          color: var(--text-muted);
        }
      `}</style>

      <div className="speedometer-header">
        <span className="speedometer-title">Estratificación de Riesgo Oncológico</span>
        <span 
          className="speedometer-status"
          style={{ 
            backgroundColor: `${riskColor}15`, 
            color: riskColor,
            border: `1px solid ${riskColor}40`
          }}
        >
          {riskLabel}
        </span>
      </div>

      <div className="speedometer-blocks">
        {[0, 1, 2, 3, 4].map(idx => (
          <div
            key={idx}
            className={`speed-block ${idx < activeCount ? `active ${riskClass}` : ''}`}
          />
        ))}
      </div>

      <div className="speedometer-labels">
        <span>Bajo</span>
        <span>Moderado</span>
        <span>Alto</span>
      </div>
    </div>
  );
};

export default RiskSpeedometer;
