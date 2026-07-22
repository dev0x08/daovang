type Kind='horizontal'|'vertical'|'cornerNE'|'cornerNW'|'cornerSE'|'cornerSW'|'teeUp'|'teeDown'|'teeLeft'|'teeRight'|'cross'|'collapse';
const paths:Record<Kind,string[]>={
 horizontal:['M0 12h24'],
 vertical:['M12 0v24'],
 cornerNE:['M12 24V12H0'],
 cornerNW:['M12 24V12h12'],
 cornerSE:['M12 0v12H0'],
 cornerSW:['M12 0v12h12'],
 teeUp:['M12 0v12M0 12h24'],
 teeDown:['M12 24V12M0 12h24'],
 teeLeft:['M0 12h12M12 0v24'],
 teeRight:['M24 12H12M12 0v24'],
 cross:['M12 0v24M0 12h24'],
 collapse:['M0 12h12','M13 7l3 4 3-5 4 8']
};
export default function PathTileIcon({kind}:{kind:Kind}){return <span className={`path-tile-icon ${kind}`}><svg viewBox="0 0 24 24" aria-hidden="true">{paths[kind].map((d,i)=><path key={i} d={d}/>)}</svg><i/><b/></span>}
