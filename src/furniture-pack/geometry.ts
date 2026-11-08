/** Engine-independent, Y-up mesh geometry. Units are approximately metres. */
export type V3 = [number, number, number];
export type Face = { points: V3[]; color: string; glow?: number };
export type Mesh = { faces: Face[] };
export const C = { blue:'#4258bd',sky:'#79cbd1',red:'#dd5670',yellow:'#efbe50',cream:'#f6dfae',white:'#fcf0d8',ink:'#414360',green:'#6fa17a',lime:'#a5b96b',orange:'#e78e56',wood:'#bb805a',bamboo:'#d5b572',pink:'#e8a3b4',purple:'#8975ac',clay:'#c7775b',dark:'#685568' };
export const add=(a:V3,b:V3):V3=>[a[0]+b[0],a[1]+b[1],a[2]+b[2]];
export const sub=(a:V3,b:V3):V3=>[a[0]-b[0],a[1]-b[1],a[2]-b[2]];
export const mul=(a:V3,s:number):V3=>[a[0]*s,a[1]*s,a[2]*s];
export const cross=(a:V3,b:V3):V3=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
export const dot=(a:V3,b:V3)=>a[0]*b[0]+a[1]*b[1]+a[2]*b[2];
export const unit=(v:V3)=>mul(v,1/(Math.hypot(...v)||1));
export function yaw(p:V3,a:number):V3 {return [p[0]*Math.cos(a)+p[2]*Math.sin(a),p[1],-p[0]*Math.sin(a)+p[2]*Math.cos(a)];}
export class Builder {
 faces:Face[]=[];
 face(points:V3[],color:string,glow=0){this.faces.push({points,color,glow});}
 box(p:V3,s:V3,color:string){
  const v:V3[]=[];for(let i=0;i<8;i++)v.push([p[0]+((i&1)?1:-1)*s[0]/2,p[1]+((i&2)?1:-1)*s[1]/2,p[2]+((i&4)?1:-1)*s[2]/2]);
  for(const f of [[0,4,6,2],[1,3,7,5],[0,1,5,4],[2,6,7,3],[0,2,3,1],[4,5,7,6]])this.face(f.map(i=>v[i]),color);
 }
 /** Rounded solid; exponent 1 = ellipsoid, 0.28 = upholstered rounded box. */
 soft(p:V3,s:V3,color:string,e=0.35,n=16,m=10,glow=0){
  const sp=(x:number)=>Math.sign(x)*Math.pow(Math.abs(x),e);
  const at=(i:number,j:number):V3=>{const a=i/n*Math.PI*2,b=-Math.PI/2+j/m*Math.PI;return [p[0]+s[0]/2*sp(Math.cos(b))*sp(Math.cos(a)),p[1]+s[1]/2*sp(Math.sin(b)),p[2]+s[2]/2*sp(Math.cos(b))*sp(Math.sin(a))];};
  for(let j=0;j<m;j++)for(let i=0;i<n;i++)this.face([at(i,j),at(i,j+1),at(i+1,j+1),at(i+1,j)],color,glow);
 }
 ball(p:V3,s:V3,color:string,glow=0){this.soft(p,s,color,1,16,10,glow);}
 rod(a:V3,b:V3,r:number,color:string,r2=r,n=12){
  const axis=unit(sub(b,a)),u=unit(cross(axis,Math.abs(axis[1])<.9?[0,1,0]:[1,0,0])),v=cross(axis,u);
  const ring=(p:V3,radius:number)=>Array.from({length:n},(_,i)=>add(p,add(mul(u,Math.cos(i/n*Math.PI*2)*radius),mul(v,Math.sin(i/n*Math.PI*2)*radius))));
  const x=ring(a,r),y=ring(b,r2);this.face([...x].reverse(),color);this.face(y,color);
  for(let i=0;i<n;i++){const j=(i+1)%n;this.face([x[i],x[j],y[j],y[i]],color);}
 }
 tube(points:V3[],r:number,color:string){
  const smooth:V3[]=[];
  for(let i=0;i<points.length-1;i++)for(let j=0;j<5;j++){
   const t=j/5,a=points[Math.max(0,i-1)],b=points[i],c=points[i+1],d=points[Math.min(points.length-1,i+2)];
   smooth.push([0,1,2].map(k=>.5*((2*b[k])+(-a[k]+c[k])*t+(2*a[k]-5*b[k]+4*c[k]-d[k])*t*t+(-a[k]+3*b[k]-3*c[k]+d[k])*t*t*t)) as V3);
  }smooth.push(points[points.length-1]);
  for(let i=1;i<smooth.length;i++)this.rod(smooth[i-1],smooth[i],r,color);
  for(const p of points)this.ball(p,[r*2,r*2,r*2],color);
 }
 ring(p:V3,rx:number,rz:number,r:number,color:string){const points:V3[]=[];for(let i=0;i<=24;i++){let a=i/24*Math.PI*2;points.push([p[0]+rx*Math.cos(a),p[1],p[2]+rz*Math.sin(a)]);}for(let i=1;i<points.length;i++)this.rod(points[i-1],points[i],r,color);}
}
export function bounds(mesh:Mesh){const min:V3=[Infinity,Infinity,Infinity],max:V3=[-Infinity,-Infinity,-Infinity];for(const f of mesh.faces)for(const p of f.points)for(let k=0;k<3;k++){min[k]=Math.min(min[k],p[k]);max[k]=Math.max(max[k],p[k]);}return {min,max,size:sub(max,min)};}
export function normalized(b:Builder):Mesh {const bb=bounds(b);return {faces:b.faces.map(f=>({...f,points:f.points.map(p=>[p[0],p[1]-bb.min[1],p[2]] as V3)}))};}
