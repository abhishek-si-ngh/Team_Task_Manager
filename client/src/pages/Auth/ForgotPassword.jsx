import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';
import axios from 'axios';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email) {
      toast.error('Please enter your email address');
      return;
    }
    setLoading(true);
    try {
      await axios.post('/api/auth/forgotpassword', { email });
      setSuccess(true);
      toast.success('Password reset email sent!');
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to send reset email.';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div
        className="auth-bg-orb"
        style={{ width: 500, height: 500, background: '#4f9cf9', top: -150, left: -150 }}
      />
      <div
        className="auth-bg-orb"
        style={{ width: 350, height: 350, background: '#7c6af7', bottom: -100, right: -100 }}
      />

      <div className="auth-card">
        <Link to="/login" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)', marginBottom: '2rem', fontSize: '0.85rem' }}>
          <ArrowLeft size={16} /> Back to Login
        </Link>

        <h2 style={{ marginBottom: '0.25rem' }}>Forgot Password</h2>
        <p className="text-sm text-muted" style={{ marginBottom: '1.75rem' }}>
          Enter your email address and we'll send you a link to reset your password.
        </p>

        {success ? (
          <div style={{ background: 'rgba(34, 197, 94, 0.1)', border: '1px solid var(--accent-green)', padding: '1rem', borderRadius: '8px', color: 'var(--text-primary)', textAlign: 'center' }}>
            <Mail size={24} color="var(--accent-green)" style={{ margin: '0 auto 0.5rem auto' }} />
            <p className="text-sm">Check your email for the reset link.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="form-group" style={{ marginBottom: '1.5rem' }}>
              <label className="form-label">Email</label>
              <div style={{ position: 'relative' }}>
                <Mail size={15} style={{ position: 'absolute', left: '0.9rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input
                  className="form-input"
                  style={{ paddingLeft: '2.5rem' }}
                  type="email"
                  placeholder="john@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoFocus
                />
              </div>
            </div>

            <button
              className="btn btn-primary w-full"
              type="submit"
              disabled={loading}
              style={{ justifyContent: 'center', padding: '0.8rem' }}
            >
              {loading ? <div className="btn-spinner" /> : null}
              {loading ? 'Sending...' : 'Send Reset Link'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default ForgotPassword;
