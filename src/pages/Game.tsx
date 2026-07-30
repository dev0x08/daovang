import { useEffect, useMemo, useRef, useState } from 'react';
import { Ban, Bot, Box, Clock3, Coins, DoorOpen, Expand, Gem, Hammer, HeartPulse, HelpCircle, MessageCircle, Minimize, Mountain, Pickaxe, RefreshCcw, RotateCcw, Search, Shield, Sparkles, Trash2, Trophy, UserPlus, UserRound, Settings, X } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { doc, getDoc, onSnapshot, runTransaction, serverTimestamp, setDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Card, discardCard, GameState, GOLD_MINE_MAP, isValidPlacement, longestTreasureRoute, newGame, placeCard, scoutTreasure, useAction, dirs, isDeadPath, PathKind, SpecialKind, useBlock, useRevive, useSwap, useSabotage, placementReason, pathDirectionsText } from '../lib/game';
import { giveLike, getGivenLikeInMatch } from '../lib/likes';
import { acceptFriendRequest, friendshipStatus, FriendshipStatus, sendFriendRequest } from '../lib/friends';
import { botMoveWithDeckActions as botMove } from '../lib/gameBot';
import { useAuth } from '../context/AuthContext';
import { MATCH_CHEST_REWARD, MatchReward, levelFromExp, expForLevel } from '../lib/progression';
import { cosmeticClass, itemById } from '../lib/shop';
import PlayerIdentity from '../components/PlayerIdentity';
import ChatPanel from '../components/ChatPanel';
import { applyPresenceRules, decodeOnlineMatch, encodeOnlineMatch, OnlineMatch, OnlineMatchDocument, timeoutTurn, TURN_MS } from '../lib/onlineMatch';
import { profileUrl } from '../lib/slugs';

const minePathTransform = (card: Card) => {
    const kind = card.kind as PathKind;
    let shape: 'straight' | 'corner' | 'tee' | 'cross' | 'crossDead' | 'cornerDead' | 'collapse' = 'straight', rotation = card.rotation || 0, flipY = false;
    if (kind === 'h' || kind === 'v') {
        rotation += (kind === 'v' ? 90 : 0);
    } else if (kind === 'ne' || kind === 'nw' || kind === 'se' || kind === 'sw') {
        shape = 'corner';
        rotation += ({ sw: 0, nw: 90, ne: 180, se: 270 } as Record<string, number>)[kind];
    } else if (kind === 'tUp' || kind === 'tRight' || kind === 'tDown' || kind === 'tLeft') {
        shape = 'tee';
        rotation += ({ tUp: 0, tRight: 90, tDown: 180, tLeft: 270 } as Record<string, number>)[kind];
    } else if (kind === 'cross') shape = 'cross';
    else if (kind === 'crossDead') shape = 'crossDead';
    else if (kind === 'nwDead') shape = 'cornerDead';
    else if (kind === 'seDead') { shape = 'cornerDead'; rotation += 180 }
    else if (kind === 'swDead') { shape = 'cornerDead'; flipY = true }
    else if (kind === 'collapse') shape = 'collapse';
    return { shape, rotation, flipY };
};
const mineRailPaths = {
    straight: { beds: ['M0 50H100'], rails: ['M0 40H100', 'M0 60H100'] },
    corner: { beds: ['M50 100V72Q50 50 28 50H0'], rails: ['M40 100V72Q40 60 28 60H0', 'M60 100V72Q60 40 28 40H0'] },
    tee: { beds: ['M0 50H100', 'M50 0V50'], rails: ['M0 40H100', 'M0 60H100', 'M40 0V40', 'M60 0V40'] },
    cross: { beds: ['M0 50H100', 'M50 0V100'], rails: ['M0 40H100', 'M0 60H100', 'M40 0V100', 'M60 0V100'] },
    crossDead: { beds: ['M0 50H34', 'M66 50H100', 'M50 0V34', 'M50 66V100'], rails: ['M0 40H34', 'M0 60H34', 'M66 40H100', 'M66 60H100', 'M40 0V34', 'M60 0V34', 'M40 66V100', 'M60 66V100'] },
    cornerDead: { beds: ['M50 100V72Q50 50 72 50H78'], rails: ['M40 100V72Q40 60 72 60H78', 'M60 100V72Q60 40 72 40H78'] },
    collapse: { beds: ['M0 50H55'], rails: ['M0 40H50', 'M0 60H50'] },
} as const;
function MineRailArt({ card, small }: { card: Card; small: boolean }) {
    const { shape, rotation, flipY } = minePathTransform(card), paths = mineRailPaths[shape], w = small ? 54 : 78;
    const transform = `rotate(${rotation} 50 50)${flipY ? ' translate(0 100) scale(1 -1)' : ''}`;
    const isJunction = shape === 'tee' || shape === 'cross' || shape === 'crossDead';
    const sleeperDash = isJunction ? '2.5 8' : '2.5 6';
    const isCross = shape === 'cross' || shape === 'crossDead';
    const bedWidth = isCross ? 26 : 30;
    const sleeperWidth = isCross ? 10 : shape === 'tee' ? 18 : 30;
    return <svg className="mine-rail-art" width={w} height={w} viewBox="0 0 100 100" preserveAspectRatio="none" aria-label={card.label}>
        <defs><linearGradient id={`mine-ground-${card.id}`} x1="0" y1="0" x2="1" y2="1"><stop stopColor="#6f4b22" /><stop offset="1" stopColor="#3d2917" /></linearGradient><filter id={`mine-shadow-${card.id}`}><feDropShadow dx="0" dy="1.4" stdDeviation="1.2" floodColor="#160d06" floodOpacity=".9" /></filter></defs>
        <rect width="100" height="100" fill={`url(#mine-ground-${card.id})`} opacity=".72" />
        <g transform={transform} filter={`url(#mine-shadow-${card.id})`}>
            {paths.beds.map((d, i) => <path key={`bed-${i}`} d={d} fill="none" stroke="#8b642f" strokeWidth={bedWidth} strokeLinecap="butt" strokeLinejoin="round" />)}
            {paths.beds.map((d, i) => <path key={`sleep-${i}`} d={d} fill="none" stroke="#3b2817" strokeWidth={sleeperWidth} strokeDasharray={sleeperDash} strokeLinecap="butt" strokeLinejoin="round" />)}
            {paths.rails.map((d, i) => <path key={`rail-${i}`} d={d} fill="none" stroke="#b18143" strokeWidth="3.2" strokeLinecap="butt" strokeLinejoin="round" />)}
            {shape === 'crossDead' && <circle cx="50" cy="50" r="12" fill="#3b2918" stroke="#6d4c28" strokeWidth="2" />}
            {shape === 'cornerDead' && <path d="M76 35v30M82 36v28" stroke="#382313" strokeWidth="5" />}
            {shape === 'collapse' && <g><circle cx="56" cy="49" r="8" fill="#55402a" /><circle cx="49" cy="55" r="6" fill="#392a1d" /><path d="M45 40l6 7 7-10 8 8" fill="none" stroke="#2b190d" strokeWidth="4" /></g>}
        </g>
    </svg>;
}
function TunnelSvg({ card, small = false, boardSkin = 'board-default' }: { card: Card; small?: boolean; boardSkin?: string }) {
    if (card.type === 'action') {
        const Icon = card.kind === 'delete' ? Hammer : card.kind === 'rotate' ? RotateCcw : card.kind === 'block' ? Ban : card.kind === 'revive' ? HeartPulse : card.kind === 'swap' ? RefreshCcw : Search;
        return <span className="action-art"><Icon aria-hidden="true" /></span>;
    }
    if (boardSkin === 'board-volcano') {
        return <MineRailArt card={card} small={small} />;
    }
    const kind = card.kind as PathKind; const open = dirs(kind, card.rotation); const dead = isDeadPath(kind); const cornerDead = kind === 'nwDead' || kind === 'seDead' || kind === 'swDead'; const deadArm = kind === 'nwDead' ? 'R' : kind === 'seDead' ? 'L' : kind === 'swDead' ? 'R' : null; const w = small ? 54 : 78;
    return <svg className="tunnel-svg" width={w} height={w} viewBox="0 0 100 100" aria-label={card.label}>
        <defs><radialGradient id={`rock-${card.id}`}><stop offset="0" stopColor="#5a4528" /><stop offset="1" stopColor="#21180f" /></radialGradient></defs>
        <rect x="3" y="3" width="94" height="94" rx="12" fill={`url(#rock-${card.id})`} stroke="#82652c" strokeWidth="3" />
        {open.includes('U') && <Tunnel x1={50} y1={0} x2={50} y2={cornerDead ? 52 : dead ? 34 : 52} dead={dead && !cornerDead} />} {open.includes('R') && <Tunnel x1={dead ? 66 : 48} y1={50} x2={100} y2={50} dead={dead} />} {open.includes('D') && <Tunnel x1={50} y1={cornerDead ? 48 : dead ? 66 : 48} x2={50} y2={100} dead={dead && !cornerDead} />} {open.includes('L') && <Tunnel x1={0} y1={50} x2={dead ? 34 : 52} y2={50} dead={dead} />}
        {deadArm === 'R' && <Tunnel x1={48} y1={50} x2={72} y2={50} dead />}
        {deadArm === 'L' && <Tunnel x1={52} y1={50} x2={28} y2={50} dead />}
        {!dead && <circle cx="50" cy="50" r="14" fill="#17120c" stroke="#c49335" strokeWidth="3" />}
        {dead && card.kind !== 'collapse' && <circle cx="50" cy="50" r="9" fill="#30251a" stroke="#82652c" strokeWidth="2" strokeDasharray="3 3" />}
        {card.kind === 'collapse' && <g><circle cx="56" cy="50" r="10" fill="#756b5d" /><circle cx="43" cy="55" r="8" fill="#514b42" /><path d="M35 42l8 7 7-11 8 10 8-7" fill="none" stroke="#bd9b56" strokeWidth="4" /></g>}
    </svg>
}
function Tunnel({ x1, y1, x2, y2, dead = false }: { x1: number; y1: number; x2: number; y2: number; dead?: boolean }) { return <g><line x1={x1} y1={y1} x2={x2} y2={y2} stroke="#100d09" strokeWidth="25" /><line x1={x1} y1={y1} x2={x2} y2={y2} stroke="#d09a35" strokeWidth="3" strokeDasharray="8 7" />{dead && <circle cx={x2 === 0 || x2 === 100 ? x1 : x2} cy={y2 === 0 || y2 === 100 ? y1 : y2} r="5" fill="#17120c" stroke="#b48633" strokeWidth="2" />}</g> }

