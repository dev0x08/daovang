const badgeAsset = {
  'badge-compass': '/images/guild-badges/badge-compass.png',
  'badge-gem': '/images/guild-badges/badge-gem.png',
  'badge-crown': '/images/guild-badges/badge-crown.png',
  'badge-pickaxe': '/images/guild-badges/badge-pickaxe.png',
  'badge-guardian': '/images/guild-badges/badge-guardian.png',
} as const;

export default function GuildBadgeMark({ id = '', className = '' }: { id?: string; className?: string }) {
  const key = id in badgeAsset ? id as keyof typeof badgeAsset : 'badge-guardian';
  return (
    <span className={`guild-badge-mark cosmetic-${key} ${className}`} aria-hidden="true">
      <img src={badgeAsset[key]} alt="" draggable={false} />
    </span>
  );
}
