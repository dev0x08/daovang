import { useEffect, useRef, useState } from 'react';
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  limit,
  onSnapshot,
  query,
  serverTimestamp,
  updateDoc,
  runTransaction,
  where,
} from 'firebase/firestore';
import {
  Bot,
  Copy,
  DoorOpen,
  Eye,
  EyeOff,
  Globe2,
  KeyRound,
  LockKeyhole,
  Pickaxe,
  Plus,
  Radio,
  Search,
  ShieldCheck,
  UserRound,
  Users,
  X,
} from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import { Equipped, useAuth } from '../context/AuthContext';
import PlayerIdentity from '../components/PlayerIdentity';
import ChatPanel from '../components/ChatPanel';
import { db } from '../lib/firebase';

type Player = {
  uid: string;
  name: string;
  avatar: string;
  bot?: boolean;
  ready: boolean;
  rank?: string;
  equipped?: Equipped;
};

type Room = {
  id: string;
  code: string;
  name: string;
  hostId: string;
  hostName?: string;
  status: 'waiting' | 'started';
  visibility: 'public' | 'private';
  passwordHash?: string;
  maxPlayers: number;
  players: Player[];
};

const ROOM_CODE_CHARS='ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const makeCode=()=>{const bytes=new Uint8Array(6);crypto.getRandomValues(bytes);return Array.from(bytes,b=>ROOM_CODE_CHARS[b%ROOM_CODE_CHARS.length]).join('')};

async function hashPassword(value: string): Promise<string> {
  const bytes = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
}

