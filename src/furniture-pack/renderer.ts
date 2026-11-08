import { yaw, sub, cross, unit, dot, bounds, type V3, type Mesh } from './geometry.ts';
import { furniture } from './catalog.ts';
export type View={yaw:number;pitch:number};
export type ProjectedFace={points:[number,number][];color:string;depth:number;depths:number[]};
export function shade(hex:string,k:number){const n=parseInt(hex.slice(1),16);return '#'+[n>>16,(n>>8)&255,n&255].map(v=>Math.round(Math.max(0,Math.min(255,v*k))).toString(16).padStart(2,'0')).join('');}
export function projectMesh(mesh:Mesh,view:View):ProjectedFace[]{
 const turn=(p:V3):V3=>{const q=yaw(p,view.yaw),s=Math.sin(view.pitch),c=Math.cos(view.pitch);return [q[0],q[1]*c-q[2]*s,q[1]*s+q[2]*c];};
 const result:ProjectedFace[]=[];
 mesh.faces.forEach((f,index)=>{
  const points=f.points.map(turn);let n=unit(cross(sub(points[1],points[0]),sub(points[2],points[0])));
  // Superellipsoid pole quads begin with coincident vertices.
  if(Math.hypot(...n)<.1&&points.length>3)n=unit(cross(sub(points[2],points[1]),sub(points[3],points[1])));
  if(n[2]<0)n=[-n[0],-n[1],-n[2]];
  const variation=1+Math.sin(index*127.1)*.032;
  const lum=(.79+Math.max(0,dot(n,unit([-.5,.9,1])))*.23+(f.glow||0)*.10)*variation;
  result.push({points:points.map(p=>[p[0],-p[1]]),color:shade(f.color,lum),depths:points.map(p=>p[2]),depth:points.reduce((a,p)=>a+p[2],0)/points.length});
 });return result.sort((a,b)=>a.depth-b.depth);
}
export function renderCanvas(ctx:CanvasRenderingContext2D,mesh:Mesh,w:number,h:number,view:View,grain=true){
 const faces=projectMesh(mesh,view);let x0=Infinity,y0=Infinity,x1=-Infinity,y1=-Infinity;
 for(const f of faces)for(const p of f.points){x0=Math.min(x0,p[0]);x1=Math.max(x1,p[0]);y0=Math.min(y0,p[1]);y1=Math.max(y1,p[1]);}
 const scale=Math.min(w*.76/(x1-x0),h*.78/(y1-y0));const ox=w/2-(x0+x1)*scale/2,oy=h/2-(y0+y1)*scale/2;
 ctx.clearRect(0,0,w,h);ctx.save();ctx.fillStyle='rgba(84,67,80,.10)';ctx.beginPath();ctx.ellipse(w/2,oy+y1*scale+5,Math.max(15,(x1-x0)*scale*.37),Math.max(5,Math.min(20,(x1-x0)*scale*.07)),0,0,Math.PI*2);ctx.fill();
 // Software Z-buffer keeps text, trim and overlapping curved parts visible from every angle.
 const pixels=ctx.getImageData(0,0,w,h),data=pixels.data,depthBuffer=new Float32Array(w*h);depthBuffer.fill(-Infinity);
 for(const f of faces){
  const p=f.points.map(p=>[p[0]*scale+ox,p[1]*scale+oy]);const color=parseInt(f.color.slice(1),16),rgb=[color>>16,(color>>8)&255,color&255];
  for(let t=1;t<p.length-1;t++){
   const a=p[0],b=p[t],c=p[t+1],za=f.depths[0],zb=f.depths[t],zc=f.depths[t+1];
   const det=(b[1]-c[1])*(a[0]-c[0])+(c[0]-b[0])*(a[1]-c[1]);if(Math.abs(det)<1e-8)continue;
   const minX=Math.max(0,Math.floor(Math.min(a[0],b[0],c[0]))),maxX=Math.min(w-1,Math.ceil(Math.max(a[0],b[0],c[0]))),minY=Math.max(0,Math.floor(Math.min(a[1],b[1],c[1]))),maxY=Math.min(h-1,Math.ceil(Math.max(a[1],b[1],c[1])));
   for(let y=minY;y<=maxY;y++)for(let x=minX;x<=maxX;x++){
    const u=((b[1]-c[1])*(x+.5-c[0])+(c[0]-b[0])*(y+.5-c[1]))/det,v=((c[1]-a[1])*(x+.5-c[0])+(a[0]-c[0])*(y+.5-c[1]))/det,q=1-u-v;
    if(u<-.00001||v<-.00001||q<-.00001)continue;
    const z=u*za+v*zb+q*zc,index=y*w+x;if(z<depthBuffer[index])continue;depthBuffer[index]=z;
    const noise=grain?(((x*374761393+y*668265263)>>>8)%13-6)*.40:0;
    for(let k=0;k<3;k++)data[index*4+k]=Math.max(0,Math.min(255,rgb[k]+noise));data[index*4+3]=255;
   }
  }
 }
 ctx.putImageData(pixels,0,0);
 ctx.restore();return {scale,ox,oy};
}
/** Minimal structural interface matching the supplied paint builder. */
export interface PaintBuilder {poly(points:number[][],options?:{smooth?:boolean;wobble?:number}):unknown;paint(shape:unknown,color:string,options?:{mottle?:number;rim?:number}):void;}
/** Fixed envelope avoids sprite-size jumps and keeps the projected origin stable when rotating. */
export function makePaintRegistry(viewFor:(id:string)=>View=()=>({yaw:-.55,pitch:.42})){
 return Object.fromEntries(Object.values(furniture).map(asset=>{
  const bb=bounds(asset.mesh),radius=Math.hypot(Math.max(Math.abs(bb.min[0]),Math.abs(bb.max[0])),Math.max(Math.abs(bb.min[2]),Math.abs(bb.max[2])));
  const w=2*radius+.12,h=asset.size[1]+2*radius+.12;
  return [asset.id,{w,h,depth:asset.size[2],mount:asset.mount,paint(b:PaintBuilder){for(const f of projectMesh(asset.mesh,viewFor(asset.id))){b.paint(b.poly(f.points.map(p=>[p[0]+w/2,p[1]+asset.size[1]+radius+.06]),{wobble:0}),f.color,{mottle:.35,rim:0});}}}];
 }));
}
