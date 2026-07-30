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
  ShieldCheck,
  User,
  X
} from 'lucide-react';

const Dashboard = () => {
  const { user, logout } = useAuth();
  const fileInputRef = useRef(null);
  const dropdownRef = useRef(null);
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
  const [validationErrorData, setValidationErrorData] = useState(null);
  const [showCameraOptions, setShowCameraOptions] = useState(false);
  const [clinicalData, setClinicalData] = useState({
    age: '',
    gender: ''
  });
  const [canClear, setCanClear] = useState(false);
  const [timeLeft, setTimeLeft] = useState(60);
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);

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
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowUserDropdown(false);
      }
    };

    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        setShowUserDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
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

  const generateShortName = (originalName) => {
    const ext = originalName.split('.').pop();
    const now = new Date();
    const time = `${String(now.getHours()).padStart(2, '0')}-${String(now.getMinutes()).padStart(2, '0')}-${String(now.getSeconds()).padStart(2, '0')}`;
    return `img_${time}.${ext}`;
  };

  const truncateFileName = (name, maxLen = 20) => {
    if (name.length <= maxLen) return name;
    const ext = name.split('.').pop();
    const base = name.substring(0, name.length - ext.length - 1);
    const available = maxLen - ext.length - 4; // 4 = '...' + '.'
    return `${base.substring(0, available)}...${ext}`;
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      const shortName = generateShortName(selectedFile.name);
      const newFile = new File([selectedFile], shortName, { type: selectedFile.type });
      setFile(newFile);
      setPreview(URL.createObjectURL(newFile));
      setResult(null);
      setError('');
      setShowCameraOptions(false);
      // Resetear datos clínicos al cambiar imagen
      setClinicalData({ age: '', gender: '' });
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
        const shortName = generateShortName(selectedFile.name);
        const newFile = new File([selectedFile], shortName, { type: selectedFile.type });
        setFile(newFile);
        setPreview(URL.createObjectURL(newFile));
        setResult(null);
        setError('');
        setShowCameraOptions(false);
        // Resetear datos clínicos al cambiar imagen
        setClinicalData({ age: '', gender: '' });
      }
    };
    input.click();
  };

  const handlePredict = async () => {
    if (!file) return;

    // Validar que todos los datos clínicos estén completos
    if (!clinicalData.age || !clinicalData.gender) {
      const msg = 'Por favor, complete todos los datos clínicos del paciente (Edad y Sexo) antes de analizar la imagen.';
      setError(msg);
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
      const detail = err.response?.data?.detail;
      const statusCode = err.response?.status;

      // Error 500 o errores de red/servidor → Solo Toast (estado del sistema)
      if (statusCode === 500 || !err.response) {
        toast.error('Interrupción del servicio: Tiempo de espera agotado al conectar con el servidor.');
        setError(''); // No mostrar alerta estática
      }
      // Error 422 (imagen no dermatoscópica) → Solo Alerta estática (accionable)
      else if (statusCode === 422 && detail?.error === 'imagen_no_dermatoscopica') {
        setValidationErrorData(detail);
        setError(detail.message);
        // No mostrar toast
      }
      // Error 400 u otros errores de validación → Solo Alerta estática (accionable)
      else if (statusCode === 400 || statusCode === 422) {
        const msg = detail?.message || detail || 'No fue posible analizar la imagen. Por favor, verifique que la captura tenga buena iluminación y vuelva a intentarlo.';
        setError(msg);
        // No mostrar toast
      }
      // Otros errores → Toast genérico
      else {
        toast.error('Error de conexión: No se pudo establecer comunicación con el motor de análisis.');
        setError('');
      }
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
      toast.success('Registro eliminado correctamente.');
    } catch (err) {
      toast.error('Error de conexión: No se pudo eliminar el registro del historial.');
      setShowDeleteModal(false);
    }
  };

  const handleClear = () => {
    setFile(null);
    setPreview(null);
    setResult(null);
    setShowAllFeatures(false);
    setError('');
    setClinicalData({ age: '', gender: '' });
    setCanClear(false);
    setTimeLeft(60);
  };

  const handleRemoveFile = () => {
    setFile(null);
    setPreview(null);
    setResult(null);
    setShowAllFeatures(false);
    setError('');
    setClinicalData({ age: '', gender: '' });
    setCanClear(false);
    setTimeLeft(60);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const toggleUserDropdown = () => {
    setShowUserDropdown(!showUserDropdown);
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
                Plataforma de Detección Acral
              </h1>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginTop: '0.2rem' }}>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', margin: 0 }}>
                  Herramienta de Evaluación Asistida
                </p>
                <div className="header-status">
                  <div className="status-dot"></div>
                  CONECTADO
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="header-actions" ref={dropdownRef}>

          <div
            className="user-profile"
            onClick={toggleUserDropdown}
            style={{ cursor: 'pointer' }}
          >
            <div className="user-avatar" style={{
              border: '2px solid white',
              boxShadow: '0 0 0 2px var(--primary-light)'
            }}>
              {getInitials(user.name)}
            </div>
            <div className="user-details">
              <span style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                {user.name}
                <ChevronDown size={14} style={{ transition: 'transform 0.2s', transform: showUserDropdown ? 'rotate(180deg)' : 'rotate(0deg)' }} />
              </span>
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

          {showUserDropdown && (
            <div className="user-dropdown">
              <div className="dropdown-item" onClick={() => { setShowUserDropdown(false); setShowProfileModal(true); }}>
                <Settings size={16} />
                <span>Acerca de</span>
              </div>
              <div className="dropdown-item dropdown-item-danger" onClick={() => { logout(); setShowUserDropdown(false); }}>
                <LogOut size={16} />
                <span>Cerrar sesión</span>
              </div>
            </div>
          )}
        </div>
      </header>

      <div className="info-bar fade-in">
        <Info color="var(--primary)" />
        <div>
          <div style={{ fontWeight: 600 }}>Sistema de Análisis Dermatoscópico</div>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
            Cargue la imagen de la lesión del paciente, ya sea desde sus archivos locales o captura directa. Para iniciar la evaluación diagnóstica, por favor complete previamente los datos clínicos requeridos.
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
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', width: '100%', justifyContent: 'center', overflow: 'hidden' }}>
                <CheckCircle2 size={24} color="var(--success)" style={{ flexShrink: 0 }} />
                <div style={{ textAlign: 'left', overflow: 'hidden', minWidth: 0 }}>
                  <p style={{ fontWeight: 600, fontSize: '0.9rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '100%' }}>{truncateFileName(file.name)}</p>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Click para cambiar imagen</p>
                </div>
              </div>
            )}
          </div>

          {preview && (
            <div style={{ marginTop: '1.5rem', position: 'relative' }}>
              <button
                onClick={handleRemoveFile}
                className="remove-preview-btn"
                title="Eliminar imagen"
              >
                <X size={16} />
              </button>
              <img src={preview} alt="Vista previa" className="preview-img" />

              {/* Panel de datos clínicos */}
              {!result && (
                <div className="clinical-panel">
                  <div className="clinical-header-static">
                    <div className="clinical-header-left">
                      <span>🩺</span>
                      <span>Datos Clínicos del Paciente</span>
                      <span className={`badge-optional ${Object.values(clinicalData).some(v => v !== '') ? 'badge-filled' : ''
                        }`}>
                        {Object.values(clinicalData).filter(v => v !== '').length > 0
                          ? `${Object.values(clinicalData).filter(v => v !== '').length}/2 ingresados`
                          : 'Obligatorio'}
                      </span>
                    </div>
                  </div>

                  <div className="clinical-body">
                    <div className="clinical-field">
                      <label htmlFor="patient-age">Edad *</label>
                      <div className="age-input-wrapper">
                        <input
                          id="patient-age"
                          type="number"
                          min="10" max="80"
                          placeholder="Ej. 45"
                          value={clinicalData.age}
                          onChange={e => setClinicalData(p => ({ ...p, age: e.target.value }))}
                        />
                        <span className="age-suffix">años</span>
                      </div>
                    </div>

                    <div className="clinical-field">
                      <label>Sexo biológico *</label>
                      <div className="gender-segmented-control">
                        <button
                          type="button"
                          onClick={() => setClinicalData(p => ({ ...p, gender: '0' }))}
                          className={`gender-option ${clinicalData.gender === '0' ? 'gender-option-active' : ''}`}
                        >
                          Masculino
                        </button>
                        <button
                          type="button"
                          onClick={() => setClinicalData(p => ({ ...p, gender: '1' }))}
                          className={`gender-option ${clinicalData.gender === '1' ? 'gender-option-active' : ''}`}
                        >
                          Femenino
                        </button>
                      </div>
                    </div>
                  </div>
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
                  {validationErrorData ? 'Evaluación Detenida' : 'Análisis Incompleto'}
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
              <ImageIcon size={64} color="#f1f5f9" style={{ marginBottom: '0.85rem' }} />
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
              <p>Procesando análisis, un momento...</p>
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
                <tr className="empty-history-row">
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

      {showProfileModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '500px' }}>
            <h3 style={{ fontSize: '1.5rem', marginBottom: '1.5rem', textAlign: 'center' }}>Acerca de</h3>

            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem', padding: '1rem', background: '#f8fafc', borderRadius: '12px' }}>
              <div className="user-avatar" style={{
                width: '56px',
                height: '56px',
                fontSize: '1.3rem',
                border: '3px solid white',
                boxShadow: '0 0 0 3px var(--primary-light)'
              }}>
                {getInitials(user.name)}
              </div>
              <div>
                <h4 style={{ fontSize: '1.1rem', marginBottom: '0.25rem', margin: 0 }}>{user.name}</h4>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', margin: 0 }}>@{user.username}</p>
              </div>
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '8px', textAlign: 'center' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>Rol</div>
                  <div style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--primary)' }}>Especialista</div>
                </div>
                <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '8px', textAlign: 'center' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>Análisis realizados</div>
                  <div style={{ fontSize: '0.95rem', fontWeight: 600 }}>{history.length}</div>
                </div>
              </div>
            </div>

            <div style={{ padding: '1.25rem', background: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)', borderRadius: '12px', marginBottom: '1.5rem', border: '1px solid #bae6fd' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
                <ShieldCheck size={20} style={{ color: '#0284c7', flexShrink: 0, marginTop: '0.1rem' }} />
                <div>
                  <div style={{ fontSize: '0.9rem', fontWeight: 600, color: '#0369a1', marginBottom: '0.5rem' }}>Desarrollador</div>
                  <div style={{ fontSize: '0.85rem', color: '#0c4a6e', lineHeight: '1.6' }}>
                    Ramos Ortiz Jhon Franklin<br />
                    Bachiller en Ingeniería de Sistemas<br />
                    Universidad Señor de Sipán
                  </div>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1.5rem' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', background: '#e2e8f0', padding: '0.35rem 1rem', borderRadius: '6px', fontFamily: 'monospace' }}>
                PDA V1.0
              </span>
            </div>

            <div className="modal-actions">
              <button
                className="cancel-btn"
                onClick={() => setShowProfileModal(false)}
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
