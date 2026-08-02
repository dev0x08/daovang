import { ArrowLeft, LogIn, Pickaxe, ShieldCheck, TriangleAlert } from 'lucide-react';
import { useState } from 'react';
import { Link, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const { profile, loading, authError, firebaseReady, login } = useAuth();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const location = useLocation();

  if (loading) return (
    <main className="login-compact-page app-page app-page-full">
      <section className="login-status-card">
        <Pickaxe className="spin-slow" />
        <span>AUTH SYSTEM</span>
        <h1>ĐANG KIỂM TRA PHIÊN</h1>
        <i />
      </section>
    </main>
  );
  if (profile) return <Navigate to={(location.state as { from?: string } | null)?.from || '/play'} replace />;

  const go = async () => {
    setBusy(true);
    setError('');
    try { await login(); }
    catch (caught: unknown) { setError(caught instanceof Error ? caught.message : 'Không thể đăng nhập Google.'); }
    finally { setBusy(false); }
  };

  return (
    <main className="login-compact-page app-page app-page-full">
      <section className="login-compact-card">
        <Link className="login-back" to="/" aria-label="Về trang chủ"><ArrowLeft /></Link>
        <div className="login-mark"><ShieldCheck /></div>
        <span className="login-kicker">PLAYER ACCESS</span>
        <h1>ĐĂNG NHẬP</h1>
        <p>Dùng tài khoản Google để lưu hồ sơ và tham gia phòng chơi online.</p>

        {firebaseReady ? (
          <button className="login-google-button" onClick={go} disabled={busy}>
            <LogIn /><span>{busy ? 'ĐANG KẾT NỐI...' : 'TIẾP TỤC VỚI GOOGLE'}</span>
          </button>
        ) : (
          <div className="login-warning"><TriangleAlert /><span><b>CHƯA CẤU HÌNH FIREBASE</b><small>Kiểm tra các biến môi trường Firebase.</small></span></div>
        )}

        {(error || authError) && <div className="login-error"><TriangleAlert />{error || authError}</div>}
        <small className="login-note">Thông tin Google chỉ dùng cho hồ sơ và đồng bộ dữ liệu trò chơi.</small>
      </section>
    </main>
  );
}
