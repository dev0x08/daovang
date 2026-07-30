import { useMemo, useState } from 'react';
import { Anchor, BadgeCheck, Coins, Frame, Gem, Palette, PanelTop, ShoppingBag, Tag, Snowflake, Pickaxe, Sparkles, Shield, Compass, Crown, Paintbrush, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { SHOP_ITEMS, ShopCategory } from '../lib/shop';
import GameEmblem from '../components/GameEmblem';
import CosmeticPreview from '../components/CosmeticPreview';

const icons = { frame: Frame, nameColor: Palette, nameplate: PanelTop, title: Tag, badge: BadgeCheck, boardSkin: PanelTop, pieceSkin: Gem };
const categoryName = { frame: 'KHUNG HỒ SƠ', nameColor: 'MÀU TÊN', nameplate: 'NỀN BẢNG TÊN', title: 'DANH HIỆU', badge: 'HUY HIỆU', boardSkin: 'SKIN BÀN CỜ', pieceSkin: 'SKIN QUÂN CỜ' };
const previewIcon = (id: string) => id === 'board-default' ? PanelTop : id === 'board-ice' ? Snowflake : id === 'board-volcano' ? Pickaxe : id === 'board-shipwreck' ? Anchor : id === 'piece-gold' ? Crown : id === 'piece-crystal' ? Gem : id.includes('wolf') ? Shield : id.includes('compass') ? Compass : id.includes('emerald') ? Sparkles : id.includes('amber') ? Paintbrush : icons.frame;
const tone = (id: string): 'gold' | 'ice' | 'fire' | 'emerald' | 'red' | 'violet' => id.includes('ice') || id.includes('ocean') || id.includes('crystal') ? 'ice' : id.includes('volcano') || id.includes('wolf') || id.includes('crimson') ? 'fire' : id.includes('emerald') ? 'emerald' : id.includes('shadow') ? 'violet' : 'gold';
type ShopFilter = 'all' | ShopCategory;
const shopFilters: Array<{ id: ShopFilter; label: string }> = [{ id: 'all', label: 'TẤT CẢ' }, { id: 'boardSkin', label: 'BÀN CỜ' }, { id: 'pieceSkin', label: 'QUÂN CỜ' }, { id: 'frame', label: 'KHUNG' }, { id: 'nameColor', label: 'MÀU TÊN' }, { id: 'nameplate', label: 'BẢNG TÊN' }, { id: 'title', label: 'DANH HIỆU' }, { id: 'badge', label: 'HUY HIỆU' }];

export default function Shop({ embedded = false, onClose }: { embedded?: boolean; onClose?: () => void }) {
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
      const equipped = profile.equipped[item.category] === item.id;
      const PreviewIcon = previewIcon(item.id);
      const cosmetic = ['frame', 'nameColor', 'nameplate', 'title', 'badge'].includes(item.category);
      return <article className={`shop-card ${equipped ? 'equipped' : ''}`} key={item.id}>
        <div className={`shop-preview ${item.id}`}><span className="shop-preview-glow" />{cosmetic ? <CosmeticPreview item={item} name={profile.displayName} photoURL={profile.photoURL} /> : <GameEmblem icon={PreviewIcon} tone={tone(item.id)} size="lg" />}{!cosmetic && <small>{categoryName[item.category]}</small>}</div>
        <div className="shop-card-copy"><span>{equipped ? 'ĐANG TRANG BỊ' : owned ? 'ĐÃ SỞ HỮU' : categoryName[item.category]}</span><h3>{item.name}</h3><p>{item.description}</p></div>
        <button className={`btn ${owned ? 'btn-ghost' : 'btn-primary'}`} disabled={equipped} onClick={() => void act(() => owned ? equipItem(item.id) : buyItem(item.id), owned ? 'Đã trang bị.' : 'Mua thành công.')}>{equipped ? <><BadgeCheck size={17} /> ĐANG DÙNG</> : owned ? 'TRANG BỊ' : <><Coins size={16} /> {item.price.toLocaleString('vi-VN')}</>}</button>
      </article>;
    })}</div>
  </section>;
}
