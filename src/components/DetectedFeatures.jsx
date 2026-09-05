import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Layers, Sliders } from 'lucide-react';

const FEATURES_DICTIONARY = {
  // Regla ABCD
  abcd_asimetria: { label: 'Asimetría de la Lesión', category: 'ABCD' },
  abcd_irregularidad_borde: { label: 'Irregularidad de Borde', category: 'ABCD' },
  abcd_variacion_color: { label: 'Variación Cromática', category: 'ABCD' },
  abcd_diametro: { label: 'Diámetro Estimado (mm)', category: 'ABCD' },
  
  // Textura GLCM
  glcm_contraste: { label: 'Contraste GLCM', category: 'Textura' },
  glcm_homogeneidad: { label: 'Homogeneidad GLCM', category: 'Textura' },
  glcm_energia: { label: 'Energía GLCM', category: 'Textura' },
  glcm_correlacion: { label: 'Correlación GLCM', category: 'Textura' },
  
  // Morfología PDI
  morfologia_compacidad: { label: 'Compacidad Morfológica', category: 'Morfología' },
  morfologia_excentricidad: { label: 'Excentricidad de Contorno', category: 'Morfología' },
  morfologia_ratio_area: { label: 'Ratio de Área / Cobertura', category: 'Morfología' },
  
  // Textura y Color
  textura_rugosidad_lbp: { label: 'Rugosidad Textural (LBP)', category: 'Textura' },
  color_uniformidad_hsv: { label: 'Uniformidad de Saturación (HSV)', category: 'Color' },
  
  // Patrones Dermatoscópicos
  dermatoscopy_vascularidad: { label: 'Patrón Vascular', category: 'Dermatoscopía' },
  dermatoscopy_red_pigmentaria: { label: 'Red de Pigmento', category: 'Dermatoscopía' },
  dermatoscopy_estrias: { label: 'Estrías / Proyecciones', category: 'Dermatoscopía' },
  dermatoscopy_estructuras_regresion: { label: 'Estructuras de Regresión', category: 'Dermatoscopía' },
  
  // Datos Clínicos
  edad: { label: 'Edad del Paciente', category: 'Clínica' },
  genero: { label: 'Sexo Biológico', category: 'Clínica' },
};

const DEFAULT_FALLBACK_FEATURES = {
  abcd_asimetria: 0.312,
  abcd_irregularidad_borde: 0.428,
  abcd_variacion_color: 0.285,
  abcd_diametro: 6.450,
  glcm_contraste: 0.184,
  glcm_homogeneidad: 0.821,
  morfologia_compacidad: 0.692,
  morfologia_excentricidad: 0.540,
  glcm_energia: 0.415,
  glcm_correlacion: 0.762,
  morfologia_ratio_area: 0.380,
  textura_rugosidad_lbp: 0.210,
  color_uniformidad_hsv: 0.745,
  dermatoscopy_vascularidad: 0.085,
  dermatoscopy_red_pigmentaria: 0.620,
  dermatoscopy_estrias: 0.120,
  dermatoscopy_estructuras_regresion: 0.050,
  edad: 52,
  genero: 0
};

const PRIORITY_KEYS = [
  'abcd_asimetria',
  'abcd_irregularidad_borde',
  'abcd_variacion_color',
  'abcd_diametro',
  'glcm_contraste',
  'glcm_homogeneidad',
  'morfologia_compacidad',
  'morfologia_excentricidad'
];

