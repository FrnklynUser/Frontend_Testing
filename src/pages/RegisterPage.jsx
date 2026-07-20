import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authService } from '../services/api';
import { Microscope, User, Lock, UserPlus, AlertCircle, ArrowLeft, Eye, EyeOff, CheckCircle } from 'lucide-react';

const RegisterPage = () => {
  const [formData, setFormData] = useState({
    name: '',
    lastName: '',
    username: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });

    // Autocompletar usuario basado en nombre y apellido
    if (name === 'name' || name === 'lastName') {
      const firstName = formData.name.trim().split(' ')[0] || '';
      const lastName = formData.lastName.trim().split(' ')[0] || '';

      // Si estamos editando nombre, usar el nuevo valor
      const currentFirstName = name === 'name' ? value.trim().split(' ')[0] : firstName;
      const currentLastName = name === 'lastName' ? value.trim().split(' ')[0] : lastName;

      if (currentFirstName && currentLastName) {
        // Función para normalizar texto (minúsculas, sin acentos, sin espacios)
        const normalizeText = (text) => {
          return text
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '') // Remover acentos
            .replace(/[^a-z0-9]/g, ''); // Solo letras y números
        };

        const autoUsername = `${normalizeText(currentFirstName)}.${normalizeText(currentLastName)}`;

        // Solo autocompletar si el usuario no ha modificado manualmente el campo username
        // o si el campo username está vacío
        if (!formData.username || formData.username === generateAutoUsername()) {
          setFormData(prev => ({ ...prev, username: autoUsername }));
        }
      }
    }
  };

  const generateAutoUsername = () => {
    const firstName = formData.name.trim().split(' ')[0] || '';
    const lastName = formData.lastName.trim().split(' ')[0] || '';

    const normalizeText = (text) => {
      return text
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]/g, '');
    };

    return `${normalizeText(firstName)}.${normalizeText(lastName)}`;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    const { name, lastName, username, password } = formData;

    // 1. Validación de campos vacíos o solo espacios
    if (!name.trim() || !lastName.trim() || !username.trim() || !password) {
      setError('Todos los campos son obligatorios y no pueden contener solo espacios');
      return;
    }

    // 2. Validación de Nombre y Apellido (Solo letras y espacios, min 2)
    const nameRegex = /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]{2,}$/;
    if (!nameRegex.test(name.trim())) {
      setError('El nombre debe tener al menos 2 caracteres y solo contener letras');
      return;
    }
    if (!nameRegex.test(lastName.trim())) {
      setError('El apellido debe tener al menos 2 caracteres y solo contener letras');
      return;
    }

    // 3. Validación de Usuario (Alfanumérico, sin espacios, min 4)
    const usernameRegex = /^[a-zA-Z0-9_]{4,}$/;
    if (!usernameRegex.test(username)) {
      setError('El usuario debe tener al menos 4 caracteres, sin espacios y solo letras, números o guiones bajos');
      return;
    }

    // 4. Validación de Contraseña (Min 8 caracteres)
    if (password.length < 8) {
      setError('La seguridad es prioridad. La contraseña debe tener al menos 8 caracteres');
      return;
    }

    setLoading(true);
    try {
      const fullName = `${name.trim()} ${lastName.trim()}`;
      const data = await authService.register(username, password, fullName);
      setSuccess(data.message + '. Redirigiendo al login...');
      setTimeout(() => navigate('/login'), 2000);
    } catch (err) {
      // Manejo mejorado de errores del backend
      const errorMsg = err.response?.data?.detail ||
        err.response?.data?.message ||
        'Error en el servidor. Intente más tarde.';
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <style>{`
        .login-container {
          display: flex;
          min-height: 100vh;
          background-color: var(--bg-body);
        }
        .welcome-side {
          flex: 1;
          background: linear-gradient(135deg, #1e3a5f 0%, #2c5282 100%);
          color: white;
          padding: 4rem;
          display: flex;
          flex-direction: column;
          justify-content: center;
        }
        .welcome-side h1 {
          color: white !important;
          font-size: 2.5rem;
          margin-bottom: 1.5rem;
        }
        .icon-box {
          font-size: 3rem;
          margin-bottom: 1.5rem;
        }
        .form-side {
          flex: 1;
          display: flex;
          justify-content: center;
          align-items: center;
          padding: 2rem;
        }
        .login-card {
          width: 100%;
          max-width: 500px;
          background: white;
          padding: 2.5rem;
          border-radius: var(--radius-lg);
          box-shadow: var(--shadow-lg);
        }
        .form-header {
          text-align: center;
          margin-bottom: 1.5rem;
        }
        .input-group {
          margin-bottom: 1rem;
        }
        .input-group label {
          display: block;
          font-weight: 500;
          margin-bottom: 0.3rem;
          color: var(--text-primary);
          font-size: 0.85rem;
        }
        .input-wrapper {
          position: relative;
        }
        .input-wrapper input {
          width: 100%;
          padding: 0.6rem 2.8rem 0.6rem 2.5rem;
          border: 1px solid var(--border-color);
          border-radius: var(--radius-md);
          font-size: 0.95rem;
          font-family: inherit;
        }
        .input-wrapper input:focus {
          outline: none;
          border-color: var(--primary);
        }
        .input-icon {
          position: absolute;
          left: 0.8rem;
          top: 50%;
          transform: translateY(-50%);
          color: var(--text-secondary);
          width: 1.1rem;
          pointer-events: none;
        }
        .submit-btn {
          width: 100%;
          padding: 0.75rem;
          background-color: var(--secondary);
          color: white;
          border: none;
          border-radius: var(--radius-md);
          font-weight: 600;
          margin-top: 1rem;
        }
        .submit-btn:hover {
          background-color: #0d9488e6;
        }
        .password-toggle {
          position: absolute;
          right: 0.8rem;
          top: 50%;
          transform: translateY(-50%);
          background: none;
          border: none;
          padding: 0;
          color: var(--text-secondary);
          display: flex;
          align-items: center;
          cursor: pointer;
          z-index: 10;
        }
        .password-toggle:hover {
          color: var(--primary);
        }
        .check-item {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          margin-bottom: 0.75rem;
          font-size: 1rem;
        }
        .error-alert {
          background-color: var(--danger-bg);
          color: var(--danger);
          padding: 0.7rem;
          border-radius: var(--radius-sm);
          margin-bottom: 1rem;
          font-size: 0.85rem;
          border-left: 4px solid var(--danger);
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }
        .success-alert {
          background-color: var(--success-bg);
          color: var(--success);
          padding: 0.7rem;
          border-radius: var(--radius-sm);
          margin-bottom: 1rem;
          font-size: 0.85rem;
          border-left: 4px solid var(--success);
        }
        .back-link {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          color: var(--text-secondary);
          text-decoration: none;
          font-size: 0.9rem;
          margin-bottom: 1.5rem;
        }
        @media (max-width: 900px) {
          .welcome-side { display: none; }
          .form-side { padding: 1rem; }
          .login-card { padding: 1.5rem; }
        }

        @media (max-width: 480px) {
          .login-card { padding: 1rem; }
          .form-header h2 { font-size: 1.3rem; }
          .input-group label { font-size: 0.85rem; }
          .input-wrapper input { font-size: 0.9rem; }
          .form-actions { flex-direction: column; }
        }
      `}</style>

      <div className="welcome-side">
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', marginBottom: '2rem' }}>
          <div className="brand-logo" style={{
            background: 'rgba(255, 255, 255, 0.15)',
            padding: '1rem',
            borderRadius: '16px',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.2)',
            flexShrink: 0
          }}>
            <Microscope size={40} color="white" strokeWidth={1.5} />
          </div>
          <h1 style={{ margin: 0, fontSize: '2.2rem', lineHeight: 1.2 }}>
            Ingrese sus datos
          </h1>
        </div>
        <p style={{ fontSize: '1.1rem', opacity: 0.9, marginBottom: '2rem', maxWidth: '500px' }}>
          Únete a nuestra plataforma de diagnóstico asistido por inteligencia artificial para la detección temprana de melanoma acral.
        </p>
        <div style={{ marginTop: '2rem' }}>
          <div className="check-item"><CheckCircle size={18} /> Analizar imágenes dermatoscópicas</div>
          <div className="check-item"><CheckCircle size={18} /> Acceder a predicciones precisas</div>
          <div className="check-item"><CheckCircle size={18} /> Visualizar explicaciones con Grad-CAM</div>
          <div className="check-item"><CheckCircle size={18} /> Mantener un historial de análisis</div>
        </div>
      </div>

      <div className="form-side">
        <div className="login-card fade-in">
          <div className="form-header">
            <h2 style={{ fontSize: '1.5rem' }}>Crear Cuenta</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Exclusivo para profesionales</p>
          </div>

          {error && <div className="error-alert"><AlertCircle size={16} />{error}</div>}
          {success && <div className="success-alert">{success}</div>}

          <form onSubmit={handleSubmit}>
            <div className="input-group">
              <label>Nombre Completo</label>
              <div className="input-wrapper">
                <User className="input-icon" />
                <input
                  type="text"
                  name="name"
                  placeholder="Nombre Completo"
                  value={formData.name}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <div className="input-group">
              <label>Apellido Completo</label>
              <div className="input-wrapper">
                <User className="input-icon" />
                <input
                  type="text"
                  name="lastName"
                  placeholder="Apellido Completo"
                  value={formData.lastName}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <div className="input-group">
              <label>Usuario</label>
              <div className="input-wrapper">
                <UserPlus className="input-icon" />
                <input
                  type="text"
                  name="username"
                  placeholder="Usuario"
                  value={formData.username}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <div className="input-group">
              <label>Contraseña</label>
              <div className="input-wrapper">
                <Lock className="input-icon" />
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={handleChange}
                  required
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div className="form-actions" style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
              <button type="submit" className="submit-btn" disabled={loading} style={{ marginTop: 0 }}>
                {loading ? 'Creando cuenta...' : 'Crear Cuenta'}
              </button>
              <Link to="/login" className="submit-btn" style={{
                marginTop: 0,
                backgroundColor: 'var(--border-color)',
                color: 'var(--text-primary)',
                textDecoration: 'none',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '0.9rem'
              }}>
                Ya tengo cuenta
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