export default function Game() {
    const { profile, completeMatch } = useAuth(); const navigate = useNavigate(); const [searchParams] = useSearchParams(); const gameRef = useRef<HTMLElement>(null); const logRef = useRef<HTMLDivElement>(null);
    const matchStartedAt = useRef(Date.now()); const [ping, setPing] = useState<number | null>(null); const [reportTarget, setReportTarget] = useState<number | null>(null); const [reportReason, setReportReason] = useState('AFK'); const [reportMessage, setReportMessage] = useState(''); const [state, setState] = useState<GameState>(() => { const roomId = searchParams.get('mode') === 'room' ? searchParams.get('room') : null; if (roomId) { try { const saved = localStorage.getItem(`room-game:${roomId}`); if (saved) return JSON.parse(saved) as GameState } catch { } } const total = Math.min(8, Math.max(6, Number(searchParams.get('players') || 6))); return newGame(profile?.displayName || 'Bạn', total - 1, GOLD_MINE_MAP) }); const [selected, setSelected] = useState<number | null>(null); const [isFullscreen, setIsFullscreen] = useState(false); const [aiThinking, setAiThinking] = useState(false); const [showFullscreenPrompt, setShowFullscreenPrompt] = useState(() => localStorage.getItem('goldmine-fullscreen-choice') !== 'normal'); const [rememberFullscreen, setRememberFullscreen] = useState(false); const [showPlayersModal, setShowPlayersModal] = useState(false); const [showLeaveConfirm, setShowLeaveConfirm] = useState(false); const [special, setSpecial] = useState<SpecialKind | null>(null); const [targetPlayer, setTargetPlayer] = useState<number | null>(null); const [mySwapCard, setMySwapCard] = useState<number | null>(null); const [sabotageMode, setSabotageMode] = useState(false); const [statsSaved, setStatsSaved] = useState(false); const [matchRewards, setMatchRewards] = useState<Record<string, MatchReward> | null>(null);
    const [likedPlayerId, setLikedPlayerId] = useState<string | null>(null);
    const [likePendingId, setLikePendingId] = useState<string | null>(null);
    const [likeMessage, setLikeMessage] = useState('');
    const [friendStatuses, setFriendStatuses] = useState<Record<string, FriendshipStatus>>({});
    const [friendStatusesLoaded, setFriendStatusesLoaded] = useState(false);
    const [friendPendingId, setFriendPendingId] = useState<string | null>(null);
    const [friendMessage, setFriendMessage] = useState('');
    const [boardMessage, setBoardMessage] = useState('Chọn một mảnh đường để xem vị trí có thể đặt.');

    const [roomAccess, setRoomAccess] = useState<'checking' | 'allowed' | 'denied'>(() => searchParams.get('mode') === 'room' ? 'checking' : 'allowed');
    const [onlineMatch, setOnlineMatch] = useState<OnlineMatch | null>(null);
    const [clockNow, setClockNow] = useState(Date.now());
    const [mobileChatOpen, setMobileChatOpen] = useState(false);
    const [mobilePlayerMenuOpen, setMobilePlayerMenuOpen] = useState(false);
    const [chatFabPosition, setChatFabPosition] = useState<{ x: number; y: number } | null>(null);
    const chatFabDrag = useRef<{ pointerId: number; offsetX: number; offsetY: number; startX: number; startY: number; moved: boolean } | null>(null);
    const onlineRoomId = searchParams.get('mode') === 'room' ? searchParams.get('room') : null;
    useEffect(() => { if (onlineRoomId) localStorage.setItem(`room-game:${onlineRoomId}`, JSON.stringify(state)) }, [state, onlineRoomId]);
    useEffect(() => { let cancelled = false; const verify = async () => { if (searchParams.get('mode') !== 'room') { setRoomAccess('allowed'); return } const roomId = searchParams.get('room'); if (!db || !profile || !roomId) { setRoomAccess('denied'); return } try { const snap = await getDoc(doc(db, 'rooms', roomId)); const data = snap.data() as { status?: string; players?: Array<{ uid: string; bot?: boolean }> } | undefined; const member = Boolean(data?.players?.some(p => p.uid === profile.uid)); if (!cancelled) setRoomAccess(snap.exists() && data?.status === 'started' && member ? 'allowed' : 'denied') } catch { if (!cancelled) setRoomAccess('denied') } }; void verify(); return () => { cancelled = true } }, [profile?.uid, searchParams]);
    useEffect(() => { if (!db || !profile || !onlineRoomId || roomAccess !== 'allowed') return; const ref = doc(db, 'matches', onlineRoomId); return onSnapshot(ref, snap => { if (!snap.exists()) { setRoomAccess('denied'); return } const match = decodeOnlineMatch(snap.data() as OnlineMatchDocument); setOnlineMatch(match); setState(match.state) }) }, [profile?.uid, onlineRoomId, roomAccess]);
    useEffect(() => { const timer = window.setInterval(() => setClockNow(Date.now()), 250); return () => window.clearInterval(timer) }, []);
    useEffect(() => { if (!db || !profile || !onlineRoomId || !onlineMatch) return; const beat = async () => { const ref = doc(db!, 'matches', onlineRoomId); await runTransaction(db!, async tx => { const snap = await tx.get(ref); if (!snap.exists()) return; const match = decodeOnlineMatch(snap.data() as OnlineMatchDocument); if (!match.participantIds.includes(profile.uid) || match.presence[profile.uid]?.status === 'left') return; const now = Date.now(); match.presence[profile.uid] = { status: 'online', lastSeen: now, disconnectDeadline: null }; tx.update(ref, { presence: match.presence }) }).catch(() => { }) }; void beat(); const timer = window.setInterval(() => void beat(), 5000); return () => window.clearInterval(timer) }, [profile?.uid, onlineRoomId, Boolean(onlineMatch)]);
    useEffect(() => { if (!db || !onlineRoomId || !onlineMatch?.state || onlineMatch.state.winner) return; const timer = window.setInterval(() => { const now = Date.now(); const turnExpired = now >= onlineMatch.turnDeadline; const stale = Object.values(onlineMatch.presence).some(p => p.status === 'online' && now - p.lastSeen > 12000 || p.status === 'disconnected' && p.disconnectDeadline !== null && now >= p.disconnectDeadline); if (!turnExpired && !stale) return; const expectedTurnStartedAt = onlineMatch.turnStartedAt; const ref = doc(db!, 'matches', onlineRoomId); void runTransaction(db!, async tx => { const snap = await tx.get(ref); if (!snap.exists()) return; const current = decodeOnlineMatch(snap.data() as OnlineMatchDocument); const sameObservedTurn = current.turnStartedAt === expectedTurnStartedAt; if (!sameObservedTurn && !stale) return; const transactionNow = Date.now(); const next = sameObservedTurn && transactionNow >= current.turnDeadline ? timeoutTurn(current, transactionNow) : applyPresenceRules(current, transactionNow); if (next.revision === current.revision && next.state.winner === current.state.winner && next.state.turn === current.state.turn && JSON.stringify(next.presence) === JSON.stringify(current.presence)) return; tx.set(ref, encodeOnlineMatch(next)) }).catch(() => { }) }, 250); return () => window.clearInterval(timer) }, [onlineRoomId, onlineMatch?.turnStartedAt, onlineMatch?.turnDeadline, onlineMatch?.revision, onlineMatch?.state.winner, onlineMatch?.presence]);

    const humanIndex = onlineRoomId && profile ? Math.max(0, state.players.findIndex(player => player.id === profile.uid)) : 0;
    const human = state.players[humanIndex] || state.players[0], current = state.players[state.turn];
    const turnSeconds = onlineMatch ? Math.min(TURN_MS / 1000, Math.max(0, Math.ceil((onlineMatch.turnDeadline - clockNow) / 1000))) : TURN_MS / 1000;
    const turnLabel = state.winner ? 'TRẬN ĐÃ KẾT THÚC' : aiThinking ? `${current.name} ĐANG SUY NGHĨ...` : current?.isBot ? `${current.name} ĐANG ĐI` : state.turn === humanIndex ? `ĐẾN LƯỢT BẠN · ${turnSeconds}s` : `LƯỢT ${current?.name || 'NGƯỜI CHƠI'} · ${turnSeconds}s`;
    const commitGameState = async (transform: (current: GameState) => GameState) => {
        if (!onlineRoomId || !db) { setState(currentState => transform(currentState)); return }
        const ref = doc(db, 'matches', onlineRoomId);
        await runTransaction(db, async tx => { const snap = await tx.get(ref); if (!snap.exists()) return; const match = decodeOnlineMatch(snap.data() as OnlineMatchDocument); const nextState = transform(match.state); if (nextState === match.state) return; const now = Date.now(); const next = applyPresenceRules({ ...match, state: nextState, turnStartedAt: now, turnDeadline: now + TURN_MS, revision: match.revision + 1 }, now); tx.set(ref, encodeOnlineMatch(next)) }).catch(() => { });
    };
    const toggleFullscreen = async () => { try { if (!document.fullscreenElement) await gameRef.current?.requestFullscreen(); else await document.exitFullscreen() } catch { } }
    useEffect(() => { const measure = async () => { const start = performance.now(); try { await fetch('/', { method: 'HEAD', cache: 'no-store' }); setPing(Math.round(performance.now() - start)) } catch { setPing(null) } }; void measure(); const t = window.setInterval(() => void measure(), 10000); return () => window.clearInterval(t) }, []);
    useEffect(() => { const onChange = () => setIsFullscreen(Boolean(document.fullscreenElement)); const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape' && showLeaveConfirm) { setShowLeaveConfirm(false); return } if (e.key.toLowerCase() === 'f' && !e.repeat) { e.preventDefault(); void toggleFullscreen() } }; document.addEventListener('fullscreenchange', onChange); window.addEventListener('keydown', onKey); return () => { document.removeEventListener('fullscreenchange', onChange); window.removeEventListener('keydown', onKey) } }, []);
    useEffect(() => { const close = (e: KeyboardEvent) => { if (e.key === 'Escape') setShowLeaveConfirm(false) }; window.addEventListener('keydown', close); return () => window.removeEventListener('keydown', close) }, []);
    useEffect(() => { if (current?.isBot && !state.winner) { setAiThinking(true); const expectedTurn = state.turn; const delay = 2500 + Math.random() * 1000; const t = setTimeout(() => { void commitGameState(s => s.turn === expectedTurn && s.players[s.turn]?.isBot ? botMove(s) : s); setAiThinking(false) }, delay); return () => { clearTimeout(t); setAiThinking(false) } } }, [state.turn, state.winner, current?.isBot]);
    useEffect(() => {
        if (!state.winner || matchRewards) return;
        const pool = state.rewardPool || MATCH_CHEST_REWARD;
        const winners = state.players.filter(player => state.winner === (player.role === 'miner' ? 'miners' : 'wolves'));
        const rewards: Record<string, MatchReward> = Object.fromEntries(state.players.map(player => [player.id, { exp: 0, coins: 0 }]));
        winners.forEach((player, index) => {
            rewards[player.id] = {
                exp: Math.floor(pool.exp / winners.length) + (index < pool.exp % winners.length ? 1 : 0),
                coins: Math.floor(pool.coins / winners.length) + (index < pool.coins % winners.length ? 1 : 0),
            };
        });
        setMatchRewards(rewards);
    }, [state.winner, state.matchId, state.rewardPool, state.players, matchRewards]);
    useEffect(() => { if (!state.winner || !matchRewards || statsSaved) return; const reward = matchRewards[human.id]; if (!reward) return; setStatsSaved(true); void completeMatch(state.winner === (human.role === 'miner' ? 'miners' : 'wolves'), state.matchId, reward, { role: human.role, turns: state.logs.length, durationSeconds: Math.floor((Date.now() - matchStartedAt.current) / 1000), opponents: state.players.filter(p => p.id !== human.id).map(p => p.name), rankEligible: Boolean(onlineRoomId) && state.players.every(player => !player.isBot) }) }, [state.winner, statsSaved, state.matchId, matchRewards, human.id, human.role, completeMatch, onlineRoomId, state.players]);
    useEffect(() => {
        if (!state.winner || !profile || !onlineRoomId) return;
        let active = true;
        void getGivenLikeInMatch(profile.uid, onlineRoomId)
            .then(receiverId => { if (active) setLikedPlayerId(receiverId) })
            .catch(() => { if (active) setLikeMessage('Không thể tải trạng thái cảm ơn.') });
        return () => { active = false };
    }, [state.winner, profile?.uid, onlineRoomId]);
    useEffect(() => {
        if (!state.winner || !profile || !onlineRoomId) return;
        let active = true;
        setFriendStatusesLoaded(false);
        const players = state.players.filter(player => !player.isBot && player.id !== profile.uid);
        void Promise.all(players.map(async player => [player.id, await friendshipStatus(profile.uid, player.id)] as const))
            .then(entries => { if (active) { setFriendStatuses(Object.fromEntries(entries)); setFriendStatusesLoaded(true) } })
            .catch(() => { if (active) setFriendMessage('Không thể tải trạng thái kết bạn.') });
        return () => { active = false };
    }, [state.winner, profile?.uid, onlineRoomId, state.matchId]);
    const thankPlayer = async (playerId: string) => {
        if (!profile || !onlineRoomId || likedPlayerId || likePendingId) return;
        setLikePendingId(playerId);
        setLikeMessage('');
        try {
            const saved = await giveLike(profile.uid, playerId, onlineRoomId);
            if (!saved) throw new Error('Không thể ghi nhận lượt cảm ơn.');
            setLikedPlayerId(playerId);
            setLikeMessage('Đã gửi lời cảm ơn. Mỗi trận bạn chỉ có một lượt.');
        } catch (error) {
            setLikeMessage(error instanceof Error ? error.message : 'Không thể gửi lời cảm ơn lúc này.');
        } finally {
            setLikePendingId(null);
        }
    };
    const connectPlayer = async (player: GameState['players'][number]) => {
        if (!profile || !onlineRoomId || player.isBot || friendPendingId || !friendStatusesLoaded) return;
        const status = friendStatuses[player.id] || 'none';
        if (status === 'friends' || status === 'sent') return;
        setFriendPendingId(player.id);
        setFriendMessage('');
        try {
            if (status === 'received') {
                await acceptFriendRequest(profile, {
                    uid: player.id,
                    fromUid: player.id,
                    toUid: profile.uid,
                    displayName: player.name,
                    photoURL: player.avatar || '',
                    rank: player.rank || 'Tân binh',
                    equipped: player.equipped || {},
                });
                setFriendStatuses(current => ({ ...current, [player.id]: 'friends' }));
                setFriendMessage(`Bạn và ${player.name} đã trở thành bạn bè.`);
            } else {
                await sendFriendRequest(profile, {
                    uid: player.id,
                    displayName: player.name,
                    photoURL: player.avatar || '',
                    rank: player.rank || 'Tân binh',
                    equipped: player.equipped || {},
                });
                setFriendStatuses(current => ({ ...current, [player.id]: 'sent' }));
                setFriendMessage(`Đã gửi lời mời kết bạn tới ${player.name}.`);
            }
        } catch (error) {
            setFriendMessage(error instanceof Error ? error.message : 'Không thể cập nhật lời mời kết bạn.');
        } finally {
            setFriendPendingId(null);
        }
    };
    useEffect(() => { const frame = requestAnimationFrame(() => { const el = logRef.current; if (!el) return; el.scrollTop = 0; }); return () => cancelAnimationFrame(frame) }, [state.logs]);
    const chooseFullscreen = async (full: boolean) => { if (rememberFullscreen) localStorage.setItem('goldmine-fullscreen-choice', full ? 'fullscreen' : 'normal'); setShowFullscreenPrompt(false); if (full) await toggleFullscreen() };
    const playable = state.turn === humanIndex && !state.winner && !aiThinking; const selectedCard = selected === null ? null : human.hand[selected];
    const select = (i: number) => { if (!playable) return; setSabotageMode(false); const card = human.hand[i]; if (card?.kind === 'block' || card?.kind === 'revive' || card?.kind === 'swap') { setSelected(i); setSpecial(card.kind); setTargetPlayer(null); setMySwapCard(null); return } const next = selected === i ? null : i; setSelected(next); if (next === null) { setBoardMessage('Chọn một mảnh đường để xem vị trí có thể đặt.'); return } if (card?.type === 'path') { let legal = 0; for (let r = 0; r < state.map.rows; r++)for (let c = 0; c < state.map.cols; c++)if (isValidPlacement(state.board, card, r, c, state.map, state.obstacles)) legal++; setBoardMessage(legal ? `Có ${legal} vị trí hợp lệ cho ${card.label}.` : 'Mảnh này hiện chưa có vị trí hợp lệ. Hãy chọn mảnh khác hoặc bỏ bài.') } };
    const discardSelected = () => { if (!playable || selected === null) return; void commitGameState(s => discardCard(s, humanIndex, selected)); setSelected(null) };
    const clickCell = (r: number, c: number) => { if (!playable) { setBoardMessage('Chưa đến lượt của bạn.'); return } if (sabotageMode) { void commitGameState(s => useSabotage(s, humanIndex, r, c)); setSabotageMode(false); return } if (selected === null) { setBoardMessage('Hãy chọn một mảnh đường trước.'); return } if (selectedCard?.type === 'action') { if (selectedCard.kind === 'delete' || selectedCard.kind === 'rotate') { void commitGameState(s => useAction(s, humanIndex, selected, r, c)); setSelected(null) } else setBoardMessage(selectedCard.kind === 'scout' ? 'Hãy chọn một rương để thăm dò.' : 'Hãy chọn mục tiêu trong cửa sổ chức năng.'); return } if (!selectedCard || !isValidPlacement(state.board, selectedCard, r, c, state.map, state.obstacles)) { if (selectedCard) setBoardMessage(placementReason(state.board, selectedCard, r, c, state.map, state.obstacles)); return } void commitGameState(s => placeCard(s, humanIndex, selected, r, c)); setSelected(null); setBoardMessage('Đã đặt mảnh đường. Chọn một lá cho lượt tiếp theo.') };
    const useSpecialTarget = (target: number) => { if (!special || !playable || selected === null) return; if (special === 'block') { void commitGameState(s => useBlock(s, humanIndex, target, selected)); setSelected(null); setSpecial(null) } else if (special === 'revive') { void commitGameState(s => useRevive(s, humanIndex, target, selected)); setSelected(null); setSpecial(null) } else setTargetPlayer(target) };
    const finishSwap = (targetCard: number) => { if (targetPlayer === null || mySwapCard === null || selected === null) return; void commitGameState(s => useSwap(s, humanIndex, mySwapCard, targetPlayer, targetCard, selected)); setSelected(null); setSpecial(null); setTargetPlayer(null); setMySwapCard(null) };
    const clickTreasure = (id: string) => { if (!playable || selected === null || selectedCard?.kind !== 'scout') return; void commitGameState(s => scoutTreasure(s, humanIndex, selected, id)); setSelected(null) };
    const leaveTable = async () => { if (document.fullscreenElement) await document.exitFullscreen().catch(() => { }); if (onlineRoomId && db && profile) { const ref = doc(db, 'matches', onlineRoomId); await runTransaction(db, async tx => { const snap = await tx.get(ref); if (!snap.exists()) return; const match = decodeOnlineMatch(snap.data() as OnlineMatchDocument); const presence = match.presence[profile.uid]; if (!presence) return; match.presence[profile.uid] = { ...presence, status: 'left', disconnectDeadline: null, lastSeen: Date.now() }; const next = applyPresenceRules(match, Date.now()); tx.set(ref, encodeOnlineMatch({ ...next, revision: next.revision + 1 })) }).catch(() => { }); localStorage.removeItem(`room-game:${onlineRoomId}`); localStorage.removeItem(`active-room:${profile.uid}`) } navigate('/room') };
    const startChatFabDrag = (e: React.PointerEvent<HTMLButtonElement>) => { const rect = e.currentTarget.getBoundingClientRect(); chatFabDrag.current = { pointerId: e.pointerId, offsetX: e.clientX - rect.left, offsetY: e.clientY - rect.top, startX: e.clientX, startY: e.clientY, moved: false }; e.currentTarget.setPointerCapture(e.pointerId) };
    const moveChatFab = (e: React.PointerEvent<HTMLButtonElement>) => { const drag = chatFabDrag.current; if (!drag || drag.pointerId !== e.pointerId) return; if (Math.hypot(e.clientX - drag.startX, e.clientY - drag.startY) > 5) drag.moved = true; const size = 48, pad = 8; setChatFabPosition({ x: Math.max(pad, Math.min(window.innerWidth - size - pad, e.clientX - drag.offsetX)), y: Math.max(pad, Math.min(window.innerHeight - size - pad, e.clientY - drag.offsetY)) }) };
    const endChatFabDrag = (e: React.PointerEvent<HTMLButtonElement>) => { const drag = chatFabDrag.current; if (!drag || drag.pointerId !== e.pointerId) return; chatFabDrag.current = null; e.currentTarget.releasePointerCapture(e.pointerId); if (!drag.moved) setMobileChatOpen(true) };
    const roleText = human.role === 'miner' ? 'THỢ ĐÀO' : 'SÓI';
    const playerExp = Math.max(0, profile?.exp || 0); const playerLevel = levelFromExp(playerExp); const levelStart = expForLevel(playerLevel); const levelEnd = expForLevel(playerLevel + 1); const levelProgress = Math.min(100, Math.max(0, ((playerExp - levelStart) / Math.max(1, levelEnd - levelStart)) * 100));
    const boardSkin = onlineRoomId ? (onlineMatch?.boardSkin || 'board-default') : (profile?.equipped.boardSkin || 'board-default');
    const glowingRoute = useMemo(() => longestTreasureRoute(state.board, state.map), [state.board, state.map]);
    const treasureApproach = useMemo(() => {
        let nearest = Infinity;
        for (const position of glowingRoute) {
            const [r, c] = position.split(',').map(Number);
            for (const objective of state.map.objectives) {
                const targetRow = objective.side === 'top' ? 0 : objective.side === 'bottom' ? state.map.rows - 1 : objective.row!;
                const targetCol = objective.side === 'left' ? 0 : objective.side === 'right' ? state.map.cols - 1 : objective.col!;
                nearest = Math.min(nearest, Math.abs(r - targetRow) + Math.abs(c - targetCol));
            }
        }
        return { distance: nearest };
    }, [glowingRoute, state.map]);
    const boardTheme = boardSkin === 'board-ice'
        ? { obstacle: '/images/board-skins/ice-block.png', obstacleAlt: 'Khối băng dày', treasure: '/images/board-skins/ice-chest.png', treasureAlt: 'Rương băng', entrance: 'CỬA BĂNG' }
        : boardSkin === 'board-shipwreck'
            ? { obstacle: '/images/board-skins/shipwreck.png', obstacleAlt: 'Xác tàu cổ', treasure: '/images/board-skins/gold-chest.png', treasureAlt: 'Rương báu vàng', entrance: 'XÁC TÀU' }
            : { obstacle: '/images/board-skins/mine-rock.png', obstacleAlt: 'Vách đá', treasure: '/images/board-skins/treasure-chest.png', treasureAlt: 'Rương kho báu', entrance: 'CỬA HẦM' };
    const openedChest = (isGold: boolean) => boardSkin === 'board-ice'
        ? `/images/board-skins/ice-open-${isGold ? 'gold' : 'empty'}.png`
        : boardSkin === 'board-shipwreck'
            ? `/images/board-skins/shipwreck-open-${isGold ? 'gold' : 'empty'}.png`
            : `/images/board-skins/open-${isGold ? 'gold' : 'empty'}-chest.png`;
    if (roomAccess === 'checking') return <section className="center-page"><div className="auth-card"><Pickaxe className="spin-slow" /><h1>ĐANG XÁC MINH PHÒNG</h1></div></section>;
    if (roomAccess === 'denied') return <section className="center-page"><div className="auth-card"><Shield /><h1>KHÔNG THỂ VÀO TRẬN</h1><p>Phòng không hợp lệ, chưa bắt đầu hoặc bạn không thuộc phòng này.</p><button className="btn btn-primary" onClick={() => navigate('/room', { replace: true })}>VỀ PHÒNG CHỜ</button></div></section>;
    return <section className={`game-page ${boardSkin} ${profile?.equipped.pieceSkin || 'piece-default'}`} ref={gameRef}>
        <div className="orientation-hint" role="dialog" aria-modal="true" aria-label="Yêu cầu xoay ngang màn hình"><div className="orientation-hint-card"><span className="orientation-phone"><RotateCcw aria-hidden="true" /></span><span className="eyebrow">TRẢI NGHIỆM MOBILE</span><h2>VUI LÒNG XOAY NGANG MÀN HÌNH</h2><p>Trò chơi trên điện thoại chỉ khả dụng ở chế độ màn hình ngang.</p></div></div>
        {showFullscreenPrompt && <div className="fullscreen-prompt"><div className="fullscreen-card"><button className="prompt-close" onClick={() => setShowFullscreenPrompt(false)}><X /></button><span className="eyebrow">CHẾ ĐỘ TRẬN ĐẤU</span><h2>SẴN SÀNG ĐÀO VÀNG?</h2><p>Khuyến nghị bật toàn màn hình để thấy trọn bàn cờ và bảng điều khiển.</p><button className="btn btn-primary btn-wide" onClick={() => void chooseFullscreen(true)}><Expand /> BẬT TOÀN MÀN HÌNH</button><button className="btn btn-ghost btn-wide" onClick={() => void chooseFullscreen(false)}>CHƠI BÌNH THƯỜNG</button><label><input type="checkbox" checked={rememberFullscreen} onChange={e => setRememberFullscreen(e.target.checked)} /> Ghi nhớ lựa chọn</label><small>Nhấn <b>F</b> để bật/tắt fullscreen.</small></div></div>}
        <div className="game-top"><div><span>{`MAP: ${state.map.id.toUpperCase()}`}</span><h1>{state.map.name}</h1></div><div className="hud-status"><div className={`turn-pill ${turnSeconds <= 3 && !state.winner ? 'turn-ending' : ''}`}><Clock3 /> {turnLabel}</div></div><div className="game-actions"><span className={`ping-badge ${ping === null ? 'offline' : ping < 100 ? 'good' : ping < 220 ? 'medium' : 'bad'}`} title="Độ trễ mạng"><b>{ping === null ? '--' : ping}</b><small>ms</small></span><button aria-label="Cài đặt" title="Cài đặt" className="btn btn-ghost btn-small action-settings" onClick={() => setShowPlayersModal(true)}><Settings /><span>Cài đặt</span></button><button aria-label={isFullscreen ? 'Thu nhỏ' : 'Toàn màn hình'} title={isFullscreen ? 'Thu nhỏ' : 'Toàn màn hình'} className="btn btn-ghost btn-small action-fullscreen" onClick={() => void toggleFullscreen()}>{isFullscreen ? <Minimize /> : <Expand />}<span>{isFullscreen ? 'Thu nhỏ' : 'Toàn màn hình'}</span></button><button aria-label="Rời bàn" title="Rời bàn" className="btn btn-danger btn-small action-leave" onClick={() => setShowLeaveConfirm(true)}><DoorOpen /><span>Rời bàn</span></button></div></div>
        <button className={`mobile-chat-fab ${chatFabPosition ? 'is-dragged' : ''}`} style={chatFabPosition ? { '--chat-x': `${chatFabPosition.x}px`, '--chat-y': `${chatFabPosition.y}px` } as React.CSSProperties : undefined} onPointerDown={startChatFabDrag} onPointerMove={moveChatFab} onPointerUp={endChatFabDrag} onPointerCancel={() => { chatFabDrag.current = null }} onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setMobileChatOpen(true) } }} aria-label="Mở hoặc di chuyển trò chuyện"><MessageCircle /><span>TRÒ CHUYỆN</span></button>
        {mobilePlayerMenuOpen && <div className="mobile-player-menu-backdrop" onClick={() => setMobilePlayerMenuOpen(false)}><div className="mobile-player-menu" role="menu" onClick={e => e.stopPropagation()}><button role="menuitem" onClick={() => { setMobilePlayerMenuOpen(false); setShowPlayersModal(true) }}><Settings /> CÀI ĐẶT</button><button role="menuitem" className="danger" onClick={() => { setMobilePlayerMenuOpen(false); setShowLeaveConfirm(true) }}><DoorOpen /> RỜI BÀN</button></div></div>}
        <div className="game-layout-v5">
            <main className="board-wrap">
                <div className={`mine-board-shell dynamic ${treasureApproach.distance <= 1 ? 'treasure-near-1' : treasureApproach.distance === 2 ? 'treasure-near-2' : treasureApproach.distance === 3 ? 'treasure-near-3' : ''}`}>
                    <div className="mine-entrance" aria-label={boardTheme.entrance}>{boardSkin === 'board-volcano' ? <><div className="mine-entrance-tile mine-entrance-upper"><img className="mine-entrance-sprite" src="/images/board-skins/mine-portal.png" alt="Cửa hầm khung gỗ" /><svg viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true"><path d="M50 48V100" stroke="#8b642f" strokeWidth="30" /><path d="M50 48V100" stroke="#3b2817" strokeWidth="30" strokeDasharray="2.5 6" /><path d="M40 48V100M60 48V100" stroke="#b18143" strokeWidth="3.2" /></svg></div><div className="mine-entrance-tile mine-entrance-lower"><svg viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true"><path d="M50 0V28Q50 50 72 50H100" stroke="#8b642f" strokeWidth="30" fill="none" /><path d="M50 0V28Q50 50 72 50H100" stroke="#3b2817" strokeWidth="30" strokeDasharray="2.5 6" fill="none" /><path d="M40 0V28Q40 40 72 40H100M60 0V28Q60 60 72 60H100" stroke="#b18143" strokeWidth="3.2" fill="none" /></svg></div></> : <span><Pickaxe aria-hidden="true" /></span>}<b>{boardTheme.entrance}</b><i /></div>
                    <div className="board dynamic-board" style={{ gridTemplateColumns: `repeat(${state.map.cols},1fr)`, gridTemplateRows: `repeat(${state.map.rows},1fr)` }}>
                        {state.board.map((row, r) => row.map((cell, c) => {
                            const legal = playable && human.blockedTurns <= 0 && selectedCard?.type === 'path' && !cell && isValidPlacement(state.board, selectedCard, r, c, state.map, state.obstacles);
                            const obstacle = state.obstacles.includes(`${r},${c}`);
                            const routeGlow = glowingRoute.has(`${r},${c}`);
                            const approachGlow = treasureApproach.distance <= 3 && routeGlow;

                            let tooltip = '';
                            if (cell?.card?.type === 'path') {
                                const directions = pathDirectionsText(cell.card);
                                tooltip = `${cell.card.label} · Lối mở: ${directions || 'Không có'}`;
                            }

                            return (
                                <button
                                    disabled={obstacle}
                                    onClick={() => clickCell(r, c)}
                                    key={`${r}-${c}`}
                                    className={`cell ${cell ? 'occupied' : ''} ${legal ? 'legal' : ''} ${obstacle ? 'obstacle' : ''} ${routeGlow ? 'route-glow' : ''} ${approachGlow ? 'approach-glow' : ''}`}
                                    data-tooltip={tooltip || undefined}
                                    title={tooltip || undefined}
                                >
                                    <span className="grid-coord">{String.fromCharCode(65 + c)}{r + 1}</span>
                                    {obstacle ? (
                                        <div className="obstacle-art cliff">
                                            <img className="board-obstacle-sprite" src={boardTheme.obstacle} alt={boardTheme.obstacleAlt} />
                                        </div>
                                    ) : (
                                        cell && <TunnelSvg card={cell.card} small boardSkin={boardSkin} />
                                    )}
                                </button>
                            );
                        }))}
                    </div>
                    <div className="treasure-column compact" style={{ gridTemplateRows: `repeat(${state.map.rows},1fr)` }}>{state.map.objectives.map(o => { const t = state.treasures.find(x => x.id === o.id)!; const peek = t.peekedBy.includes(human.id), opened = peek || t.revealed; return <button onClick={() => clickTreasure(o.id)} key={o.id} className={`treasure-slot ${t.revealed ? 'revealed' : ''} ${t.revealed && t.isGold ? 'gold' : ''} ${peek ? 'peeked' : ''} ${peek ? (t.isGold ? 'peeked-gold' : 'peeked-fake') : ''}`} style={{ gridRow: (o.row ?? 0) + 1 }} title={t.revealed ? (t.isGold ? 'Kho báu thật' : 'Rương giả') : peek ? (t.isGold ? 'Bạn đã thăm dò: KHO BÁU THẬT' : 'Bạn đã thăm dò: RƯƠNG GIẢ') : 'Rương bí ẩn'}><span>{opened ? <img className={`board-open-chest ${t.isGold ? 'is-gold' : 'is-empty'}`} src={openedChest(t.isGold)} alt={t.isGold ? 'Rương kho báu mở, vàng tràn ra ngoài' : 'Rương giả mở và trống rỗng'} /> : <img className="board-treasure-sprite" src={boardTheme.treasure} alt={boardTheme.treasureAlt} />}</span>{peek && !t.revealed && <b>{t.isGold ? 'THẬT' : 'GIẢ'}</b>}</button> })}</div>
                </div>
                <div className="board-help" role="status" aria-live="polite">{boardMessage}</div>
            </main>
            <aside className={`battle-right-column ${mobileChatOpen ? 'mobile-chat-open' : ''}`}>
                <button className="mobile-chat-close" onClick={() => setMobileChatOpen(false)} aria-label="Đóng trò chuyện"><X /> ĐÓNG</button>
                <section className="battle-journal panel" ref={logRef}>
                    <ChatPanel compact systemMessages={state.logs.slice(0, 20)} roomId={searchParams.get('room') || `match-${state.matchId}`} />
                </section>
            </aside>
        </div>
        <div className={`mobile-turn-strip ${turnSeconds <= 3 && !state.winner ? 'turn-ending' : ''}`}><Clock3 />{turnLabel}</div>
        <footer className="game-bottom-hud redesigned-bottom-hud">
            <div className="player-hand-row">
                <section className="player-progress-card">
                    <div className="progress-avatar-wrap"><button type="button" className={`progress-avatar ${cosmeticClass(profile?.equipped.frame)}`} aria-label="Mở menu người chơi" onClick={() => setMobilePlayerMenuOpen(v => !v)}>{profile?.photoURL ? <img src={profile.photoURL} alt="" /> : <UserRound />}</button><i className="online-dot" /></div>
                    <div className={`progress-player-copy ${cosmeticClass(profile?.equipped.nameplate)}`}><div className="progress-name-line"><b className={cosmeticClass(profile?.equipped.nameColor)}>{human.name}</b><span><Sparkles /> LV. {playerLevel}</span></div><strong className={`${human.role} equipped-title ${cosmeticClass(profile?.equipped.title)}`}>{itemById(profile?.equipped.title)?.name || roleText}</strong><div className="exp-values"><small>{playerExp.toLocaleString('vi-VN')} / {levelEnd.toLocaleString('vi-VN')}</small></div><div className="exp-track"><i style={{ width: `${levelProgress}%` }} /></div></div>
                </section>
                <section className={`hand-hud-panel ${!playable ? 'is-waiting' : ''}`}><header className={`hand-role-header role-${human.role}`}><b>VAI TRÒ</b><small><Shield aria-hidden="true" />{roleText}</small></header><div className="hand-hud-cards">{human.hand.map((card, i) => <button data-slot={i + 1} onClick={() => select(i)} className={`hand-hud-card ${card.type} ${card.kind} ${human.blockedTurns > 0 && card.type === 'path' ? 'movement-locked' : ''} ${selected === i ? 'selected' : ''}`} key={card.id} title={human.blockedTurns > 0 && card.type === 'path' ? 'Đang bị Chặn: chỉ có thể bỏ lá này' : card.type === 'path' ? `${card.label} · Lối mở: ${pathDirectionsText(card)}` : card.label}><span><TunnelSvg card={card} boardSkin={boardSkin} /></span><b>{card.label}</b><small>{card.type === 'path' ? `MỞ: ${pathDirectionsText(card)}` : 'CHỨC NĂNG'}</small></button>)}</div><button className="hand-hud-discard" disabled={!playable || selected === null} onClick={discardSelected}><Trash2 /><span>BỎ BÀI</span></button>
                    {human.canSabotage && <section className="bottom-special-hand wolf-only-skill">
                        <header><span>KỸ NĂNG SÓI</span><small>Kỹ năng bí mật dùng một lần</small></header>
                        <div className="bottom-special-grid"><button className={`bottom-special-card sabotage ${sabotageMode ? 'selected' : ''}`} disabled={!playable || human.sabotageUsed} onClick={() => { setSelected(null); setSabotageMode(v => !v) }}><Hammer /><span><em>KỸ NĂNG SÓI</em><b>PHÁ SẬP HẦM</b><small>Phá tâm và 4 mảnh kề · dùng 1 lần</small></span></button></div>
                    </section>}
                </section>
            </div>
        </footer>

        {state.winner && matchRewards && <div className="match-summary-modal"><div className="match-summary-card"><header><div><span className="eyebrow">TỔNG KẾT TRẬN ĐẤU</span><h2>{state.winner === 'miners' ? 'THỢ ĐÀO CHIẾN THẮNG' : 'SÓI CHIẾN THẮNG'}</h2><p>Vai trò đã được công khai. Hãy cảm ơn hoặc kết bạn với những người đã tạo nên trận đấu hay.</p></div><Trophy aria-hidden="true" /></header><div className="match-summary-table"><div className="summary-head"><span>NGƯỜI CHƠI</span><span>VAI TRÒ</span><span>KẾT QUẢ</span><span>VÀNG</span><span>EXP</span><span>TƯƠNG TÁC</span></div>{state.players.map((p, i) => { const won = state.winner === (p.role === 'miner' ? 'miners' : 'wolves'); const reward = matchRewards[p.id]; const alreadyLiked = likedPlayerId === p.id; const canThank = Boolean(onlineRoomId) && i !== humanIndex && !p.isBot && !likedPlayerId; const friendStatus = friendStatuses[p.id] || 'none'; const canConnect = friendStatusesLoaded && Boolean(onlineRoomId) && i !== humanIndex && !p.isBot && friendStatus !== 'friends' && friendStatus !== 'sent'; const friendLabel = !friendStatusesLoaded && onlineRoomId && i !== humanIndex && !p.isBot ? 'Đang tải...' : friendStatus === 'friends' ? 'Đã là bạn' : friendStatus === 'sent' ? 'Đã gửi' : friendStatus === 'received' ? 'Chấp nhận' : 'Kết bạn'; return <div className={`summary-row ${i === humanIndex ? 'is-you' : ''} ${won ? 'is-winner' : ''}`} key={p.id}><PlayerIdentity compact player={{ name: `${p.name}${i === humanIndex ? ' (Bạn)' : ''}`, bot: p.isBot, photoURL: p.avatar, rank: p.rank, equipped: p.equipped }} /><span><strong className={`role-chip ${p.role}`}>{p.role === 'miner' ? 'THỢ ĐÀO' : p.canSabotage ? 'SÓI PHÁ HẦM' : 'SÓI'}</strong></span><span><strong className={won ? 'result-win' : 'result-loss'}>{won ? 'THẮNG' : 'THUA'}</strong></span><span className="reward-value coins"><Coins /> +{reward.coins}</span><span className="reward-value exp"><Sparkles /> +{reward.exp}</span><span className="summary-social"><button className={`like-btn ${alreadyLiked ? 'liked' : ''}`} disabled={!canThank || likePendingId !== null} onClick={() => void thankPlayer(p.id)} aria-label={alreadyLiked ? `Đã cảm ơn ${p.name}` : `Cảm ơn ${p.name}`}><HeartPulse className={alreadyLiked ? 'filled' : ''} /><small>{likePendingId === p.id ? 'Đang gửi...' : alreadyLiked ? 'Đã cảm ơn' : 'Cảm ơn'}</small></button><button className={`friend-summary-btn status-${friendStatus}`} disabled={!canConnect || friendPendingId !== null} onClick={() => void connectPlayer(p)} aria-label={`${friendLabel} ${p.name}`}><UserPlus /><small>{friendPendingId === p.id ? 'Đang gửi...' : friendLabel}</small></button></span></div> })}</div>{likeMessage && <p className={`like-feedback ${likedPlayerId ? 'success' : 'error'}`} role="status">{likeMessage}</p>}{friendMessage && <p className={`like-feedback ${friendMessage.startsWith('Không') ? 'error' : 'success'}`} role="status">{friendMessage}</p>}<footer><div className="your-reward"><small>PHẦN THƯỞNG CỦA BẠN</small><b><Coins /> +{matchRewards[human.id].coins} vàng</b><b><Sparkles /> +{matchRewards[human.id].exp} EXP</b><span>{statsSaved ? 'Đã ghi nhận vào hồ sơ.' : 'Đang ghi nhận phần thưởng...'}</span></div><button className="btn btn-primary" onClick={() => void leaveTable()}>HOÀN TẤT & RỜI BÀN</button></footer></div></div>}

        {special && <div className="leave-modal special-modal" onMouseDown={e => { if (e.target === e.currentTarget) { setSpecial(null); setTargetPlayer(null); setMySwapCard(null) } }}><div className={`leave-card special-card skill-${special}`}><button className="prompt-close" onClick={() => { setSpecial(null); setTargetPlayer(null); setMySwapCard(null) }}><X /></button><div className="special-hero-icon">{special === 'block' ? <Ban aria-hidden="true" /> : special === 'revive' ? <HeartPulse aria-hidden="true" /> : <RefreshCcw aria-hidden="true" />}</div><span className="eyebrow">LÁ ĐẶC BIỆT</span><h2>{special === 'block' ? 'CHẶN ĐƯỜNG' : special === 'revive' ? 'HỒI SINH' : 'ĐỔI BÀI ÚP'}</h2>{special === 'swap' && mySwapCard === null ? <><p>Chọn một lá bài của bạn để mang đi đổi.</p><div className="swap-my-cards">{human.hand.map((c, i) => <button key={c.id} onClick={() => setMySwapCard(i)}><TunnelSvg card={c} small boardSkin={boardSkin} /><b>{c.label}</b></button>)}</div></> : targetPlayer === null ? <><p>{special === 'revive' ? 'Chọn chính bạn hoặc một người khác đang bị Chặn.' : special === 'swap' ? 'Chọn người chơi bạn muốn đổi bài.' : 'Chọn người chơi mục tiêu.'}</p><div className="special-player-list">{state.players.map((p, i) => special === 'block' && i === humanIndex ? null : <button disabled={(special === 'revive' && p.blockedTurns <= 0) || (special === 'block' && p.blockedTurns > 0)} key={p.id} onClick={() => useSpecialTarget(i)}><span>{i === humanIndex ? <UserRound aria-hidden="true" /> : p.isBot ? <Bot aria-hidden="true" /> : <UserRound aria-hidden="true" />}</span><b>{p.name}{i === 0 ? ' (Bạn)' : ''}</b><small>{p.blockedTurns > 0 ? 'ĐANG BỊ CHẶN' : `${p.hand.length} lá úp`}</small></button>)}</div></> : <><p>Chọn một lá đang úp của {state.players[targetPlayer].name}. Bạn chỉ biết lá gì sau khi đổi.</p><div className="facedown-cards">{state.players[targetPlayer].hand.map((_, i) => <button key={i} onClick={() => finishSwap(i)}><span><Box aria-hidden="true" /></span><b>LÁ {i + 1}</b></button>)}</div></>}</div></div>}

        {showPlayersModal && <div className="leave-modal players-settings-modal" onMouseDown={e => { if (e.target === e.currentTarget) setShowPlayersModal(false) }}><div className="leave-card players-settings-card"><button className="prompt-close" onClick={() => setShowPlayersModal(false)}><X /></button><div className="mobile-settings-compact"><Settings /><div><b>NGƯỜI CHƠI</b><small>{state.players.length} người trong trận</small></div></div><div className="mobile-settings-player-list">{state.players.map((p, i) => <div className={`mobile-settings-player ${state.turn === i ? 'active' : ''}`} key={p.id}><PlayerIdentity compact active={state.turn === i} profileUrl={p.isBot ? undefined : profileUrl(p.name)} player={{ name: p.name, bot: p.isBot, photoURL: p.avatar, rank: p.rank, equipped: p.equipped }} />{state.turn === i && <i>ĐANG ĐI</i>}</div>)}</div><div className="settings-modal-head"><Settings /><div><span className="eyebrow">CÀI ĐẶT TRẬN ĐẤU</span><h2>NGƯỜI CHƠI</h2></div></div><div className="settings-player-list">{state.players.map((p, i) => <div className={`player-row ${state.turn === i ? 'active' : ''}`} key={p.id}><PlayerIdentity compact active={state.turn === i} profileUrl={p.isBot ? undefined : profileUrl(p.name)} player={{ name: i === humanIndex ? `${p.name} - ${roleText}` : p.name, bot: p.isBot, photoURL: p.avatar, rank: p.rank, equipped: p.equipped }} />{i !== humanIndex && !p.isBot && <button className="report-mini" onClick={() => setReportTarget(i)}>BÁO CÁO</button>}</div>)}</div><button className="btn btn-primary btn-wide settings-close-button" onClick={() => setShowPlayersModal(false)}>ĐÓNG</button></div></div>}
        {reportTarget !== null && <div className="leave-modal" onMouseDown={e => { if (e.target === e.currentTarget) setReportTarget(null) }}><div className="leave-card report-card"><button className="prompt-close" onClick={() => setReportTarget(null)}><X /></button><Shield /><span className="eyebrow">BÁO CÁO NGƯỜI CHƠI</span><h2>{state.players[reportTarget]?.name}</h2><select value={reportReason} onChange={e => setReportReason(e.target.value)}><option>AFK</option><option>Spam</option><option>Tên phản cảm</option><option>Phá game</option><option>Nghi gian lận</option></select><button className="btn btn-danger btn-wide" onClick={async () => { if (!db || !profile || reportTarget === null) return; const target = state.players[reportTarget]; const id = `${state.matchId}_${profile.uid}_${target.id}`; try { await setDoc(doc(db, 'reports', id), { matchId: state.matchId, reporterUid: profile.uid, targetId: target.id, targetName: target.name, reason: reportReason, createdAt: serverTimestamp() }); setReportMessage('Đã gửi báo cáo.'); setReportTarget(null) } catch (e: any) { setReportMessage(e?.message || 'Không thể gửi báo cáo.') } }}>GỬI BÁO CÁO</button></div></div>}
        {reportMessage && <div className="game-toast" onClick={() => setReportMessage('')}>{reportMessage}</div>}
        {showLeaveConfirm && <div className="leave-modal" onMouseDown={e => { if (e.target === e.currentTarget) setShowLeaveConfirm(false) }}><div className="leave-card"><DoorOpen /><span className="eyebrow">XÁC NHẬN</span><h2>RỜI BÀN?</h2><p>Bạn có chắc muốn rời trận? Tiến trình hiện tại sẽ không được giữ lại.</p><div><button className="btn btn-ghost" onClick={() => setShowLeaveConfirm(false)}>Ở LẠI</button><button className="btn btn-danger" onClick={() => void leaveTable()}>RỜI BÀN</button></div></div></div>}
    </section>
}

