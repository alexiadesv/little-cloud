import { bounds,yaw,add,type V3 } from './geometry.ts';
import { type Furniture,type Mount } from './catalog.ts';
export type Instance={asset:Furniture;position:V3;yaw:number;velocityY:number;settled:boolean};
export type AABB={min:V3;max:V3};
export function createInstance(asset:Furniture,position:V3=[0,0,0]):Instance{return {asset,position:[...position],yaw:0,velocityY:0,settled:asset.mount!=='floor'};}
export function worldBounds(instance:Instance):AABB{
 const bb=bounds(instance.asset.mesh),points:V3[]=[];
 for(const x of [bb.min[0],bb.max[0]])for(const y of [bb.min[1],bb.max[1]])for(const z of [bb.min[2],bb.max[2]])points.push(add(yaw([x,y,z],instance.yaw),instance.position));
 return {min:[0,1,2].map(k=>Math.min(...points.map(p=>p[k]))) as V3,max:[0,1,2].map(k=>Math.max(...points.map(p=>p[k]))) as V3};
}
export function overlaps(a:AABB,b:AABB){return [0,1,2].every(k=>a.min[k]<b.max[k]-1e-5&&a.max[k]>b.min[k]+1e-5);}
export function turnQuarter(instance:Instance){instance.yaw=(instance.yaw+Math.PI/2)%(Math.PI*2);}
export function snapToGrid(instance:Instance,grid=.25){if(grid<=0)throw new Error('grid must be positive');instance.position[0]=Math.round(instance.position[0]/grid)*grid;instance.position[2]=Math.round(instance.position[2]/grid)*grid;}
/** Constrain attachment to a plane. Wall normal points INTO the room; yaw follows it. */
export function attach(instance:Instance,mount:Mount,plane:V3,wallNormal:V3=[0,0,1]){
 if(instance.asset.mount!==mount)throw new Error(`Expected ${instance.asset.mount} attachment`);
 instance.velocityY=0;instance.settled=true;
 if(mount==='floor'){instance.position[1]=plane[1];return;}
 if(mount==='ceiling'){instance.position[1]=plane[1]-instance.asset.size[1];return;}
 if(Math.abs(wallNormal[1])>1e-5||Math.hypot(wallNormal[0],wallNormal[2])<1e-5)throw new Error('Wall normal must be horizontal and nonzero');
 const len=Math.hypot(wallNormal[0],wallNormal[2]),nx=wallNormal[0]/len,nz=wallNormal[2]/len;
 instance.yaw=Math.atan2(nx,nz);const back=bounds(instance.asset.mesh).min[2];
 instance.position=[plane[0]-nx*back,plane[1],plane[2]-nz*back];
}
/** Simple gravity + bounce onto floor / static box tops; not a general rigid-body solver. */
export function stepDrop(instance:Instance,dt:number,floorY=0,obstacles:AABB[]=[]){
 if(instance.asset.mount!=='floor'||instance.settled)return;
 const total=Math.min(Math.max(dt,0),.25),steps=Math.max(1,Math.ceil(total/(1/120))),h=total/steps;
 for(let s=0;s<steps;s++){
  const old=worldBounds(instance);instance.velocityY-=9.81*h;instance.position[1]+=instance.velocityY*h;const next=worldBounds(instance);
  let support=floorY;
  for(const b of obstacles)if(next.max[0]>b.min[0]&&next.min[0]<b.max[0]&&next.max[2]>b.min[2]&&next.min[2]<b.max[2]&&old.min[1]>=b.max[1]-1e-5&&next.min[1]<=b.max[1])support=Math.max(support,b.max[1]);
  if(next.min[1]<=support){instance.position[1]+=support-next.min[1];instance.velocityY=-instance.velocityY*instance.asset.restitution;if(instance.velocityY<.12){instance.velocityY=0;instance.settled=true;break;}}
 }
}
export function tryMove(instance:Instance,position:V3,others:Instance[]){const before=instance.position;instance.position=[...position];if(others.some(o=>o!==instance&&overlaps(worldBounds(instance),worldBounds(o)))){instance.position=before;return false;}return true;}
