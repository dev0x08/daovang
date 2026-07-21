type Kind='straight'|'corner'|'tee'|'cross'|'deadend'|'collapse';
const paths:Record<Kind,string[]>={
 straight:['M12 0v24'],
 corner:['M12 24V12h12'],
 tee:['M12 24V12M0 12h24'],
 cross:['M12 0v24M0 12h24'],
 deadend:['M12 24V12'],
 collapse:['M2 19L8 11l4 4 4-8 6 12','M4 22h16']
};
export default function PathTileIcon({kind}:{kind:Kind}){return <span className={`path-tile-icon ${kind}`}><svg viewBox="0 0 24 24" aria-hidden="true">{paths[kind].map((d,i)=><path key={i} d={d}/>)}</svg><i/><b/></span>}
