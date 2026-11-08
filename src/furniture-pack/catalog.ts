import { Builder, C, normalized, bounds, type Mesh, type V3 } from './geometry.ts';
export type Mount='floor'|'wall'|'ceiling';
export type Furniture={id:string;name:string;collection:string;mount:Mount;mesh:Mesh;size:V3;mass:number;restitution:number;friction:number;light?:{color:string;intensity:number;localPosition:V3}};
const items:Furniture[]=[];
function item(id:string,name:string,collection:string,mount:Mount,build:(b:Builder)=>void,light?:Furniture['light']){const b=new Builder();build(b);const mesh=normalized(b),size=bounds(mesh).size;items.push({id,name,collection,mount,mesh,size,mass:Math.max(.5,size[0]*size[1]*size[2]*15),restitution:.12,friction:.8,light});}
const feet=(b:Builder,w:number,d:number,h:number,c=C.wood)=>{for(const x of [-w/2,w/2])for(const z of [-d/2,d/2])b.rod([x,0,z],[x,h,z],.065,c);};
const pot=(b:Builder,p:V3,r:number,h:number,c=C.clay)=>{b.rod(p,[p[0],p[1]+h,p[2]],r*.75,c,r);b.ring([p[0],p[1]+h,p[2]],r,r,.035,c);b.rod([p[0],p[1]+h-.025,p[2]],[p[0],p[1]+h-.018,p[2]],r*.87,C.dark);};
const flower=(b:Builder,p:V3,s:number,c=C.pink)=>{for(let i=0;i<7;i++){const a=i/7*Math.PI*2;b.ball([p[0]+Math.cos(a)*s*.6,p[1]+.02,p[2]+Math.sin(a)*s*.6],[s*.9,s*.35,s*.9],c);}b.ball([p[0],p[1]+.05,p[2]],[s*.55,s*.3,s*.55],C.yellow);};
const leaf=(b:Builder,p:V3,s=.25)=>b.ball(p,[s,.045,s*.65],C.green);
const light={color:'#ffe2a1',intensity:1,localPosition:[0,1,0] as V3};
const NY='New York',TH='Thailand',MX='Mexico',CN='China',CH='Switzerland',EF='England / France';
item('bold-chair-blue','Bold Chair · blue',NY,'floor',b=>{
 for(const s of [-1,1]){b.tube([[s*.31,.10,.32],[s*.30,.55,.22],[s*.22,.62,-.08],[s*.26,.38,-.31],[s*.34,.10,-.38]],.095,C.blue);}
 b.tube([[-.31,.57,-.16],[-.34,.85,-.29],[-.30,1.16,-.32],[0,1.20,-.32],[.30,1.16,-.32],[.34,.85,-.29],[.31,.57,-.16]],.10,C.blue);
 b.tube([[-.25,.59,.15],[0,.56,.24],[.25,.59,.15]],.11,C.blue);
});
// Tiny geometric lettering lies on a real front plane; rotates with the mesh.
const font:Record<string,string>={A:'010101111101101',C:'111100100100111',E:'111100110100111',N:'101111111111101',S:'111100111001111',T:'111010010010010',R:'110101110101101',D:'110101101101110',W:'101101111111101',Y:'101101010010010',O:'111101101101111',K:'101101110101101',B:'110101110101110',I:'111010010010111',M:'101111111101101',U:'101101101101111',L:'100100100100111','1':'010110010010111','2':'110001010100111','3':'110001010001110'};
function text(b:Builder,t:string,p:V3,s:number,c=C.white){for(let k=0;k<t.length;k++){const glyph=font[t[k]];if(!glyph)continue;for(let i=0;i<15;i++)if(glyph[i]==='1')b.box([p[0]+(k*4+i%3)*s,p[1]-Math.floor(i/3)*s,p[2]],[s*.85,s*.85,.004],c);}}
item('subway-sign','Subway sign collectible',NY,'wall',b=>{
 b.soft([0,.30,0],[1.7,.60,.10],C.ink,.22);b.box([0,.52,.055],[1.5,.025,.008],C.white);text(b,'NEW YORK',[-.71,.44,.060],.035);text(b,'ST',[.47,.44,.061],.035);
 [C.red,C.blue,C.green].forEach((c,i)=>{b.ball([-.53+i*.28,.16,.06],[.21,.21,.027],c);text(b,String(i+1),[-.56+i*.28,.21,.08],.027);});b.rod([.48,.16,.07],[.69,.16,.07],.018,C.white);b.rod([.62,.23,.07],[.69,.16,.07],.018,C.white);b.rod([.62,.09,.07],[.69,.16,.07],.018,C.white);
});
item('basketball-ceiling-lamp','Basketball ceiling lamp',NY,'ceiling',b=>{
 b.rod([0,.47,0],[0,1.1,0],.018,C.ink);b.rod([0,1.08,0],[0,1.14,0],.12,C.cream);
 b.ball([0,.28,0],[.56,.56,.56],C.orange,.2);
 for(let axis=0;axis<3;axis++){let pts:V3[]=[];for(let i=0;i<=40;i++){let a=i/40*Math.PI*2;pts.push(axis===0?[.282*Math.cos(a),.28+.282*Math.sin(a),0]:axis===1?[0,.28+.282*Math.sin(a),.282*Math.cos(a)]:[.282*Math.cos(a),.28,.282*Math.sin(a)]);}for(let i=1;i<pts.length;i++)b.rod(pts[i-1],pts[i],.009,C.dark);}
}, {...light,localPosition:[0,.28,0]});
item('chelebi-rubik-table','Chelebi coffee table · Rubik colors',NY,'floor',b=>{
 const cols=[C.red,C.blue,C.yellow,C.green,C.orange,C.white];for(const x of [-.52,.52])for(const z of [-.28,.28])b.ball([x,.13,z],[.24,.24,.24],C.red);
 b.box([0,.37,0],[1.45,.35,.85],C.ink);
 for(let x=0;x<6;x++)for(let z=0;z<4;z++)b.box([-.605+x*.242,.555,-.318+z*.212],[.229,.035,.198],cols[(x*3+z*5)%6]);
 for(let x=0;x<6;x++)for(const z of [-.43,.43])b.box([-.605+x*.242,.37,z],[.229,.30,.02],cols[(x+(z>0?2:0))%6]);
 for(let z=0;z<4;z++)for(const x of [-.73,.73])b.box([x,.37,-.318+z*.212],[.02,.30,.198],cols[(z+3)%6]);
});
item('locker-tv-stand','Locker TV stand with TV',NY,'floor',b=>{
 feet(b,1.35,.45,.17,C.ink);b.soft([0,.43,0],[1.7,.56,.64],C.sky,.22);
 for(let i=0;i<3;i++){const x=(i-1)*.53;b.box([x,.43,.33],[.49,.49,.025],i===1?C.blue:C.sky);for(let j=0;j<3;j++)b.box([x,.53+j*.045,.348],[.24,.014,.01],C.ink);b.box([x+.15,.36,.36],[.025,.09,.025],C.cream);}
 b.rod([0,.70,0],[0,.84,0],.04,C.ink);b.soft([0,1.14,0],[1.2,.68,.10],C.ink,.22);b.soft([0,1.14,.058],[1.08,.55,.02],C.purple,.25);b.ball([-.19,1.23,.075],[.28,.28,.012],C.yellow);b.face([[-.53,.88,.08],[-.20,1.14,.08],[.08,.88,.08]],C.sky);b.face([[-.12,.88,.082],[.22,1.21,.082],[.53,.88,.082]],C.green);
});
item('floor-cushions','Floor cushions',TH,'floor',b=>{
 b.soft([0,.13,0],[.94,.24,.80],C.purple);b.ring([0,.14,0],.43,.36,.016,C.yellow);
 b.soft([.08,.35,0],[.79,.22,.70],C.red);b.ring([.08,.36,0],.36,.31,.014,C.yellow);b.ball([.08,.468,0],[.07,.018,.07],C.yellow);
 for(let x=-.26;x<.4;x+=.13){b.rod([x,.465,-.23],[x,.465,.23],.008,C.pink);}
 for(const x of [-.34,.48])for(const z of [-.29,.29])b.ball([x,.31,z],[.08,.12,.08],C.yellow);
});
item('elephant-statue','Elephant statue',TH,'floor',b=>{
 for(const x of [-.24,.24])for(const z of [-.23,.23])b.soft([x,.19,z],[.24,.38,.25],C.sky);
 b.ball([0,.51,0],[.8,.68,.80],C.sky);b.ball([0,.76,.31],[.60,.57,.52],C.sky);
 for(const x of [-.32,.32]){b.ball([x,.75,.33],[.39,.48,.15],C.blue);b.ball([x,.75,.42],[.23,.31,.04],C.pink);b.ball([x*.48,.83,.56],[.05,.06,.03],C.ink);}
 b.tube([[0,.69,.53],[0,.43,.67],[0,.24,.72],[0,.23,.89],[0,.37,.92]],.085,C.sky);
 for(const x of [-.15,.15])b.tube([[x,.58,.52],[x,.48,.67],[x,.55,.74]],.025,C.cream);
 b.soft([0,.80,-.10],[.57,.08,.50],C.red);for(let x=-.22;x<=.22;x+=.11)b.ball([x,.68,.17],[.045,.045,.045],C.yellow);
 b.tube([[0,.57,-.37],[0,.39,-.49],[.1,.32,-.5]],.025,C.blue);
});
item('tuk-tuk-sofa','Tuk-Tuk Sofa',TH,'floor',b=>{
 feet(b,1.25,.63,.21,C.ink);b.soft([0,.35,0],[1.6,.35,.90],C.green,.24);b.soft([0,.57,.07],[1.35,.22,.70],C.wood);b.soft([0,.96,-.34],[1.35,.73,.19],C.yellow);
 for(const x of [-.70,.70]){b.soft([x,.74,0],[.18,.60,.83],C.yellow);b.rod([x,.92,-.34],[x,1.66,-.34],.045,C.ink);b.rod([x,.82,.31],[x,1.66,.31],.04,C.ink);b.ball([x,.33,.47],[.13,.13,.035],C.orange);}
 b.soft([0,1.67,0],[1.65,.20,1.04],C.ink);b.soft([0,.85,-.20],[1.16,.36,.17],C.wood);
 for(let x=-.52;x<=.52;x+=.13)b.rod([x,.70,-.10],[x,1.02,-.10],.01,C.cream);
 for(let i=0;i<7;i++){const x=-.63+i*.21;b.rod([x,1.65,.47],[x,1.49,.47],.008,C.cream);b.ball([x,1.47,.47],[.09,.11,.07],[C.red,C.sky,C.yellow][i%3]);}
 b.box([0,.32,.47],[.35,.12,.03],C.cream);text(b,'TUK',[-.12,.36,.49],.023,C.ink);
});
item('wall-shrine','Wall-mounted shrine',TH,'wall',b=>{
 b.soft([0,.08,0],[.98,.16,.48],C.red,.23);b.box([0,.53,-.16],[.69,.86,.12],C.red);
 for(const x of [-.34,.34]){b.rod([x,.16,.10],[x,.93,.10],.055,C.yellow);for(let y=.25;y<.90;y+=.16)b.ball([x,y,.14],[.12,.06,.09],C.cream);}
 for(let k=0;k<3;k++){const w=.53-k*.12,y=.94+k*.18;b.face([[-w,y,-.2],[w,y,-.2],[0,y+.30,-.2]],C.red);b.face([[-w,y,.22],[0,y+.30,-.05],[w,y,.22]],C.red);b.rod([-w,y,.22],[0,y+.30,-.05],.026,C.yellow);b.rod([0,y+.30,-.05],[w,y,.22],.026,C.yellow);}
 b.ball([0,.51,.02],[.22,.30,.18],C.yellow);b.ball([0,.72,.02],[.14,.16,.14],C.yellow);b.soft([0,.30,.04],[.35,.10,.23],C.yellow);
 for(const x of [-.42,.42]){b.rod([x,.90,.15],[x,.73,.15],.008,C.yellow);b.ball([x,.65,.15],[.17,.20,.14],C.pink);b.rod([x,.56,.15],[x,.43,.15],.015,C.red);}
 b.rod([0,.15,.17],[0,.23,.17],.06,C.cream);for(const x of [-.025,0,.025])b.rod([x,.22,.17],[x,.4,.17],.005,C.wood);
});
item('plastic-stool','Vibrant plastic stool',TH,'floor',b=>{
 for(const x of [-1,1])for(const z of [-1,1])b.rod([x*.26,.02,z*.22],[x*.19,.47,z*.16],.047,C.red,.065);
 b.soft([0,.49,0],[.59,.12,.49],C.red,.23);b.soft([0,.553,0],[.16,.005,.04],C.dark,.3);b.rod([-.23,.19,.19],[.23,.19,.19],.022,C.red);b.rod([-.23,.19,-.19],[.23,.19,-.19],.022,C.red);
});
function plush(b:Builder,saint=false){
 const body=saint?C.cream:C.wood,patch=saint?C.wood:C.clay;
 b.ball([0,.30,0],[.55,.58,.43],body);for(const x of [-.23,.23]){b.ball([x,.12,.16],[.25,.23,.34],body);b.ball([x*.9,.38,.16],[.16,.30,.19],body);}
 b.ball([0,.69,.04],[.66,.55,.47],body);
 if(saint){for(const x of [-.31,.31])b.soft([x,.68,-.02],[.18,.43,.25],patch,.55);}else{for(const s of [-1,1]){b.face([[s*.12,.83,.02],[s*.36,1.12,.02],[s*.34,.70,.02]],patch);b.face([[s*.12,.83,.02],[s*.34,.70,.02],[s*.24,.84,-.12]],body);b.face([[s*.12,.83,.02],[s*.24,.84,-.12],[s*.36,1.12,.02]],body);b.face([[s*.34,.70,.02],[s*.36,1.12,.02],[s*.24,.84,-.12]],body);b.face([[s*.18,.85,.025],[s*.31,1.02,.025],[s*.29,.78,.025]],C.pink);}}
 for(const x of [-.15,.15]){if(saint)b.ball([x,.73,.238],[.23,.25,.025],patch);b.ball([x,.74,.268],[.066,.075,.033],C.ink);b.ball([x-.013,.757,.285],[.017,.018,.008],C.white);}
 b.ball([0,.59,.26],[.30,.20,.13],C.cream);b.ball([0,.65,.33],[.10,.075,.06],C.ink);b.ball([0,.54,.327],[.055,.07,.025],C.pink);b.ring([0,.46,0],.24,.20,.035,C.red);
 if(saint){b.rod([-.12,.40,.27],[.12,.40,.27],.09,C.wood);for(const x of [-.075,.075])b.rod([x-.012,.40,.27],[x+.012,.40,.27],.096,C.ink);}
 b.tube([[0,.24,-.17],[.18,.30,-.32],[.24,.42,-.30]],.045,body);
}
item('chihuahua-plushie','Chihuahua plushie',MX,'floor',b=>plush(b));
item('serape-hammock-chair','Serape blanket hammock chair',MX,'floor',b=>{
 b.ring([0,.055,0],.50,.43,.045,C.wood);b.tube([[0,.07,-.35],[0,1.2,-.48],[0,1.75,-.35],[0,1.87,.02]],.045,C.wood);b.rod([0,1.86,.02],[0,1.65,.02],.015,C.cream);
 b.rod([-.48,1.59,.02],[.48,1.59,.02],.035,C.wood);
 for(const x of [-.45,.45])for(const z of [-.23,.30])b.rod([x,1.59,.02],[x,.67,z],.012,C.cream);
 const colors=[C.red,C.orange,C.cream,C.sky,C.purple,C.yellow];
 for(let i=0;i<18;i++){const x=-.45+i*.05,y=.49+.18*Math.pow(Math.abs(x)/.45,2);b.soft([x,y,.04],[.051,.06,.58],colors[i%6],.35,8,6);b.soft([x,y+.24,-.23],[.051,.50,.06],colors[i%6],.35,8,6);b.rod([x,y,.32],[x,y-.14,.34],.008,C.cream);}
});
item('woven-beach-mat','Woven straw beach mat',MX,'floor',b=>{
 b.soft([0,.025,0],[.85,.05,1.65],C.bamboo,.22);
 for(let z=-.78;z<=.78;z+=.035)b.rod([-.40,.055,z],[.40,.055,z],.009,Math.round(z/.035)%3?C.cream:C.wood);
 for(let x=-.38;x<=.38;x+=.065){b.rod([x,.058,-.79],[x,.058,.79],.004,C.wood);for(const z of [-1,1])b.rod([x,.035,z*.78],[x,.02,z*.92],.008,C.bamboo);}
 for(const z of [-.63,.63])b.box([0,.065,z],[.83,.008,.08],C.red);
});
item('clay-chiminea','Clay chiminea fireplace',MX,'floor',b=>{
 feet(b,.42,.35,.16,C.ink);b.ball([0,.50,0],[.80,.83,.68],C.clay);b.rod([0,.72,0],[0,1.45,0],.20,C.clay,.135);b.ring([0,1.46,0],.145,.145,.035,C.clay);b.rod([0,1.46,0],[0,1.47,0],.115,C.dark);
 b.soft([0,.43,.327],[.48,.43,.065],C.dark,.55);b.tube([[-.25,.27,.33],[-.25,.51,.33],[0,.69,.31],[.25,.51,.33],[.25,.27,.33]],.035,C.orange);
 for(const x of [-.09,.09]){b.rod([x-.08,.29,.38],[x+.08,.33,.38],.035,C.wood);b.ball([x,.39,.38],[.12,.25,.04],C.orange,.6);b.ball([x,.35,.405],[.06,.15,.02],C.yellow,.8);}
 b.ring([0,.93,0],.18,.18,.018,C.cream);
}, {...light,localPosition:[0,.4,.4]});
item('neon-cactus-lamp','Neon cactus floor lamp',MX,'floor',b=>{
 pot(b,[0,0,0],.25,.30,C.purple);b.tube([[0,.28,0],[0,.75,0],[0,1.43,0]],.055,C.green);b.tube([[0,.72,0],[-.32,.77,0],[-.34,1.09,0]],.05,C.green);b.tube([[0,.95,0],[.32,1.0,0],[.33,1.27,0]],.05,C.green);
 b.tube([[0,.3,.05],[0,1.43,.05]],.017,C.lime);b.tube([[0,.74,.05],[-.31,.79,.05],[-.34,1.09,.05]],.017,C.lime);b.tube([[0,.97,.05],[.30,1.02,.05],[.33,1.27,.05]],.017,C.lime);flower(b,[0,1.47,0],.1,C.pink);
}, {color:'#b9ef8a',intensity:1.3,localPosition:[0,1,0]});
item('rice-paper-floor-lamp','Rice paper lantern floor lamp',CN,'floor',b=>{
 b.rod([0,.025,0],[0,.08,0],.25,C.wood);b.rod([0,.05,0],[0,1.39,0],.025,C.wood);b.soft([0,1.02,0],[.53,.94,.53],C.cream,.7,24,18,.25);
 for(let i=0;i<17;i++){const y=.59+i*.054,r=.265*Math.pow(Math.max(0,1-Math.pow((y-1.02)/.48,2)),.35);b.ring([0,y,0],r,r,.006,C.bamboo);}b.ring([0,1.50,0],.12,.12,.018,C.wood);
},light);
item('gourd-side-table','Gourd side table',CN,'floor',b=>{
 b.ball([0,.25,0],[.62,.50,.62],C.yellow);b.ball([0,.53,0],[.40,.36,.40],C.yellow);b.rod([0,.66,0],[0,.72,0],.36,C.wood);b.rod([0,.72,0],[0,.75,0],.36,C.orange);b.ring([0,.73,0],.35,.35,.016,C.yellow);
});
item('bamboo-slat-couch','Bamboo slat couch',CN,'floor',b=>{
 feet(b,1.55,.64,.34,C.bamboo);
 for(let i=0;i<12;i++){const x=-.77+i*.14;b.rod([x,.44,-.42],[x,.44,.42],.055,C.bamboo);for(const z of [-.27,.22])b.rod([x,.44,z-.012],[x,.44,z+.012],.058,C.wood);}
 for(let i=0;i<3;i++)b.rod([-.89,.62+i*.18,-.37],[.89,.62+i*.18,-.37],.062,C.bamboo);
 for(const x of [-.89,.89]){b.rod([x,.02,-.36],[x,1.01,-.36],.065,C.bamboo);b.rod([x,.04,.35],[x,.73,.35],.065,C.bamboo);b.rod([x,.75,.36],[x,.94,-.36],.06,C.bamboo);for(const z of [-.36,.35])for(let j=0;j<3;j++)b.ring([x,.60+j*.018,z],.065,.065,.009,C.wood);}
 b.soft([.39,.55,.02],[.54,.15,.60],C.green);
});
item('potted-water-lotus','Chunky potted water lotus',CN,'floor',b=>{
 pot(b,[0,0,0],.40,.37,C.sky);b.rod([0,.355,0],[0,.365,0],.345,C.blue);
 for(let i=0;i<5;i++){const a=i/5*Math.PI*2,p:V3=[Math.cos(a)*.25,.38,Math.sin(a)*.23];leaf(b,p,.27);}
 for(const p of [[-.12,.71,.02],[.13,.90,-.06],[.18,.60,.20]] as V3[]){b.rod([p[0],.35,p[2]],p,.012,C.green);flower(b,p,.17);b.ball([p[0],p[1]+.08,p[2]],[.13,.15,.13],C.pink);}
});
item('lion-dance-wall-head','Lion dance wall head',CN,'wall',b=>{
 b.soft([0,.42,-.03],[.77,.70,.20],C.red,.65);for(let i=0;i<18;i++){let a=i/18*Math.PI*2;b.ball([Math.cos(a)*.40,.44+Math.sin(a)*.37,.02],[.15,.15,.14],C.cream);}
 for(const x of [-.20,.20]){b.ball([x,.57,.13],[.37,.37,.21],C.yellow);b.ball([x,.57,.23],[.27,.27,.08],C.white);b.ball([x,.58,.28],[.14,.16,.04],C.ink);b.ball([x-.025,.62,.305],[.045,.05,.015],C.white);b.tube([[x-.14,.76,.12],[x,.82,.14],[x+.12,.77,.12]],.04,C.green);}
 b.ball([0,.39,.23],[.19,.15,.14],C.green);b.soft([0,.23,.15],[.48,.21,.18],C.red);b.soft([0,.27,.25],[.35,.07,.03],C.cream);for(let x=-.19;x<.22;x+=.05)b.tube([[x,.17,.14],[x,.05,.15],[x*.8,-.02,.12]],.018,C.cream);b.ball([0,.85,.04],[.14,.20,.12],C.red);b.ball([0,.86,.11],[.07,.08,.025],C.white);
});
item('gondola-couch','Cable car gondola couch',CH,'floor',b=>{
 feet(b,1.18,.58,.16,C.ink);b.soft([0,.36,0],[1.53,.46,.88],C.red,.25);b.soft([0,.60,.05],[1.22,.17,.62],C.cream);b.soft([0,.90,-.32],[1.28,.55,.15],C.sky);
 for(const x of [-.68,.68]){b.soft([x,.71,0],[.18,.60,.80],C.red);b.rod([x,.90,-.33],[x,1.40,-.33],.04,C.cream);b.rod([x,.90,.31],[x,1.40,.31],.04,C.cream);b.soft([x,1.15,0],[.025,.40,.57],C.sky,.25);}
 b.soft([0,1.43,0],[1.52,.18,.92],C.red);b.tube([[0,1.50,0],[0,1.72,0],[.28,1.84,0],[.28,1.98,0]],.045,C.ink);b.rod([.07,1.98,0],[.48,1.98,0],.045,C.ink);b.box([0,.36,.455],[.28,.08,.015],C.white);b.box([0,.36,.462],[.08,.26,.015],C.white);
});
item('cheese-ceiling-light','Cheese ceiling light',CH,'ceiling',b=>{
 const v:V3[]=[[-.45,.12,-.25],[.45,.12,-.25],[-.25,.12,.45],[-.45,.42,-.25],[.45,.42,-.25],[-.25,.42,.45]];for(const f of [[0,2,1],[3,4,5],[0,1,4,3],[1,2,5,4],[2,0,3,5]])b.face(f.map(i=>v[i]),C.yellow,.2);
 for(const p of [[-.24,.426,-.08],[.12,.426,-.12],[-.19,.426,.22]] as V3[])b.ball(p,[.13,.012,.13],C.orange);
 for(const x of [-.25,.12])b.ball([x,.27,-.257],[.13,.12,.012],C.orange);
 for(const t of [.25,.65]){const x=.45-.7*t,z=-.25+.7*t;b.rod([x,.27,z],[x+.006,.27,z+.006],.065,C.orange);}
 b.rod([-.08,.42,0],[-.08,1.02,0],.014,C.ink);b.rod([-.08,1.02,0],[-.08,1.07,0],.11,C.cream);
}, {...light,localPosition:[0,.25,0]});
item('hot-chocolate-side-table','Hot chocolate cup side table',CH,'floor',b=>{
 b.rod([0,.04,0],[0,.49,0],.27,C.red,.33);b.ring([0,.49,0],.32,.32,.025,C.cream);b.rod([0,.49,0],[0,.505,0],.30,C.dark);b.tube([[.30,.42,0],[.48,.46,0],[.54,.29,0],[.45,.16,0],[.29,.17,0]],.045,C.red);
 for(const p of [[-.12,.52,.03],[.06,.52,-.10],[.12,.52,.12]] as V3[])b.soft(p,[.12,.035,.12],C.cream,.28);
 b.box([0,.28,.302],[.23,.07,.03],C.cream);b.box([0,.28,.32],[.07,.23,.025],C.cream);
});
item('st-bernard-plushie','St. Bernard plushie',CH,'floor',b=>plush(b,true));
item('ski-pole-coat-rack','Ski pole coat rack',CH,'floor',b=>{
 for(let i=0;i<3;i++){const a=i/3*Math.PI*2,x=Math.cos(a),z=Math.sin(a);b.rod([x*.34,0,z*.34],[-x*.18,1.65,-z*.18],.025,[C.red,C.blue,C.yellow][i]);b.rod([-x*.18,1.62,-z*.18],[-x*.21,1.83,-z*.21],.045,C.ink);b.ring([x*.30,.14,z*.30],.09,.09,.012,C.ink);b.tube([[-x*.20,1.78,-z*.20],[-x*.32,1.70,-z*.32],[-x*.30,1.59,-z*.30]],.012,C.wood);}
 b.ring([0,1.12,0],.09,.09,.025,C.cream);b.soft([.16,1.30,.03],[.19,.44,.08],C.red);for(let j=0;j<3;j++)b.box([.16,1.15+j*.08,.076],[.20,.025,.008],C.cream);
});
item('bibendum-topiary-couch','Bibendum topiary couch',EF,'floor',b=>{
 feet(b,1.55,.55,.16);b.soft([0,.30,0],[1.93,.38,.87],C.green,.35);
 for(let i=0;i<9;i++){let x=-.84+i*.21;b.soft([x,.45,.10],[.28,.41,.79],i%2?C.green:C.lime,.65);b.soft([x,.76,-.30],[.29,.69,.31],i%2?C.green:C.lime,.65);}
 for(const x of [-1.0,1.0])b.soft([x,.62,0],[.32,.64,.91],C.green,.6);
 for(let i=0;i<26;i++){let x=Math.sin(i*15.3)*.9,y=.85+Math.sin(i*4.8)*.18;leaf(b,[x,y,-.115],.065);}
});
item('bouquet-potted-plant','Flower bouquet potted plant',EF,'floor',b=>{
 pot(b,[0,0,0],.25,.42,C.cream);b.ring([0,.13,0],.21,.21,.016,C.blue);
 for(let i=0;i<11;i++){let a=i*2.4,r=.22*Math.sqrt(i/11),p:V3=[Math.cos(a)*r,.68+(i%3)*.11,Math.sin(a)*r];b.rod([0,.35,0],p,.009,C.green);leaf(b,[p[0]*.6,.52+(i%2)*.07,p[2]*.6],.19);flower(b,p,.10,[C.red,C.pink,C.yellow,C.purple][i%4]);}
});
item('tiered-fountain','Tiered water fountain statue',EF,'floor',b=>{
 b.rod([0,0,0],[0,.12,0],.54,C.cream);b.rod([0,.12,0],[0,.24,0],.46,C.cream,.54);b.rod([0,.23,0],[0,.24,0],.46,C.sky);b.ring([0,.25,0],.50,.50,.05,C.cream);
 b.rod([0,.24,0],[0,.88,0],.09,C.cream,.12);b.rod([0,.73,0],[0,.87,0],.19,C.cream,.33);b.rod([0,.87,0],[0,.88,0],.29,C.sky);b.ring([0,.89,0],.32,.32,.035,C.cream);b.rod([0,.88,0],[0,1.26,0],.065,C.cream);b.ball([0,1.30,0],[.16,.18,.16],C.cream);
 for(let i=0;i<6;i++){let a=i/6*Math.PI*2;b.tube([[Math.cos(a)*.29,.88,Math.sin(a)*.29],[Math.cos(a)*.39,.65,Math.sin(a)*.39],[Math.cos(a)*.39,.27,Math.sin(a)*.39]],.012,C.sky);}
});
item('streetlight-floor-lamp','Street light floor lamp',EF,'floor',b=>{
 b.rod([0,.02,0],[0,.10,0],.23,C.ink);b.rod([0,.10,0],[0,.36,0],.10,C.ink,.055);b.rod([0,.30,0],[0,1.51,0],.035,C.ink);b.soft([0,1.76,0],[.31,.43,.31],C.yellow,.28,12,8,.4);
 for(const x of [-.16,.16])for(const z of [-.16,.16])b.rod([x*.75,1.53,z*.75],[x,1.98,z],.018,C.ink);
 b.rod([0,1.51,0],[0,1.55,0],.18,C.ink);b.rod([0,1.98,0],[0,2.15,0],.26,C.ink,.02,4);b.ball([0,2.16,0],[.08,.10,.08],C.ink);
}, {...light,localPosition:[0,1.75,0]});
item('telephone-box-coat-rack','Red telephone box coat rack',EF,'floor',b=>{
 b.soft([0,.08,0],[.67,.16,.56],C.red,.25);b.box([0,.98,-.22],[.57,1.72,.10],C.red);
 for(const x of [-.28,.28])b.box([x,1.0,0],[.075,1.75,.48],C.red);
 for(let i=0;i<3;i++)for(let j=0;j<5;j++)b.box([-.18+i*.18,.52+j*.24,-.161],[.145,.20,.012],C.sky);
 b.soft([0,1.94,0],[.69,.24,.57],C.red,.55);b.box([0,1.84,.284],[.52,.12,.012],C.cream);text(b,'TEL',[-.16,1.87,.295],.025,C.ink);
 for(const x of [-.20,0,.20]){b.tube([[x,1.55,-.13],[x,1.55,.10],[x,1.64,.14]],.022,C.yellow);}
 b.soft([-.18,1.22,.06],[.17,.52,.14],C.wood);b.soft([.18,1.20,.06],[.13,.62,.10],C.blue);b.box([.18,1.02,.118],[.14,.035,.006],C.cream);
});
export const furniture=Object.fromEntries(items.map(x=>[x.id,x])) as Record<string,Furniture>;
export const catalog=items;
