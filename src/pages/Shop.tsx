import { useMemo, useState } from 'react';
import { BadgeCheck, Coins, ShoppingBag, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { SHOP_ITEMS, ShopCategory } from '../lib/shop';
import GameEmblem from '../components/GameEmblem';
import ShopLivePreview from '../components/ShopLivePreview';
import { Guild, updateGuildBadge } from '../lib/guilds';

const categoryName = { frame: 'KHUNG HỒ SƠ', nameColor: 'MÀU TÊN', nameplate: 'NỀN BẢNG TÊN', title: 'DANH HIỆU', badge: 'HUY HIỆU', boardSkin: 'SKIN BÀN CỜ', pieceSkin: 'SKIN QUÂN CỜ' };
type ShopFilter = 'all' | ShopCategory;
const shopFilters: Array<{ id: ShopFilter; label: string }> = [{ id: 'all', label: 'TẤT CẢ' }, { id: 'boardSkin', label: 'BÀN CỜ' }, { id: 'pieceSkin', label: 'QUÂN CỜ' }, { id: 'frame', label: 'KHUNG' }, { id: 'nameColor', label: 'MÀU TÊN' }, { id: 'nameplate', label: 'BẢNG TÊN' }, { id: 'title', label: 'DANH HIỆU' }, { id: 'badge', label: 'HUY HIỆU' }];

export default function Shop({ embedded = false, onClose, guild, canManageGuild = false, onGuildBadgeChange }: { embedded?: boolean; onClose?: () => void; guild?: Guild; canManageGuild?: boolean; onGuildBadgeChange?: (badge: string) => void }) {
  const { profile, buyItem, equipItem } = useAuth();
  const [msg, setMsg] = useState('');
  const [filter, setFilter] = useState<ShopFilter>('all');
  const items = useMemo(() => SHOP_ITEMS.filter(item => filter === 'all' || item.category === filter), [filter]);
  if (!profile) return null;

  const act = async (fn: () => Promise<void>, ok: string) => {
    try { await fn(); setMsg(ok); }
    catch (error: any) { setMsg(error?.message || 'Không thể thực hiện.'); }
  };

  return <section className={`shop-page ui-v2-page app-page ${embedded ? 'guild-shop-page' : ''}`}>
    {embedded && <button className="guild-close guild-shop-close" onClick={onClose} aria-label="Đóng cửa hàng"><X /></button>}
    <div className="section-heading">
      {!embedded && <span>SHOP ĐỘC QUYỀN GUILD</span>}
      <h1>CỬA HÀNG GUILD</h1>
      {!embedded && <p>Chỉ thành viên Guild mới có thể mua và trang bị vật phẩm tại đây.</p>}
    </div>
    <div className="shop-toolbar">
      <div className="shop-tabs">{shopFilters.map(tab => <button key={tab.id} className={filter === tab.id ? 'active' : ''} onClick={() => setFilter(tab.id)}>{tab.label}</button>)}</div>
      <div className="shop-wallet"><GameEmblem icon={ShoppingBag} size="sm" /><div><b>{profile.coins.toLocaleString('vi-VN')}</b><span>VÀNG HIỆN CÓ</span></div></div>
    </div>
    {msg && <div className="shop-message">{msg}</div>}
    <div className="shop-grid">{items.map(item => {
      const owned = item.defaultOwned || profile.ownedItems.includes(item.id);
      const guildBadge = item.category === 'badge' && Boolean(guild);
      const equipped = guildBadge ? guild?.badge === item.id : profile.equipped[item.category] === item.id;
      const equip = async () => {
        if (guildBadge) {
          if (!canManageGuild || !guild) throw new Error('Chỉ Chủ Guild được thay đổi huy hiệu Guild.');
          await updateGuildBadge(guild.id, item.id);
          onGuildBadgeChange?.(item.id);
          return;
        }
        await equipItem(item.id);
      };
      return <article className={`shop-card ${equipped ? 'equipped' : ''}`} key={item.id}>
        <div className={`shop-preview ${item.id}`}><span className="shop-preview-glow" /><ShopLivePreview item={item} name={guildBadge ? guild?.name || 'GUILD' : profile.displayName} photoURL={profile.photoURL} /></div>
        <div className="shop-card-copy"><span>{equipped ? 'ĐANG TRANG BỊ' : owned ? 'ĐÃ SỞ HỮU' : categoryName[item.category]}</span><h3>{item.name}</h3><p>{item.description}</p></div>
        <button className={`btn ${owned ? 'btn-ghost' : 'btn-primary'}`} disabled={equipped || (guildBadge && owned && !canManageGuild)} onClick={() => void act(() => owned ? equip() : buyItem(item.id), owned ? 'Đã trang bị huy hiệu Guild.' : 'Mua thành công.')}>{equipped ? <><BadgeCheck size={17} /> ĐANG DÙNG</> : owned ? guildBadge && !canManageGuild ? 'CHỈ CHỦ GUILD' : 'TRANG BỊ' : <><Coins size={16} /> {item.price.toLocaleString('vi-VN')}</>}</button>
      </article>;
    })}</div>
  </section>;
}
