"use client";
import { useEffect,useRef,useState } from "react";
import * as T from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import { CanvasRenderer } from "./canvas-renderer";
import { buildApartment } from "./apartment-model";
import { type Apartment,type ApartmentDesign,type ObjectInfo,defaultTransform,palettes,floors,roomArea } from "./apartment-data";

export type ApartmentApi={snapshot:()=>Promise<string>;objects:ObjectInfo[]};
export type SceneProps={apartment:Apartment;design:ApartmentDesign;roomId:string|null;objectId:string|null;view:string;progress:number;lighting:string;zoom:number;wheelZoom:boolean;reset:number;rotate:boolean;walls:boolean;doors:boolean;furniture:boolean;isolate:boolean;labels:boolean;dimensions:boolean;onReady:(api:ApartmentApi)=>void;onRoom:(id:string)=>void;onObject:(object:ObjectInfo|null)=>void;onDoors:()=>void;onInteraction:()=>void;onZoom:(factor:number)=>void};
export default function ApartmentScene(props:SceneProps){
 const container=useRef<HTMLDivElement>(null),settings=useRef(props);settings.current=props;const [error,setError]=useState(false),[attempt,setAttempt]=useState(0);
 useEffect(()=>{
  const host=container.current;if(!host)return;const a=settings.current.apartment;let renderer:T.WebGLRenderer|CanvasRenderer,software=false;
  try{renderer=new T.WebGLRenderer({antialias:true,alpha:true,powerPreference:"high-performance",preserveDrawingBuffer:true});}catch{try{renderer=new CanvasRenderer();software=true;}catch{setError(true);return;}}
  setError(false);host.dataset.renderer=software?"canvas":"webgl";
  if(renderer instanceof T.WebGLRenderer){renderer.setPixelRatio(Math.min(devicePixelRatio,1.8));renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.PCFSoftShadowMap;renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1.08;renderer.setClearColor(0,0);}
  renderer.domElement.setAttribute("aria-hidden","true");host.appendChild(renderer.domElement);
  const scene=new T.Scene(),model=buildApartment(a,software);scene.add(model.root);
  const ortho=new T.OrthographicCamera(-8,8,8,-8,.1,120),perspective=new T.PerspectiveCamera(65,1,.045,100);let camera:T.PerspectiveCamera|T.OrthographicCamera=ortho;
  const diagonal=Math.max(a.w,a.d);ortho.position.set(diagonal*.9,diagonal*.95,diagonal*1.05);perspective.position.copy(ortho.position);
  const controls=new OrbitControls<T.PerspectiveCamera|T.OrthographicCamera>(camera,host);controls.enableDamping=true;controls.dampingFactor=.08;controls.enablePan=false;controls.enableZoom=false;controls.minPolarAngle=.025;controls.maxPolarAngle=1.48;controls.rotateSpeed=.52;controls.autoRotateSpeed=.4;controls.target.set(0,.2,0);controls.update();
  let env:T.WebGLRenderTarget|undefined;
  if(renderer instanceof T.WebGLRenderer){const pm=new T.PMREMGenerator(renderer),roomEnv=new RoomEnvironment();env=pm.fromScene(roomEnv,.03);scene.environment=env.texture;scene.environmentIntensity=.35;roomEnv.dispose();pm.dispose();}
  const ambient=new T.AmbientLight("#fff9ee",software?.5:.65),sun=new T.DirectionalLight("#fff5e5",software?.47:3.2),fill=new T.DirectionalLight("#e1eafa",software?.18:.7);sun.position.set(-5,13,8);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);Object.assign(sun.shadow.camera,{left:-12,right:12,top:12,bottom:-12,near:.5,far:40});sun.shadow.normalBias=.025;sun.shadow.bias=-.0002;fill.position.set(8,8,-5);scene.add(ambient,sun,fill,new T.HemisphereLight("#fff9f0","#9da58e",.8));
  const eveningLights:T.PointLight[]=[];if(!software)for(const r of model.rooms){const light=new T.PointLight("#ffc982",0,5,2);light.position.copy(r.group.position).add(new T.Vector3(0,1.9,0));scene.add(light);eveningLights.push(light);}
  const shadowMat=new T.ShadowMaterial({color:"#536044",opacity:.15}),ground=new T.Mesh(new T.PlaneGeometry(100,100),shadowMat);ground.rotation.x=-Math.PI/2;ground.position.y=-.214;ground.receiveShadow=true;if(!software)scene.add(ground);
  const selection=new T.BoxHelper(model.root,0x7a926b);selection.material.transparent=true;selection.material.opacity=.8;selection.visible=false;scene.add(selection);
  const overlay=document.createElement("div");overlay.className="apartment-labels";host.appendChild(overlay);
  const hotspots=model.rooms.map(r=>{const button=document.createElement("button");button.className="room-hotspot";button.type="button";button.setAttribute("aria-label","Перейти в комнату: "+r.definition.name);button.textContent=r.definition.short;const size=document.createElement("small");size.textContent=roomArea(r.definition)+" м²";button.appendChild(size);button.addEventListener("click",e=>{e.stopPropagation();settings.current.onRoom(r.definition.id);});overlay.appendChild(button);return {room:r,button};});
  const measureX=document.createElement("div"),measureZ=document.createElement("div");measureX.className="dimension-label";measureZ.className="dimension-label";overlay.appendChild(measureX);overlay.appendChild(measureZ);
  const targetPosition=new T.Vector3(),targetLook=new T.Vector3();let targetZoom=1,transition=true,dirty=true,visible=true,frame=0,lastFrame=0,lastKey="",smoothProgress=settings.current.progress,lightMix=0,lastProps=settings.current;
  const tempColor=new T.Color(),concreteColor=new T.Color("#bcbdb2"),wallColor=new T.Color("#ede8dc"),projected=new T.Vector3();const reduced=matchMedia("(prefers-reduced-motion: reduce)").matches;
  const ease=(v:number)=>{const t=T.MathUtils.clamp(v,0,1);return t*t*(3-2*t);};
  function setCamera(){
   const s=settings.current,r=a.rooms.find(r=>r.id===s.roomId);let nextCamera=s.view==="walk"?perspective:ortho;
   if(nextCamera!==camera){nextCamera.position.copy(camera.position);camera=nextCamera;controls.object=camera;host!.classList.remove("view-changing");void host!.offsetWidth;host!.classList.add("view-changing");}
   const center=r?new T.Vector3(r.x+r.w/2-a.w/2,0,r.z+r.d/2-a.d/2):new T.Vector3();
   if(s.view==="walk"&&r){targetPosition.copy(center).add(new T.Vector3(0,1.58,r.d/2-.23));targetLook.copy(center).add(new T.Vector3(-r.w*.055,.83,-r.d*.32));targetZoom=1;controls.maxPolarAngle=1.72;controls.minPolarAngle=.3;}
   else if(s.view==="plan"){targetLook.set(0,0,0);targetPosition.set(0,diagonal*1.6,.015);targetZoom=1.18;controls.maxPolarAngle=1.48;controls.minPolarAngle=.01;}
   else{const d=r?Math.max(r.w,r.d):diagonal;targetLook.copy(center).add(new T.Vector3(0,r?.3:.25,0));targetPosition.copy(center).add(new T.Vector3(d*.95,d*1.03,d*1.25));targetZoom=r?Math.min(2.8,diagonal/Math.max(r.w,r.d)*.95):1;controls.maxPolarAngle=1.48;controls.minPolarAngle=.03;}
   transition=true;dirty=true;
  }
  function resize(){const w=host!.clientWidth,h=host!.clientHeight;if(!w||!h)return;renderer.setSize(w,h);const aspect=w/h,half=aspect<1?diagonal*.61/aspect:diagonal*.62;Object.assign(ortho,{left:-half*aspect,right:half*aspect,top:half,bottom:-half});ortho.updateProjectionMatrix();perspective.aspect=aspect;perspective.updateProjectionMatrix();dirty=true;}
  const ro=new ResizeObserver(resize);ro.observe(host);resize();const io=new IntersectionObserver(entries=>visible=entries[0].isIntersecting,{rootMargin:"100px"});io.observe(host);
  const clickTargets:T.Object3D[]=[];model.root.traverse(o=>{if(o instanceof T.Mesh)clickTargets.push(o);});const ray=new T.Raycaster(),pointer=new T.Vector2();let downX=0,downY=0,walkDragging=false,walkX=0,walkY=0;
  function lookAround(dx:number,dy:number){const sph=new T.Spherical().setFromVector3(controls.target.clone().sub(camera.position));sph.theta-=dx;sph.phi=T.MathUtils.clamp(sph.phi+dy,.25,2.85);controls.target.copy(camera.position).add(new T.Vector3().setFromSpherical(sph));camera.lookAt(controls.target);transition=false;dirty=true;}
  function pointerDown(e:PointerEvent){downX=e.clientX;downY=e.clientY;if(settings.current.view==="walk"&&!(e.target as HTMLElement).closest("button")){walkDragging=true;walkX=e.clientX;walkY=e.clientY;host!.setPointerCapture(e.pointerId);settings.current.onInteraction();}}
  function pointerMove(e:PointerEvent){if(!walkDragging)return;lookAround((e.clientX-walkX)*.004,(e.clientY-walkY)*.004);walkX=e.clientX;walkY=e.clientY;}
  function wheel(e:WheelEvent){
   if(!settings.current.wheelZoom||e.ctrlKey||e.metaKey||e.deltaY===0)return;
   e.preventDefault();
   const unit=e.deltaMode===1?16:e.deltaMode===2?host!.clientHeight:1;
   const delta=T.MathUtils.clamp(e.deltaY*unit,-240,240);
   settings.current.onZoom(Math.exp(-delta*.0015));
  }
  function pointerUp(e:PointerEvent){
   walkDragging=false;if(host!.hasPointerCapture(e.pointerId))host!.releasePointerCapture(e.pointerId);if(Math.hypot(e.clientX-downX,e.clientY-downY)>5||(e.target as HTMLElement).closest("button"))return;const rect=host!.getBoundingClientRect();pointer.set((e.clientX-rect.left)/rect.width*2-1,-(e.clientY-rect.top)/rect.height*2+1);ray.setFromCamera(pointer,camera);
   const hit=ray.intersectObjects(clickTargets).find(h=>{let o:T.Object3D|null=h.object;while(o){if(!o.visible)return false;o=o.parent;}return true;});if(!hit)return;let node:T.Object3D|null=hit.object;
   while(node){if(node.userData.furnitureId){const item=model.objects.find(o=>o.info.id===node!.userData.furnitureId);if(item)settings.current.onObject(item.info);return;}if(node.userData.door){settings.current.onDoors();return;}if(node.userData.roomId){settings.current.onRoom(node.userData.roomId);return;}node=node.parent;}
  }
  function key(e:KeyboardEvent){if((e.target as HTMLElement).tagName==="BUTTON"||!["ArrowLeft","ArrowRight","ArrowUp","ArrowDown"].includes(e.key))return;e.preventDefault();if(settings.current.view==="plan")return;if(settings.current.view==="walk"){lookAround(e.key==="ArrowLeft"?-.1:e.key==="ArrowRight"?.1:0,e.key==="ArrowUp"?-.08:e.key==="ArrowDown"?.08:0);settings.current.onInteraction();return;}const sph=new T.Spherical().setFromVector3(camera.position.clone().sub(controls.target));if(e.key==="ArrowLeft")sph.theta-=.13;if(e.key==="ArrowRight")sph.theta+=.13;if(e.key==="ArrowUp")sph.phi=Math.max(controls.minPolarAngle,sph.phi-.08);if(e.key==="ArrowDown")sph.phi=Math.min(controls.maxPolarAngle,sph.phi+.08);camera.position.copy(controls.target).add(new T.Vector3().setFromSpherical(sph));transition=false;dirty=true;controls.update();settings.current.onInteraction();}
  const interaction=()=>{transition=false;settings.current.onInteraction();};controls.addEventListener("start",interaction);controls.addEventListener("change",()=>dirty=true);host.addEventListener("pointerdown",pointerDown);host.addEventListener("pointermove",pointerMove);host.addEventListener("pointerup",pointerUp);host.addEventListener("keydown",key);host.addEventListener("wheel",wheel,{passive:false});
  function labelAt(el:HTMLElement,x:number,y:number,z:number){projected.set(x,y,z).project(camera);el.style.transform=`translate(-50%,-50%) translate(${(projected.x*.5+.5)*host!.clientWidth}px,${(-projected.y*.5+.5)*host!.clientHeight}px)`;el.style.visibility=projected.z>1||projected.z< -1||Math.abs(projected.x)>1.03||Math.abs(projected.y)>1.03?"hidden":"visible";}
  function animate(time=0){
   frame=requestAnimationFrame(animate);if(!visible||document.hidden||(software&&time-lastFrame<45))return;const dt=Math.min(.07,(time-lastFrame)/1000||.016);lastFrame=time;const blend=reduced?1:1-Math.exp(-dt*6),s=settings.current;
   if(s!==lastProps){dirty=true;lastProps=s;}const key=[s.view,s.roomId,s.reset].join(":");if(key!==lastKey){lastKey=key;setCamera();}
   if(Math.abs(smoothProgress-s.progress)>.01)dirty=true;smoothProgress=T.MathUtils.lerp(smoothProgress,s.progress,blend);const finished=ease((smoothProgress-10)/35);
   tempColor.copy(concreteColor).lerp(wallColor,finished);if(!model.wallMaterial.color.equals(tempColor)){model.wallMaterial.color.copy(tempColor);dirty=true;}
   const lightTarget=s.lighting==="night"?2:s.lighting==="sunset"?1:0;if(Math.abs(lightTarget-lightMix)>.001)dirty=true;lightMix=T.MathUtils.lerp(lightMix,lightTarget,blend*.65);const dusk=Math.min(lightMix,1),night=Math.max(0,lightMix-1);
   ambient.intensity=software?.5-dusk*.08-night*.08:.65-dusk*.15-night*.18;sun.intensity=software?.47-dusk*.1-night*.28:3.2-dusk*.75-night*2.05;sun.color.set("#fff7e7").lerp(tempColor.set("#ffd1a7"),dusk).lerp(tempColor.set("#bdcde5"),night);fill.intensity=software?.18:.7-night*.3;eveningLights.forEach(l=>l.intensity=(dusk*4+night*9)*finished);model.lampMaterials.forEach(m=>m.emissiveIntensity=dusk*.3+night*.8);
   for(const r of model.rooms){
    const conf=s.design.rooms[r.definition.id],floorColor=floors.find(f=>f.id===conf.floor)!.color,accentColor=palettes.find(p=>p.id===conf.palette)!.color;
    tempColor.set(floorColor);
    if(Math.abs(r.floor.color.r-tempColor.r)+Math.abs(r.floor.color.g-tempColor.g)+Math.abs(r.floor.color.b-tempColor.b)>.0001)dirty=true;r.floor.color.lerp(tempColor,blend);
    tempColor.set(accentColor);if(Math.abs(r.accent.color.r-tempColor.r)+Math.abs(r.accent.color.g-tempColor.g)+Math.abs(r.accent.color.b-tempColor.b)>.0001)dirty=true;r.accent.color.lerp(tempColor,blend);
    const texture=conf.floor==="stone"?null:model.woodTexture;if(r.floor.map!==texture){r.floor.map=texture;r.floor.needsUpdate=true;dirty=true;}
    const roomVisible=!s.isolate||!s.roomId||s.roomId===r.definition.id;if(r.group.visible!==roomVisible){r.group.visible=roomVisible;dirty=true;}
    const finishVisible=smoothProgress>12;if(r.finish.visible!==finishVisible){r.finish.visible=finishVisible;dirty=true;}r.finish.position.y=-(1-finished)*.17;
    for(const item of r.objects){const t=s.design.objects[item.info.id]||defaultTransform,f=ease((smoothProgress-item.start)/(item.end-item.start)),vis=s.furniture&&!t.hidden&&f>.005;
     if(item.group.visible!==vis){item.group.visible=vis;dirty=true;}const x=item.info.x+t.dx,z=item.info.z+t.dz,rotation=item.info.rotation+t.rotation*Math.PI/180;
     if(Math.abs(item.group.position.x-x)+Math.abs(item.group.position.z-z)+Math.abs(item.group.rotation.y-rotation)>.001)dirty=true;
     item.group.position.x=T.MathUtils.lerp(item.group.position.x,x,blend);item.group.position.z=T.MathUtils.lerp(item.group.position.z,z,blend);item.group.rotation.y=T.MathUtils.lerp(item.group.rotation.y,rotation,blend);
     item.group.position.y=(1-f)*.85;item.group.scale.setScalar(.93+f*.07);
     for(const m of item.materials){const transparent=m.userData.baseTransparent||f<.998;if(transparent!==m.transparent){m.transparent=transparent;m.needsUpdate=true;}m.opacity=f*(m.userData.baseOpacity??1);m.depthWrite=!m.userData.baseTransparent&&f>.97;if(m.userData.accent)m.color.copy(r.accent.color);}
    }
   }
   const isolatedRoom=s.isolate?a.rooms.find(r=>r.id===s.roomId):undefined;model.base.scale.set(isolatedRoom?(isolatedRoom.w+.15)/(a.w+.15):1,1,isolatedRoom?(isolatedRoom.d+.15)/(a.d+.15):1);model.base.position.x=isolatedRoom?isolatedRoom.x+isolatedRoom.w/2-a.w/2:0;model.base.position.z=isolatedRoom?isolatedRoom.z+isolatedRoom.d/2-a.d/2:0;
   for(const wall of model.walls){const near=wall.outer&&((wall.axis==="x"&&wall.coord>a.d-.01)||(wall.axis==="z"&&wall.coord>a.w-.01));let h=s.view==="plan"?.18:s.walls?2.6:wall.outer&&!near?2.6:.68;if(s.view==="walk")h=2.6;
    const vis=!s.isolate||!s.roomId||wall.rooms.includes(s.roomId);if(wall.group.visible!==vis){wall.group.visible=vis;dirty=true;}const sc=h/2.6;if(Math.abs(wall.group.scale.y-sc)>.001)dirty=true;wall.group.scale.y=T.MathUtils.lerp(wall.group.scale.y,sc,blend);
   }
   for(const door of model.doors){const angle=s.doors?-1.34:0;if(Math.abs(door.pivot.rotation.y-angle)>.001)dirty=true;door.pivot.rotation.y=T.MathUtils.lerp(door.pivot.rotation.y,angle,blend*.65);}
   if(transition){camera.position.lerp(targetPosition,blend*.66);controls.target.lerp(targetLook,blend*.66);dirty=true;if(camera.position.distanceTo(targetPosition)<.012&&controls.target.distanceTo(targetLook)<.012){camera.position.copy(targetPosition);controls.target.copy(targetLook);transition=false;}}
   const zoom=targetZoom*s.zoom;if(Math.abs(camera.zoom-zoom)>.001)dirty=true;camera.zoom=T.MathUtils.lerp(camera.zoom,zoom,blend);camera.updateProjectionMatrix();controls.enabled=s.view!=="walk";controls.enableRotate=s.view==="dollhouse";controls.autoRotate=s.rotate&&!reduced&&s.view==="dollhouse"&&!transition;if(s.view==="walk")camera.lookAt(controls.target);else controls.update(dt);
   const selected=model.objects.find(o=>o.info.id===s.objectId);const selVisible=!!selected&&selected.group.visible&&selected.group.parent!.visible;if(selection.visible!==selVisible){selection.visible=selVisible;dirty=true;}if(selected&&selVisible)selection.setFromObject(selected.group);
   // Labels are real buttons projected from the same room coordinates as the 3D plan.
   for(const {room,button} of hotspots){const show=s.labels&&s.view!=="walk"&&(!s.isolate||s.roomId===room.definition.id);button.style.display=show?"flex":"none";button.classList.toggle("active",s.roomId===room.definition.id);button.setAttribute("aria-pressed",String(s.roomId===room.definition.id));if(show)labelAt(button,room.group.position.x,.1,room.group.position.z+room.definition.d*.24);}
   const selectedRoom=a.rooms.find(r=>r.id===s.roomId),mw=selectedRoom?.w||a.w,md=selectedRoom?.d||a.d,mx=selectedRoom?selectedRoom.x+mw/2-a.w/2:0,mz=selectedRoom?selectedRoom.z+md/2-a.d/2:0;
   measureX.style.display=measureZ.style.display=s.dimensions&&s.view!=="walk"?"block":"none";measureX.textContent=mw.toLocaleString("ru-RU")+" м";measureZ.textContent=md.toLocaleString("ru-RU")+" м";labelAt(measureX,mx,.1,mz+md/2+.26);labelAt(measureZ,mx-mw/2-.24,.1,mz);
   if(dirty){renderer.render(scene,camera);dirty=false;}
  }
  async function snapshot(){renderer.render(scene,camera);const c=document.createElement("canvas");c.width=1800;c.height=Math.round(1800*host!.clientHeight/host!.clientWidth)+140;const ctx=c.getContext("2d")!;ctx.fillStyle=settings.current.lighting==="night"?"#596354":"#edf0e6";ctx.fillRect(0,0,c.width,c.height);ctx.drawImage(renderer.domElement,0,65,1800,c.height-140);ctx.fillStyle=settings.current.lighting==="night"?"#fff9eb":"#40523d";ctx.font="600 34px sans-serif";ctx.fillText("gasgarick.",50,52);ctx.font="23px sans-serif";const room=a.rooms.find(r=>r.id===settings.current.roomId);ctx.fillText(a.name+" · "+a.area+" м²"+(room?" · "+room.name:" · вся квартира"),50,c.height-30);return c.toDataURL("image/png");}
  const contextLost=(e:Event)=>{e.preventDefault();setError(true);};renderer.domElement.addEventListener("webglcontextlost",contextLost);animate();settings.current.onReady({snapshot,objects:model.objects.map(o=>o.info)});
  return()=>{cancelAnimationFrame(frame);ro.disconnect();io.disconnect();controls.removeEventListener("start",interaction);controls.dispose();host.removeEventListener("pointerdown",pointerDown);host.removeEventListener("pointermove",pointerMove);host.removeEventListener("pointerup",pointerUp);host.removeEventListener("keydown",key);host.removeEventListener("wheel",wheel);renderer.domElement.removeEventListener("webglcontextlost",contextLost);model.root.traverse(o=>{if(o instanceof T.Mesh||o instanceof T.LineSegments)o.geometry.dispose();});model.materials.forEach(m=>m.dispose());model.textures.forEach(t=>t.dispose());env?.dispose();selection.geometry.dispose();selection.material.dispose();ground.geometry.dispose();shadowMat.dispose();renderer.dispose();renderer.domElement.remove();overlay.remove();};
 },[props.apartment.id,attempt]);
 return <div ref={container} className="apartment-canvas" data-lenis-prevent-wheel={props.wheelZoom?"":undefined} tabIndex={0} role="region" aria-label="Интерактивная 3D-квартира. Нажмите на комнату или мебель. Колесо меняет масштаб, стрелки поворачивают камеру.">{error&&<div className="room-error"><p>Не удалось открыть квартиру.</p><button onClick={()=>{setError(false);setAttempt(n=>n+1);}}>Попробовать ещё раз</button></div>}</div>;
}