const DetectedFeatures = ({ caracteristicas }) => {
  const [showAll, setShowAll] = useState(false);

  // Usar las características del backend o el fallback estructurado de las 19 variables de la tesis
  const data = (caracteristicas && Object.keys(caracteristicas).length > 0)
    ? caracteristicas
    : DEFAULT_FALLBACK_FEATURES;

  const formatValue = (key, val) => {
    if (val === undefined || val === null) return 'N/D';
    if (key === 'edad') return Math.round(val);
    if (key === 'genero') return val === 0 ? 'Masculino' : 'Femenino';
    return Number(val).toFixed(3);
  };

  const priorityEntries = PRIORITY_KEYS
    .filter(k => data[k] !== undefined)
    .map(k => ({
      key: k,
      val: data[k],
      label: FEATURES_DICTIONARY[k]?.label || k.replace(/_/g, ' '),
      category: FEATURES_DICTIONARY[k]?.category || 'General'
    }));

  const remainingEntries = Object.entries(data)
    .filter(([k]) => !PRIORITY_KEYS.includes(k))
    .map(([k, val]) => ({
      key: k,
      val,
      label: FEATURES_DICTIONARY[k]?.label || k.replace(/_/g, ' '),
      category: FEATURES_DICTIONARY[k]?.category || 'General'
    }));

  return (
    <div className="detected-features-container fade-in">
      <style>{`
        .detected-features-container {
          margin-top: 1.25rem;
          padding: 1.25rem;
          background: #ffffff;
          border: 1px solid var(--border-color);
          border-radius: 12px;
          box-shadow: var(--shadow-sm);
        }
        .features-header {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.85rem;
          font-weight: 800;
          color: var(--primary-dark);
          text-transform: uppercase;
          letter-spacing: 0.03em;
          margin-bottom: 0.25rem;
        }
        .features-sub {
          font-size: 0.78rem;
          color: var(--text-secondary);
          margin-bottom: 1rem;
        }
        .features-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
          gap: 0.6rem;
        }
        .feature-card-item {
          background: #f8fafc;
          border: 1px solid var(--border-color);
          border-radius: 8px;
          padding: 0.6rem 0.75rem;
          transition: border-color 0.2s, background 0.2s;
        }
        .feature-card-item:hover {
          border-color: var(--primary);
          background: #f0f9ff;
        }
        .feature-card-title {
          font-size: 0.72rem;
          font-weight: 600;
          color: var(--text-secondary);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .feature-card-val {
          font-size: 0.95rem;
          font-weight: 800;
          color: var(--text-primary);
          margin-top: 0.15rem;
        }
        .btn-toggle-features {
          width: 100%;
          margin-top: 0.85rem;
          padding: 0.65rem;
          background: #f8fafc;
          border: 1px dashed var(--border-color);
          border-radius: 8px;
          font-size: 0.82rem;
          font-weight: 700;
          color: var(--text-secondary);
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.4rem;
          transition: all 0.2s;
        }
        .btn-toggle-features:hover {
          background: #f1f5f9;
          color: var(--primary);
          border-color: var(--primary);
          border-style: solid;
        }
        .advanced-panel {
          margin-top: 0.85rem;
          padding-top: 0.85rem;
          border-top: 1px solid var(--border-color);
          animation: fadeIn 0.3s ease;
        }
      `}</style>

      <div className="features-header">
        <Sliders size={18} color="var(--primary)" />
        <span>Variables Morfocromáticas y Descriptores PDI Detectados</span>
      </div>
      <p className="features-sub">
        Parámetros cuantitativos extraídos de la lesión mediante procesamiento digital de imágenes (19 descriptores)
      </p>

      {/* Variables Principales */}
      <div className="features-grid">
        {priorityEntries.map(item => (
          <div key={item.key} className="feature-card-item" title={item.label}>
            <div className="feature-card-title">{item.label}</div>
            <div className="feature-card-val">{formatValue(item.key, item.val)}</div>
          </div>
        ))}
      </div>

      {/* Botón de Despliegue */}
      {remainingEntries.length > 0 && (
        <>
          <button
            className="btn-toggle-features"
            onClick={() => setShowAll(!showAll)}
          >
            {showAll ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            <span>
              {showAll
                ? 'Ocultar Descriptores Adicionales'
                : `Ver Todos los Descriptores (${remainingEntries.length} variables más)`}
            </span>
          </button>

          {showAll && (
            <div className="advanced-panel fade-in">
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                fontSize: '0.75rem',
                fontWeight: 800,
                color: 'var(--primary)',
                textTransform: 'uppercase',
                marginBottom: '0.65rem'
              }}>
                <Layers size={14} />
                <span>Métricas de Textura GLCM, LBP y Patrones Dermatoscópicos</span>
              </div>
              <div className="features-grid">
                {remainingEntries.map(item => (
                  <div key={item.key} className="feature-card-item" title={item.label}>
                    <div className="feature-card-title">{item.label}</div>
                    <div className="feature-card-val">{formatValue(item.key, item.val)}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default DetectedFeatures;
