import { useEffect, useRef, useState } from 'react';
import {
  addDoc,
  collection,
  doc,
  getDoc,
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
  Settings,
  ShieldCheck,
  UserRound,
  UserX,
  Users,
  X,
} from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import { Equipped, useAuth } from '../context/AuthContext';
import PlayerIdentity from '../components/PlayerIdentity';
import ChatPanel from '../components/ChatPanel';
import { db } from '../lib/firebase';
import { GOLD_MINE_MAP, newRoomGame } from '../lib/game';
import { createPresence, encodeOnlineMatch, TURN_MS } from '../lib/onlineMatch';

type Player = {
  uid: string;
  name: string;
  avatar: string;
  bot?: boolean;
  ready: boolean;
  rank?: string;
  equipped?: Equipped;
  slot?: number;
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
  mode?: 'online' | 'ai';
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
  const createLock = useRef(false);

  const [room, setRoom] = useState<Room | null>(null);
  const [waitingRooms, setWaitingRooms] = useState<Room[]>([]);
  const [input, setInput] = useState('');
  const [error, setError] = useState('');
  const [showCode, setShowCode] = useState(false);
  const [showCreate, setShowCreate] = useState(params.get('create') === '1');
  const [visibility, setVisibility] = useState<'public' | 'private'>('public');
  const [roomMode, setRoomMode] = useState<'online' | 'ai'>('online');
  const [roomName, setRoomName] = useState('');
  const [createPassword, setCreatePassword] = useState('');
  const [joinPassword, setJoinPassword] = useState('');
  const [pendingRoom, setPendingRoom] = useState<Room | null>(null);
  const [creating, setCreating] = useState(false);
  const [showMatchSettings, setShowMatchSettings] = useState(false);

  useEffect(() => {
    if (profile && !roomName) setRoomName(`Phòng của ${profile.displayName}`);
  }, [profile, roomName]);

  useEffect(()=>{if(!profile||!db||room)return;const roomId=localStorage.getItem(`active-room:${profile.uid}`);if(!roomId)return;let cancelled=false;(async()=>{try{const snap=await getDoc(doc(db!,'rooms',roomId));if(!snap.exists()){localStorage.removeItem(`active-room:${profile.uid}`);return}const restored={id:snap.id,...snap.data()} as Room;if(restored.players.some(player=>player.uid===profile.uid)&&!cancelled)setRoom(restored);else localStorage.removeItem(`active-room:${profile.uid}`)}catch{}})();return()=>{cancelled=true}},[profile?.uid,room]);

  useEffect(()=>{if(profile&&room)localStorage.setItem(`active-room:${profile.uid}`,room.id)},[profile?.uid,room?.id]);

  useEffect(()=>{if(!profile||!room||!db)return;const member=room.players.find(player=>player.uid===profile.uid);if(!member||JSON.stringify(member.equipped||{})===JSON.stringify(profile.equipped||{}))return;const ref=doc(db,'rooms',room.id);void runTransaction(db,async tx=>{const snap=await tx.get(ref);if(!snap.exists())return;const current={id:snap.id,...snap.data()} as Room;const players=current.players.map(player=>player.uid===profile.uid?{...player,name:profile.displayName,avatar:profile.photoURL,rank:profile.rank,equipped:profile.equipped}:player);tx.update(ref,{players})})},[profile?.uid,profile?.displayName,profile?.photoURL,profile?.rank,profile?.equipped,room?.id,room?.players]);

  useEffect(()=>{if(room?.status==='started')window.location.assign(`/game?mode=room&room=${encodeURIComponent(room.id)}&players=${room.players.length}`)},[room?.status,room?.id]);

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
      else {setRoom(null);if(profile)localStorage.removeItem(`active-room:${profile.uid}`)}
    });
    return () => { unsubscribe(); };
  }, [room?.id]);

  const createRoom = async () => {
    if(createLock.current)return;
    createLock.current=true;
    setError('');
    if (!profile || !db) {
      setError('Firebase chưa được cấu hình.');
      createLock.current=false;
      return;
    }
    const activeRoomId=localStorage.getItem(`active-room:${profile.uid}`);
    if(activeRoomId){
      try{
        const activeSnap=await getDoc(doc(db,'rooms',activeRoomId));
        if(activeSnap.exists()){
          const activeRoom={id:activeSnap.id,...activeSnap.data()} as Room;
          if(activeRoom.players.some(player=>player.uid===profile.uid)){
            setRoom(activeRoom);
            setShowCreate(false);
            setError(activeRoom.status==='started'?'Bạn đang ở trong một trận đấu.':'Bạn đang ở trong một phòng chờ. Hãy rời phòng hiện tại trước khi tạo phòng mới.');
            createLock.current=false;
            return;
          }
        }
        localStorage.removeItem(`active-room:${profile.uid}`);
      }catch{
        setError('Không thể xác minh phòng hiện tại. Vui lòng thử lại.');
        createLock.current=false;
        return;
      }
    }
    const safeRoomName=roomName.trim().replace(/\s+/g,' ').slice(0,40);
    if (safeRoomName.length < 3) {
      setError('Vui lòng nhập tên phòng.');
      createLock.current=false;
      return;
    }
    if (roomMode === 'online' && visibility === 'private' && createPassword.trim().length < 4) {
      setError('Mật khẩu phòng riêng tư phải có ít nhất 4 ký tự.');
      createLock.current=false;
      return;
    }

    setCreating(true);
    try {
      const effectiveVisibility = roomMode === 'ai' ? 'private' : visibility;
      const passwordHash = roomMode === 'online' && visibility === 'private' ? await hashPassword(createPassword.trim()) : '';
      const hostPlayer:Player={uid:profile.uid,name:profile.displayName,avatar:profile.photoURL,ready:true,rank:profile.rank,equipped:profile.equipped,slot:0};
      const aiPlayers:Player[]=roomMode==='ai'?Array.from({length:5},(_,index)=>({uid:`bot-${crypto.randomUUID()}`,name:`AI Thợ Mỏ ${index+1}`,avatar:'',bot:true,ready:true,slot:index+1})):[];
      const data = {
        code: makeCode(),
        name: safeRoomName,
        hostId: profile.uid,
        hostName: profile.displayName,
        status: 'waiting' as const,
        visibility: effectiveVisibility,
        mode: roomMode,
        passwordHash,
        maxPlayers: 6,
        players: [hostPlayer],
        createdAt: serverTimestamp(),
      };
      const reference = await addDoc(collection(db, 'rooms'), data);
      const finalPlayers=roomMode==='ai'?[hostPlayer,...aiPlayers]:[hostPlayer];
      if(roomMode==='ai')await updateDoc(reference,{players:finalPlayers});
      localStorage.setItem(`active-room:${profile.uid}`,reference.id);
      setRoom({ id: reference.id, ...data, players:finalPlayers } as Room);
      setShowCreate(false);
      setCreatePassword('');
    } catch {
      setError('Không thể tạo phòng. Hãy kiểm tra Firebase Rules và thử lại.');
    } finally {
      setCreating(false);
      createLock.current=false;
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
        if(current.players.length>=current.maxPlayers) throw new Error('Phòng đã đủ người.');
        const normalized=current.players.map((player,index)=>{const slot=player.slot??index;return {...player,slot,name:player.bot?`AI Thợ Mỏ ${slot}`:player.name}});
        const usedSlots=new Set(normalized.map(player=>player.slot));
        const slot=Array.from({length:current.maxPlayers},(_,index)=>index).find(index=>!usedSlots.has(index));
        if(slot===undefined)throw new Error('Phòng đã đủ người.');
        const player={uid:profile.uid,name:profile.displayName.slice(0,40),avatar:profile.photoURL,ready:false,rank:profile.rank,equipped:profile.equipped,slot};
        const players=[...normalized,player];
        tx.update(ref,{players});
        return {...current,players};
      });
      localStorage.setItem(`active-room:${profile.uid}`,joined.id);setRoom(joined);setPendingRoom(null);setJoinPassword('');
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
      if(current.hostId!==profile.uid||current.status!=='waiting'||current.players.length>=current.maxPlayers)return;
      const normalized=current.players.map((player,index)=>{const slot=player.slot??index;return {...player,slot,name:player.bot?`AI Thợ Mỏ ${slot}`:player.name}});
      const usedSlots=new Set(normalized.map(player=>player.slot));
      const slot=Array.from({length:current.maxPlayers},(_,index)=>index).find(index=>!usedSlots.has(index));
      if(slot===undefined)return;
      const players=[...normalized,{uid:`bot-${crypto.randomUUID()}`,name:`AI Thợ Mỏ ${slot}`,avatar:'',bot:true,ready:true,slot}];
      tx.update(ref,{players});
    });
  };

  const changeMaxPlayers=async(maxPlayers:number)=>{
    if(!room||!db||profile?.uid!==room.hostId||maxPlayers<6||maxPlayers>8)return;
    const highestSlot=Math.max(...room.players.map((player,index)=>player.slot??index));
    if(room.players.length>maxPlayers||highestSlot>=maxPlayers){setError(`Không thể giảm xuống ${maxPlayers} khi vẫn có người ở vị trí cao hơn.`);return}
    try{await updateDoc(doc(db,'rooms',room.id),{maxPlayers});setError('')}catch{setError('Không thể đổi số người chơi. Hãy cập nhật Firebase Rules.')}
  };

  const kickPlayer=async(targetUid:string)=>{
    if(!room||!db||profile?.uid!==room.hostId||targetUid===room.hostId)return;
    try{
      const ref=doc(db,'rooms',room.id);
      await runTransaction(db,async tx=>{const snap=await tx.get(ref);if(!snap.exists())return;const current={id:snap.id,...snap.data()} as Room;if(current.hostId!==profile.uid||current.status!=='waiting')return;const players=current.players.map((player,index)=>{const slot=player.slot??index;return {...player,slot,name:player.bot?`AI Thợ Mỏ ${slot}`:player.name}}).filter(player=>player.uid!==targetUid);tx.update(ref,{players})});
      setError('');
    }catch{setError('Không thể kích người chơi khỏi phòng.')}
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
    localStorage.removeItem(`active-room:${profile.uid}`);
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
        if(current.players.length!==current.maxPlayers)throw new Error(`Cần đúng ${current.maxPlayers} người chơi.`);
        if(new Set(current.players.map(p=>p.uid)).size!==current.players.length)throw new Error('Danh sách người chơi không hợp lệ.');
        const now=Date.now();
        const gameState=newRoomGame(current.id,current.players,GOLD_MINE_MAP);
        const participantIds=current.players.filter(player=>!player.bot).map(player=>player.uid);
        tx.set(doc(db!,'matches',current.id),encodeOnlineMatch({roomId:current.id,participantIds,state:gameState,presence:createPresence(participantIds,now),autoDiscardCounts:{},turnStartedAt:now,turnDeadline:now+TURN_MS,revision:0}));
        tx.update(ref,{status:'started',startedAt:serverTimestamp()});return current.players.length;
      });
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

              <div className="room-visibility-picker room-mode-picker">
                <button className={roomMode === 'online' ? 'active' : ''} onClick={() => setRoomMode('online')}>
                  <Users />
                  <b>PHÒNG ONLINE</b>
                  <small>Chờ người chơi tham gia và có thể thêm AI sau.</small>
                </button>
                <button className={roomMode === 'ai' ? 'active' : ''} onClick={() => {setRoomMode('ai');setCreatePassword('')}}>
                  <Bot />
                  <b>CHƠI VỚI AI</b>
                  <small>Tự động thêm 5 AI và sẵn sàng bắt đầu ngay.</small>
                </button>
              </div>

              {roomMode === 'online' && <div className="room-visibility-picker">
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
              </div>}

              {roomMode === 'online' && visibility === 'private' && (
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
          <header><Users /> ĐỘI HÌNH ({room.players.length}/{room.maxPlayers})<button className="lobby-settings-trigger" title="Thiết lập trận" onClick={()=>setShowMatchSettings(true)}><Settings /></button></header>
          <div className="lobby-player-grid">
          {Array.from({ length: room.maxPlayers }, (_, index) => {
            const player = room.players.find((candidate,candidateIndex)=>(candidate.slot??candidateIndex)===index);
            return player ? (
              <div className="lobby-player" key={player.uid}>
                <PlayerIdentity
                  player={player}
                  subtitle={player.uid === room.hostId ? 'CHỦ PHÒNG' : player.bot ? 'AI' : 'NGƯỜI CHƠI'}
                  trailing={<><em>{player.ready ? 'SẴN SÀNG' : 'ĐANG CHỜ'}</em>{isHost&&player.uid!==room.hostId&&<button className="kick-player-button" title={`Kích ${player.name}`} onClick={()=>void kickPlayer(player.uid)}><UserX/><span>KÍCH</span></button>}</>}
                />
              </div>
            ) : <div className="empty-slot" key={index}>VỊ TRÍ TRỐNG</div>;
          })}
          </div>
          {isHost && (
            <button onClick={() => void addBot()} disabled={room.players.length >= room.maxPlayers} className="btn btn-ghost">
              <Bot /> THÊM AI
            </button>
          )}
          {isHost ? (
            <button onClick={() => void startRoom()} disabled={room.players.length !== room.maxPlayers} className="btn btn-primary lobby-start-button">
              BẮT ĐẦU TRẬN
            </button>
          ) : (
            <div className="waiting-host"><Radio /> Đang chờ chủ phòng bắt đầu...</div>
          )}
          {room.players.length < room.maxPlayers && <small className="lobby-player-note">Cần thêm {room.maxPlayers - room.players.length} người hoặc AI.</small>}
        </div>

        <div className="room-side-stack"><div className="panel lobby-chat-card"><ChatPanel roomId={room.id}/></div></div>
      </div>
      {showMatchSettings&&<div className="room-modal-backdrop" onMouseDown={()=>setShowMatchSettings(false)}><div className="room-modal match-settings-modal" onMouseDown={event=>event.stopPropagation()}><button className="room-modal-close" onClick={()=>setShowMatchSettings(false)}><X /></button><div className="room-modal-icon"><Settings /></div><span>PHÒNG CHỜ</span><h2>THIẾT LẬP TRẬN</h2><div className="setting-row"><span>Loại phòng</span><b>{room.mode==='ai'?'CHƠI VỚI AI':room.visibility==='public'?'CÔNG KHAI':'RIÊNG TƯ'}</b></div><div className="setting-row"><span>Bàn chơi</span><b>12×5</b></div><div className="setting-row match-player-limit"><span>Người chơi</span>{isHost?<select value={room.maxPlayers} onChange={event=>void changeMaxPlayers(Number(event.target.value))}>{[6,7,8].map(value=><option key={value} value={value} disabled={value<room.players.length}>{value} người</option>)}</select>:<b>{room.maxPlayers} người</b>}</div><div className="setting-row"><span>Vai trò</span><b>BÍ MẬT</b></div><button className="btn btn-primary btn-wide" onClick={()=>setShowMatchSettings(false)}>XONG</button></div></div>}
    </section>
  );
}
