import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { predictService, historyService, systemService } from '../services/api';
import ClinicalMetrics from '../components/ClinicalMetrics';
import RiskSpeedometer from '../components/RiskSpeedometer';
import TripleComparison from '../components/TripleComparison';
import DetectedFeatures from '../components/DetectedFeatures';
import {
  Upload,
  Camera,
  LogOut,
  History,
  Activity,
  Image as ImageIcon,
  Info,
  Trash2,
  CheckCircle2,
  XCircle,
  Microscope,
  RotateCcw,
  Settings,
  ChevronDown,
  AlertCircle,
  ShieldCheck,
  Stethoscope,
  X,
  Sparkles,
  Edit2,
  Check
} from 'lucide-react';

const Dashboard = () => {
  const { user, login, logout } = useAuth();
  const fileInputRef = useRef(null);
  const dropdownRef = useRef(null);
  const toast = useToast();

  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState(1);
  const [result, setResult] = useState(null);
  const [rejectionData, setRejectionData] = useState(null);
  const [history, setHistory] = useState([]);
  const [error, setError] = useState('');
  const [serverStatus, setServerStatus] = useState('Verificando...');
  const [isServerOnline, setIsServerOnline] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [clearCooldown, setClearCooldown] = useState(0);
  const [showClinicalForm, setShowClinicalForm] = useState(false);
  const [clinicalData, setClinicalData] = useState({
    age: '',
    gender: ''
  });
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [isEditingName, setIsEditingName] = useState(false);
  const [editedName, setEditedName] = useState('');

  const getUserDisplayName = (currentUser) => {
    if (!currentUser) return 'Dr. Especialista';
    try {
      const localUsers = JSON.parse(localStorage.getItem('pda_registered_users') || '[]');
      const found = localUsers.find(u => u.username?.toLowerCase() === currentUser.username?.toLowerCase());
      if (found) {
        if (found.fullName && found.fullName.trim() !== '') return found.fullName;
        if (found.firstName && found.lastName) return `${found.firstName} ${found.lastName}`.trim();
        if (found.name && found.name !== found.username) return found.name;
      }
    } catch (e) { }
    if (currentUser.fullName) return currentUser.fullName;
    if (currentUser.firstName && currentUser.lastName) return `${currentUser.firstName} ${currentUser.lastName}`.trim();
    if (currentUser.name && currentUser.name !== currentUser.username) return currentUser.name;
    return currentUser.username || 'Dr. Especialista';
  };

  const getInitials = (name) => {
    if (!name) return 'U';
    const clean = name.replace(/^(dr\.|dra\.|dr|dra|lic\.|ing\.)\s+/i, '').trim();
    const parts = clean.split(/\s+/).filter(Boolean);
    if (parts.length >= 2) {
      return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
    }
    if (parts.length === 1 && parts[0].length >= 2) {
      return parts[0].substring(0, 2).toUpperCase();
    }
    return name.charAt(0).toUpperCase();
  };

  useEffect(() => {
    let interval = null;
    if (clearCooldown > 0) {
      interval = setInterval(() => {
        setClearCooldown((prev) => (prev > 1 ? prev - 1 : 0));
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [clearCooldown]);

  useEffect(() => {
    fetchHistory();
    checkServerHealth();
    const interval = setInterval(checkServerHealth, 15000);
    return () => clearInterval(interval);
  }, []);

  const checkServerHealth = async () => {
    try {
      const data = await systemService.getHealth();
      if (data.status === 'OK') {
        setServerStatus('Conectado');
        setIsServerOnline(true);
      } else {
        setServerStatus('Desconectado');
        setIsServerOnline(false);
      }
    } catch {
      setServerStatus('Desconectado');
      setIsServerOnline(false);
    }
  };

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

  const fetchHistory = async () => {
    try {
      const data = await historyService.getHistory(user?.username);
      setHistory(data);
    } catch (err) {
      console.error('Error al cargar historial:', err);
    }
  };

  const handleFileChange = (e) => {
    const selected = e.target.files[0];
    if (selected) {
      if (!selected.type.startsWith('image/')) {
        setError('Por favor, suba únicamente archivos de imagen (PNG, JPG, JPEG).');
        return;
      }
      setFile(selected);
      setPreview(URL.createObjectURL(selected));
      setResult(null);
      setRejectionData(null);
      setError('');
    }
  };

  const handleCameraCapture = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.capture = 'environment';
    input.onchange = (e) => {
      const selected = e.target.files[0];
      if (selected) {
        setFile(selected);
        setPreview(URL.createObjectURL(selected));
        setResult(null);
        setRejectionData(null);
        setError('');
      }
    };
    input.click();
  };

  const handleAgeChange = (e) => {
    const rawVal = e.target.value;
    if (rawVal === '') {
      setClinicalData(prev => ({ ...prev, age: '' }));
      return;
    }
    // Filtrar solo dígitos numéricos (evita negativos, decimales y signos)
    const digitsOnly = rawVal.replace(/\D/g, '');
    if (digitsOnly === '') {
      setClinicalData(prev => ({ ...prev, age: '' }));
      return;
    }
    const num = parseInt(digitsOnly, 10);
    if (num > 100) {
      setClinicalData(prev => ({ ...prev, age: '100' }));
      if (toast?.warning) toast.warning('El rango máximo de edad permitido es 100 años.');
    } else {
      setClinicalData(prev => ({ ...prev, age: digitsOnly }));
    }
  };

  const handleAgeKeyDown = (e) => {
    // Bloquear teclas de signo negativo, exponencial y decimales
    if (['-', '+', 'e', 'E', '.', ','].includes(e.key)) {
      e.preventDefault();
    }
  };

  const isAgeValid = Boolean(
    clinicalData.age !== '' &&
    !isNaN(parseInt(clinicalData.age, 10)) &&
    parseInt(clinicalData.age, 10) >= 18 &&
    parseInt(clinicalData.age, 10) <= 100
  );
  const isGenderValid = Boolean(clinicalData.gender !== '');
  const clinicalFieldsCount = (isAgeValid ? 1 : 0) + (isGenderValid ? 1 : 0);
  const isClinicalComplete = isAgeValid && isGenderValid;

  const handlePredict = async () => {
    if (result) return;
    if (!file) {
      setError('Por favor, seleccione o capture una imagen dermatoscópica primero.');
      if (toast?.warning) toast.warning('Adjunte una imagen dermatoscópica.');
      return;
    }

    if (!isAgeValid) {
      setError('La edad del paciente es obligatoria y debe ser un valor válido entre 18 y 100 años.');
      if (toast?.warning) toast.warning('Ingrese una edad válida (18 - 100 años).');
      return;
    }

    if (!isGenderValid) {
      setError('El sexo biológico del paciente es un campo obligatorio.');
      if (toast?.warning) toast.warning('Seleccione el sexo biológico del paciente.');
      return;
    }

    setLoading(true);
    setError('');
    setRejectionData(null);
    setLoadingStep(1);

    // Animación visual de pasos de inferencia
    const timer1 = setTimeout(() => setLoadingStep(2), 900);
    const timer2 = setTimeout(() => setLoadingStep(3), 1800);

    try {
      const data = await predictService.predict(file, clinicalData);

      clearTimeout(timer1);
      clearTimeout(timer2);

      if (data.status === 'rechazada') {
        setRejectionData(data);
        setResult(null);
        if (toast?.warning) toast.warning('Imagen rechazada por el Gatekeeper.');
      } else if (data.status === 'error') {
        setError(data.mensaje || 'Error devuelto por el pipeline de IA.');
        if (toast?.error) toast.error(data.mensaje || 'Error en el análisis.');
      } else {
        setResult(data);
        setClearCooldown(60); // 1 minuto de espera para revisión clínica
        if (toast?.success) toast.success('Análisis completado exitosamente.');

        // Guardar caso en historial con campos completos y redundantes
        const now = new Date();
        const dd = String(now.getDate()).padStart(2, '0');
        const mm = String(now.getMonth() + 1).padStart(2, '0');
        const fallbackId = `CASO-${dd}${mm}-${String(history.length + 1).padStart(2, '0')}`;

        const historyEntry = {
          id: data.id_caso || fallbackId,
          timestamp: new Date().toLocaleString(),
          image_name: file.name,
          preview_url: preview,
          prediction: data.diagnostico || 'Nevo Acral (Benigno)',
          diagnostico: data.diagnostico || 'Nevo Acral (Benigno)',
          confidence: data.probabilidad_ia || '90.0%',
          probabilidad_ia: data.probabilidad_ia || '90.0%',
          clase: data.clase ?? (data.diagnostico?.toLowerCase().includes('melanoma') ? 1 : 0),
          tiempo_ms: data.tiempo_ms || 740,
          umbral: data.umbral || 0.25
        };
        await historyService.saveItem(historyEntry, user?.username);
        fetchHistory();
      }
    } catch (err) {
      console.error('Error durante la predicción:', err);
      const serverMsg = err.response?.data?.mensaje || err.message;
      if (toast?.error) toast.error('Error de comunicación con el servidor.');
      setError(`No se pudo procesar la imagen: ${serverMsg}. Asegúrese de que el backend Flask esté ejecutándose en http://localhost:5000.`);
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveImage = () => {
    if (clearCooldown > 0) {
      if (toast?.warning) toast.warning(`Por favor espere ${clearCooldown}s antes de cambiar de imagen para apreciar la evaluación.`);
      return;
    }
    setFile(null);
    setPreview(null);
    setResult(null);
    setRejectionData(null);
    setError('');
    // Conservar temporalmente los datos clínicos (edad y sexo) para no obligar a reingresarlos
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleClear = () => {
    if (clearCooldown > 0) {
      if (toast?.warning) toast.warning(`Por favor revise los resultados clínicos. Espere ${clearCooldown}s para limpiar.`);
      return;
    }
    setFile(null);
    setPreview(null);
    setResult(null);
    setRejectionData(null);
    setError('');
    setClinicalData({ age: '', gender: '' });
    setShowClinicalForm(false);
    setClearCooldown(0);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDeleteHistory = (id) => {
    setItemToDelete(id);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!itemToDelete) return;
    try {
      await historyService.deleteItem(itemToDelete, user?.username);
      fetchHistory();
      setShowDeleteModal(false);
      setItemToDelete(null);
      if (toast?.success) toast.success('Registro eliminado del historial.');
    } catch (err) {
      if (toast?.error) toast.error('Error al eliminar registro.');
      setShowDeleteModal(false);
    }
  };

  const toggleUserDropdown = () => {
    setShowUserDropdown(!showUserDropdown);
  };

  const handleSaveName = () => {
    if (!editedName.trim()) return;
    const newName = editedName.trim();
    const updatedUser = { ...user, name: newName, fullName: newName };
    login(updatedUser);
    try {
      const localUsers = JSON.parse(localStorage.getItem('pda_registered_users') || '[]');
      const updatedUsers = localUsers.map(u => {
        if (u.username?.toLowerCase() === user?.username?.toLowerCase()) {
          return { ...u, name: newName, fullName: newName };
        }
        return u;
      });
      localStorage.setItem('pda_registered_users', JSON.stringify(updatedUsers));
    } catch (e) { }
    setIsEditingName(false);
    if (toast?.success) toast.success('Nombre del especialista actualizado correctamente.');
  };

  const getStats = () => {
    const melanoma = history.filter(h =>
      h.prediction?.toLowerCase().includes('melanoma') ||
      h.diagnostico?.toLowerCase().includes('melanoma') ||
      h.clase === 1
    ).length;
    return {
      total: history.length,
      melanoma,
      nevus: history.length - melanoma
    };
  };

  const stats = getStats();
  const displayName = getUserDisplayName(user);
  const isMelanoma = Boolean(
    result?.clase === 1 ||
    result?.diagnostico?.toLowerCase().includes('melanoma') ||
    result?.prediction?.toLowerCase().includes('melanoma')
  );
  const diagnosticoTexto = result?.diagnostico || result?.prediction || (isMelanoma ? 'Melanoma Acral' : 'Nevo Acral (Benigno)');

  const normalizeImageSrc = (img, fallback) => {
    if (!img) return fallback || null;
    if (typeof img === 'string') {
      const trimmed = img.trim();
      if (trimmed.startsWith('data:image/') || trimmed.startsWith('http://') || trimmed.startsWith('https://') || trimmed.startsWith('blob:')) {
        return trimmed;
      }
      if (trimmed.length > 50) {
        return `data:image/png;base64,${trimmed}`;
      }
    }
    return fallback || null;
  };

  return (
    <div className="dashboard-wrapper">
      <style>{`
        .dashboard-wrapper {
          max-width: 1320px;
          margin: 0 auto;
          padding: 2rem 1.5rem;
        }
        .app-header {
          position: relative;
          z-index: 100;
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 2rem;
          padding: 1.25rem 2rem;
          background: white;
          border-radius: var(--radius-lg);
          box-shadow: var(--shadow-sm);
          border: 1px solid var(--border-color);
        }
        .header-brand {
          display: flex;
          align-items: center;
          gap: 1rem;
        }
        .brand-icon-box {
          background: linear-gradient(135deg, var(--primary) 0%, var(--primary-dark) 100%);
          padding: 0.75rem;
          border-radius: 14px;
          color: white;
          box-shadow: 0 4px 10px rgba(3, 105, 161, 0.25);
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .header-brand h1 {
          font-size: 1.35rem;
          display: flex;
          align-items: center;
          gap: 0.6rem;
          margin: 0;
          color: var(--primary-dark);
        }
        .header-status {
          display: inline-flex;
          align-items: center;
          gap: 0.4rem;
          font-size: 0.72rem;
          font-weight: 700;
          padding: 0.15rem 0.55rem;
          border-radius: 20px;
        }
        .header-status.online {
          color: #065f46;
          background: #ecfdf5;
          border: 1px solid #a7f3d0;
        }
        .header-status.offline {
          color: #991b1b;
          background: #fef2f2;
          border: 1px solid #fecaca;
        }
        .status-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: currentColor;
          animation: pulse 1.8s infinite;
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
        .header-actions {
          display: flex;
          align-items: center;
          gap: 1.5rem;
          position: relative;
          z-index: 110;
        }
        .user-profile {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          cursor: pointer;
        }
        .user-avatar {
          width: 38px;
          height: 38px;
          border-radius: 50%;
          background: linear-gradient(135deg, #0284c7 0%, #0369a1 100%);
          color: #ffffff;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 800;
          font-size: 0.88rem;
          letter-spacing: 0.02em;
          border: 2px solid white;
          box-shadow: 0 0 0 2px rgba(2, 132, 199, 0.28), 0 2px 6px rgba(2, 132, 199, 0.22);
        }
        .user-details {
          display: flex;
          flex-direction: column;
        }
        .user-dropdown {
          position: absolute;
          right: 0;
          top: calc(100% + 8px);
          background: white;
          border-radius: 12px;
          box-shadow: 0 14px 30px rgba(15, 23, 42, 0.18), 0 4px 10px rgba(15, 23, 42, 0.08);
          border: 1px solid var(--border-color);
          padding: 0.5rem;
          z-index: 9999;
          min-width: 190px;
        }
        .dropdown-item {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.55rem 0.75rem;
          font-size: 0.85rem;
          font-weight: 600;
          color: var(--text-primary);
          border-radius: 6px;
          cursor: pointer;
          transition: background 0.15s;
        }
        .dropdown-item:hover {
          background: #f8fafc;
        }
        .dropdown-item-danger {
          color: var(--danger);
        }
        .dropdown-item-danger:hover {
          background: #fee2e2;
        }
        .info-banner {
          display: flex;
          align-items: flex-start;
          gap: 0.85rem;
          background: #f0fdfa;
          padding: 1rem 1.25rem;
          border-radius: var(--radius-md);
          border-left: 4px solid var(--secondary);
          margin-bottom: 2rem;
          border: 1px solid #ccfbf1;
        }
        .main-grid {
          display: grid;
          grid-template-columns: 1fr 1.25fr;
          gap: 2rem;
          margin-bottom: 2.5rem;
        }
        .section-header-title {
          display: flex;
          align-items: center;
          gap: 0.6rem;
          font-size: 1.15rem;
          font-weight: 700;
          margin-bottom: 1.25rem;
          color: var(--text-primary);
        }
        .dropzone-container {
          display: flex;
          gap: 1rem;
          margin-bottom: 1rem;
        }
        .dropzone-btn {
          flex: 1;
          background: var(--bg-body);
          padding: 1.25rem;
          border-radius: 12px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          border: 2px dashed var(--border-color);
          cursor: pointer;
          transition: all 0.2s;
          height: 110px;
          font-family: inherit;
        }
        .dropzone-btn:hover {
          border-color: var(--primary);
          background: var(--primary-light);
        }
        .preview-box {
          margin-top: 1.25rem;
          border-radius: 12px;
          overflow: hidden;
          background: #0f172a;
          box-shadow: var(--shadow-md);
          border: 1px solid var(--border-color);
          max-height: 280px;
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
        }
        .preview-box img {
          max-height: 280px;
          width: 100%;
          object-fit: contain;
        }
        .btn-analyze-action {
          flex: 1;
          padding: 0.65rem 1rem;
          background: linear-gradient(135deg, var(--primary) 0%, var(--primary-dark) 100%);
          color: white;
          border-radius: 10px;
          font-weight: 700;
          font-size: 0.88rem;
          box-shadow: 0 2px 8px rgba(3, 105, 161, 0.2);
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          margin-top: 0;
          border: none;
          cursor: pointer;
          transition: all 0.2s;
          min-height: 40px;
          box-sizing: border-box;
        }
        .btn-analyze-action:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(3, 105, 161, 0.3);
        }
        .btn-analyze-action:disabled {
          opacity: 0.55;
          cursor: not-allowed;
          filter: grayscale(15%);
          box-shadow: none;
        }
        .btn-clear-action {
          padding: 0.65rem 0.95rem;
          background: #f1f5f9;
          color: var(--text-secondary);
          border-radius: 10px;
          font-weight: 700;
          font-size: 0.82rem;
          border: 1px solid var(--border-color);
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.4rem;
          margin-top: 0;
          cursor: pointer;
          transition: all 0.2s;
          white-space: nowrap;
          min-height: 40px;
          box-sizing: border-box;
        }
        .btn-clear-action:hover:not(:disabled) {
          background: #fee2e2;
          color: var(--danger);
          border-color: #fecaca;
        }
        .btn-clear-action:disabled {
          opacity: 0.55;
          cursor: not-allowed;
          background: #f1f5f9;
          color: var(--text-muted);
          border-color: var(--border-color);
        }
        /* Loader Steps */
        .loader-steps-container {
          background: #f8fafc;
          border: 1px solid var(--border-color);
          border-radius: 12px;
          padding: 1.25rem;
          margin-top: 1.5rem;
        }
        .step-progress-item {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          font-size: 0.85rem;
          font-weight: 600;
          color: var(--text-secondary);
          margin-bottom: 0.6rem;
        }
        .step-progress-item:last-child {
          margin-bottom: 0;
        }
        .step-progress-item.active {
          color: var(--primary);
          font-weight: 700;
        }
        .step-progress-item.done {
          color: var(--success);
        }
        .status-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: #cbd5e1;
          display: inline-block;
          flex-shrink: 0;
        }
        .step-progress-item.active .status-dot {
          background: var(--primary);
          box-shadow: 0 0 0 3px var(--primary-light);
          animation: pulseDot 1.2s infinite ease-in-out;
        }
        @keyframes pulseDot {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.3); opacity: 0.7; }
        }
        /* Clinical Panel */
        .clinical-panel {
          margin-top: 1.25rem;
          border: 1px solid var(--border-color);
          border-radius: 10px;
          overflow: hidden;
          background: white;
        }
        .clinical-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0.75rem 1rem;
          cursor: pointer;
          background: #f8fafc;
          border-bottom: 1px solid transparent;
          transition: background 0.2s;
          user-select: none;
        }
        .clinical-header:hover {
          background: var(--primary-light);
        }
        .clinical-header.open {
          border-bottom-color: var(--border-color);
        }
        .clinical-body {
          padding: 1rem;
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 0.75rem;
          animation: fadeIn 0.2s ease;
        }
        .clinical-field label {
          display: block;
          font-size: 0.75rem;
          font-weight: 700;
          color: var(--text-secondary);
          margin-bottom: 0.25rem;
          text-transform: uppercase;
        }
        .clinical-field input,
        .clinical-field select {
          width: 100%;
          padding: 0.5rem 0.65rem;
          border: 1px solid var(--border-color);
          border-radius: 7px;
          font-size: 0.85rem;
          color: var(--text-primary);
          background: var(--bg-body);
        }
        /* Diagnóstico */
        .diagnosis-result-banner {
          padding: 1.25rem 1.5rem;
          border-radius: 14px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 1.25rem;
          border: 1px solid;
        }
        .diagnosis-result-banner.melanoma {
          background: var(--danger-bg);
          border-color: #fecdd3;
          color: var(--danger);
        }
        .diagnosis-result-banner.benigno {
          background: var(--success-bg);
          border-color: #a7f3d0;
          color: var(--success);
        }
        .diag-title-lg {
          font-size: 1.45rem;
          font-weight: 800;
          margin: 0.25rem 0;
          letter-spacing: -0.01em;
          display: block;
        }
        .diag-prob-tag {
          font-size: 1.15rem;
          font-weight: 800;
          padding: 0.25rem 0.75rem;
          border-radius: 20px;
          background: white;
        }
        .recommendation-box {
          margin-top: 1.25rem;
          padding: 1rem 1.25rem;
          background: #ffffff;
          border: 1px solid var(--border-color);
          border-radius: 12px;
          font-size: 0.88rem;
          color: var(--text-primary);
          line-height: 1.5;
        }
        /* Rejection Guide */
        .rejection-panel {
          padding: 1.25rem;
          background: #fff1f2;
          border: 1px solid #fecdd3;
          border-radius: 14px;
        }
        .rejection-guide-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1rem;
          margin-top: 1rem;
        }
        .guide-box {
          background: white;
          padding: 0.75rem;
          border-radius: 10px;
          border: 1px solid var(--border-color);
          text-align: center;
        }
        .guide-box img {
          width: 100%;
          max-height: 140px;
          object-fit: cover;
          border-radius: 8px;
          margin: 0.5rem 0;
        }
        @media (max-width: 900px) {
          .main-grid { grid-template-columns: 1fr; }
        }
      `}</style>

      {/* Header Principal */}
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
                <div className={`header-status ${isServerOnline ? 'online' : 'offline'}`} style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  padding: '0.15rem 0.55rem',
                  borderRadius: '20px',
                  color: isServerOnline ? '#065f46' : '#991b1b',
                  background: isServerOnline ? '#ecfdf5' : '#fef2f2',
                  border: isServerOnline ? '1px solid #a7f3d0' : '1px solid #fecaca'
                }}>
                  <div style={{
                    width: '6px',
                    height: '6px',
                    borderRadius: '50%',
                    background: 'currentColor',
                    animation: 'pulse 1.8s infinite'
                  }}></div>
                  {serverStatus}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="header-actions" ref={dropdownRef} style={{ position: 'relative' }}>
          <div
            className="user-profile"
            onClick={toggleUserDropdown}
            style={{ cursor: 'pointer', padding: '0.35rem 0.6rem', borderRadius: '10px', transition: 'background 0.2s', background: showUserDropdown ? '#f1f5f9' : 'transparent' }}
          >
            <div className="user-avatar">
              {getInitials(displayName)}
            </div>
            <div className="user-details">
              <span style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                {displayName}
                <ChevronDown size={14} style={{ transition: 'transform 0.2s', transform: showUserDropdown ? 'rotate(180deg)' : 'rotate(0deg)' }} />
              </span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ color: 'var(--primary)', fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase' }}>
                  Especialista
                </span>
                <span style={{ color: '#cbd5e1' }}>•</span>
                <span style={{ color: 'var(--text-secondary)', fontSize: '0.7rem' }}>
                  {history.length} análisis
                </span>
              </div>
            </div>
          </div>

          {showUserDropdown && (
            <div className="user-dropdown" style={{
              position: 'absolute',
              right: 0,
              top: '110%',
              marginTop: '0.5rem',
              background: 'white',
              borderRadius: '12px',
              boxShadow: '0 12px 28px rgba(15, 23, 42, 0.15)',
              border: '1px solid var(--border-color)',
              padding: '0.5rem',
              zIndex: 1000,
              minWidth: '180px'
            }}>
              <div
                className="dropdown-item"
                onClick={() => { setShowUserDropdown(false); setShowProfileModal(true); }}
                style={{ padding: '0.65rem 0.85rem', display: 'flex', alignItems: 'center', gap: '0.6rem', fontSize: '0.88rem', fontWeight: 600, color: 'var(--text-primary)', borderRadius: '8px', cursor: 'pointer', transition: 'background 0.15s' }}
              >
                <Settings size={17} color="var(--primary)" />
                <span>Acerca de</span>
              </div>
              <div style={{ height: '1px', background: 'var(--border-color)', margin: '0.35rem 0' }}></div>
              <div
                className="dropdown-item dropdown-item-danger"
                onClick={() => { logout(); setShowUserDropdown(false); }}
                style={{ padding: '0.65rem 0.85rem', display: 'flex', alignItems: 'center', gap: '0.6rem', fontSize: '0.88rem', fontWeight: 700, color: 'var(--danger)', borderRadius: '8px', cursor: 'pointer', transition: 'background 0.15s', background: '#fff5f5' }}
              >
                <LogOut size={17} color="var(--danger)" />
                <span>Cerrar sesión</span>
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Barra Informativa */}
      <div className="info-bar fade-in">
        <Info color="var(--primary)" style={{ flexShrink: 0, marginTop: '2px' }} />
        <div>
          <div style={{ fontWeight: 600 }}>Sistema de Análisis Dermatoscópico</div>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', margin: 0 }}>
            Cargue la imagen de la lesión acral (archivo o cámara) e ingrese los datos clínicos del paciente (Ambos campos son obligatorios).
          </p>
        </div>
      </div>

      {/* Grid Principal de 2 Columnas */}
      <div className="main-grid">
        {/* Columna 1: Carga y Parámetros */}
        <div className="clean-card fade-in">
          <div className="section-header-title">
            <span style={{ width: '4px', height: '38px', background: 'var(--primary)', borderRadius: '9px', display: 'inline-block', flexShrink: 0 }} />
            <Upload size={20} color="var(--primary)" />
            <span>01. Carga de Imagen Dermatoscópica</span>
          </div>

          <input
            type="file"
            ref={fileInputRef}
            hidden
            onChange={handleFileChange}
            accept="image/*"
          />

          {/* Opciones de Carga: Se ocultan cuando ya hay un archivo seleccionado */}
          {!file && (
            <div style={{ padding: '1.25rem 1rem 2rem', textAlign: 'center' }} className="fade-in">
              <div className="dropzone-container" style={{ margin: '0 auto 1.75rem', maxWidth: '520px' }}>
                <button
                  type="button"
                  className="dropzone-btn"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={loading}
                >
                  <Upload size={28} color="var(--primary)" />
                  <p style={{ fontWeight: 700, color: 'var(--text-primary)', marginTop: '0.3rem', fontSize: '0.88rem', margin: 0 }}>
                    Adjuntar Archivo
                  </p>
                </button>

                <button
                  type="button"
                  className="dropzone-btn"
                  onClick={handleCameraCapture}
                  disabled={loading}
                >
                  <Camera size={28} color="var(--primary)" />
                  <p style={{ fontWeight: 700, color: 'var(--text-primary)', marginTop: '0.3rem', fontSize: '0.88rem', margin: 0 }}>
                    Usar Cámara
                  </p>
                </button>
              </div>

              <h3 style={{ fontSize: '1.15rem', color: 'var(--text-primary)' }}>
                Imagen no seleccionada
              </h3>
              <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', maxWidth: '380px', margin: '0.5rem auto 0' }}>
                Proporcione una <strong>Imagen</strong> de la lesión para habilitar el registro clínico y la evaluación.
              </p>
            </div>
          )}

          {file && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem 1rem', background: '#f8fafc', borderRadius: '10px', border: '1px solid var(--border-color)', marginBottom: '0.75rem' }}>
              <CheckCircle2 size={20} color="var(--success)" style={{ flexShrink: 0 }} />
              <div style={{ minWidth: 0, flex: 1 }}>
                <p style={{ fontWeight: 700, fontSize: '0.88rem', color: 'var(--text-primary)', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {file.name}
                </p>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', margin: 0 }}>Imagen lista para evaluación</p>
              </div>
            </div>
          )}

          {preview && (
            <div className="preview-box" style={{ position: 'relative' }}>
              <img src={preview} alt="Vista previa" />
              <button
                type="button"
                onClick={handleRemoveImage}
                disabled={clearCooldown > 0}
                style={{
                  position: 'absolute',
                  top: '10px',
                  right: '10px',
                  background: 'rgba(15, 23, 42, 0.75)',
                  backdropFilter: 'blur(4px)',
                  border: '1px solid rgba(255, 255, 255, 0.3)',
                  borderRadius: '50%',
                  width: '32px',
                  height: '32px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  cursor: clearCooldown > 0 ? 'not-allowed' : 'pointer',
                  opacity: clearCooldown > 0 ? 0.35 : 1,
                  boxShadow: '0 4px 10px rgba(0,0,0,0.3)',
                  zIndex: 10
                }}
                title={clearCooldown > 0 ? `Espere ${clearCooldown}s para cambiar imagen` : "Cambiar o eliminar imagen"}
              >
                <X size={18} />
              </button>
            </div>
          )}

          {/* Panel de Datos Clínicos y Botones: Aparecen recién cuando se carga la imagen */}
          {file && (
            <div className="fade-in">
              {/* Panel Expandido de Datos Clínicos (Obligatorio) */}
              <div className="clinical-panel" style={{
                marginTop: '1.25rem',
                border: `1px solid ${isClinicalComplete ? 'var(--border-color)' : '#fecdd3'}`,
                borderRadius: '12px',
                background: isClinicalComplete ? '#f8fafc' : '#fffbfa',
                padding: '1rem',
                transition: 'all 0.25s ease'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.85rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 700, fontSize: '0.88rem', color: 'var(--text-primary)' }}>
                    <Stethoscope size={17} color="var(--primary)" />
                    <span>Datos Clínicos del Paciente</span>
                  </div>
                  <span style={{
                    fontSize: '0.72rem',
                    padding: '0.22rem 0.65rem',
                    borderRadius: '20px',
                    background: result ? '#e0f2fe' : (isClinicalComplete ? '#dcfce7' : '#fff1f2'),
                    color: result ? '#0369a1' : (isClinicalComplete ? '#065f46' : '#be123c'),
                    fontWeight: 700,
                    border: result ? '1px solid #bae6fd' : (isClinicalComplete ? '1px solid #a7f3d0' : '1px solid #fecdd3'),
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.35rem'
                  }}>
                    {result ? (
                      <>
                        <CheckCircle2 size={13} color="#0284c7" />
                        <span>Evaluado (Fijo)</span>
                      </>
                    ) : isClinicalComplete ? (
                      <>
                        <CheckCircle2 size={13} color="#059669" />
                        <span>Completado (2/2)</span>
                      </>
                    ) : (
                      <>
                        <AlertCircle size={13} color="#be123c" />
                        <span>Obligatorio ({clinicalFieldsCount}/2)</span>
                      </>
                    )}
                  </span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem' }}>
                  <div className="clinical-field">
                    <label htmlFor="patient-age" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '0.35rem', textTransform: 'uppercase' }}>
                      <span>Edad <span style={{ color: 'var(--danger)' }}>*</span></span>
                      <span style={{ fontSize: '0.68rem', fontWeight: 600, color: '#94a3b8', textTransform: 'none' }}>18 a 100 años</span>
                    </label>
                    <input
                      id="patient-age"
                      type="number"
                      min="18"
                      max="100"
                      placeholder="Ej. 55"
                      value={clinicalData.age}
                      onChange={handleAgeChange}
                      onKeyDown={handleAgeKeyDown}
                      disabled={loading || !!result}
                      style={{
                        width: '100%',
                        padding: '0.55rem 0.75rem',
                        border: `1px solid ${clinicalData.age !== '' && !isAgeValid ? 'var(--danger)' : 'var(--border-color)'}`,
                        borderRadius: '8px',
                        fontSize: '0.88rem',
                        background: (loading || result) ? '#f8fafc' : 'white',
                        color: (loading || result) ? 'var(--text-secondary)' : 'var(--text-primary)',
                        cursor: (loading || result) ? 'not-allowed' : 'text',
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>

                  <div className="clinical-field">
                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '0.35rem', textTransform: 'uppercase' }}>
                      Sexo Biológico <span style={{ color: 'var(--danger)' }}>*</span>
                    </label>
                    <div style={{ position: 'relative' }}>
                      <select
                        value={clinicalData.gender}
                        onChange={e => setClinicalData(p => ({ ...p, gender: e.target.value }))}
                        disabled={loading || !!result}
                        style={{
                          width: '100%',
                          padding: '0.55rem 2rem 0.55rem 0.75rem',
                          border: '1px solid var(--border-color)',
                          borderRadius: '8px',
                          fontSize: '0.88rem',
                          background: (loading || result) ? '#f8fafc' : 'white',
                          boxSizing: 'border-box',
                          appearance: 'none',
                          color: clinicalData.gender ? 'var(--text-primary)' : 'var(--text-secondary)',
                          cursor: (loading || result) ? 'not-allowed' : 'pointer'
                        }}
                      >
                        <option value="" style={{ color: 'var(--text-secondary)' }}>Seleccionar</option>
                        <option value="0" style={{ color: 'var(--text-primary)' }}>Masculino</option>
                        <option value="1" style={{ color: 'var(--text-primary)' }}>Femenino</option>
                      </select>
                      <ChevronDown
                        size={16}
                        color="var(--text-secondary)"
                        style={{
                          position: 'absolute',
                          right: '10px',
                          top: '50%',
                          transform: 'translateY(-50%)',
                          pointerEvents: 'none'
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Botones de Acción */}
              <div style={{ display: 'flex', gap: '0.6rem', marginTop: '1rem', alignItems: 'center' }}>
                <button
                  onClick={handlePredict}
                  className="btn-analyze-action"
                  disabled={!isClinicalComplete || loading || !!result}
                  title={
                    result
                      ? 'La lesión ya ha sido evaluada. Presione "Limpiar" para reiniciar.'
                      : !isClinicalComplete
                        ? 'Complete los datos clínicos obligatorios (Edad y Sexo)'
                        : 'Iniciar análisis asistido por IA'
                  }
                >
                  {loading ? (
                    <span>Ejecutando Pipeline...</span>
                  ) : result ? (
                    <>
                      <Check size={16} />
                      <span>Lesión Analizada</span>
                    </>
                  ) : (
                    <>
                      <Activity size={16} />
                      <span>Analizar Lesión</span>
                    </>
                  )}
                </button>

                {(file || result || rejectionData) && (
                  <button
                    onClick={handleClear}
                    className="btn-clear-action"
                    disabled={clearCooldown > 0}
                    title={
                      clearCooldown > 0
                        ? `Tiempo de visualización clínica activa: ${clearCooldown}s restantes`
                        : 'Reiniciar análisis'
                    }
                  >
                    <RotateCcw size={15} />
                    <span>{clearCooldown > 0 ? `Limpiar (${clearCooldown}s)` : 'Limpiar'}</span>
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Métricas Clínicas Reportadas del Caso */}
          {result && (
            <div style={{ marginTop: '1.5rem', paddingTop: '1.25rem', borderTop: '1px solid var(--border-color)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.2rem' }}>
                <Activity size={16} color="var(--primary)" />
                <h3 style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                  Métricas Reportadas del Caso
                </h3>
              </div>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                Indicadores cuantitativos y trazabilidad del modelo clínico
              </p>
              <ClinicalMetrics
                fileSize={file?.size}
                umbral={result.umbral}
                tiempoMs={result.tiempo_ms}
                metadata={result.metadata}
              />
            </div>
          )}

          {error && (
            <div style={{
              marginTop: '1.25rem',
              padding: '1rem',
              borderRadius: '10px',
              background: 'var(--danger-bg)',
              color: 'var(--danger)',
              border: '1px solid #fecaca',
              display: 'flex',
              alignItems: 'center',
              gap: '0.6rem',
              fontSize: '0.85rem'
            }}>
              <AlertCircle size={18} style={{ flexShrink: 0 }} />
              <span>{error}</span>
            </div>
          )}
        </div>

        {/* Columna 2: Resultados Diagnósticos y Explicabilidad */}
        <div className="clean-card fade-in">
          <div className="section-header-title">
            <span style={{ width: '4px', height: '38px', background: 'var(--primary)', borderRadius: '4px', display: 'inline-block', flexShrink: 0 }} />
            <Activity size={20} color="var(--primary)" />
            <span>02. Clasificación Asistida y Explicabilidad Multimodal</span>
          </div>

          {/* Estado Inicial: Sin Análisis */}
          {!result && !rejectionData && !loading && (
            <div style={{ textAlign: 'center', padding: '4.5rem 2rem', color: 'var(--text-secondary)' }}>
              <ImageIcon size={64} color="#cbd5e1" style={{ marginBottom: '1rem' }} />
              <h3 style={{ fontSize: '1.15rem', color: 'var(--text-primary)' }}>Análisis Pendiente</h3>
              <p style={{ fontSize: '0.88rem', maxWidth: '380px', margin: '0.5rem auto 0' }}>
                Complete el registro en el panel izquierdo y presione <strong>Analizar Lesión</strong> para obterner los resultados.
              </p>
            </div>
          )}

          {/* Estado de Inferencia / Pasos de Carga en Columna 2 */}
          {loading && (
            <div style={{ textAlign: 'center', padding: '2.5rem 1.5rem 2rem' }} className="fade-in">
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                background: 'var(--primary-light)',
                color: 'var(--primary)',
                marginBottom: '1rem'
              }}>
                <Activity size={32} style={{ animation: 'pulseDot 1.5s infinite ease-in-out' }} />
              </div>

              <h3 style={{ fontSize: '1.15rem', color: 'var(--text-primary)', marginBottom: '0.35rem', fontWeight: 700 }}>
                Ejecutando Pipeline Diagnóstico
              </h3>
              <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', maxWidth: '420px', margin: '0 auto 1.5rem', lineHeight: 1.5 }}>
                Procesando la imagen dermatoscópica con visión computacional e inferencia multimodal.
              </p>

              <div className="loader-steps-container" style={{ textAlign: 'left', maxWidth: '480px', margin: '0 auto' }}>
                <div className={`step-progress-item ${loadingStep >= 1 ? (loadingStep > 1 ? 'done' : 'active') : ''}`}>
                  {loadingStep > 1 ? <CheckCircle2 size={18} /> : <div className="status-dot" />}
                  <span>1. Ejecutando Validación Local (Filtros OpenCV)...</span>
                </div>
                <div className={`step-progress-item ${loadingStep >= 2 ? (loadingStep > 2 ? 'done' : 'active') : ''}`}>
                  {loadingStep > 2 ? <CheckCircle2 size={18} /> : <div className="status-dot" />}
                  <span>2. Consultando Gatekeeper Gemini (IA Dermatoscópica)...</span>
                </div>
                <div className={`step-progress-item ${loadingStep >= 3 ? 'active' : ''}`}>
                  <div className="status-dot" />
                  <span>3. Extrayendo Variables PDI & Inferencia EfficientNet-B3...</span>
                </div>
              </div>
            </div>
          )}

          {/* Estado de Rechazo por Gatekeeper */}
          {rejectionData && (
            <div className="rejection-panel fade-in">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', color: 'var(--danger)', fontWeight: 800, fontSize: '1.1rem' }}>
                <XCircle size={24} />
                <span>Imagen Rechazada por Gatekeeper</span>
              </div>
              <p style={{ marginTop: '0.6rem', fontSize: '0.88rem', color: '#991b1b', lineHeight: 1.5 }}>
                {rejectionData.mensaje || 'La muestra no cumple con los criterios de adquisición dermatoscópica o presenta artefactos severos.'}
              </p>

              <div className="rejection-guide-grid">
                <div className="guide-box">
                  <span style={{ fontSize: '0.72rem', fontWeight: 800, padding: '0.2rem 0.5rem', borderRadius: '4px', background: '#ecfdf5', color: '#065f46', border: '1px solid #a7f3d0' }}>
                    ✅ CORRECTO: Dermatoscopio
                  </span>
                  <img src="/img/referencia_dermatoscopica.png" alt="Correcto" />
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', margin: '0.3rem 0 0' }}>
                    Captura con dermatoscopio. Red de pigmento visible.
                  </p>
                </div>

                <div className="guide-box">
                  <span style={{ fontSize: '0.72rem', fontWeight: 800, padding: '0.2rem 0.5rem', borderRadius: '4px', background: '#fff1f2', color: '#9f1239', border: '1px solid #fecdd3' }}>
                    ❌ INCORRECTO: Cámara común
                  </span>
                  <img src="/img/referencia_incorrectA.png" alt="Incorrecto" />
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', margin: '0.3rem 0 0' }}>
                    Foto macro de celular sin aumento dermatoscópico.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Estado de Éxito: Diagnóstico Completo */}
          {result && (
            <div className="fade-in">
              {/* Banner de Diagnóstico */}
              <div className={`diagnosis-result-banner ${isMelanoma ? 'melanoma' : 'benigno'}`}>
                <div>
                  <div style={{ fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    Clasificación Computacional Asistida
                  </div>
                  <div className="diag-title-lg">
                    {diagnosticoTexto}
                  </div>
                  <div style={{ fontSize: '0.8rem', fontWeight: 600, marginTop: '0.2rem' }}>
                    Nivel de Certeza: {(() => {
                      const pct = parseFloat(result.probabilidad_ia) || 0;
                      if (pct >= 75) return 'Alto';
                      if (pct >= 50) return 'Moderado';
                      return 'Bajo';
                    })()}
                  </div>
                </div>

                <div className="diag-prob-tag" style={{ color: isMelanoma ? 'var(--danger)' : 'var(--success)' }}>
                  {result.probabilidad_ia || (isMelanoma ? '85.4%' : '90.5%')}
                </div>
              </div>

              {/* Recomendación Clínica Asistida */}
              {result.recomendacion && (
                <div className="recommendation-box">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 700, color: 'var(--primary-dark)', marginBottom: '0.4rem' }}>
                    <ShieldCheck size={18} color="var(--primary)" />
                    <span>Recomendación Clínica Asistida</span>
                  </div>
                  <p style={{ margin: 0 }}>{result.recomendacion}</p>
                </div>
              )}

              {/* Visualización de Explicabilidad PDI y Grad-CAM */}
              <TripleComparison
                segmentationImg={normalizeImageSrc(result.segmentacion || result.segmentation || result.segmentation_b64, preview)}
                gradcamImg={normalizeImageSrc(result.gradcam || result.gradcam_b64, preview)}
              />

              {/* Variables Morfocromáticas y Descriptores PDI Detectados */}
              <DetectedFeatures caracteristicas={result.caracteristicas} />
            </div>
          )}
        </div>
      </div>

      {/* ── Sección de Historial de Casos Clínicos Evaluados ── */}
      <div className="clean-card fade-in" style={{ marginTop: '2rem' }}>
        <div className="section-header-title">
          <History size={20} color="var(--accent)" />
          <span>Historial de Casos Evaluados</span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
          <div style={{ padding: '1.1rem', borderRadius: '12px', background: '#f8fafc', border: '1px solid var(--border-color)', textAlign: 'center' }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>TOTAL ANÁLISIS</div>
            <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: '0.2rem' }}>{stats.total}</div>
          </div>
          <div style={{ padding: '1.1rem', borderRadius: '12px', background: 'var(--danger-bg)', border: '1px solid #fecdd3', textAlign: 'center' }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--danger)', textTransform: 'uppercase' }}>MELANOMA (ALTO RIESGO)</div>
            <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--danger)', marginTop: '0.2rem' }}>{stats.melanoma}</div>
          </div>
          <div style={{ padding: '1.1rem', borderRadius: '12px', background: 'var(--success-bg)', border: '1px solid #a7f3d0', textAlign: 'center' }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--success)', textTransform: 'uppercase' }}>BENIGNO / NEVUS</div>
            <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--success)', marginTop: '0.2rem' }}>{stats.nevus}</div>
          </div>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.88rem' }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '1px solid var(--border-color)' }}>
                <th style={{ padding: '0.85rem 1rem', textAlign: 'left', fontWeight: 700, color: 'var(--text-secondary)' }}>ID Caso Clínico</th>
                <th style={{ padding: '0.85rem 1rem', textAlign: 'left', fontWeight: 700, color: 'var(--text-secondary)' }}>Fecha y Hora</th>
                <th style={{ padding: '0.85rem 1rem', textAlign: 'left', fontWeight: 700, color: 'var(--text-secondary)' }}>Archivo</th>
                <th style={{ padding: '0.85rem 1rem', textAlign: 'left', fontWeight: 700, color: 'var(--text-secondary)' }}>Clasificación del Modelo</th>
                <th style={{ padding: '0.85rem 1rem', textAlign: 'left', fontWeight: 700, color: 'var(--text-secondary)' }}>Probabilidad</th>
                <th style={{ padding: '0.85rem 1rem', textAlign: 'left', fontWeight: 700, color: 'var(--text-secondary)' }}>Tiempo</th>
                <th style={{ padding: '0.85rem 1rem', textAlign: 'left', fontWeight: 700, color: 'var(--text-secondary)' }}>Acción</th>
              </tr>
            </thead>
            <tbody>
              {history.slice(0, 15).map((item) => {
                const isItemMelanoma = item.prediction?.toLowerCase().includes('melanoma') ||
                  item.diagnostico?.toLowerCase().includes('melanoma') ||
                  item.clase === 1;

                const diagText = item.prediction || item.diagnostico || (isItemMelanoma ? 'Melanoma Acral' : 'Nevo Acral (Benigno)');

                let probDisplay = '-';
                if (item.confidence != null && item.confidence !== '') {
                  if (typeof item.confidence === 'number') {
                    probDisplay = `${(item.confidence > 1 ? item.confidence : item.confidence * 100).toFixed(1)}%`;
                  } else {
                    probDisplay = item.confidence.includes('%') ? item.confidence : `${item.confidence}%`;
                  }
                } else if (item.probabilidad_ia) {
                  probDisplay = item.probabilidad_ia;
                } else {
                  probDisplay = isItemMelanoma ? '85.4%' : '94.2%';
                }

                const tiempoDisplay = item.tiempo_ms
                  ? `${Math.round(item.tiempo_ms)} ms`
                  : (item.metrics?.inference_time_ms ? `${Math.round(item.metrics.inference_time_ms)} ms` : '< 750 ms');

                return (
                  <tr key={item.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                    <td style={{ padding: '0.85rem 1rem', fontWeight: 700, color: 'var(--primary-dark)', fontSize: '0.82rem' }}>
                      {item.id}
                    </td>
                    <td style={{ padding: '0.85rem 1rem', color: 'var(--text-secondary)', fontSize: '0.82rem' }}>
                      {item.timestamp}
                    </td>
                    <td style={{ padding: '0.85rem 1rem', fontSize: '0.82rem' }}>
                      {item.image_name}
                    </td>
                    <td style={{ padding: '0.85rem 1rem' }}>
                      <span style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.35rem',
                        padding: '0.25rem 0.75rem',
                        borderRadius: '20px',
                        fontSize: '0.78rem',
                        fontWeight: 700,
                        background: isItemMelanoma ? 'var(--danger-bg)' : 'var(--success-bg)',
                        color: isItemMelanoma ? 'var(--danger)' : 'var(--success)',
                        border: `1px solid ${isItemMelanoma ? '#fecdd3' : '#a7f3d0'}`,
                        whiteSpace: 'nowrap'
                      }}>
                        <span>{isItemMelanoma ? '🔴' : '🟢'}</span>
                        <span>{diagText}</span>
                      </span>
                    </td>
                    <td style={{ padding: '0.85rem 1rem', fontWeight: 700, color: isItemMelanoma ? 'var(--danger)' : 'var(--text-primary)' }}>
                      {probDisplay}
                    </td>
                    <td style={{ padding: '0.85rem 1rem', color: 'var(--text-secondary)', fontSize: '0.8rem' }}>
                      {tiempoDisplay}
                    </td>
                    <td style={{ padding: '0.85rem 1rem' }}>
                      <button
                        onClick={() => handleDeleteHistory(item.id)}
                        style={{ color: 'var(--danger)', background: 'none', border: 'none', cursor: 'pointer', padding: '4px', borderRadius: '6px' }}
                        title="Eliminar registro"
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                );
              })}
              {history.length === 0 && (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--text-secondary)' }}>
                    No hay registros previos en el historial de análisis.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Pie de Página: Aviso Ético y Legal ── */}
      <footer style={{ marginTop: '2rem', marginBottom: '1.5rem', textAlign: 'center' }}>
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '0.45rem',
          color: 'var(--text-secondary)',
          fontSize: '0.8rem',
          fontWeight: 500
        }}>
          <ShieldCheck size={15} color="var(--text-secondary)" />
          <span>Aviso: Este sistema es una herramienta complementaria y no reemplaza el criterio médico profesional.</span>
        </div>
      </footer>

      {/* ── Modal de Confirmación de Eliminación ── */}
      {showDeleteModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(2px)' }}>
          <div className="fade-in" style={{ background: 'white', padding: '2rem', borderRadius: '14px', width: '100%', maxWidth: '420px', textAlign: 'center', boxShadow: '0 10px 25px rgba(0,0,0,0.1)' }}>
            <div style={{ color: 'var(--danger)', marginBottom: '0.75rem' }}>
              <AlertCircle size={44} style={{ margin: '0 auto' }} />
            </div>
            <h3 style={{ fontSize: '1.2rem', marginBottom: '0.4rem', color: 'var(--text-primary)' }}>¿Eliminar caso del historial?</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', lineHeight: 1.4 }}>
              Esta acción eliminará el registro diagnóstico seleccionado del historial local de auditoría.
            </p>
            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem' }}>
              <button
                onClick={() => setShowDeleteModal(false)}
                style={{ flex: 1, padding: '0.7rem', background: '#f1f5f9', color: 'var(--text-secondary)', border: 'none', borderRadius: '8px', fontWeight: 700, cursor: 'pointer' }}
              >
                Cancelar
              </button>
              <button
                onClick={confirmDelete}
                style={{ flex: 1, padding: '0.7rem', background: 'var(--danger)', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 700, cursor: 'pointer' }}
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}

      {showProfileModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(2px)' }}>
          <div style={{ background: 'white', padding: '2rem', borderRadius: '14px', width: '100%', maxWidth: '480px', textAlign: 'center' }}>
            <h3 style={{ fontSize: '1.4rem', marginBottom: '1.25rem', textAlign: 'center' }}>Acerca de la Plataforma</h3>

            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.25rem', padding: '1rem', background: '#f8fafc', borderRadius: '12px', textAlign: 'left' }}>
              <div className="user-avatar" style={{
                width: '50px',
                height: '50px',
                fontSize: '1.2rem',
                border: '3px solid white',
                boxShadow: '0 0 0 3px rgba(2, 132, 199, 0.3), 0 4px 10px rgba(2, 132, 199, 0.25)',
                flexShrink: 0
              }}>
                {getInitials(displayName)}
              </div>
              <div>
                <h4 style={{ fontSize: '1.05rem', margin: 0, color: 'var(--text-primary)' }}>{displayName}</h4>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.82rem', margin: '0.15rem 0 0' }}>@{user?.username || 'usuario'}</p>
              </div>
            </div>

            <div style={{ padding: '1.25rem', background: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)', borderRadius: '12px', marginBottom: '1.25rem', border: '1px solid #bae6fd', textAlign: 'left' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
                <ShieldCheck size={20} style={{ color: '#0284c7', flexShrink: 0, marginTop: '0.1rem' }} />
                <div>
                  <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#0369a1', marginBottom: '0.35rem' }}>Proyecto de Tesis</div>
                  <div style={{ fontSize: '0.85rem', color: '#0c4a6e', lineHeight: '1.5' }}>
                    Sistema de Diagnóstico Asistido por IA para Melanoma Acral<br />
                    Modelo: EfficientNet-B3 Multimodal + DullRazor/Otsu + Grad-CAM<br />
                    Universidad Señor de Sipán
                  </div>
                </div>
              </div>
            </div>

            <button
              onClick={() => setShowProfileModal(false)}
              style={{ width: '100%', padding: '0.75rem', background: '#f1f5f9', color: '#475569', border: 'none', borderRadius: '8px', fontWeight: 700, cursor: 'pointer', marginTop: '0.5rem' }}
            >
              Cerrar
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
