import { useEffect, useState } from 'react';
import { Check, Clock3, Coins, Copy, Eye, History, Sparkles, Trophy, X, XCircle } from 'lucide-react';
import { collection, getDocs, limit, orderBy, query } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';
import { db } from '../lib/firebase';

type Row = { matchId:string; won:boolean; role:string; turns:number; durationSeconds:number; opponents:string[]; reward:{coins:number;exp:number}; completedAt?:{toDate?:()=>Date} };

export default function MatchHistory() {
  const { profile } = useAuth();
  const [rows, setRows] = useState<Row[]>([]);
  const [selected, setSelected] = useState<Row | null>(null);
  const [copiedId, setCopiedId] = useState('');
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    if (!profile || !db) return;
    let active = true;
    (async () => {
      try {
        const snap = await getDocs(query(collection(db!, 'users', profile.uid, 'matchHistory'), orderBy('completedAt', 'desc'), limit(20)));
        if (active) setRows(snap.docs.map(item => item.data() as Row));
      } finally { if (active) setLoading(false); }
    })();
    return () => { active = false; };
  }, [profile?.uid]);
  if (!profile) return null;

  const wins = rows.filter(row => row.won).length;
  const copyMatchId = async (matchId:string) => { await navigator.clipboard.writeText(matchId); setCopiedId(matchId); window.setTimeout(() => setCopiedId(current => current === matchId ? '' : current), 1800); };
  return <section className="history-page app-page">
    <header className="history-hero app-hero"><div><span><History/> NHẬT KÝ CHIẾN TUYẾN</span><h1>LỊCH SỬ TRẬN ĐẤU</h1><p>Kết quả, vai trò, thời lượng và phần thưởng của 20 trận gần nhất.</p></div><div className="history-hero-status"><small>DỮ LIỆU GẦN NHẤT</small><b>{rows.length}</b><span>{wins} CHIẾN THẮNG</span></div></header>
    {loading ? <div className="panel history-empty">Đang tải...</div> : rows.length === 0 ? <div className="panel history-empty"><History/> Chưa có trận đấu nào được ghi nhận.</div> : <div className="history-table">
      <div className="history-list-head"><span>KẾT QUẢ</span><span>VAI TRÒ</span><span>PHẦN THƯỞNG</span><span>THỜI GIAN</span><span></span></div>
      <div className="history-list">{rows.map(row => <article className={`history-row ${row.won ? 'won' : 'lost'}`} key={row.matchId}>
        <div className="history-result">{row.won ? <Trophy/> : <XCircle/>}<b>{row.won ? 'THẮNG' : 'THUA'}</b></div>
        <div className="history-role"><strong>{row.role === 'miner' ? 'THỢ ĐÀO' : 'SÓI'}</strong></div>
        <div className="history-reward"><span className="coins"><Coins/><b>+{row.reward?.coins || 0}</b><small>VÀNG</small></span><span className="exp"><Sparkles/><b>+{row.reward?.exp || 0}</b><small>EXP</small></span></div>
        <time>{row.completedAt?.toDate?.().toLocaleString('vi-VN') || 'Vừa xong'}</time>
        <button className="history-review-button" onClick={() => setSelected(row)}><Eye/><span>XEM LẠI</span></button>
      </article>)}</div>
    </div>}
    {selected && <div className="history-review-backdrop" onMouseDown={event => event.target === event.currentTarget && setSelected(null)}>
      <section className="history-review-modal" role="dialog" aria-modal="true" aria-label="Tổng kết trận đấu">
        <button className="history-review-close" onClick={() => setSelected(null)} aria-label="Đóng"><X/></button>
        <header><div><span>TỔNG KẾT TRẬN ĐẤU</span><h2>{selected.won ? 'CHIẾN THẮNG' : 'THẤT BẠI'}</h2><div className="history-review-meta"><time><Clock3/>{selected.completedAt?.toDate?.().toLocaleString('vi-VN') || 'Vừa xong'}</time><button className="history-modal-match-id" onClick={() => void copyMatchId(selected.matchId)} title="Sao chép mã trận"><small>MÃ TRẬN</small><b>{selected.matchId}</b>{copiedId === selected.matchId ? <Check/> : <Copy/>}</button></div></div>{selected.won ? <Trophy/> : <XCircle/>}</header>
        <div className="history-review-stats">
          <article><small>VAI TRÒ</small><b>{selected.role === 'miner' ? 'THỢ ĐÀO' : 'SÓI'}</b></article>
          <article><small>THỜI LƯỢNG</small><b>{Math.floor((selected.durationSeconds || 0) / 60)}p {(selected.durationSeconds || 0) % 60}s</b></article>
          <article><small>SỐ LƯỢT</small><b>{selected.turns || 0}</b></article>
        </div>
        <div className="history-review-players"><h3>NGƯỜI CHƠI TRONG TRẬN</h3><div className="history-review-player you"><strong>{profile.displayName || 'Bạn'} <em>(Bạn)</em></strong><span>{selected.won ? 'THẮNG' : 'THUA'}</span></div>{(selected.opponents || []).map((name, index) => <div className="history-review-player" key={`${name}-${index}`}><strong>{name}</strong><span>ĐỐI THỦ</span></div>)}</div>
        <footer><div><small>PHẦN THƯỞNG ĐÃ NHẬN</small><b><Coins/> +{selected.reward?.coins || 0} VÀNG</b><b><Sparkles/> +{selected.reward?.exp || 0} EXP</b></div><button className="btn btn-primary" onClick={() => setSelected(null)}>ĐÓNG</button></footer>
      </section>
    </div>}
  </section>;
}