export default function Room() {
  const { profile } = useAuth();
  const [params] = useSearchParams();
  const roomRef = useRef<Room | null>(null);
  const profileRef = useRef(profile);
  const startingRef = useRef(false);
  const cleanupTimer = useRef<number | null>(null);

  const [room, setRoom] = useState<Room | null>(null);
  const [waitingRooms, setWaitingRooms] = useState<Room[]>([]);
  const [input, setInput] = useState('');
  const [error, setError] = useState('');
  const [showCode, setShowCode] = useState(false);
  const [showCreate, setShowCreate] = useState(params.get('create') === '1');
  const [visibility, setVisibility] = useState<'public' | 'private'>('public');
  const [roomName, setRoomName] = useState('');
  const [createPassword, setCreatePassword] = useState('');
  const [joinPassword, setJoinPassword] = useState('');
  const [pendingRoom, setPendingRoom] = useState<Room | null>(null);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    roomRef.current = room;
    profileRef.current = profile;
  }, [room, profile]);

  useEffect(() => {
    if (profile && !roomName) setRoomName(`Phòng của ${profile.displayName}`);
  }, [profile, roomName]);

  useEffect(() => {
    if (cleanupTimer.current) window.clearTimeout(cleanupTimer.current);
    return () => {
      const current = roomRef.current;
      const user = profileRef.current;
      const database = db;
      if (current && user?.uid === current.hostId && current.status === 'waiting' && !startingRef.current && database) {
        cleanupTimer.current = window.setTimeout(() => {
          void deleteDoc(doc(database, 'rooms', current.id));
        }, 200);
      }
    };
  }, []);

  useEffect(() => {
    if (!db) return;
    const roomsQuery = query(collection(db, 'rooms'), where('status', '==', 'waiting'), limit(50));
    const unsubscribe = onSnapshot(roomsQuery, (snapshot) => {
      const rooms = snapshot.docs
        .map((item) => ({ id: item.id, ...item.data() } as Room))
        .filter((item) => item.players.length < item.maxPlayers)
        .sort((a, b) => Number(b.visibility === 'public') - Number(a.visibility === 'public'));
      setWaitingRooms(rooms);
    });
    return () => { unsubscribe(); };
  }, []);

  useEffect(() => {
    if (!db || !room) return;
    const unsubscribe = onSnapshot(doc(db, 'rooms', room.id), (snapshot) => {
      if (snapshot.exists()) setRoom({ id: snapshot.id, ...snapshot.data() } as Room);
      else setRoom(null);
    });
    return () => { unsubscribe(); };
  }, [room?.id]);

  const createRoom = async () => {
    setError('');
    if (!profile || !db) {
      setError('Firebase chưa được cấu hình.');
      return;
    }
    const safeRoomName=roomName.trim().replace(/\s+/g,' ').slice(0,40);
    if (safeRoomName.length < 3) {
      setError('Vui lòng nhập tên phòng.');
      return;
    }
    if (visibility === 'private' && createPassword.trim().length < 4) {
      setError('Mật khẩu phòng riêng tư phải có ít nhất 4 ký tự.');
      return;
    }

    setCreating(true);
    try {
      const passwordHash = visibility === 'private' ? await hashPassword(createPassword.trim()) : '';
      const data = {
        code: makeCode(),
        name: safeRoomName,
        hostId: profile.uid,
        hostName: profile.displayName,
        status: 'waiting' as const,
        visibility,
        passwordHash,
        maxPlayers: 6,
        players: [
          {
            uid: profile.uid,
            name: profile.displayName,
            avatar: profile.photoURL,
            ready: true,
            rank: profile.rank,
            equipped: profile.equipped,
          },
        ],
        createdAt: serverTimestamp(),
      };
      const reference = await addDoc(collection(db, 'rooms'), data);
      setRoom({ id: reference.id, ...data } as Room);
      setShowCreate(false);
      setCreatePassword('');
    } catch {
      setError('Không thể tạo phòng. Hãy kiểm tra Firebase Rules và thử lại.');
    } finally {
      setCreating(false);
    }
  };

  const enterRoom = async (target: Room, password = '') => {
    setError('');
    if (!profile || !db) return;
    if (target.visibility === 'private') {
      const suppliedHash = await hashPassword(password.trim());
      if (!password.trim() || suppliedHash !== target.passwordHash) {
        setError('Mật khẩu phòng không đúng.');
        return;
      }
    }
    try {
      const ref=doc(db,'rooms',target.id);
      const joined=await runTransaction(db,async tx=>{
        const snap=await tx.get(ref);
        if(!snap.exists()) throw new Error('Phòng không còn tồn tại.');
        const current={id:snap.id,...snap.data()} as Room;
        if(current.players.some(p=>p.uid===profile.uid)) return current;
        if(current.status!=='waiting') throw new Error('Phòng đã bắt đầu.');
        if(current.players.length>=Math.min(6,current.maxPlayers)) throw new Error('Phòng đã đủ người.');
        const player={uid:profile.uid,name:profile.displayName.slice(0,40),avatar:profile.photoURL,ready:false,rank:profile.rank,equipped:profile.equipped};
        const players=[...current.players,player];
        tx.update(ref,{players});
        return {...current,players};
      });
      setRoom(joined);setPendingRoom(null);setJoinPassword('');
    } catch(e){setError(e instanceof Error?e.message:'Không thể tham gia phòng.');}
  };

  const requestJoin = (target: Room) => {
    setError('');
    if (target.visibility === 'private') {
      setPendingRoom(target);
      setJoinPassword('');
      return;
    }
    void enterRoom(target);
  };

  const joinByCode = async () => {
    setError('');
    if (!db || !input.trim()) {
      setError('Vui lòng nhập mã phòng.');
      return;
    }
    const roomsQuery = query(
      collection(db, 'rooms'),
      where('code', '==', input.trim().toUpperCase()),
      limit(1),
    );
    const snapshot = await getDocs(roomsQuery);
    if (snapshot.empty) {
      setError('Không tìm thấy phòng.');
      return;
    }
    requestJoin({ id: snapshot.docs[0].id, ...snapshot.docs[0].data() } as Room);
  };

  const addBot = async () => {
    if (!room || !db || profile?.uid !== room.hostId) return;
    const ref=doc(db,'rooms',room.id);
    await runTransaction(db,async tx=>{
      const snap=await tx.get(ref);if(!snap.exists())return;
      const current={id:snap.id,...snap.data()} as Room;
      if(current.hostId!==profile.uid||current.status!=='waiting'||current.players.length>=Math.min(6,current.maxPlayers))return;
      const players=[...current.players,{uid:`bot-${crypto.randomUUID()}`,name:`AI Thợ Mỏ ${current.players.filter(p=>p.bot).length+1}`,avatar:'',bot:true,ready:true}];
      tx.update(ref,{players});
    });
  };

  const leaveRoom = async () => {
    if (!room || !db || !profile) return;
    const ref=doc(db,'rooms',room.id);
    await runTransaction(db,async tx=>{
      const snap=await tx.get(ref);if(!snap.exists())return;
      const current={id:snap.id,...snap.data()} as Room;
      if(current.hostId===profile.uid){tx.delete(ref);return;}
      tx.update(ref,{players:current.players.filter(p=>p.uid!==profile.uid)});
    });
    setRoom(null);
  };

  const startRoom = async () => {
    if (!room || !db || profile?.uid !== room.hostId) return;
    try{
      const ref=doc(db,'rooms',room.id);
      const count=await runTransaction(db,async tx=>{
        const snap=await tx.get(ref);if(!snap.exists())throw new Error('Phòng không còn tồn tại.');
        const current={id:snap.id,...snap.data()} as Room;
        if(current.hostId!==profile.uid)throw new Error('Chỉ chủ phòng được bắt đầu.');
        if(current.status!=='waiting')throw new Error('Phòng đã bắt đầu.');
        if(current.players.length<6||current.players.length>6)throw new Error('Cần đúng 6 người chơi.');
        if(new Set(current.players.map(p=>p.uid)).size!==current.players.length)throw new Error('Danh sách người chơi không hợp lệ.');
        tx.update(ref,{status:'started',startedAt:serverTimestamp()});return current.players.length;
      });
      startingRef.current=true;
      window.location.assign(`/game?mode=room&room=${encodeURIComponent(room.id)}&players=${count}`);
    }catch(e){setError(e instanceof Error?e.message:'Không thể bắt đầu trận.');}
  };


  if (!profile) {
    return (
      <section className="center-page">
        <div className="auth-card">
          <LockKeyhole />
          <h1>CẦN ĐĂNG NHẬP</h1>
        </div>
      </section>
    );
  }

  if (!room) {
    return (
      <section className="room-entry room-lobby-page">
        <div className="room-lobby-head">
          <div>
            <span>LOBBY ONLINE</span>
            <h1>TÌM PHÒNG ĐANG CHỜ</h1>
            <p>Phòng công khai vào ngay. Phòng riêng tư yêu cầu đúng mật khẩu.</p>
          </div>
          <button className="btn btn-primary" onClick={() => setShowCreate(true)}>
            <Plus /> TẠO PHÒNG MỚI
          </button>
        </div>

        <div className="room-quick-join panel">
          <div className="quick-join-copy">
            <Search />
            <div>
              <b>THAM GIA BẰNG MÃ PHÒNG</b>
              <small>Mã phòng gồm 6 ký tự. Mật khẩu sẽ được hỏi nếu đó là phòng riêng tư.</small>
            </div>
          </div>
          <input
            value={input}
            onChange={(event) => setInput(event.target.value.toUpperCase())}
            onKeyDown={(event) => event.key === 'Enter' && void joinByCode()}
            maxLength={6}
            placeholder="VD: A7K92X"
          />
          <button onClick={() => void joinByCode()} className="btn btn-primary">
            VÀO PHÒNG
          </button>
        </div>

        <div className="room-list-panel panel">
          <header className="room-list-title">
            <div>
              <Globe2 />
              <div>
                <b>DANH SÁCH PHÒNG ĐANG CHỜ</b>
                <small>{waitingRooms.length} phòng có thể tham gia</small>
              </div>
            </div>
            <div className="room-type-legend">
              <span><Globe2 /> Công khai</span>
              <span><LockKeyhole /> Riêng tư</span>
            </div>
          </header>

          <div className="room-table-head">
            <span>TÊN PHÒNG</span>
            <span>CHỦ PHÒNG</span>
            <span>LOẠI PHÒNG</span>
            <span>NGƯỜI CHƠI</span>
            <span>TRẠNG THÁI</span>
            <span />
          </div>

          <div className="room-table-body">
            {waitingRooms.length === 0 ? (
              <div className="room-list-empty">
                <Radio />
                <b>CHƯA CÓ PHÒNG ĐANG CHỜ</b>
                <span>Hãy tạo phòng mới và mời bạn bè tham gia.</span>
              </div>
            ) : (
              waitingRooms.map((item) => {
                const isPrivate = item.visibility === 'private';
                return (
                  <div className="room-table-row" key={item.id}>
                    <div className="room-name-cell">
                      <span className={isPrivate ? 'private-room-icon' : 'public-room-icon'}>
                        {isPrivate ? <LockKeyhole /> : <Globe2 />}
                      </span>
                      <div>
                        <b>{item.name}</b>
                        <small>Mã phòng được ẩn</small>
                      </div>
                    </div>
                    <div className="room-host-cell">
                      <PlayerIdentity compact player={{
                        name: item.hostName || item.players[0]?.name || 'Chủ phòng',
                        avatar: item.players[0]?.avatar,
                        rank: item.players[0]?.rank,
                        equipped: item.players[0]?.equipped,
                      }} />
                    </div>
                    <div>
                      <span className={`room-privacy-badge ${isPrivate ? 'private' : 'public'}`}>
                        {isPrivate ? <LockKeyhole /> : <Globe2 />}
                        {isPrivate ? 'RIÊNG TƯ' : 'CÔNG KHAI'}
                      </span>
                    </div>
                    <div className="room-player-count">
                      <Users />
                      <b>{item.players.length}/{item.maxPlayers}</b>
                    </div>
                    <div>
                      <span className="room-status-badge"><Radio /> ĐANG CHỜ</span>
                    </div>
                    <button className="btn btn-small btn-ghost" onClick={() => requestJoin(item)}>
                      {isPrivate ? <KeyRound /> : <DoorOpen />}
                      {isPrivate ? 'NHẬP MẬT KHẨU' : 'THAM GIA'}
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {error && !pendingRoom && <p className="room-page-error">{error}</p>}

        {showCreate && (
          <div className="room-modal-backdrop" onMouseDown={() => setShowCreate(false)}>
            <div className="room-modal" onMouseDown={(event) => event.stopPropagation()}>
              <button className="room-modal-close" onClick={() => setShowCreate(false)}><X /></button>
              <div className="room-modal-icon"><DoorOpen /></div>
              <span>TẠO PHÒNG ONLINE</span>
              <h2>THIẾT LẬP PHÒNG MỚI</h2>

              <label>
                Tên phòng
                <input value={roomName} maxLength={40} onChange={(event) => setRoomName(event.target.value)} />
              </label>

              <div className="room-visibility-picker">
                <button
                  className={visibility === 'public' ? 'active' : ''}
                  onClick={() => {
                    setVisibility('public');
                    setCreatePassword('');
                  }}
                >
                  <Globe2 />
                  <b>CÔNG KHAI</b>
                  <small>Hiện trong lobby và không cần mật khẩu.</small>
                </button>
                <button
                  className={visibility === 'private' ? 'active' : ''}
                  onClick={() => setVisibility('private')}
                >
                  <LockKeyhole />
                  <b>RIÊNG TƯ</b>
                  <small>Hiện trong lobby nhưng bắt buộc nhập mật khẩu.</small>
                </button>
              </div>

              {visibility === 'private' && (
                <label>
                  Mật khẩu phòng
                  <div className="password-input-wrap">
                    <KeyRound />
                    <input
                      type="password"
                      value={createPassword}
                      minLength={4}
                      maxLength={32}
                      placeholder="Tối thiểu 4 ký tự"
                      onChange={(event) => setCreatePassword(event.target.value)}
                    />
                  </div>
                </label>
              )}

              {error && <p className="error">{error}</p>}
              <button className="btn btn-primary btn-wide" disabled={creating} onClick={() => void createRoom()}>
                <ShieldCheck /> {creating ? 'ĐANG TẠO...' : 'TẠO PHÒNG'}
              </button>
            </div>
          </div>
        )}

        {pendingRoom && (
          <div className="room-modal-backdrop" onMouseDown={() => setPendingRoom(null)}>
            <div className="room-modal room-password-modal" onMouseDown={(event) => event.stopPropagation()}>
              <button className="room-modal-close" onClick={() => setPendingRoom(null)}><X /></button>
              <div className="room-modal-icon"><LockKeyhole /></div>
              <span>PHÒNG RIÊNG TƯ</span>
              <h2>{pendingRoom.name}</h2>
              <p>Nhập mật khẩu do chủ phòng cung cấp để tham gia.</p>
              <label>
                Mật khẩu
                <div className="password-input-wrap">
                  <KeyRound />
                  <input
                    autoFocus
                    type="password"
                    value={joinPassword}
                    onChange={(event) => setJoinPassword(event.target.value)}
                    onKeyDown={(event) => event.key === 'Enter' && void enterRoom(pendingRoom, joinPassword)}
                  />
                </div>
              </label>
              {error && <p className="error">{error}</p>}
              <button className="btn btn-primary btn-wide" onClick={() => void enterRoom(pendingRoom, joinPassword)}>
                <KeyRound /> XÁC NHẬN VÀO PHÒNG
              </button>
            </div>
          </div>
        )}
      </section>
    );
  }

  const isHost = profile.uid === room.hostId;
  return (
    <section className="lobby-page">
      <div className="lobby-head">
        <div>
          <span>PHÒNG CHỜ · {room.visibility === 'public' ? 'CÔNG KHAI' : 'RIÊNG TƯ'}</span>
          <h1>#{showCode ? room.code : '••••••'}</h1>
        </div>
        <div className="lobby-code-actions">
          <button className="btn btn-ghost btn-small" onClick={() => setShowCode((value) => !value)}>
            {showCode ? <EyeOff /> : <Eye />}{showCode ? 'Ẩn mã' : 'Hiện mã'}
          </button>
          <button className="btn btn-ghost btn-small" onClick={() => navigator.clipboard.writeText(room.code)}>
            <Copy /> Sao chép
          </button>
          <button className="btn btn-danger btn-small" onClick={() => void leaveRoom()}>
            <DoorOpen /> Rời phòng
          </button>
        </div>
      </div>

      <div className="lobby-grid">
        <div className="panel lobby-players">
          <header><Users /> ĐỘI HÌNH ({room.players.length}/{room.maxPlayers})</header>
          {Array.from({ length: room.maxPlayers }, (_, index) => {
            const player = room.players[index];
            return player ? (
              <div className="lobby-player" key={player.uid}>
                <PlayerIdentity
                  player={player}
                  subtitle={player.uid === room.hostId ? 'CHỦ PHÒNG' : player.bot ? 'AI' : 'NGƯỜI CHƠI'}
                  trailing={<em>{player.ready ? 'SẴN SÀNG' : 'ĐANG CHỜ'}</em>}
                />
              </div>
            ) : <div className="empty-slot" key={index}>VỊ TRÍ TRỐNG</div>;
          })}
          {isHost && (
            <button onClick={() => void addBot()} disabled={room.players.length >= room.maxPlayers} className="btn btn-ghost">
              <Bot /> THÊM AI
            </button>
          )}
        </div>

        <div className="room-side-stack"><div className="panel room-settings">
          <header><DoorOpen /> THIẾT LẬP TRẬN</header>
          <div className="setting-row"><span>Loại phòng</span><b>{room.visibility === 'public' ? 'CÔNG KHAI' : 'RIÊNG TƯ'}</b></div>
          <div className="setting-row"><span>Bàn chơi</span><b>12×5</b></div>
          <div className="setting-row"><span>Người chơi</span><b>6–8</b></div>
          <div className="setting-row"><span>Vai trò</span><b>BÍ MẬT</b></div>
          {isHost ? (
            <button onClick={() => void startRoom()} disabled={room.players.length < 6} className="btn btn-primary btn-wide">
              BẮT ĐẦU TRẬN
            </button>
          ) : (
            <div className="waiting-host"><Radio /> Đang chờ chủ phòng bắt đầu...</div>
          )}
          {room.players.length < 6 && <small>Cần thêm {6 - room.players.length} người hoặc AI.</small>}
        </div><div className="panel lobby-chat-card"><ChatPanel roomId={room.id}/></div></div>
      </div>
    </section>
  );
}
