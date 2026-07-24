import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { predictService, historyService } from '../services/api';
import {
  Upload,
  Camera,
  LogOut,
  History,
  BarChart3,
  Activity,
  Image as ImageIcon,
  Info,
  Trash2,
  CheckCircle2,
  XCircle,
  Clock,
  Microscope,
  RotateCcw,
  Bell,
  Settings,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  ShieldCheck
} from 'lucide-react';

const Dashboard = () => {
  const { user, logout } = useAuth();
  const fileInputRef = useRef(null);
  const toast = useToast();
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [showAllFeatures, setShowAllFeatures] = useState(false);
  const [history, setHistory] = useState([]);
  const [error, setError] = useState('');
  const [historyLimit, setHistoryLimit] = useState(5);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [showClinicalForm, setShowClinicalForm] = useState(false);
  const [validationErrorData, setValidationErrorData] = useState(null);
  const [showCameraOptions, setShowCameraOptions] = useState(false);
  const [clinicalData, setClinicalData] = useState({
    age: '',
    gender: '',
    family_history: '',
    sun_exposure: ''
  });
  const [canClear, setCanClear] = useState(false);
  const [timeLeft, setTimeLeft] = useState(60);

  const getInitials = (name) => {
    const parts = name.split(' ').filter(p => !['dr.', 'dra.', 'dr', 'dra'].includes(p.toLowerCase()));
    if (parts.length >= 2) {
      return (parts[0].charAt(0) + parts[1].charAt(0)).toUpperCase();
    }
    return name.charAt(0).toUpperCase();
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  useEffect(() => {
    let timer;
    if (result && !canClear) {
      timer = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            setCanClear(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [result, canClear]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const fetchHistory = async () => {
    try {
      const data = await historyService.getHistory(user.username);
      setHistory(data);
    } catch (err) {
      console.error("Error fetching history:", err);
    }
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      setPreview(URL.createObjectURL(selectedFile));
      setResult(null);
      setError('');
      setShowCameraOptions(false);
      // Resetear datos clínicos al cambiar imagen
      setClinicalData({ age: '', gender: '', family_history: '', sun_exposure: '' });
      setShowClinicalForm(false);
    }
  };

  const handleCameraCapture = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.capture = 'environment'; // Usa la cámara trasera en móviles
    input.onchange = (e) => {
      const selectedFile = e.target.files[0];
      if (selectedFile) {
        setFile(selectedFile);
        setPreview(URL.createObjectURL(selectedFile));
        setResult(null);
        setError('');
        setShowCameraOptions(false);
        // Resetear datos clínicos al cambiar imagen
        setClinicalData({ age: '', gender: '', family_history: '', sun_exposure: '' });
        setShowClinicalForm(false);
      }
    };
    input.click();
  };

  const handlePredict = async () => {
    if (!file) return;

    // Validar que todos los datos clínicos estén completos
    if (!clinicalData.age || !clinicalData.gender || !clinicalData.family_history || !clinicalData.sun_exposure) {
      const msg = 'Por favor, complete todos los datos clínicos del paciente (Edad, Sexo, Antecedentes familiares y Exposición solar) antes de analizar la imagen.';
      setError(msg);
      toast.warning('Por favor complete todos los datos clínicos.');
      setShowClinicalForm(true);
      return;
    }

    setLoading(true);
    setError('');
    setValidationErrorData(null);
    try {
      const data = await predictService.predict(user.username, file, clinicalData);
      setResult(data);
      toast.success('Análisis de lesión completado con éxito.');
      setShowAllFeatures(false); // Resetear estado de expansión
      fetchHistory();
    } catch (err) {
      // Manejo especial para imagen no dermatoscópica (HTTP 422)
      const detail = err.response?.data?.detail;
      let msg = '';
      if (err.response?.status === 422 && detail?.error === 'imagen_no_dermatoscopica') {
        setValidationErrorData(detail);
        msg = detail.message;
      } else {
        msg = detail?.message || detail || 'Error al procesar la imagen.';
      }
      setError(msg);
      toast.error('Error al analizar la lesión.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteHistory = (id) => {
    setItemToDelete(id);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!itemToDelete) return;
    try {
      await historyService.deleteItem(user.username, itemToDelete);
      fetchHistory();
      setShowDeleteModal(false);
      setItemToDelete(null);
    } catch (err) {
      setError("Error al eliminar el registro");
      setShowDeleteModal(false);
    }
  };

  const handleClear = () => {
    setFile(null);
    setPreview(null);
    setResult(null);
    setShowAllFeatures(false);
    setError('');
    setClinicalData({ age: '', gender: '', family_history: '', sun_exposure: '' });
    setShowClinicalForm(false);
    setCanClear(false);
    setTimeLeft(60);
  };

  const getStats = () => {
    const melanoma = history.filter(h => h.prediction === 'Melanoma' || h.prediction === 'Melanoma acral').length;
    return {
      total: history.length,
      melanoma,
      nevus: history.length - melanoma
    };
  };

  const stats = getStats();

  // Diccionario de traducción de las 25 características clínicas
  const FEATURES_ES = {
    asymmetry_score: 'Puntuación de asimetría',
    border_irregularity: 'Irregularidad del borde',
    color_variation: 'Variación de color',
    diameter: 'Diámetro (mm)',
    contrast: 'Contraste',
    energy: 'Energía',
    homogeneity: 'Homogeneidad',
    correlation: 'Correlación',
    eccentricity: 'Excentricidad',
    compactness: 'Compacidad',
    area_ratio: 'Ratio de área',
    age: 'Edad',
    gender: 'Género',
    family_history: 'Antecedentes familiares',
    sun_exposure: 'Exposición solar',
    texture_roughness: 'Rugosidad de textura',
    lesion_shape: 'Forma de la lesión',
    color_uniformity: 'Uniformidad de color',
    edge_sharpness: 'Nitidez de bordes',
    surface_smoothness: 'Suavidad de superficie',
    pattern_symmetry: 'Simetría del patrón',
    vascularity: 'Vascularidad',
    pigment_network: 'Red de pigmento',
    streaks: 'Estrías',
    regression_structures: 'Estructuras de regresión',
  };

  const traducirFeature = (key) => FEATURES_ES[key] || key.replace(/_/g, ' ');

  const VALIDATION_ES = {
    area_ratio: 'Ratio de área',
    lesion_compactness: 'Compacidad de la lesión',
    skin_tones: 'Tonos de piel',
    dark_center: 'Centro oscuro',
    color_profile: 'Perfil de color'
  };

  const traducirValidacion = (key) => VALIDATION_ES[key] || key;

  return (
    <div className="dashboard-wrapper">
      <header className="app-header fade-in">
        <div className="header-brand">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{
              background: 'linear-gradient(135deg, var(--primary) 0%, var(--primary-dark) 100%)',
              padding: '0.6rem',
              borderRadius: '12px',
              color: 'white',
              boxShadow: '0 4px 6px -1px rgba(3, 105, 161, 0.2)'
            }}>
              <Microscope size={24} />
            </div>
            <div>
              <h1 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                Plataforma de Detección Acral <span className="badge-system">PDA V1.0</span>
              </h1>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginTop: '0.2rem' }}>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', margin: 0 }}>
                  Sistema de Diagnóstico Asistido por IA
                </p>
                <div className="header-status">
                  <div className="status-dot"></div>
                  SERVIDOR ACTIVO
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="header-actions">

          <div className="user-profile">
            <div className="user-avatar" style={{
              border: '2px solid white',
              boxShadow: '0 0 0 2px var(--primary-light)'
            }}>
              {getInitials(user.name)}
            </div>
            <div className="user-details">
              <span style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-primary)' }}>{user.name}</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ color: 'var(--primary)', fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase' }}>
                  Especialista
                </span>
                <span style={{ color: '#cbd5e1' }}>•</span>
                <span style={{ color: 'var(--text-secondary)', fontSize: '0.7rem', display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                  <Activity size={10} /> {history.length} análisis
                </span>
              </div>
            </div>
          </div>

          <button onClick={logout} className="logout-btn" title="Cerrar Sesión">
            <LogOut size={18} />
            <span>Cerrar Sesión</span>
          </button>
        </div>
      </header>

      <div className="info-bar fade-in">
        <Info color="var(--primary)" />
        <div>
          <div style={{ fontWeight: 600 }}>Sistema de Análisis Dermatoscópico</div>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
            Se aceptan imágenes dermatoscópicas del dataset y también imágenes externas descargadas de internet.
            Debe ingresar los datos clínicos obligatorios del paciente para realizar el análisis de diagnóstico.
          </p>
        </div>
      </div>

      <div className="main-grid">
        {/* Columna Izquierda: Carga */}
        <div className="clean-card fade-in">
          <div className="section-title">
            <Upload size={20} color="var(--primary)" />
            <h2 style={{ fontSize: '1.2rem' }}>Cargar Imagen</h2>
          </div>

          <div className={`upload-area ${file ? 'compact' : ''} ${result ? 'disabled' : ''}`}>
            {!file ? (
              <>
                <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem', width: '100%' }}>
                  <input
                    type="file"
                    ref={fileInputRef}
                    hidden
                    onChange={handleFileChange}
                    accept="image/*"
                    disabled={!!result}
                  />
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={!!result}
                    type="button"
                    style={{
                      flex: 1,
                      backgroundColor: 'var(--bg-body)',
                      padding: '1.5rem',
                      borderRadius: '12px',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      border: '2px dashed var(--border-color)',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      height: '120px',
                      fontFamily: 'inherit',
                      boxSizing: 'border-box'
                    }}
                  >
                    <Upload size={32} color="var(--primary)" />
                    <p style={{ fontWeight: 600, color: 'var(--text-primary)', marginTop: '0.5rem', fontSize: '0.9rem', margin: 0 }}>
                      Adjuntar
                    </p>
                  </button>
                  <button
                    onClick={handleCameraCapture}
                    disabled={!!result}
                    type="button"
                    style={{
                      flex: 1,
                      backgroundColor: 'var(--bg-body)',
                      padding: '1.5rem',
                      borderRadius: '12px',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      border: '2px dashed var(--border-color)',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      height: '120px',
                      fontFamily: 'inherit',
                      boxSizing: 'border-box'
                    }}
                  >
                    <Camera size={32} color="var(--primary)" />
                    <p style={{ fontWeight: 600, color: 'var(--text-primary)', marginTop: '0.5rem', fontSize: '0.9rem', margin: 0 }}>
                      Usar cámara
                    </p>
                  </button>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                    Selecciona una opción para cargar tu imagen
                  </p>
                </div>
              </>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', width: '100%', justifyContent: 'center' }}>
                <CheckCircle2 size={24} color="var(--success)" />
                <div style={{ textAlign: 'left' }}>
                  <p style={{ fontWeight: 600, fontSize: '0.9rem' }}>{file.name}</p>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Click para cambiar imagen</p>
                </div>
              </div>
            )}
          </div>

          {preview && (
            <div style={{ marginTop: '1.5rem' }}>
              <img src={preview} alt="Vista previa" className="preview-img" />

              {/* Panel de datos clínicos opcionales */}
              {!result && (
                <div className="clinical-panel">
                  <div
                    className={`clinical-header ${showClinicalForm ? 'open' : ''}`}
                    onClick={() => setShowClinicalForm(v => !v)}
                    id="clinical-data-toggle"
                  >
                    <div className="clinical-header-left">
                      <span>🩺</span>
                      <span>Datos Clínicos del Paciente</span>
                      <span className={`badge-optional ${Object.values(clinicalData).some(v => v !== '') ? 'badge-filled' : ''
                        }`}>
                        {Object.values(clinicalData).filter(v => v !== '').length > 0
                          ? `${Object.values(clinicalData).filter(v => v !== '').length}/4 ingresados`
                          : 'Obligatorio'}
                      </span>
                    </div>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', transition: 'transform 0.2s', display: 'inline-block', transform: showClinicalForm ? 'rotate(180deg)' : 'rotate(0deg)' }}>▼</span>
                  </div>

                  {showClinicalForm && (
                    <div className="clinical-body">
                      <p className="clinical-hint">
                        Proporcione datos clínicos del paciente. Todos los campos son obligatorios para el análisis.
                      </p>

                      <div className="clinical-field">
                        <label htmlFor="patient-age">Edad *</label>
                        <input
                          id="patient-age"
                          type="number"
                          min="1" max="110"
                          placeholder="ej: 55"
                          value={clinicalData.age}
                          onChange={e => setClinicalData(p => ({ ...p, age: e.target.value }))}
                        />
                      </div>

                      <div className="clinical-field">
                        <label htmlFor="patient-gender">Sexo biológico *</label>
                        <select
                          id="patient-gender"
                          value={clinicalData.gender}
                          onChange={e => setClinicalData(p => ({ ...p, gender: e.target.value }))}
                        >
                          <option value="">-- Seleccione --</option>
                          <option value="0">Masculino</option>
                          <option value="1">Femenino</option>
                        </select>
                      </div>

                      <div className="clinical-field">
                        <label htmlFor="patient-family">Antecedentes familiares *</label>
                        <select
                          id="patient-family"
                          value={clinicalData.family_history}
                          onChange={e => setClinicalData(p => ({ ...p, family_history: e.target.value }))}
                        >
                          <option value="">-- Seleccione --</option>
                          <option value="0">Ninguno</option>
                          <option value="1">Sí, hay antecedentes</option>
                          <option value="2">Incierto</option>
                          <option value="3">Múltiples casos</option>
                        </select>
                      </div>

                      <div className="clinical-field">
                        <label htmlFor="patient-sun">Exposición solar crónica *</label>
                        <select
                          id="patient-sun"
                          value={clinicalData.sun_exposure}
                          onChange={e => setClinicalData(p => ({ ...p, sun_exposure: e.target.value }))}
                        >
                          <option value="">-- Seleccione --</option>
                          <option value="0">Baja</option>
                          <option value="1">Media</option>
                          <option value="2">Alta</option>
                          <option value="3">Muy alta</option>
                        </select>
                      </div>
                    </div>
                  )}
                </div>
              )}

              <div className="actions-group">
                <button
                  onClick={handlePredict}
                  className="action-btn"
                  disabled={loading || !!result}
                  style={{
                    flex: '1',
                    backgroundColor: result ? 'var(--secondary)' : 'var(--secondary)',
                    cursor: (loading || result) ? 'not-allowed' : 'pointer',
                    opacity: (loading || result) ? 0.7 : 1
                  }}
                >
                  {loading ? 'Analizando...' : (
                    <>
                      {result ? <CheckCircle2 size={20} /> : <BarChart3 size={20} />}
                      {result ? 'Imagen Analizada' : 'Analizar Lesión'}
                    </>
                  )}
                </button>

                {result && (
                  <button
                    onClick={handleClear}
                    className="clear-btn"
                    disabled={!canClear}
                    title={!canClear ? `Desbloqueo en ${formatTime(timeLeft)}` : "Limpiar análisis"}
                  >
                    <RotateCcw size={18} />
                    <span>{canClear ? 'Limpiar' : `Limpiar (${formatTime(timeLeft)})`}</span>
                  </button>
                )}
              </div>

              {result && (
                <div style={{ marginTop: '1.5rem' }}>
                  <h3 style={{ marginBottom: '0.25rem', fontSize: '1.1rem' }}>Métricas Reportadas:</h3>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
                    Indicadores cuantitativos del procesamiento realizado
                  </p>
                  <div className="metrics-grid">
                    {(() => {
                      const m = result.metrics || {};
                      const bytes = m.size_bytes;
                      const sizeKb = bytes ? (bytes / 1024) : (m.image_size_kb ?? (m.image_size_mb ? m.image_size_mb * 1024 : 0));
                      const sizeLabel = sizeKb > 0
                        ? (sizeKb < 1024 ? `${sizeKb.toFixed(2)} KB` : `${(sizeKb / 1024).toFixed(2)} MB`)
                        : (bytes > 0 ? `${bytes} Bytes` : '—');
                      return (
                        <>
                          <div className="metric-item" style={{ background: 'var(--primary-light)', borderColor: 'var(--primary)' }}>
                            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--primary-dark)' }}>TIEMPO</div>
                            <div style={{ fontSize: '1.1rem', fontWeight: 700 }}>{m.inference_time_ms != null ? `${m.inference_time_ms} ms` : '—'}</div>
                          </div>
                          <div className="metric-item" style={{ background: '#f5f3ff', borderColor: '#8b5cf6' }}>
                            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#5b21b6' }}>TAMAÑO</div>
                            <div style={{ fontSize: '1.1rem', fontWeight: 700 }}>{sizeLabel}</div>
                          </div>
                          <div className="metric-item" style={{ background: '#fff7ed', borderColor: 'var(--accent)' }}>
                            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#9a3412' }}>CONFIANZA</div>
                            <div style={{ fontSize: '1.1rem', fontWeight: 700 }}>{m.confidence_percent != null ? `${m.confidence_percent}%` : '—'}</div>
                          </div>
                          <div className="metric-item" style={{ background: 'var(--success-bg)', borderColor: 'var(--success)' }}>
                            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#065f46' }}>ESTADO</div>
                            <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--success)' }}>ÉXITO</div>
                          </div>
                        </>
                      );
                    })()}
                  </div>
                </div>
              )}
            </div>
          )}

          {error && (
            <div className="error-container" style={{ marginTop: '1.5rem' }}>
              <div className="result-card" style={{ borderColor: 'var(--danger)', backgroundColor: 'var(--danger-bg)' }}>
                <div style={{ color: 'var(--danger)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.6rem', fontSize: '1.05rem' }}>
                  <XCircle size={22} />
                  {validationErrorData ? 'Imagen; Rechazada' : (error.includes(';') ? error.split('\n')[0] : 'Error en el Procesamiento')}
                </div>
                <div style={{ fontSize: '0.9rem', marginTop: '0.75rem', color: '#4b5563', lineHeight: 1.5 }}>
                  {(() => {
                    let msg = error.includes('\n') ? error.split('\n').slice(1).join('\n') : error;
                    // Fallback de traducción para mensajes del backend antiguos
                    if (validationErrorData) {
                      Object.entries(VALIDATION_ES).forEach(([en, es]) => {
                        msg = msg.replace(new RegExp(en, 'g'), es);
                      });
                    }
                    return msg;
                  })()}
                </div>

                {validationErrorData && (
                  <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid rgba(220, 38, 38, 0.1)' }}>
                    <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#991b1b', marginBottom: '0.5rem', textTransform: 'uppercase' }}>
                      Puntuaciones por Criterio:
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                      {Object.entries(validationErrorData.criteria).map(([k, v]) => (
                        <span key={k} style={{
                          fontSize: '0.75rem',
                          padding: '0.2rem 0.5rem',
                          borderRadius: '4px',
                          background: 'white',
                          border: '1px solid #fca5a5',
                          color: '#4b5563'
                        }}>
                          <strong>{traducirValidacion(k)}:</strong> {v}
                        </span>
                      ))}
                    </div>
                    <div style={{
                      marginTop: '1rem',
                      padding: '0.75rem',
                      background: '#fff',
                      borderRadius: '8px',
                      border: '1px solid #fecaca',
                      fontSize: '0.85rem',
                      color: '#b91c1c',
                      fontWeight: 500
                    }}>
                      💡 {validationErrorData.suggestion}
                    </div>
                  </div>
                )}
              </div>

              {validationErrorData && (
                <div style={{
                  marginTop: '1.5rem',
                  padding: '1.25rem',
                  background: '#f0fdfa',
                  borderRadius: '16px',
                  border: '2px solid var(--secondary)',
                  boxShadow: '0 4px 15px rgba(13, 148, 136, 0.1)',
                  animation: 'fadeIn 0.5s ease'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1.25rem' }}>
                    <div style={{
                      backgroundColor: 'var(--secondary)',
                      color: 'white',
                      padding: '0.4rem',
                      borderRadius: '50%',
                      display: 'flex'
                    }}>
                      <CheckCircle2 size={18} />
                    </div>
                    <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 800, color: '#0f766e', textTransform: 'uppercase', letterSpacing: '0.02em' }}>
                      Guía de Captura Requerida
                    </h4>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
                    <div>
                      <div style={{
                        fontSize: '0.7rem',
                        fontWeight: 800,
                        color: '#0d9488',
                        marginBottom: '0.5rem',
                        background: '#ccfbf1',
                        padding: '0.2rem 0.6rem',
                        borderRadius: '20px',
                        display: 'inline-block'
                      }}>
                        ✅ CORRECTO: Dermatoscopio
                      </div>
                      <img
                        src="/img/referencia_dermatoscopica.png"
                        alt="Correcto"
                        style={{
                          width: '100%',
                          borderRadius: '10px',
                          border: '3px solid var(--secondary)',
                          boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                        }}
                      />
                      <p style={{ fontSize: '0.75rem', color: '#0f766e', marginTop: '0.5rem', lineHeight: 1.4 }}>
                        Imagen capturada con dermatoscopio. Se aprecia la red de pigmento.
                      </p>
                    </div>

                    <div>
                      <div style={{
                        fontSize: '0.7rem',
                        fontWeight: 800,
                        color: '#dc2626',
                        marginBottom: '0.5rem',
                        background: '#fee2e2',
                        padding: '0.2rem 0.6rem',
                        borderRadius: '20px',
                        display: 'inline-block'
                      }}>
                        ❌ INCORRECTO: Cámara
                      </div>
                      <img
                        src="/img/referencia_incorrectA.png"
                        alt="Incorrecto"
                        style={{
                          width: '100%',
                          borderRadius: '10px',
                          border: '3px solid #ef4444',
                          opacity: 0.8,
                          boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                        }}
                      />
                      <p style={{ fontSize: '0.75rem', color: '#991b1b', marginTop: '0.5rem', lineHeight: 1.4 }}>
                        Foto común de celular. No permite ver estructuras internas.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Columna Derecha: Resultados */}
        <div className="clean-card fade-in">
          <div className="section-title">
            <Activity size={20} color="var(--primary-dark)" />
            <h2 style={{ fontSize: '1.2rem' }}>Resultados del Análisis</h2>
          </div>

          {!result && !loading && (
            <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-secondary)' }}>
              <ImageIcon size={64} color="#f1f5f9" style={{ marginBottom: '1rem' }} />
              <p>Sube una imagen para comenzar el análisis</p>
            </div>
          )}

          {loading && (
            <div style={{ textAlign: 'center', padding: '4rem' }}>
              <div className="spinner" style={{
                border: '4px solid #f3f3f3',
                borderTop: '4px solid var(--secondary)',
                borderRadius: '50%',
                width: '40px',
                height: '40px',
                animation: 'spin 1s linear infinite',
                margin: '0 auto 1rem'
              }}></div>
              <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
              <p>Procesando imagen, un momento...</p>
            </div>
          )}

          {result && (
            <div>
              {/* Tarjeta de predicción principal */}
              <div className="result-card" style={{
                borderColor: (result.prediction === 'Melanoma' || result.prediction === 'Melanoma acral') ? 'var(--danger)' : 'var(--success)',
                backgroundColor: (result.prediction === 'Melanoma' || result.prediction === 'Melanoma acral') ? 'var(--danger-bg)' : 'var(--success-bg)'
              }}>
                <div style={{
                  color: (result.prediction === 'Melanoma' || result.prediction === 'Melanoma acral') ? 'var(--danger)' : 'var(--success)',
                  fontWeight: 700,
                  fontSize: '1.25rem'
                }}>
                  {result.prediction === 'Melanoma acral' ? 'Melanoma' : result.prediction} {result.confidence != null ? `(${(result.confidence * 100).toFixed(2)}%)` : ''}
                </div>

              </div>

              <div style={{ marginTop: '1.5rem' }}>
                <h3 style={{ marginBottom: '0.25rem', fontSize: '1.1rem' }}>Explicabilidad (Grad-CAM):</h3>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
                  Visualización de las áreas de la imagen que más influyeron en la predicción
                </p>
                <img src={result.grad_cam_image} alt="Grad-CAM" className="preview-img" />
              </div>

              <div style={{ marginTop: '1.5rem' }}>
                <h3 style={{ marginBottom: '0.25rem', fontSize: '1.1rem' }}>Características Detectadas:</h3>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
                  Atributos morfológicos y clínicos identificados en la lesión
                </p>
                <div className="features-grid">
                  {(() => {
                    const entries = Object.entries(result.top_features);
                    const priorityKeys = [
                      'asymmetry_score', 'border_irregularity', 'color_variation', 'diameter',
                      'contrast', 'homogeneity', 'correlation', 'eccentricity', 'compactness'
                    ];
                    
                    return priorityKeys
                      .filter(key => result.top_features[key] != null && typeof result.top_features[key] === 'number')
                      .map(key => {
                        const val = result.top_features[key];
                        return (
                          <div key={key} className="feature-tag">
                            <strong>{traducirFeature(key)}:</strong> {val.toFixed(3)}
                          </div>
                        );
                      });
                  })()}
                </div>

                {/* Sección Expandible para las 16 restantes */}
                <button 
                  className="show-more-btn" 
                  onClick={() => setShowAllFeatures(!showAllFeatures)}
                >
                  {showAllFeatures ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  {showAllFeatures ? 'Ocultar Análisis Avanzado' : 'Ver Análisis Avanzado Detallado (16 métricas más)'}
                </button>

                {showAllFeatures && (
                  <div className="advanced-features-panel fade-in">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', color: 'var(--primary)' }}>
                      <ChevronRight size={16} />
                      <span style={{ fontWeight: 700, fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                        Métricas de Textura y Clínicas
                      </span>
                    </div>
                    <div className="features-grid">
                      {(() => {
                        const priorityKeys = [
                          'asymmetry_score', 'border_irregularity', 'color_variation', 'diameter',
                          'contrast', 'homogeneity', 'correlation', 'eccentricity', 'compactness'
                        ];
                        return Object.entries(result.top_features)
                          .filter(([key]) => !priorityKeys.includes(key))
                          .filter(([, val]) => val != null && typeof val === 'number')
                          .map(([key, val]) => {
                            let displayVal = val.toFixed(3);
                            if (key === 'age') displayVal = Math.round(val);
                            if (key === 'gender') displayVal = val === 0 ? 'Masc.' : 'Fem.';
                            if (key === 'family_history') {
                              const maps = { 0: 'Ninguno', 1: 'Sí', 2: 'Incierto', 3: 'Múltiples' };
                              displayVal = maps[Math.round(val)] || val;
                            }
                            if (key === 'sun_exposure') {
                              const maps = { 0: 'Baja', 1: 'Media', 2: 'Alta', 3: 'Muy alta' };
                              displayVal = maps[Math.round(val)] || val;
                            }
                            
                            return (
                              <div key={key} className="feature-tag" style={{ background: '#fcfcfc', borderStyle: 'dotted' }}>
                                <strong>{traducirFeature(key)}:</strong> {displayVal}
                              </div>
                            );
                          });
                      })()}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

        </div>
      </div>

      <div className="clean-card fade-in">
        <div className="section-title">
          <History size={20} color="var(--accent)" />
          <h2 style={{ fontSize: '1.2rem' }}>Historial de Análisis</h2>
        </div>

        <div className="stats-grid">
          <div className="stat-card" style={{ borderColor: 'var(--border-color)', background: '#f1f5f9' }}>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>TOTAL</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>{stats.total}</div>
          </div>
          <div className="stat-card" style={{ borderColor: 'var(--danger)', background: '#fee2e2' }}>
            <div style={{ fontSize: '0.8rem', color: 'var(--danger)' }}>MELANOMA</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--danger)' }}>{stats.melanoma}</div>
          </div>
          <div className="stat-card" style={{ borderColor: 'var(--success)', background: '#dcfce7' }}>
            <div style={{ fontSize: '0.8rem', color: 'var(--success)' }}>NEVUS</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--success)' }}>{stats.nevus}</div>
          </div>
        </div>

        <div className="history-table-wrapper">
          <table className="history-table">
            <thead>
              <tr>
                <th>Fecha del Diagnóstico</th>
                <th>Imagen</th>
                <th>Predicción</th>
                <th>Confianza</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
            {history.slice(0, 10).map((item) => (
              <tr key={item.id}>
                <td>{item.timestamp}</td>
                <td>{item.image_name}</td>
                <td>
                  <span style={{
                    color: (item.prediction === 'Melanoma' || item.prediction === 'Melanoma acral') ? 'var(--danger)' : 'var(--success)',
                    fontWeight: 600
                  }}>
                    {(item.prediction === 'Melanoma' || item.prediction === 'Melanoma acral') ? '🔴' : '🟢'} {item.prediction === 'Melanoma acral' ? 'Melanoma' : item.prediction}
                  </span>
                </td>
                <td>{(item.confidence * 100).toFixed(1)}%</td>
                <td>
                  <button onClick={() => handleDeleteHistory(item.id)} style={{ color: 'var(--danger)', background: 'none', border: 'none' }}>
                    <Trash2 size={18} />
                  </button>
                </td>
              </tr>
            ))}
            {history.length === 0 && (
              <tr>
                <td colSpan="5" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>
                  No hay análisis previos
                </td>
              </tr>
            )}
          </tbody>
          </table>
        </div>
      </div>

      <footer style={{ marginTop: '2rem', textAlign: 'center', padding: '2rem' }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '0.5rem',
          color: 'var(--text-secondary)',
          backgroundColor: 'var(--bg-card)',
          padding: '1rem',
          borderRadius: '8px',
          fontSize: '0.85rem'
        }}>
          <ShieldCheck size={16} />
          Aviso: Este sistema es una herramienta complementaria y no reemplaza el criterio médico profesional.
        </div>
      </footer>

      {showDeleteModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div style={{ color: 'var(--danger)', marginBottom: '1rem' }}>
              <AlertCircle size={48} style={{ margin: '0 auto' }} />
            </div>
            <h3 style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>¿Eliminar registro?</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
              Esta acción no se puede deshacer. El registro desaparecerá permanentemente de su historial.
            </p>
            <div className="modal-actions">
              <button
                className="cancel-btn"
                onClick={() => setShowDeleteModal(false)}
              >
                Cancelar
              </button>
              <button
                className="confirm-btn"
                onClick={confirmDelete}
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
