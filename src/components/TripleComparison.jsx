import React, { useState } from 'react';
import { Maximize2, X } from 'lucide-react';

const TripleComparison = ({ segmentationImg, gradcamImg }) => {
  const [modalImage, setModalImage] = useState(null);

  return (
    <div className="triple-comparison-container">
      <style>{`
        .triple-comparison-container {
          margin-top: 1.25rem;
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
          background: rgba(15, 23, 42, 0.9);
          z-index: 1100;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 2rem;
        }
        .zoom-modal-content {
          max-width: 90vw;
          max-height: 85vh;
          position: relative;
          text-align: center;
        }
        .zoom-modal-content img {
          max-width: 100%;
          max-height: 80vh;
          border-radius: 12px;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
        }
        .btn-close-zoom {
          position: absolute;
          top: -40px;
          right: 0;
          background: white;
          color: #0f172a;
          padding: 6px 12px;
          border-radius: 20px;
          font-weight: 700;
          font-size: 0.85rem;
          display: flex;
          align-items: center;
          gap: 4px;
        }
      `}</style>

      <div className="images-grid">
        {/* 1. Segmentación PDI */}
        <div className="image-card">
          <div className="image-header">
            <span>1. Segmentación PDI</span>
            <span className="badge-tech" style={{ fontSize: '0.7rem', padding: '0.15rem 0.45rem', background: '#f1f5f9', borderRadius: '4px', color: 'var(--text-secondary)' }}>DullRazor + Otsu</span>
          </div>
          <div
            className="image-wrapper"
            onClick={() => setModalImage({ src: segmentationImg, title: 'Segmentación PDI (DullRazor + Umbralización Otsu)' })}
          >
            <img src={segmentationImg} alt="Segmentación PDI" />
            <div className="btn-zoom"><Maximize2 size={18} /></div>
          </div>
        </div>

        {/* 2. Grad-CAM */}
        <div className="image-card">
          <div className="image-header">
            <span>2. Zonas de Interés</span>
            <span className="badge-tech" style={{ fontSize: '0.7rem', padding: '0.15rem 0.45rem', background: '#f1f5f9', borderRadius: '4px', color: 'var(--text-secondary)' }}>Grad-CAM (CNN)</span>
          </div>
          <div
            className="image-wrapper"
            onClick={() => setModalImage({ src: gradcamImg, title: 'Mapa de Activación Grad-CAM (EfficientNet-B3)' })}
          >
            <img src={gradcamImg} alt="Grad-CAM" />
            <div className="btn-zoom"><Maximize2 size={18} /></div>
          </div>
        </div>
      </div>

      <div className="gradcam-legend-box">
        💡 <strong>Interpretación de Explicabilidad Visual</strong>: Las zonas con tonalidad <span style={{ color: '#e11d48', fontWeight: 700 }}>roja / cálida</span> señalan las estructuras morfológicas y cromáticas que tuvieron mayor peso e influencia en la inferencia del modelo deep learning.
      </div>

      {modalImage && (
        <div className="zoom-modal" onClick={() => setModalImage(null)}>
          <div className="zoom-modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="btn-close-zoom" onClick={() => setModalImage(null)}>
              <X size={16} /> Cerrar
            </button>
            <img src={modalImage.src} alt={modalImage.title} />
            <p style={{ color: 'white', marginTop: '0.75rem', fontWeight: 600, fontSize: '0.95rem' }}>
              {modalImage.title}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default TripleComparison;
