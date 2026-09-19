import React, { useState } from 'react';
import { Maximize2, Scan, Sparkles, X } from 'lucide-react';

const TripleComparison = ({ segmentationImg, gradcamImg, isMelanoma = false, diagnostico = '' }) => {
  const [modalImage, setModalImage] = useState(null);

  return (
    <div className="triple-comparison-container">
      <style>{`
        .triple-comparison-container {
          margin-top: 1.25rem;
        }
        .comp-section-title {
          display: flex;
          align-items: center;
          gap: 0.45rem;
          font-size: 0.88rem;
          font-weight: 700;
          color: var(--text-primary);
          margin-bottom: 0.65rem;
        }
        .images-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 1.25rem;
        }
        .image-card {
          background: #f8fafc;
          border: 1px solid var(--border-color);
          border-radius: 14px;
          overflow: hidden;
          position: relative;
          transition: transform 0.2s, box-shadow 0.2s;
        }
        .image-card:hover {
          transform: translateY(-2px);
          box-shadow: var(--shadow-md);
        }
        .image-header {
          padding: 0.65rem 0.85rem;
          background: #ffffff;
          border-bottom: 1px solid var(--border-color);
          font-size: 0.8rem;
          font-weight: 700;
          color: var(--text-secondary);
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        .image-wrapper {
          position: relative;
          aspect-ratio: 1 / 1;
          background: #0f172a;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
        }
        .image-wrapper img {
          width: 100%;
          height: 100%;
          object-fit: contain;
          transition: transform 0.3s ease;
        }
        .image-wrapper:hover img {
          transform: scale(1.03);
        }
        .btn-zoom {
          position: absolute;
          bottom: 10px;
          right: 10px;
          background: rgba(15, 23, 42, 0.8);
          color: white;
          padding: 6px;
          border-radius: 8px;
          backdrop-filter: blur(4px);
          opacity: 0;
          transition: opacity 0.2s;
        }
        .image-wrapper:hover .btn-zoom {
          opacity: 1;
        }
        .gradcam-legend-box {
          margin-top: 1rem;
          padding: 0.75rem 1rem;
          background: #f8fafc;
          border-left: 3px solid var(--primary);
          border-radius: 6px;
          font-size: 0.8rem;
          color: var(--text-secondary);
          line-height: 1.4;
        }
        @media (max-width: 640px) {
          .images-grid {
            grid-template-columns: 1fr;
          }
        }
        .zoom-modal {
          position: fixed;
          inset: 0;
          background: transparent;
          z-index: 1100;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 2rem;
          animation: fadeIn 0.15s ease-out;
        }
        .zoom-modal-content {
          max-width: 90vw;
          max-height: 90vh;
          position: relative;
          text-align: center;
          display: flex;
          flex-direction: column;
          align-items: center;
          transform: translateY(-80px);
        }
        .zoom-modal-image-wrapper {
          position: relative;
          display: inline-block;
          line-height: 0;
          max-width: 100%;
        }
        .zoom-modal-image-wrapper img {
          max-width: 100%;
          max-height: 75vh;
          border-radius: 12px;
          box-shadow: 0 25px 50px -10px rgba(0, 0, 0, 0.55), 0 0 0 1px rgba(0, 0, 0, 0.15);
          background: #ffffff;
          display: block;
          object-fit: contain;
        }
        .btn-close-zoom {
          position: absolute;
          top: 12px;
          right: 12px;
          width: 34px;
          height: 34px;
          background: rgba(15, 23, 42, 0.65);
          backdrop-filter: blur(8px);
          -webkit-backdrop-filter: blur(8px);
          color: #ffffff;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.35);
          border: 1px solid rgba(255, 255, 255, 0.25);
          cursor: pointer;
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
          z-index: 20;
          padding: 0;
        }
        .btn-close-zoom:hover {
          background: rgba(225, 29, 72, 0.9);
          border-color: rgba(255, 255, 255, 0.5);
          transform: scale(1.1);
          color: #ffffff;
        }
      `}</style>

      <div className="comp-section-title">
        <Scan size={17} color="var(--primary)" />
        <span>Interpretación de Explicabilidad Visual</span>
      </div>

      <div className="images-grid">
        {/* 1. Segmentación PDI */}
        <div className="image-card">
          <div className="image-header">
            <span>a) Segmentación PDI</span>
            <span className="badge-tech" style={{ fontSize: '0.7rem', padding: '0.15rem 0.45rem', background: '#f1f5f9', borderRadius: '4px', color: 'var(--text-secondary)' }}>DullRazor + Otsu</span>
          </div>
          <div
            className="image-wrapper"
            onClick={() => segmentationImg && setModalImage({ src: segmentationImg, title: 'Segmentación PDI (DullRazor + Umbralización Otsu)' })}
          >
            {segmentationImg ? (
              <img src={segmentationImg} alt="Segmentación PDI" />
            ) : (
              <div style={{ color: '#94a3b8', fontSize: '0.8rem', textAlign: 'center', padding: '1.5rem' }}>
                Segmentación no disponible
              </div>
            )}
            {segmentationImg && <div className="btn-zoom"><Maximize2 size={18} /></div>}
          </div>
        </div>

        {/* 2. Grad-CAM */}
        <div className="image-card">
          <div className="image-header">
            <span>b) Zonas de Interés</span>
            <span className="badge-tech" style={{ fontSize: '0.7rem', padding: '0.15rem 0.45rem', background: '#f1f5f9', borderRadius: '4px', color: 'var(--text-secondary)' }}>Grad-CAM (CNN)</span>
          </div>
          <div
            className="image-wrapper"
            onClick={() => gradcamImg && setModalImage({ src: gradcamImg, title: 'Mapa de Activación Grad-CAM (EfficientNet-B3)' })}
          >
            {gradcamImg ? (
              <img src={gradcamImg} alt="Grad-CAM" />
            ) : (
              <div style={{ color: '#94a3b8', fontSize: '0.8rem', textAlign: 'center', padding: '1.5rem' }}>
                Mapa Grad-CAM no disponible
              </div>
            )}
            {gradcamImg && <div className="btn-zoom"><Maximize2 size={18} /></div>}
          </div>
        </div>
      </div>

      <div
        className="gradcam-legend-box"
        style={{
          borderLeftColor: isMelanoma ? 'var(--danger, #e11d48)' : '#0284c7'
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem',
            fontWeight: 700,
            fontSize: '0.82rem',
            color: isMelanoma ? 'var(--danger, #e11d48)' : '#0284c7',
            marginBottom: '0.35rem'
          }}
        >
          <Sparkles size={15} />
          <span>Foco de atención del modelo ({isMelanoma ? 'Sospecha de malignidad' : 'Patrón benigno'})</span>
        </div>
        <p style={{ margin: 0, lineHeight: 1.45 }}>
          {isMelanoma ? (
            <>
              Las zonas con tonalidad <span style={{ color: '#e11d48', fontWeight: 700 }}>roja / cálida</span> señalan regiones con alta atipia morfológica, asimetría o desorganización pigmentaria acral que tuvieron mayor peso en la sospecha de <strong>Melanoma Acral</strong> identificadas por el modelo.
            </>
          ) : (
            <>
              Las zonas con tonalidad <span style={{ color: '#e11d48', fontWeight: 700 }}>roja / cálida</span> destacan los patrones de regularidad estructural y distribución cromática uniforme compatibles con <strong>Nevo Acral (Benigno)</strong> analizados por el modelo.
            </>
          )}
        </p>
      </div>

      {modalImage && (
        <div className="zoom-modal" onClick={() => setModalImage(null)}>
          <div className="zoom-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="zoom-modal-image-wrapper">
              <button
                className="btn-close-zoom"
                onClick={() => setModalImage(null)}
                title="Cerrar vista previa"
                aria-label="Cerrar"
              >
                <X size={18} />
              </button>
              <img src={modalImage.src} alt={modalImage.title} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TripleComparison;
