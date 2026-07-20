import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { authService } from '../services/api';
import { Microscope, User, Lock, AlertCircle, CheckCircle, Eye, EyeOff } from 'lucide-react';

const LoginPage = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!username || !password) {
      setError('Por favor, complete todos los campos obligatorios.');
      return;
    }

    setLoading(true);
    try {
      const data = await authService.login(username, password);
      login(data.user);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.detail || 'Usuario o contraseña incorrectos. Verifique sus datos.');
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
          align-items: flex-start;
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
          max-width: 450px;
          background: white;
          padding: 2.5rem;
          border-radius: var(--radius-lg);
          box-shadow: var(--shadow-lg);
        }
        .icon-box {
          font-size: 3rem;
          margin-bottom: 1.5rem;
        }
        .welcome-side h1 {
          font-size: 2.5rem;
          margin-bottom: 1.5rem;
          color: white !important;
        }
        .welcome-side p {
          font-size: 1.1rem;
          margin-bottom: 1rem;
          opacity: 0.9;
        }
        .check-item {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          margin-bottom: 0.75rem;
          font-size: 1rem;
        }
        .form-header {
          text-align: center;
          margin-bottom: 2rem;
        }
        .input-group {
          margin-bottom: 1.5rem;
        }
        .input-group label {
          display: block;
          font-weight: 500;
          margin-bottom: 0.5rem;
          color: var(--text-primary);
          font-size: 0.9rem;
        }
        .input-wrapper {
          position: relative;
        }
        .input-wrapper input {
          width: 100%;
          padding: 0.75rem 1rem 0.75rem 2.5rem;
          padding-right: 3rem;
          border: 1px solid var(--border-color);
          border-radius: var(--radius-md);
          font-size: 1rem;
          transition: border-color 0.2s;
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
          width: 1.2rem;
          height: 1.2rem;
          pointer-events: none;
        }
        .submit-btn {
          width: 100%;
          padding: 0.8rem;
          background-color: var(--secondary);
          color: white;
          border: none;
          border-radius: var(--radius-md);
          font-weight: 600;
          font-size: 1rem;
          margin-top: 1rem;
        }
        .submit-btn:hover {
          background-color: #0d9488e6;
        }
        .submit-btn:disabled {
          opacity: 0.7;
          cursor: not-allowed;
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
        .error-alert {
          background-color: var(--danger-bg);
          color: var(--danger);
          padding: 0.75rem;
          border-radius: var(--radius-sm);
          margin-bottom: 1.5rem;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.875rem;
          border-left: 4px solid var(--danger);
        }
        .register-link {
          text-align: center;
          margin-top: 1.5rem;
          font-size: 0.9rem;
          color: var(--text-secondary);
        }
        .register-link a {
          color: var(--primary);
          text-decoration: none;
          font-weight: 600;
        }

        @media (max-width: 900px) {
          .welcome-side { display: none; }
          .form-side { padding: 1rem; }
          .login-card { padding: 1.5rem; }
        }

        @media (max-width: 480px) {
          .login-card { padding: 1rem; }
          .form-header h2 { font-size: 1.5rem; }
          .input-group label { font-size: 0.85rem; }
          .input-wrapper input { font-size: 0.9rem; }
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
            Plataforma de Detección Acral (PDA)
          </h1>
        </div>
        <p style={{ fontSize: '1.1rem', opacity: 0.9, marginBottom: '2rem', maxWidth: '500px' }}>
          Bienvenido al Sistema Inteligente de Diagnóstico Asistido para la detección temprana de melanoma acral. Por favor, ingrese sus credenciales para comenzar.
        </p>
        <div style={{ marginTop: '2rem' }}>
          <div className="check-item"><CheckCircle size={18} /> Acceso seguro y protegido</div>
          <div className="check-item"><CheckCircle size={18} /> Datos confidenciales</div>
          <div className="check-item"><CheckCircle size={18} /> Apoyo al diagnóstico médico</div>
        </div>
      </div>

      <div className="form-side">
        <div className="login-card fade-in">
          <div className="form-header">
            <h2 style={{ fontSize: '1.75rem', color: 'var(--primary-dark)' }}>Iniciar Sesión</h2>
            <p style={{ color: 'var(--text-secondary)' }}>Ingrese a su cuenta profesional</p>
          </div>

          {error && (
            <div className="error-alert">
              <AlertCircle size={18} />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="input-group">
              <label>Usuario</label>
              <div className="input-wrapper">
                <User className="input-icon" />
                <input
                  type="text"
                  placeholder="Usuario"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label>Contraseña</label>
              <div className="input-wrapper">
                <Lock className="input-icon" />
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
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

            <button type="submit" className="submit-btn" disabled={loading}>
              {loading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
            </button>
          </form>

          <div className="register-link">
            ¿No tiene una cuenta? <Link to="/register">Crear cuenta</Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
