import * as THREE from "three";
import { Projector,RenderableFace,RenderableLine } from "three/examples/jsm/renderers/Projector.js";

/** Depth-tested software fallback for devices without a WebGL context. */
export class CanvasRenderer {
 domElement=document.createElement("canvas");
 private context:CanvasRenderingContext2D;
 private projector=new Projector();
 private width=1;private height=1;private bufferWidth=1;private bufferHeight=1;
 private pixels:ImageData;private depth=new Float32Array(1);
 private color=new THREE.Color();private ambient=new THREE.Color();private lightColor=new THREE.Color();
 private centroid=new THREE.Vector3();private direction=new THREE.Vector3();private normal=new THREE.Vector3();
 constructor(){const ctx=this.domElement.getContext("2d",{alpha:true});if(!ctx)throw new Error("Canvas unavailable");this.context=ctx;this.pixels=ctx.createImageData(1,1);}
 setSize(width:number,height:number){this.width=width;this.height=height;const ratio=Math.min(1,1000/width);this.bufferWidth=Math.max(1,Math.round(width*ratio));this.bufferHeight=Math.max(1,Math.round(height*ratio));this.domElement.width=this.bufferWidth;this.domElement.height=this.bufferHeight;this.domElement.style.width=width+"px";this.domElement.style.height=height+"px";this.pixels=this.context.createImageData(this.bufferWidth,this.bufferHeight);this.depth=new Float32Array(this.bufferWidth*this.bufferHeight);}
 render(scene:THREE.Scene,camera:THREE.Camera){
  const ctx=this.context,data=this.projector.projectScene(scene,camera,true,true),w=this.bufferWidth,h=this.bufferHeight,hw=w/2,hh=h/2,rgba=this.pixels.data,zbuffer=this.depth;rgba.fill(0);zbuffer.fill(Infinity);
  this.ambient.setRGB(.035,.035,.035);
  const lights:{position:THREE.Vector3;color:THREE.Color;intensity:number;point:boolean;distance:number}[]=[];
  for(const raw of data.lights){const l=raw as THREE.Light;if(l instanceof THREE.AmbientLight)this.ambient.add(this.lightColor.copy(l.color).multiplyScalar(l.intensity));else if(l instanceof THREE.DirectionalLight||l instanceof THREE.PointLight)lights.push({position:new THREE.Vector3().setFromMatrixPosition(l.matrixWorld),color:l.color,intensity:l.intensity,point:l instanceof THREE.PointLight,distance:l instanceof THREE.PointLight?l.distance:0});}
  for(let pass=0;pass<2;pass++)for(const e of data.elements){
   if(!(e instanceof RenderableFace))continue;const m=e.material as THREE.MeshStandardMaterial;if(!m||m.opacity<.003)continue;
   const transparent=m.opacity<.995;if((pass===0&&transparent)||(pass===1&&!transparent))continue;
   const a=e.v1.positionScreen,b=e.v2.positionScreen,c=e.v3.positionScreen;if(a.z< -1||a.z>1||b.z< -1||b.z>1||c.z< -1||c.z>1)continue;
   this.color.copy(this.ambient);this.centroid.copy(e.v1.positionWorld).add(e.v2.positionWorld).add(e.v3.positionWorld).multiplyScalar(1/3);
   if(e.vertexNormalsLength===3)this.normal.copy(e.vertexNormalsModel[0]).add(e.vertexNormalsModel[1]).add(e.vertexNormalsModel[2]).normalize();else this.normal.copy(e.normalModel);
   for(const l of lights){this.direction.copy(l.position);if(l.point)this.direction.sub(this.centroid);const distance=this.direction.length();this.direction.normalize();let amount=Math.max(0,this.normal.dot(this.direction))*l.intensity;if(l.point&&l.distance)amount*=Math.max(0,1-distance/l.distance);this.color.add(this.lightColor.copy(l.color).multiplyScalar(amount));}
   this.color.multiply(m.color||new THREE.Color("white"));if(m.emissive)this.color.add(this.lightColor.copy(m.emissive).multiplyScalar(m.emissiveIntensity||0));const hex=this.color.getHex(),red=hex>>16&255,green=hex>>8&255,blue=hex&255,alpha=m.opacity;
   const ax=a.x*hw+hw,ay=-a.y*hh+hh,bx=b.x*hw+hw,by=-b.y*hh+hh,cx=c.x*hw+hw,cy=-c.y*hh+hh;
   const minX=Math.max(0,Math.floor(Math.min(ax,bx,cx))),maxX=Math.min(w-1,Math.ceil(Math.max(ax,bx,cx))),minY=Math.max(0,Math.floor(Math.min(ay,by,cy))),maxY=Math.min(h-1,Math.ceil(Math.max(ay,by,cy)));
   const area=(by-cy)*(ax-cx)+(cx-bx)*(ay-cy);if(Math.abs(area)<.001)continue;const inv=1/area,du=(by-cy)*inv,dv=(cy-ay)*inv;
   for(let y=minY;y<=maxY;y++){
    let u=((by-cy)*(minX+.5-cx)+(cx-bx)*(y+.5-cy))*inv,v=((cy-ay)*(minX+.5-cx)+(ax-cx)*(y+.5-cy))*inv;
    for(let x=minX;x<=maxX;x++,u+=du,v+=dv){const t=1-u-v;if(u<-.0001||v<-.0001||t<-.0001)continue;const z=u*a.z+v*b.z+t*c.z,index=y*w+x;if(z>zbuffer[index]+.000001)continue;const i=index*4;
     if(!transparent){zbuffer[index]=z;rgba[i]=red;rgba[i+1]=green;rgba[i+2]=blue;rgba[i+3]=255;}
     else{const dst=rgba[i+3]/255,out=alpha+dst*(1-alpha);if(out<.001)continue;rgba[i]=(red*alpha+rgba[i]*dst*(1-alpha))/out;rgba[i+1]=(green*alpha+rgba[i+1]*dst*(1-alpha))/out;rgba[i+2]=(blue*alpha+rgba[i+2]*dst*(1-alpha))/out;rgba[i+3]=out*255;if(m.depthWrite)zbuffer[index]=z;}
    }
   }
  }
  ctx.putImageData(this.pixels,0,0);
  // Wire outlines and dimension seams also respect opaque surfaces.
  for(const e of data.elements){if(!(e instanceof RenderableLine))continue;const m=e.material as THREE.LineBasicMaterial;if(!m||m.opacity<.01)continue;const a=e.v1.positionScreen,b=e.v2.positionScreen;if(a.z< -1||b.z< -1||a.z>1||b.z>1)continue;const ax=a.x*hw+hw,ay=-a.y*hh+hh,bx=b.x*hw+hw,by=-b.y*hh+hh,n=Math.max(1,Math.ceil(Math.hypot(bx-ax,by-ay)));ctx.strokeStyle=m.color.getStyle();ctx.globalAlpha=m.opacity;ctx.lineWidth=.7;
   let drawing=false;ctx.beginPath();for(let i=0;i<=n;i++){const t=i/n,x=ax+(bx-ax)*t,y=ay+(by-ay)*t,ix=Math.round(x),iy=Math.round(y),visible=ix>=0&&ix<w&&iy>=0&&iy<h&&a.z+(b.z-a.z)*t<=zbuffer[iy*w+ix]+.00008;if(visible){if(drawing)ctx.lineTo(x,y);else ctx.moveTo(x,y);drawing=true;}else drawing=false;}ctx.stroke();
  }ctx.globalAlpha=1;
 }
 dispose(){this.domElement.width=this.domElement.height=1;this.depth=new Float32Array(1);}
}
