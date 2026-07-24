import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { authService } from '../services/api';
import { Microscope, User, Lock, AlertCircle, CheckCircle, Eye, EyeOff } from 'lucide-react';

const LoginPage = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { login } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!username || !password) {
      const msg = 'Por favor, complete todos los campos obligatorios.';
      setError(msg);
      toast.error(msg);
      return;
    }

    setLoading(true);
    try {
      const data = await authService.login(username, password);
      toast.success('¡Inicio de sesión exitoso! Bienvenido de nuevo.');
      login(data.user);
      navigate('/');
    } catch (err) {
      const msg = err.response?.data?.detail || 'Usuario o contraseña incorrectos. Verifique sus datos.';
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">

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

            <div className="input-group">
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
