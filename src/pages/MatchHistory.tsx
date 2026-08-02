import { useEffect, useState } from 'react';
import { Clock3, Coins, History, Sparkles, Trophy, XCircle } from 'lucide-react';
import { collection, getDocs, limit, orderBy, query } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';
import { db } from '../lib/firebase';

type Row = { matchId:string; won:boolean; role:string; turns:number; durationSeconds:number; opponents:string[]; reward:{coins:number;exp:number}; completedAt?:{toDate?:()=>Date} };

export default function MatchHistory() {
  const { profile } = useAuth();
  const [rows, setRows] = useState<Row[]>([]);
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
  return <section className="history-page app-page">
    <header className="history-hero app-hero"><div><span><History/> NHẬT KÝ CHIẾN TUYẾN</span><h1>LỊCH SỬ TRẬN ĐẤU</h1><p>Kết quả, vai trò, thời lượng và phần thưởng của 20 trận gần nhất.</p></div><div className="history-hero-status"><small>DỮ LIỆU GẦN NHẤT</small><b>{rows.length}</b><span>{wins} CHIẾN THẮNG</span></div></header>
    {loading ? <div className="panel history-empty">Đang tải...</div> : rows.length === 0 ? <div className="panel history-empty"><History/> Chưa có trận đấu nào được ghi nhận.</div> : <div className="history-table">
      <div className="history-list-head"><span>KẾT QUẢ</span><span>VAI TRÒ</span><span>ĐỐI THỦ</span><span>THỜI LƯỢNG</span><span>SỐ LƯỢT</span><span>PHẦN THƯỞNG</span><span>THỜI GIAN</span></div>
      <div className="history-list">{rows.map(row => <article className={`history-row ${row.won ? 'won' : 'lost'}`} key={row.matchId}>
        <div className="history-result">{row.won ? <Trophy/> : <XCircle/>}<b>{row.won ? 'THẮNG' : 'THUA'}</b></div>
        <div className="history-role"><strong>{row.role === 'miner' ? 'THỢ ĐÀO' : 'SÓI'}</strong></div>
        <div className="history-opponents"><strong title={(row.opponents || []).join(', ')}>{(row.opponents || []).slice(0, 3).join(', ') || 'Không rõ'}</strong></div>
        <div className="history-duration"><Clock3/><strong>{Math.floor((row.durationSeconds || 0) / 60)}p {(row.durationSeconds || 0) % 60}s</strong></div>
        <div className="history-turns"><strong>{row.turns || 0}</strong></div>
        <div className="history-reward"><span className="coins"><Coins/><b>+{row.reward?.coins || 0}</b><small>VÀNG</small></span><span className="exp"><Sparkles/><b>+{row.reward?.exp || 0}</b><small>EXP</small></span></div>
        <time>{row.completedAt?.toDate?.().toLocaleString('vi-VN') || 'Vừa xong'}</time>
      </article>)}</div>
    </div>}
  </section>;
}
