import type { LucideIcon } from 'lucide-react';

type Props={icon:LucideIcon;tone?:'gold'|'ice'|'fire'|'emerald'|'red'|'violet';size?:'sm'|'md'|'lg';label?:string};
export default function GameEmblem({icon:Icon,tone='gold',size='md',label}:Props){
 return <span className={`game-emblem ${tone} ${size}`} aria-label={label} role={label?'img':undefined}>
  <span className="game-emblem-ring"><Icon strokeWidth={1.8}/></span>
 </span>
}
