import { useEffect, useState } from 'react';
import { ArrowLeft, ShieldAlert, ShoppingBag } from 'lucide-react';
import { Link, Navigate, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { findMyGuild, Guild } from '../lib/guilds';
import { guildUrl, nameSlug } from '../lib/slugs';
import Shop from './Shop';

export default function GuildShop() {
  const { profile } = useAuth();
  const { guildId = '' } = useParams();
  const [guild, setGuild] = useState<Guild | null>(null);
  const [canManageGuild, setCanManageGuild] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    if (!profile) return;
    void findMyGuild(profile.uid).then(result => {
      if (active) {
        setGuild(result?.guild || null);
        setCanManageGuild(result?.member.role === 'owner');
        setLoading(false);
      }
    }).catch(() => active && setLoading(false));
    return () => { active = false; };
  }, [profile]);

  if (!profile) return null;
  if (loading) return <section className="center-page"><div className="auth-card"><ShoppingBag /><h1>ĐANG MỞ SHOP GUILD...</h1></div></section>;
  if (!guild || nameSlug(guild.name) !== guildId) return <Navigate to="/guild" replace />;

  return <section className="guild-shop-route app-page">
    <header className="guild-shop-route-head">
      <Link className="btn btn-ghost btn-small" to={guildUrl(guild.name)}><ArrowLeft /> VỀ GUILD</Link>
      <div><span><ShieldAlert /> SHOP CỦA GUILD</span><b>{guild.tag ? `[${guild.tag}] ` : ''}{guild.name}</b></div>
    </header>
    <Shop guild={guild} canManageGuild={canManageGuild} onGuildBadgeChange={badge => setGuild(current => current ? { ...current, badge } : current)} />
  </section>;
}
