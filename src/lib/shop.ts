export type ShopCategory='frame'|'nameColor'|'nameplate'|'title'|'badge';
export type ShopItem={id:string;name:string;description:string;category:ShopCategory;price:number;preview:string};
export const SHOP_ITEMS:ShopItem[]=[
 {id:'frame-gold',name:'Khung Vàng Cổ',description:'Khung avatar ánh vàng cổ điển.',category:'frame',price:450,preview:'◆'},
 {id:'frame-wolf',name:'Khung Sói Đêm',description:'Khung avatar đỏ tối dành cho hồ sơ.',category:'frame',price:700,preview:'◈'},
 {id:'name-emerald',name:'Tên Lục Bảo',description:'Màu tên xanh lục bảo.',category:'nameColor',price:350,preview:'Aa'},
 {id:'name-amber',name:'Tên Hổ Phách',description:'Màu tên vàng hổ phách.',category:'nameColor',price:350,preview:'Aa'},
 {id:'plate-ocean',name:'Nền Biển Sâu',description:'Nền bảng tên xanh lam phát sáng.',category:'nameplate',price:520,preview:'▰'},
 {id:'plate-crimson',name:'Nền Sói Đỏ',description:'Nền bảng tên đỏ sẫm dành cho phong cách bí ẩn.',category:'nameplate',price:680,preview:'▰'},
 {id:'plate-royal',name:'Nền Hoàng Kim',description:'Nền bảng tên vàng sang trọng.',category:'nameplate',price:850,preview:'▰'},
 {id:'title-prospector',name:'Nhà Thám Khoáng',description:'Danh hiệu hiển thị dưới tên.',category:'title',price:500,preview:'T'},
 {id:'title-shadow',name:'Bóng Trong Hầm',description:'Danh hiệu bí ẩn cho hồ sơ.',category:'title',price:650,preview:'T'},
 {id:'badge-compass',name:'Huy hiệu La Bàn',description:'Huy hiệu trang trí hồ sơ.',category:'badge',price:300,preview:'✦'},
 {id:'badge-gem',name:'Huy hiệu Đá Quý',description:'Huy hiệu đá quý hiếm.',category:'badge',price:550,preview:'♦'},
];
export const itemById=(id?:string|null)=>SHOP_ITEMS.find(x=>x.id===id);
