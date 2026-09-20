"use client";

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import { CanvasRenderer } from "./canvas-renderer";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";

export type RoomApi = { snapshot: () => Promise<string> };
type Props = { progress: number; palette: string; floor: string; lighting: string; view: string; reset: number; zoom: number; autoRotate: boolean; onReady: (api: RoomApi) => void; onInteraction: () => void };
const colors: Record<string, string> = { sage: "#a7b19b", sand: "#cdb99b", rose: "#c9a5a0", blue: "#9fadb8" };

export default function Room(props: Props) {
  const container = useRef<HTMLDivElement>(null);
  const settings = useRef(props);
  const [error, setError] = useState(false);
  const [attempt, setAttempt] = useState(0);
  settings.current = props;

  useEffect(() => {
    const host = container.current;
    if (!host) return;
    let renderer: THREE.WebGLRenderer | CanvasRenderer;
    let software = false;
    try { renderer = new THREE.WebGLRenderer({antialias:true,alpha:true,powerPreference:"high-performance",preserveDrawingBuffer:true}); }
    catch {
      try { renderer = new CanvasRenderer(); software = true; }
      catch { setError(true); return; }
    }
    setError(false);
    if (renderer instanceof THREE.WebGLRenderer) {
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.shadowMap.enabled = true;
      renderer.shadowMap.type = THREE.PCFSoftShadowMap;
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.03;
      renderer.setClearColor(0x000000,0);
    }
    renderer.domElement.setAttribute("role","img");
    renderer.domElement.setAttribute("aria-label", "Объёмный план гостиной: две стены, окно, диван, кресло и столик. Поворачивайте мышью или клавишами со стрелками.");
    host.appendChild(renderer.domElement);
    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-5,5,5,-5,.1,80);
    if (settings.current.view === "top") camera.position.set(0,14,.02);
    else camera.position.set(7.6,7.2,9.6);
    const target = new THREE.Vector3(0,.72,0);
    const controls = new OrbitControls(camera,host);
    controls.target.copy(target);
    controls.enableDamping = true;
    controls.dampingFactor = .065;
    controls.autoRotateSpeed = .55;
    controls.enablePan = false;
    controls.enableZoom = false;
    controls.minPolarAngle = .03;
    controls.maxPolarAngle = Math.PI/2.15;
    controls.rotateSpeed = .52;
    controls.touches.ONE = THREE.TOUCH.ROTATE;
    controls.touches.TWO = THREE.TOUCH.DOLLY_ROTATE;
    controls.update();
    const ambient = new THREE.AmbientLight(0xfffcf7,software ? .43 : .55);scene.add(ambient);
    const hemisphere = new THREE.HemisphereLight(0xfffcf4,0x9b9d8b,1.1);scene.add(hemisphere);
    let envTarget: THREE.WebGLRenderTarget | undefined;
    if(renderer instanceof THREE.WebGLRenderer){const pmrem=new THREE.PMREMGenerator(renderer);const environment=new RoomEnvironment();envTarget=pmrem.fromScene(environment,.04);scene.environment=envTarget.texture;scene.environmentIntensity=.28;environment.dispose();pmrem.dispose();}
    const sun = new THREE.DirectionalLight(software ? 0xfffcf5 : 0xfff5df,software ? .42 : 2.7);
    sun.position.set(-3,9,6);
    sun.castShadow = true;
    sun.shadow.mapSize.set(2048,2048);
    Object.assign(sun.shadow.camera,{left:-7,right:7,top:7,bottom:-7,near:.5,far:30});
    sun.shadow.normalBias = .035;
    sun.shadow.bias = -.00015;
    scene.add(sun);
    const fill = new THREE.DirectionalLight(0xe4eaf5,software ? .15 : .6);
    fill.position.set(5,4,-5);scene.add(fill);
    const room = new THREE.Group();scene.add(room);
    const materials: THREE.Material[] = [];
    const textures: THREE.Texture[] = [];
    function texture(kind: "wood" | "fabric" | "plaster") {
      const canvas=document.createElement("canvas");canvas.width=256;canvas.height=256;
      const ctx=canvas.getContext("2d")!;const data=ctx.createImageData(256,256);
      let seed=42;const random=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};
      for(let y=0;y<256;y++)for(let x=0;x<256;x++){
        let value=kind==="wood"?220+Math.sin(x*.26+Math.sin(y*.021)*2.2)*11+Math.sin(x*.92+y*.015)*4+(random()-.5)*12:kind==="fabric"?225+((x%3===0||y%3===0)?-22:0)+(random()-.5)*18:232+(random()-.5)*18;
        const i=(y*256+x)*4;data.data[i]=value;data.data[i+1]=value;data.data[i+2]=value;data.data[i+3]=255;
      }
      ctx.putImageData(data,0,0);const map=new THREE.CanvasTexture(canvas);map.wrapS=map.wrapT=THREE.RepeatWrapping;map.repeat.set(kind==="fabric"?4:1,kind==="wood"?2:kind==="fabric"?4:1);map.colorSpace=THREE.SRGBColorSpace;map.anisotropy=renderer instanceof THREE.WebGLRenderer?Math.min(8,renderer.capabilities.getMaxAnisotropy()):1;textures.push(map);return map;
    }
    const woodTexture=software?null:texture("wood"),fabricTexture=software?null:texture("fabric"),plasterTexture=software?null:texture("plaster");
    const material = (color: string, options: Partial<THREE.MeshStandardMaterialParameters> = {}) => {
      const m = new THREE.MeshStandardMaterial({color,roughness:.82,...options});materials.push(m);return m;
    };
    const plaster = material("#e9e2d6",{map:plasterTexture,bumpMap:plasterTexture,bumpScale:.025});
    const concrete = material("#b4b2a7");
    const cream = material("#ebe5d6");
    const fabric = material("#e3ded0",{map:fabricTexture,bumpMap:fabricTexture,bumpScale:.025,roughness:.97});
    const accent = material(colors.sage,{map:fabricTexture,bumpMap:fabricTexture,bumpScale:.02,roughness:.94});
    const wood = material("#ba9b77",{map:woodTexture,roughness:.6});
    const woodDark = material("#796b53");
    const travertine = material("#dbcfb5");
    const rugMat = material("#dad3c1",{map:fabricTexture,bumpMap:fabricTexture,bumpScale:.04,roughness:1});
    const bronze = material("#6b6c57",{metalness:.45,roughness:.4});
    const leafMat = material("#7c8b69");
    const clay = material("#bda18b");
    const glass = material("#dce6df",{transparent:true,opacity:.23,roughness:.12,metalness:.15,depthWrite:false,side:THREE.DoubleSide});
    const box = (parent: THREE.Object3D,w:number,h:number,d:number,x:number,y:number,z:number,mat:THREE.Material,round=0) => {
      const subdivide = software && (w > 3 || d > 2);
      const geo = subdivide ? new THREE.BoxGeometry(w,h,d,Math.ceil(w/.7),Math.ceil(h/.7),Math.ceil(d/.7)) : round && (!software || round>=.06) ? new RoundedBoxGeometry(w,h,d,software ? 1 : 5,Math.min(round,w/3,h/3,d/3)) : new THREE.BoxGeometry(w,h,d);
      const mesh = new THREE.Mesh(geo,mat);mesh.position.set(x,y,z);mesh.castShadow=true;mesh.receiveShadow=true;parent.add(mesh);return mesh;
    };
    const cyl = (parent:THREE.Object3D,rt:number,rb:number,h:number,x:number,y:number,z:number,mat:THREE.Material) => {
      const m = new THREE.Mesh(new THREE.CylinderGeometry(rt,rb,h,software ? (rt<.04?6:16) : 48),mat);m.position.set(x,y,z);m.castShadow=true;m.receiveShadow=true;parent.add(m);return m;
    };
    const base = box(room,6.28,.23,4.28,0,-.115,0,concrete,.025);
    // Open dollhouse shell; the side wall has a genuine window opening.
    box(room,6.28,2.8,.17,0,1.4,-2.08,plaster,.025);
    box(room,.17,2.8,.76,-3.08,1.4,-1.7,plaster,.015);
    box(room,.17,2.8,.7,-3.08,1.4,1.78,plaster,.015);
    box(room,.17,.32,2.8,-3.08,2.64,.05,plaster,.015);
    box(room,.17,.36,2.8,-3.08,.18,.05,plaster,.015);
    const windowGroup = new THREE.Group();room.add(windowGroup);
    box(windowGroup,.13,.08,2.75,-3.035,.41,.05,cream);
    box(windowGroup,.13,.08,2.75,-3.035,2.47,.05,cream);
    for(const z of [-1.28,.05,1.38])box(windowGroup,.11,2.05,.055,-3.035,1.44,z,cream);
    box(windowGroup,.025,2,2.6,-3.035,1.45,.05,glass);
    const finish = new THREE.Group();room.add(finish);
    box(finish,6,.08,.06,0,.07,-1.955,cream,.01);
    box(finish,.06,.08,4,-2.96,.07,0,cream,.01);
    const planks:THREE.Mesh[]=[];
    const floorMaterials:THREE.MeshStandardMaterial[]=[];
    const plankColors=["#c7ad89","#cbb48e","#c3a682","#d2b995","#c5ac89"];
    for(let row=0;row<16;row++){
      const m = material(plankColors[row%5],{map:woodTexture,roughness:.68});floorMaterials.push(m);
      for(let col=0;col<3;col++){
        const plank=box(finish,1.99,.035,.242,-2+col*2,.018,-1.875+row*.25,m,.004);
        plank.userData.delay=row*.8+col*.4;planks.push(plank);
      }
    }
    const animated: {group:THREE.Group;start:number;end:number;fall:number}[]=[];
    function furniture(x:number,z:number,start:number,end:number,fall=.6){const g=new THREE.Group();g.position.set(x,0,z);room.add(g);animated.push({group:g,start,end,fall});return g;}
    const rug=furniture(-.1,.2,48,62,.05);
    box(rug,3.65,.035,2.65,0,.045,0,rugMat,.016);
    for(let i=0;i<27;i++)box(rug,3.45,.005,.012,0,.066,-1.2+i*.09,cream,.002);
    const sofa=furniture(-.7,-1.26,57,76);
    for(const x of [-1.2,1.2])for(const z of [-.33,.33])cyl(sofa,.05,.045,.15,x,.12,z,woodDark);
    box(sofa,2.97,.42,.98,0,.38,0,fabric,.19);
    box(sofa,2.9,.62,.3,0,.79,-.35,fabric,.13);
    for(const x of [-1.34,1.34])box(sofa,.3,.48,.99,x,.65,.025,fabric,.14);
    for(const x of [-.63,.63])box(sofa,1.18,.18,.78,x,.66,.1,cream,.09);
    const cushionA=box(sofa,.52,.52,.16,-.88,.96,-.18,accent,.08);cushionA.rotation.z=.13;
    const cushionB=box(sofa,.47,.45,.17,.65,.93,-.18,clay,.08);cushionB.rotation.z=-.17;
    const table=furniture(-.15,.42,66,84);
    cyl(table,.44,.49,.43,0,.27,0,travertine);
    cyl(table,.81,.81,.09,0,.53,0,travertine);
    for(let i=0;i<28;i++){const a=i*Math.PI*2/28;cyl(table,.009,.009,.39,Math.cos(a)*.463,.28,Math.sin(a)*.463,cream);}
    const books=furniture(-.15,.42,83,96,.35);
    box(books,.42,.042,.28,-.18,.606,.08,woodDark,.009);
    const book=box(books,.36,.03,.24,-.16,.641,.08,cream,.009);book.rotation.y=.2;
    cyl(books,.15,.13,.07,.32,.626,.11,clay);
    cyl(books,.066,.084,.2,.16,.695,-.22,cream);
    const chair=furniture(1.77,.68,69,86);
    chair.rotation.y=-.65;
    cyl(chair,.34,.4,.15,0,.13,0,woodDark);
    box(chair,1,.4,.95,0,.4,0,accent,.19);
    box(chair,1,.65,.3,0,.79,-.34,accent,.14);
    for(const x of [-.42,.42])box(chair,.2,.35,.87,x,.64,.04,accent,.1);
    box(chair,.68,.17,.71,0,.62,.08,accent,.08);
    const side=furniture(-2.42,-.55,72,88);
    cyl(side,.27,.25,.53,0,.3,0,travertine);
    cyl(side,.3,.3,.035,0,.58,0,travertine);
    cyl(side,.105,.07,.06,0,.64,0,bronze);
    const cabinet=furniture(1.8,-1.71,56,73,.35);
    box(cabinet,1.95,.65,.48,0,.39,0,wood,.035);
    for(let i=0;i<23;i++)box(cabinet,.025,.55,.018,-.9+i*.08,.41,.252,woodDark,.004);
    for(const x of [-.8,.8])box(cabinet,.07,.12,.34,x,.06,0,woodDark);
    const decor=furniture(1.8,-1.71,84,98,.5);
    cyl(decor,.13,.11,.32,.5,.88,0,cream);
    cyl(decor,.08,.065,.2,.23,.82,0,clay);
    box(decor,.42,.045,.29,-.52,.74,0,cream,.01);
    const shelf=furniture(.86,-1.98,80,96,.4);
    box(shelf,1.4,.055,.25,0,1.75,0,wood,.016);
    for(let i=0;i<4;i++)box(shelf,.075,.26+i*.027,.16,-.4+i*.08,1.91+i*.0135,0,i%2?cream:accent,.009);
    cyl(shelf,.08,.1,.14,.43,1.85,0,clay);
    const lamp=furniture(2.55,-.83,77,92);
    const shade=material("#e7dbc3",{emissive:"#ffcb85",emissiveIntensity:0,roughness:.8});
    shade.name="lamp-shade";
    const lampLight=new THREE.PointLight(0xffbf74,0,6,2);lampLight.position.set(2.5,1.6,-.8);scene.add(lampLight);
    const softLight=new THREE.PointLight(0xffd09a,0,5,2);softLight.position.set(-1,1.8,-1.5);scene.add(softLight);
    cyl(lamp,.25,.27,.055,0,.065,0,bronze);
    cyl(lamp,.016,.016,1.76,0,.95,0,bronze);
    cyl(lamp,.27,.4,.43,0,1.81,0,shade);
    for(let i=0;i<24;i++){const a=i*Math.PI*2/24;const rib=cyl(lamp,.006,.006,.4,Math.cos(a)*.337,1.81,Math.sin(a)*.337,cream);rib.rotation.z=Math.cos(a)*.2;rib.rotation.x=-Math.sin(a)*.2;}
    const plant=furniture(-2.45,1.35,83,99);
    cyl(plant,.21,.16,.38,0,.22,0,clay);
    for(let i=0;i<6;i++){
      const angle=i*2.4;
      const height=.57+i*.1;
      const branch=cyl(plant,.01,.013,height,Math.cos(angle)*.09,height/2+.4,Math.sin(angle)*.09,woodDark);
      branch.rotation.z=Math.cos(angle)*.13;
      for(let j=0;j<3;j++){
        const leaf=new THREE.Mesh(new THREE.SphereGeometry(.15,software ? 6 : 12,software ? 4 : 8),leafMat);
        leaf.scale.set(.5,1.4,.18);leaf.rotation.set(.3,angle,.6+j*.4);
        leaf.position.set(Math.cos(angle+j*.6)*(.15+j*.06),height+.27-j*.11,Math.sin(angle+j*.6)*(.15+j*.07));leaf.castShadow=true;plant.add(leaf);
      }
    }
    const curtain=furniture(-2.91,-.95,43,58,.15);
    for(let i=0;i<7;i++){
      const drape=box(curtain,.08,2.14,.12,0,1.44,-.15+i*.07,cream,.04);
      drape.position.x+=Math.sin(i*1.3)*.055;
    }
    // A softly folded throw, stitched cushions, and a tall ceramic vase add scale.
    const throwGroup=furniture(-.7,-1.26,87,100,.15);
    const throwMat=material("#b9aa96",{map:fabricTexture,bumpMap:fabricTexture,bumpScale:.035,side:THREE.DoubleSide});
    const throwGeo=new THREE.PlaneGeometry(.55,1.2,8,16);
    const positions=throwGeo.attributes.position;
    for(let i=0;i<positions.count;i++){const x=positions.getX(i),t=positions.getY(i)+.6;positions.setXYZ(i,x-.88,.78-Math.max(0,t-.73)*1.1+Math.sin(x*35)*.012,t-.55);}
    throwGeo.computeVertexNormals();const blanket=new THREE.Mesh(throwGeo,throwMat);blanket.castShadow=true;blanket.receiveShadow=true;throwGroup.add(blanket);
    const vase=furniture(2.2,-1.7,89,100,.3);
    const vaseProfile=[new THREE.Vector2(.09,0),new THREE.Vector2(.16,.06),new THREE.Vector2(.16,.22),new THREE.Vector2(.09,.32),new THREE.Vector2(.065,.37)];
    const vaseMesh=new THREE.Mesh(new THREE.LatheGeometry(vaseProfile,software?16:40),clay);vaseMesh.position.y=.73;vaseMesh.castShadow=true;vase.add(vaseMesh);
    const ground = new THREE.Mesh(new THREE.PlaneGeometry(200,200),new THREE.ShadowMaterial({color:0x657157,opacity:.14}));
    ground.rotation.x=-Math.PI/2;ground.position.y=-.238;ground.receiveShadow=true;if(!software)scene.add(ground);
    materials.push(ground.material);
    const edgeGeo = new THREE.EdgesGeometry(new THREE.BoxGeometry(6.3,.23,4.3));
    if (software) {
      base.renderOrder = -30;
      finish.traverse(object => {object.renderOrder = -20;});
      rug.traverse(object => {object.renderOrder = -10;});
    }
    const edgeMat = new THREE.LineBasicMaterial({color:0xaaa99a,transparent:true,opacity:.4});
    const edges = new THREE.LineSegments(edgeGeo,edgeMat);edges.position.y=-.115;room.add(edges);
    const concreteColor=new THREE.Color("#b4b2a7");
    const plasterColor=new THREE.Color("#e9e2d6");
    const accentColor=new THREE.Color();
    let frame=0,visible=true,smoothProgress=settings.current.progress,lastReset=settings.current.reset,lastView=settings.current.view;
    let cameraTransition=0;
    let lightingMix=settings.current.lighting==="night"?2:settings.current.lighting==="sunset"?1:0;
    let lastFloor="";
    const floorTargets={oak:["#c7ad89","#cbb48e","#c3a682","#d2b995","#c5ac89"],walnut:["#856447","#927053","#7e624c","#967759","#88694e"],stone:["#b8b9b0","#b8b9b0","#b8b9b0","#b8b9b0","#b8b9b0"]};
    const transitionColor=new THREE.Color();
    const accentCopies:THREE.MeshStandardMaterial[]=[accent];
    const animatedMaterials=new Map<THREE.Group,THREE.MeshStandardMaterial[]>();
    for(const item of animated){const cache=new Map<THREE.Material,THREE.MeshStandardMaterial>();item.group.traverse(object=>{if(!(object instanceof THREE.Mesh)||!(object.material instanceof THREE.MeshStandardMaterial))return;const original=object.material;let clone=cache.get(original);if(!clone){clone=original.clone();cache.set(original,clone);materials.push(clone);if(original===accent)accentCopies.push(clone);}object.material=clone;});animatedMaterials.set(item.group,[...cache.values()]);}
    let desiredCamera=new THREE.Vector3(7.6,7.2,9.6);
    const reduced=matchMedia("(prefers-reduced-motion: reduce)").matches;
    const ease=(n:number)=>{const x=THREE.MathUtils.clamp(n,0,1);return x*x*(3-2*x);};
    let dirty = true;
    function size(){if(!host)return;const w=host.clientWidth,h=host.clientHeight;if(!w||!h)return;renderer.setSize(w,h);const aspect=w/h;const half=aspect<1?4.45/aspect:4.15;camera.left=-half*aspect;camera.right=half*aspect;camera.top=half;camera.bottom=-half;camera.updateProjectionMatrix();dirty=true;}
    const ro=new ResizeObserver(size);ro.observe(host);size();
    const io=new IntersectionObserver(e=>{visible=e[0].isIntersecting;},{rootMargin:"120px"});io.observe(host);
    let lastFrame = 0;
    function animate(time = 0){
      frame=requestAnimationFrame(animate);if(!visible||document.hidden || (software && time - lastFrame < 40))return;
      const dt=Math.min(.08,(time-lastFrame)/1000||.016);lastFrame = time;
      const blend=reduced?1:1-Math.exp(-dt*7);
      const current=settings.current;
      const lightTarget=current.lighting==="night"?2:current.lighting==="sunset"?1:0;
      if(Math.abs(lightingMix-lightTarget)>.001)dirty=true;lightingMix=THREE.MathUtils.lerp(lightingMix,lightTarget,blend*.55);
      const dusk=Math.min(lightingMix,1),night=Math.max(0,lightingMix-1);
      ambient.intensity=software?.43-dusk*.06-night*.08:.55-dusk*.2-night*.15;
      hemisphere.intensity=1.1-dusk*.35-night*.4;
      sun.intensity=software?.42-dusk*.08-night*.28:2.7-dusk*.65-night*1.95;
      sun.color.set(0xfffcf5).lerp(new THREE.Color(0xffd0a0),dusk).lerp(new THREE.Color(0xb3c8e4),night);
      fill.intensity=software?.15+night*.02:.6-night*.25;
      lampLight.intensity=(software?dusk*.16+night*.5:dusk*5+night*10)*ease((smoothProgress-77)/15);softLight.intensity=night*(software?.12:3);shade.emissiveIntensity=dusk*.2+night*.7;
      for(const mats of animatedMaterials.values())for(const mat of mats)if(mat.name==="lamp-shade")mat.emissiveIntensity=shade.emissiveIntensity;
      const floorKey=(current.floor in floorTargets?current.floor:"oak") as keyof typeof floorTargets;
      floorMaterials.forEach((mat,index)=>{transitionColor.set(floorTargets[floorKey][index%5]);if(Math.abs(mat.color.r-transitionColor.r)+Math.abs(mat.color.g-transitionColor.g)>.0001)dirty=true;mat.color.lerp(transitionColor,blend*.7);});
      if(lastFloor!==current.floor){lastFloor=current.floor;for(const mat of floorMaterials){mat.map=current.floor==="stone"?plasterTexture:woodTexture;mat.roughness=current.floor==="stone"?.94:.68;mat.needsUpdate=true;}dirty=true;}
      if(Math.abs(smoothProgress-current.progress)>.005 || Math.abs(camera.zoom-current.zoom*(current.view==="front"?1.13:1))>.0001 || cameraTransition>0 || lastReset!==current.reset || lastView!==current.view)dirty=true;
      smoothProgress=reduced?current.progress:THREE.MathUtils.lerp(smoothProgress,current.progress,blend);
      const finishAmount=ease((smoothProgress-17)/28);
      plaster.color.copy(concreteColor).lerp(plasterColor,finishAmount);
      windowGroup.visible=smoothProgress>30;
      finish.visible=smoothProgress>13;
      for(const plank of planks){const f=ease((smoothProgress-14-plank.userData.delay)/18);plank.scale.y=Math.max(.001,f);plank.scale.x=current.floor==="stone"?1.006:1;plank.scale.z=current.floor==="stone"?1.035:1;plank.position.y=.018-(1-f)*.14;plank.visible=f>.02;}
      for(const item of animated){const f=ease((smoothProgress-item.start)/(item.end-item.start));item.group.visible=f>.003;item.group.scale.setScalar(.92+.08*f);item.group.position.y=(1-f)*item.fall;for(const mat of animatedMaterials.get(item.group)||[]){const transparent=f<.995;if(mat.transparent!==transparent){mat.transparent=transparent;mat.needsUpdate=true;}mat.opacity=f;mat.depthWrite=f>.95;}}
      accentColor.set(colors[current.palette]||colors.sage);if(Math.abs(accent.color.r-accentColor.r)+Math.abs(accent.color.g-accentColor.g)+Math.abs(accent.color.b-accentColor.b)>.0001)dirty=true;for(const mat of accentCopies)mat.color.lerp(accentColor,blend);
      if(current.reset!==lastReset||current.view!==lastView){
        lastReset=current.reset;lastView=current.view;
        desiredCamera=current.view==="top"?new THREE.Vector3(0,14,.02):current.view==="front"?new THREE.Vector3(5.2,3.8,11):new THREE.Vector3(7.6,7.2,9.6);
        cameraTransition=reduced?1:60;
      }
      if(cameraTransition>0){camera.position.lerp(desiredCamera,blend*.72);controls.target.lerp(target,blend*.72);cameraTransition--;if(cameraTransition===0){camera.position.copy(desiredCamera);controls.target.copy(target);}}
      camera.zoom=THREE.MathUtils.lerp(camera.zoom,current.zoom*(current.view==="front"?1.13:1),blend);camera.updateProjectionMatrix();
      controls.enableRotate=current.view!=="top";
      controls.autoRotate=current.autoRotate&&!reduced&&current.view!=="top"&&cameraTransition===0;
      if(controls.update(dt))dirty=true;
      if(dirty){renderer.render(scene,camera);dirty=false;}
    }
    const key=(event:KeyboardEvent)=>{
      if(!["ArrowLeft","ArrowRight","ArrowUp","ArrowDown"].includes(event.key))return;
      event.preventDefault();if(settings.current.view==="top")return;
      const offset=camera.position.clone().sub(controls.target);
      const spherical=new THREE.Spherical().setFromVector3(offset);
      if(event.key==="ArrowLeft")spherical.theta-=.12;
      if(event.key==="ArrowRight")spherical.theta+=.12;
      if(event.key==="ArrowUp")spherical.phi=Math.max(.06,spherical.phi-.1);
      if(event.key==="ArrowDown")spherical.phi=Math.min(1.42,spherical.phi+.1);
      camera.position.copy(controls.target).add(new THREE.Vector3().setFromSpherical(spherical));controls.update();dirty=true;
    };
    const interaction=()=>{cameraTransition=0;settings.current.onInteraction();};controls.addEventListener("start",interaction);
    const contextLost=(e:Event)=>{e.preventDefault();setError(true);};
    async function snapshot():Promise<string>{
      renderer.render(scene,camera);
      const canvas=document.createElement("canvas");canvas.width=1600;canvas.height=Math.round(1600*host!.clientHeight/host!.clientWidth)+150;
      const ctx=canvas.getContext("2d");if(!ctx)throw new Error("Canvas unavailable");
      const night=settings.current.lighting==="night";ctx.fillStyle=night?"#505d56":"#eef0e8";ctx.fillRect(0,0,canvas.width,canvas.height);
      ctx.drawImage(renderer.domElement,0,65,1600,canvas.height-150);
      ctx.fillStyle=night?"#f5f5e8":"#435541";ctx.font="600 36px sans-serif";ctx.fillText("gasgarick.",55,59);
      ctx.font="22px sans-serif";ctx.fillText("Гостиная · 24 м² · ваш вариант интерьера",55,canvas.height-38);
      return canvas.toDataURL("image/png");
    }
    host.addEventListener("keydown",key);renderer.domElement.addEventListener("webglcontextlost",contextLost);
    animate();settings.current.onReady({snapshot});
    return ()=>{cancelAnimationFrame(frame);ro.disconnect();io.disconnect();host.removeEventListener("keydown",key);renderer.domElement.removeEventListener("webglcontextlost",contextLost);controls.removeEventListener("start",interaction);controls.dispose();envTarget?.dispose();textures.forEach(t=>t.dispose());scene.traverse(o=>{if(o instanceof THREE.Mesh || o instanceof THREE.LineSegments)o.geometry.dispose();});materials.forEach(m=>m.dispose());edgeMat.dispose();renderer.dispose();renderer.domElement.remove();};
  }, [attempt]);

  return <div ref={container} className="room-container" tabIndex={0} role="region" aria-label="Интерактивная 3D-модель комнаты. Используйте мышь или клавиши со стрелками.">{error&&<div className="room-error"><p>Не удалось открыть 3D-план. Проверьте, включено ли аппаратное ускорение в браузере.</p><button onClick={()=>{setError(false);setAttempt(n=>n+1);}}>Попробовать ещё раз</button></div>}</div>;
}
