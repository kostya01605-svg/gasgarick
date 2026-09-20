import * as T from "three";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import { type Apartment, type PlanRoom, type ObjectInfo } from "./apartment-data";

export type Furniture = {group:T.Group;info:ObjectInfo;start:number;end:number;materials:T.MeshStandardMaterial[]};
export type ModelRoom = {definition:PlanRoom;group:T.Group;finish:T.Group;floor:T.MeshStandardMaterial;accent:T.MeshStandardMaterial;walls:T.MeshStandardMaterial;objects:Furniture[]};
export type ModelWall = {group:T.Group;rooms:string[];outer:boolean;axis:"x"|"z";coord:number};
export type ModelDoor = {pivot:T.Group;rooms:string[];sign:number};
export function buildApartment(apartment:Apartment,software:boolean){
 const root=new T.Group(),materials:T.Material[]=[],textures:T.Texture[]=[],rooms:ModelRoom[]=[],walls:ModelWall[]=[],doors:ModelDoor[]=[],objects:Furniture[]=[],lampMaterials:T.MeshStandardMaterial[]=[];
 const mat=(color:string,extra:T.MeshStandardMaterialParameters={})=>{const m=new T.MeshStandardMaterial({color,roughness:.84,...extra});materials.push(m);return m;};
 function grain(kind:"wood"|"cloth"){
  if(software)return null;const c=document.createElement("canvas");c.width=c.height=128;const ctx=c.getContext("2d")!,image=ctx.createImageData(128,128);let seed=119;
  for(let y=0;y<128;y++)for(let x=0;x<128;x++){seed=(seed*1664525+1013904223)>>>0;const v=kind==="wood"?226+Math.sin(x*.6+Math.sin(y*.03)*2)*12+(seed/4294967296-.5)*10:230-((x%3===0||y%3===0)?19:0)+(seed/4294967296-.5)*14;const i=(y*128+x)*4;image.data[i]=image.data[i+1]=image.data[i+2]=v;image.data[i+3]=255;}
  ctx.putImageData(image,0,0);const tex=new T.CanvasTexture(c);tex.wrapS=tex.wrapT=T.RepeatWrapping;tex.repeat.set(kind==="cloth"?4:2,4);tex.colorSpace=T.SRGBColorSpace;textures.push(tex);return tex;
 }
 const woodTexture=grain("wood"),clothTexture=grain("cloth");
 const cream=mat("#eee8db"),fabric=mat("#e0d9cc",{map:clothTexture,roughness:.99}),wood=mat("#b79b76",{map:woodTexture}),dark=mat("#6c695b"),stone=mat("#d8ccba"),clay=mat("#bd9985"),leaf=mat("#778a69"),white=mat("#f1efe7"),metal=mat("#666a5d",{metalness:.55,roughness:.37}),glass=mat("#bad3cd",{transparent:true,opacity:.18,depthWrite:false,side:T.DoubleSide});
 function box(p:T.Object3D,w:number,h:number,d:number,x:number,y:number,z:number,m:T.Material,round=0){
  const geo=round&&!software?new RoundedBoxGeometry(w,h,d,2,Math.min(round,w/3,h/3,d/3)):new T.BoxGeometry(w,h,d,software?Math.max(1,Math.ceil(w/1.2)):1,1,software?Math.max(1,Math.ceil(d/1.2)):1);
  const mesh=new T.Mesh(geo,m);mesh.position.set(x,y,z);mesh.castShadow=true;mesh.receiveShadow=true;p.add(mesh);return mesh;
 }
 function cyl(p:T.Object3D,rt:number,rb:number,h:number,x:number,y:number,z:number,m:T.Material){const mesh=new T.Mesh(new T.CylinderGeometry(rt,rb,h,software?10:28),m);mesh.position.set(x,y,z);mesh.castShadow=true;mesh.receiveShadow=true;p.add(mesh);return mesh;}
 function ball(p:T.Object3D,r:number,x:number,y:number,z:number,m:T.Material){const mesh=new T.Mesh(new T.SphereGeometry(r,software?8:20,software?5:12),m);mesh.position.set(x,y,z);mesh.castShadow=true;p.add(mesh);return mesh;}
 const base=box(root,apartment.w+.15,.2,apartment.d+.15,0,-.105,0,mat("#bbb9ac"),.025);base.renderOrder=-50;
 function plant(p:T.Object3D,x:number,z:number,scale=1){const group=new T.Group();group.position.set(x,0,z);group.scale.setScalar(scale);p.add(group);cyl(group,.17,.13,.31,0,.18,0,clay);for(let i=0;i<4;i++){const a=i*2.3;const h=.55+i*.12;cyl(group,.014,.018,h,Math.cos(a)*.08,.3+h/2,Math.sin(a)*.08,dark);const l=ball(group,.2,Math.cos(a)*.19,h+.27,Math.sin(a)*.19,leaf);l.scale.set(.65,1.45,.35);l.rotation.z=Math.sin(a)*.6;}}
 function chair(p:T.Object3D,x:number,z:number,rotation:number,accent:T.Material){const g=new T.Group();g.position.set(x,0,z);g.rotation.y=rotation;p.add(g);box(g,.47,.09,.48,0,.45,0,accent,.04);box(g,.47,.42,.08,0,.68,-.21,accent,.04);for(const a of [-.17,.17])for(const b of [-.17,.17])box(g,.045,.43,.045,a,.215,b,wood);}
 for(const r of apartment.rooms){
  const group=new T.Group();group.position.set(r.x+r.w/2-apartment.w/2,0,r.z+r.d/2-apartment.d/2);root.add(group);
  const floor=mat(r.kind==="bath"?"#c3c2b9":"#cfb38d",{map:woodTexture}),accent=mat("#a7b69d",{map:clothTexture,roughness:.95}),wallColor=mat("#f0e9db");
  const finish=new T.Group();group.add(finish);const floorMesh=box(finish,r.w-.025,.045,r.d-.025,0,.01,0,floor);floorMesh.userData.roomId=r.id;floorMesh.userData.floor=true;floorMesh.renderOrder=-40;
  const seamMat=new T.LineBasicMaterial({color:"#76654c",transparent:true,opacity:.14});materials.push(seamMat);const vertices:number[]=[];for(let x=-r.w/2+.3;x<r.w/2;x+=r.kind==="bath"?.55:.32)vertices.push(x,.035,-r.d/2+.02,x,.035,r.d/2-.02);for(let z=-r.d/2+.6;z<r.d/2;z+=r.kind==="bath"?.55:1.5)vertices.push(-r.w/2+.02,.035,z,r.w/2-.02,.035,z);const lines=new T.LineSegments(new T.BufferGeometry().setAttribute("position",new T.Float32BufferAttribute(vertices,3)),seamMat);lines.renderOrder=-35;finish.add(lines);
  const model:ModelRoom={definition:r,group,finish,floor,accent,walls:wallColor,objects:[]};rooms.push(model);
  function item(id:string,name:string,x:number,z:number,w:number,d:number,build:(g:T.Group)=>void,start=52,rotation=0){
   const g=new T.Group();g.position.set(x,0,z);g.rotation.y=rotation;group.add(g);const info:ObjectInfo={id:r.id+":"+id,name,roomId:r.id,x,z,w,d,rotation};g.userData.furnitureId=info.id;g.userData.roomId=r.id;build(g);
   const cache=new Map<T.Material,T.MeshStandardMaterial>();g.traverse(o=>{if(!(o instanceof T.Mesh)||!(o.material instanceof T.MeshStandardMaterial))return;let clone=cache.get(o.material);if(!clone){clone=o.material.clone();clone.userData.baseOpacity=clone.opacity;clone.userData.baseTransparent=clone.transparent;clone.userData.accent=o.material===accent;materials.push(clone);cache.set(o.material,clone);if(o.material.name==="lamp")lampMaterials.push(clone);}o.material=clone;});
   const f={group:g,info,start,end:Math.min(100,start+20),materials:[...cache.values()]};objects.push(f);model.objects.push(f);return g;
  }
  const rug=(w:number,d:number,x=0,z=0)=>{const g=item("rug","Ковёр",x,z,w,d,g=>box(g,w,.025,d,0,.047,0,mat("#e1daca",{map:clothTexture}),.015),44);g.traverse(o=>o.renderOrder=-20);};
  if(r.kind==="living"){
   rug(Math.min(3.6,r.w-.7),r.d*.63,0,.1);
   item("sofa","Диван",-.35,-r.d/2+.75,2.5,.93,g=>{box(g,2.5,.32,.9,0,.35,0,fabric,.13);box(g,2.5,.52,.22,0,.72,-.32,fabric,.1);for(const x of [-1.13,1.13])box(g,.22,.4,.91,x,.57,0,fabric,.09);for(const x of [-.55,.55]){box(g,1.05,.15,.68,x,.57,.05,cream,.07);const pillow=box(g,.42,.42,.14,x*.9,.84,-.13,accent,.07);pillow.rotation.z=x*.2;}for(const x of [-1,1])box(g,.08,.14,.5,x,.1,0,wood);},52);
   item("table","Журнальный стол",-.35,.35,1.18,.85,g=>{cyl(g,.39,.42,.35,0,.24,0,stone);const top=cyl(g,.61,.61,.08,0,.44,0,stone);top.scale.z=.73;box(g,.3,.04,.22,-.14,.51,0,dark);cyl(g,.085,.075,.15,.16,.56,.05,clay);},63);
   item("armchair","Кресло",r.w/2-.8,.75,.9,.92,g=>{cyl(g,.32,.36,.18,0,.13,0,wood);box(g,.86,.34,.86,0,.39,0,accent,.16);box(g,.88,.57,.22,0,.72,-.3,accent,.12);for(const x of [-.35,.35])box(g,.18,.27,.8,x,.57,0,accent,.08);},65,-.5);
   item("console","Консоль",r.w/2-.7,-r.d/2+.5,.75,.4,g=>{box(g,.75,.65,.4,0,.36,0,wood,.02);box(g,.6,.025,.32,0,.71,0,stone);cyl(g,.085,.06,.2,.15,.81,0,cream);},60);
   item("plant","Растение",-r.w/2+.4,r.d/2-.4,.45,.45,g=>plant(g,0,0),82);
   const shade=mat("#e9ddbf",{emissive:"#ffca88",emissiveIntensity:0});shade.name="lamp";
   item("lamp","Торшер",r.w/2-.37,-.2,.45,.45,g=>{cyl(g,.19,.21,.04,0,.06,0,metal);cyl(g,.018,.018,1.57,0,.85,0,metal);cyl(g,.21,.3,.36,0,1.65,0,shade);},78);
  }else if(r.kind==="kitchen"){
   const length=r.w-.35;
   item("cabinets","Кухонный гарнитур",0,-r.d/2+.4,length,.65,g=>{box(g,length,.8,.62,0,.45,0,accent,.025);box(g,length+.04,.06,.65,0,.88,0,stone,.018);for(let x=-length/2+.3;x<length/2;x+=.55){box(g,.017,.67,.015,x,.47,.317,cream);box(g,.18,.025,.025,x-.14,.71,.339,metal);}box(g,.47,.025,.4,-length/2+.48,.922,0,dark,.02);for(const x of [-.1,.1])for(const z of [-.1,.1])cyl(g,.064,.064,.008,-length/2+.48+x,.94,z,metal);box(g,.48,.03,.34,length/2-.4,.928,0,metal,.035);box(g,.36,.032,.24,length/2-.4,.933,0,cream,.03);cyl(g,.018,.018,.3,length/2-.4,1.06,-.17,metal);box(g,.15,.028,.028,length/2-.34,1.21,-.17,metal);},47);
   if(r.w>3.5)item("island","Кухонный остров",-.8,-.2,1.35,.65,g=>{box(g,1.3,.8,.62,0,.45,0,wood,.025);box(g,1.4,.07,.73,0,.89,0,stone,.02);cyl(g,.15,.12,.08,0,.97,0,clay);},62);
   const tx=r.w>3.5?.65:0,tz=r.d>3? .65:.42;
   item("dining","Обеденная группа",tx,tz,Math.min(1.6,r.w-.35),1.25,g=>{const rad=r.w>3?.55:.39;cyl(g,.2,.24,.68,0,.37,0,wood);cyl(g,rad,rad,.065,0,.74,0,cream);chair(g,-rad-.19,0,Math.PI/2,accent);chair(g,rad+.19,0,-Math.PI/2,accent);if(r.w>3.5)chair(g,0,.75,0,accent);cyl(g,.07,.09,.17,0,.86,0,clay);},66);
  }else if(r.kind==="bedroom"||r.kind==="nursery"){
   const small=r.kind==="nursery",sideways=r.d<2.7,bw=small?1.05:1.55,bd=2.02;
   const bx=sideways?-.65:small?-.65:-.32,bz=sideways?0:-r.d/2+1.35;
   if(!sideways)rug(r.w-.6,2.4,0,-.05);
   item("bed",small?"Кровать в детской":"Кровать",bx,bz,bw,bd,g=>{box(g,bw+.12,.33,bd+.1,0,.22,0,wood,.04);box(g,bw,.24,bd,0,.49,0,cream,.09);box(g,bw+.17,.98,.12,0,.53,-bd/2,accent,.04);box(g,bw+.02,.075,1.25,0,.65,.31,accent,.05);for(const x of small?[0]:[-.39,.39])box(g,small?.65:.64,.13,.42,x,.69,-.62,fabric,.07);},52,sideways?Math.PI/2:0);
   if(!sideways){item("nightstand","Прикроватная тумба",Math.min(r.w/2-.4,bx+bw/2+.43),-r.d/2+.65,.52,.45,g=>{box(g,.52,.46,.45,0,.28,0,wood,.025);cyl(g,.12,.14,.18,0,.63,0,cream);},65);}
   item("wardrobe","Шкаф",r.w/2-.45,sideways?0:r.d/2-.75,.65,sideways?1.35:1.2,g=>{box(g,.62,1.95,sideways?1.35:1.2,0,1,0,cream,.025);box(g,.025,.34,.025,-.325,1.05,-.18,metal);box(g,.025,.34,.025,-.325,1.05,.18,metal);},58);
   if(small)item("desk","Детский стол",-.55,r.d/2-.55,1.3,.62,g=>{box(g,1.3,.06,.57,0,.72,0,wood,.02);for(const x of [-.53,.53])box(g,.065,.7,.43,x,.35,0,cream);chair(g,0,-.6,Math.PI,accent);box(g,.25,.03,.22,.25,.77,0,accent);},70);
   if(!sideways)item("plant","Растение",-r.w/2+.36,r.d/2-.38,.4,.4,g=>plant(g,0,0,.8),84);
  }else if(r.kind==="office"){
   rug(2.2,1.7,0,.25);
   item("desk","Рабочий стол",-.25,-r.d/2+.48,1.7,.65,g=>{box(g,1.7,.065,.65,0,.76,0,wood,.025);for(const x of [-.68,.68])box(g,.075,.73,.48,x,.37,0,cream);box(g,.69,.42,.055,0,1.04,-.15,dark,.025);box(g,.025,.15,.06,0,.88,-.15,metal);box(g,.3,.025,.15,0,.795,-.13,metal);box(g,.48,.025,.18,0,.808,.14,cream);chair(g,0,.68,0,accent);},55);
   item("shelf","Стеллаж",r.w/2-.35,-.2,.4,1.25,g=>{for(const y of [.13,.64,1.15,1.66])box(g,.4,.055,1.25,0,y,0,wood);for(const z of [-.6,.6])box(g,.4,1.6,.04,0,.85,z,wood);for(let i=0;i<7;i++)box(g,.25,.3,.075,-.02,.825,-.46+i*.09,i%2?accent:cream);},64);
   item("chair","Кресло для чтения",-.75,.8,.8,.85,g=>{box(g,.8,.36,.8,0,.36,0,accent,.13);box(g,.8,.57,.19,0,.73,-.3,accent,.1);},69,.3);
   item("plant","Растение",r.w/2-.42,r.d/2-.4,.4,.4,g=>plant(g,0,0,.85),84);
  }else if(r.kind==="bath"){
   if(r.d>2.5){item("tub","Ванна",0,-r.d/2+.56,Math.min(1.7,r.w-.25),.84,g=>{const w=Math.min(1.7,r.w-.25);box(g,w,.48,.83,0,.3,0,white,.15);box(g,w-.18,.04,.61,0,.55,0,mat("#bdd0c9"),.12);cyl(g,.022,.022,.62,w/2-.07,.34,-.37,metal);},52);}else{item("shower","Душевая",-r.w/2+.54,0,.95,r.d-.18,g=>{box(g,.94,.05,r.d-.2,0,.06,0,white,.03);box(g,.026,1.8,r.d-.25,.45,.96,0,glass);cyl(g,.018,.018,1.7,-.15,.92,-r.d/2+.23,metal);cyl(g,.13,.13,.026,-.15,1.81,-r.d/2+.31,metal);},52);}
   item("vanity","Тумба с раковиной",r.d>2.5?-r.w/2+.42:r.w/2-.46,r.d>2.5?.55:-.35,.68,.6,g=>{box(g,.68,.55,.57,0,.42,0,wood,.025);box(g,.7,.12,.59,0,.77,0,white,.07);cyl(g,.023,.023,.25,0,.92,-.22,metal);box(g,.61,.62,.035,0,1.35,-.27,glass,.08);},61);
   item("toilet","Унитаз",r.w/2-.4,r.d/2-.4,.45,.63,g=>{box(g,.42,.36,.6,0,.25,0,white,.14);const seat=cyl(g,.215,.215,.035,0,.445,.07,cream);seat.scale.z=1.2;box(g,.38,.64,.15,0,.36,-.24,white,.04);},65);
  }else{
   const wide=r.w>4;
   item("bench","Банкетка",wide?-r.w/2+.85:0,wide?0:-.45,1.1,.4,g=>{box(g,1.1,.13,.4,0,.46,0,accent,.065);for(const x of [-.43,.43])box(g,.055,.4,.3,x,.2,0,wood);},62);
   if(wide)item("console","Консоль в галерее",r.w/2-1.1,0,1.5,.35,g=>{box(g,1.5,.07,.35,0,.8,0,wood,.02);for(const x of [-.62,.62])box(g,.04,.77,.3,x,.39,0,metal);cyl(g,.09,.12,.3,.42,.98,0,clay);box(g,.35,.035,.22,-.2,.85,0,cream);},71);
  }
 }
 // Split every shared boundary into exact segments, so adjacent rooms share one wall.
 type Edge={axis:"x"|"z";coord:number;from:number;to:number;room:string};const edges:Edge[]=[];
 for(const r of apartment.rooms){edges.push({axis:"x",coord:r.z,from:r.x,to:r.x+r.w,room:r.id},{axis:"x",coord:r.z+r.d,from:r.x,to:r.x+r.w,room:r.id},{axis:"z",coord:r.x,from:r.z,to:r.z+r.d,room:r.id},{axis:"z",coord:r.x+r.w,from:r.z,to:r.z+r.d,room:r.id});}
 const segments=new Map<string,{edge:Edge;ids:Set<string>}>();const round=(n:number)=>Math.round(n*1000)/1000;
 for(const e of edges){const cuts=[e.from,e.to,...edges.filter(b=>b.axis===e.axis&&Math.abs(b.coord-e.coord)<.001).flatMap(b=>[b.from,b.to]).filter(n=>n>e.from+.001&&n<e.to-.001)].sort((a,b)=>a-b);for(let i=0;i<cuts.length-1;i++){if(cuts[i+1]-cuts[i]<.01)continue;const s={...e,from:cuts[i],to:cuts[i+1]},key=[s.axis,round(s.coord),round(s.from),round(s.to)].join(":");if(!segments.has(key))segments.set(key,{edge:s,ids:new Set()});segments.get(key)!.ids.add(e.room);}}
 const wallMaterial=mat("#ece7dc");
 for(const {edge:e,ids} of segments.values()){
  const len=e.to-e.from,outer=ids.size===1,g=new T.Group();root.add(g);g.position.set(e.axis==="x"?(e.from+e.to)/2-apartment.w/2:e.coord-apartment.w/2,0,e.axis==="x"?e.coord-apartment.d/2:(e.from+e.to)/2-apartment.d/2);if(e.axis==="z")g.rotation.y=-Math.PI/2;
  const window=outer&&len>1.8&&(Math.abs(e.coord)<.01||e.axis==="x"&&Math.abs(e.coord-apartment.d)<.01),door=!outer&&len>1.08,opening=window?Math.min(len-.65,1.75):door?Math.min(.88,len-.28):0;
  if(opening){const side=(len-opening)/2;for(const x of [-(opening+side)/2,(opening+side)/2])box(g,side,2.6,.11,x,1.3,0,wallMaterial);if(window){box(g,opening,.66,.11,0,.33,0,wallMaterial);box(g,opening,.24,.11,0,2.48,0,wallMaterial);box(g,opening+.08,.05,.2,0,.68,0,cream);box(g,opening,1.55,.025,0,1.5,0,glass);for(const x of [-opening/2,0,opening/2])box(g,.04,1.62,.07,x,1.5,0,cream);box(g,opening,.045,.07,0,2.3,0,cream);}else{box(g,opening,.45,.11,0,2.375,0,wallMaterial);const pivot=new T.Group();pivot.position.set(-opening/2,0,0);g.add(pivot);box(pivot,opening-.035,2.06,.045,(opening-.035)/2,1.03,0,cream,.012);box(pivot,.08,.025,.08,opening-.15,1.04,.045,metal);pivot.userData.door=true;doors.push({pivot,rooms:[...ids],sign:1});}}
  else box(g,len,2.6,.11,0,1.3,0,wallMaterial);
  walls.push({group:g,rooms:[...ids],outer,axis:e.axis,coord:e.coord});
 }
 return {root,base,rooms,walls,doors,objects,materials,textures,wallMaterial,woodTexture,lampMaterials};
}
