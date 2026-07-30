export const ADMIN_UID='6DRn3nbz4xZzoZJi6agyYsiAE7n2';

export const nameSlug=(value:string)=>value
 .normalize('NFD')
 .replace(/[\u0300-\u036f]/g,'')
 .replace(/đ/g,'d')
 .replace(/Đ/g,'D')
 .toLowerCase()
 .replace(/[^a-z0-9]+/g,'')
 .slice(0,60);

export const profileUrl=(displayName:string)=>`/profile/${nameSlug(displayName)}`;
export const guildUrl=(name:string)=>`/guild/${nameSlug(name)}`;
