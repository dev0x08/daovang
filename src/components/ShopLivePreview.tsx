import { ShopItem } from '../lib/shop';
import CosmeticPreview from './CosmeticPreview';

const boardImages: Record<string, string> = {
  'board-default': '/images/board-skins/default-cavern.png',
  'board-ice': '/images/board-skins/ice-cavern.png',
  'board-volcano': '/images/board-skins/mine-cavern.png',
  'board-shipwreck': '/images/board-skins/shipwreck-cavern.png',
};

export default function ShopLivePreview({ item, name, photoURL }: { item: ShopItem; name: string; photoURL: string }) {
  if (item.category === 'boardSkin') {
    return <div className="shop-live-board" style={{ backgroundImage: `url("${boardImages[item.id] || boardImages['board-default']}")` }}>
      <span className="shop-live-grid">{Array.from({ length: 8 }, (_, index) => <i key={index} />)}</span>
      <b>LIVE</b>
    </div>;
  }

  if (item.category === 'pieceSkin') {
    return <div className={`shop-live-piece ${item.id}`}>
      <span className="live-tunnel horizontal"><i /></span>
      <span className="live-tunnel corner"><i /></span>
      <span className="live-tunnel vertical"><i /></span>
      <b>LIVE</b>
    </div>;
  }

  return <div className="shop-live-profile"><CosmeticPreview item={item} name={name} photoURL={photoURL} className="shop-live-cosmetic" /><b>LIVE</b></div>;
}
