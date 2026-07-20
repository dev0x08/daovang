import type { ReactNode } from 'react';
import { Bot, Crown, Shield, UserRound } from 'lucide-react';
import { Equipped } from '../context/AuthContext';
import { itemById } from '../lib/shop';

export type IdentityPlayer = {
  name: string;
  avatar?: string;
  photoURL?: string;
  bot?: boolean;
  rank?: string;
  equipped?: Equipped;
};

type Props = {
  player: IdentityPlayer;
  compact?: boolean;
  active?: boolean;
  subtitle?: string;
  hideSubtitle?: boolean;
  trailing?: ReactNode;
  className?: string;
};

const cosmeticClass = (id?: string) => id ? `cosmetic-${id}` : '';

export default function PlayerIdentity({ player, compact=false, active=false, subtitle, hideSubtitle=false, trailing, className='' }: Props) {
  const equipped = player.equipped || {};
  const title = itemById(equipped.title)?.name;
  const avatar = player.avatar || player.photoURL || '';
  return (
    <div className={`player-identity ${compact?'is-compact':''} ${active?'is-active':''} ${cosmeticClass(equipped.nameplate)} ${className}`}>
      <span className={`identity-avatar ${cosmeticClass(equipped.frame)}`}>
        {player.bot ? <Bot aria-hidden="true"/> : avatar ? <img src={avatar} alt=""/> : <UserRound aria-hidden="true"/>}
        {equipped.badge && <i className={`identity-badge ${cosmeticClass(equipped.badge)}`}><Shield aria-hidden="true"/></i>}
      </span>
      <span className="identity-copy">
        <b className={cosmeticClass(equipped.nameColor)}>{player.name}</b>
        {!hideSubtitle && <small>{title || subtitle || player.rank || (player.bot ? 'AI' : 'NGƯỜI CHƠI')}</small>}
      </span>
      {player.rank && <span className={`identity-rank rank-${player.rank.toLowerCase().replace(/\s+/g,'-')}`}><Crown aria-hidden="true"/>{player.rank}</span>}
      {trailing && <span className="identity-trailing">{trailing}</span>}
    </div>
  );
}
