'use client';

import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import styles from './OryzoStoryWorld.module.css';

const ASSETS = [
  'Founders.png','Founders copy.png','California - Hawaii Map.png','Concerned provider.png',
  'EMPLOYEE ID.png','Diverse Healthcare Team Portrait (1).png','Friendly Medical Appointment Call.png',
  'Medical Eval.png','Calm Clinic Blood Draw (1).png','Dental Eval.png','Audiometry.png','Pharmacist Administering a Vaccine(1) (1).png',
  'EXAM REPORT.png','Fitness Determination.png','Diverse Workforce.png','Diverse Workforce2.png',
  'International Certification.png','Vaccine Schedule.png','Facilities.png','International Network.png',
  'Corevalue.png','Corevalue2.png','Corevalue3.png','Corevalue4.png','Corevalue5.png','Corevalue6.png',
] as const;

const STARTS = [0,3,4,6,7,12,13,14,16,18,20] as const;
const COUNTS = [3,1,2,1,5,1,1,2,2,2,6] as const;

// Oryzo supplies the motion grammar; these environments are authored for the
// Occu-Med images and subjects rather than copying Oryzo's product palette.
const ENVIRONMENTS = [
  {bg:'#15120f',accent:'#c99a68',fill:'#eadaca',tint:'#d0a36f',amount:.10,fog:.034}, // origin
  {bg:'#120d11',accent:'#e05c67',fill:'#eed6d9',tint:'#c95b64',amount:.08,fog:.043}, // problem
  {bg:'#07141d',accent:'#67c8e8',fill:'#d7f2fb',tint:'#6ec7e3',amount:.07,fog:.036}, // method
  {bg:'#071713',accent:'#79d8bd',fill:'#ddf4ed',tint:'#78cdb6',amount:.06,fog:.035}, // referral
  {bg:'#06131a',accent:'#5ec4e4',fill:'#d9f2fb',tint:'#6ec7e3',amount:.06,fog:.034}, // clinical
  {bg:'#10101b',accent:'#9c8ee4',fill:'#ece8fb',tint:'#9d91df',amount:.07,fog:.041}, // documentation
  {bg:'#081814',accent:'#70d7b5',fill:'#def5ed',tint:'#70c9ac',amount:.06,fog:.035}, // determination
  {bg:'#11101a',accent:'#b4a1e6',fill:'#eee9fb',tint:'#a693db',amount:.07,fog:.037}, // workforce
  {bg:'#07101f',accent:'#7ca8ef',fill:'#e2eaf9',tint:'#7d9fd5',amount:.06,fog:.038}, // deployment
  {bg:'#030d14',accent:'#58d3e6',fill:'#d9f4f8',tint:'#57c8dc',amount:.06,fog:.031}, // network
  {bg:'#16120b',accent:'#d7b45c',fill:'#f1e6c7',tint:'#c9a84f',amount:.08,fog:.036}, // values
] as const;

const vertex = `
varying vec2 vUv;
uniform float uTime;
uniform float uMotion;
uniform float uProgress;
void main(){
  vUv=uv;
  vec3 p=position;
  float edge=(uv.x-.5)*(uv.y-.5);
  p.z += sin(uv.x*3.14159 + uTime*.18) * .045 * uMotion;
  p.y += sin((uv.x+uProgress*.25)*3.14159) * .025 * uMotion;
  p.z += edge * .18 * uMotion;
  gl_Position=projectionMatrix*modelViewMatrix*vec4(p,1.0);
}`;

const fragment = `
precision highp float;
varying vec2 vUv;
uniform sampler2D uTexture;
uniform float uOpacity;
uniform float uImageAspect;
uniform float uPlaneAspect;
uniform vec3 uTint;
uniform float uTintAmount;
void main(){
  vec2 uv=vUv-.5;
  if(uImageAspect>uPlaneAspect) uv.x*=uPlaneAspect/max(uImageAspect,.001);
  else uv.y*=uImageAspect/max(uPlaneAspect,.001);
  uv+=.5;
  vec4 tex=texture2D(uTexture,uv);
  float frame=smoothstep(0.,.055,vUv.x)*smoothstep(0.,.055,vUv.y)*smoothstep(0.,.055,1.-vUv.x)*smoothstep(0.,.055,1.-vUv.y);
  float vignette=mix(.72,1.,smoothstep(.72,.18,length(vUv-.5)));
  vec3 grade=vec3(.76)+uTint*.42;
  vec3 image=mix(tex.rgb,tex.rgb*grade,uTintAmount);
  gl_FragColor=vec4(image,tex.a*uOpacity*frame*vignette);
}`;

type PlaneRecord={mesh:THREE.Mesh<THREE.PlaneGeometry,THREE.ShaderMaterial>;chapter:number;local:number;texture:THREE.Texture};
type Pose={x:number;y:number;z:number;s:number;rx:number;ry:number;rz:number};
type FadeMaterial=THREE.MeshBasicMaterial|THREE.LineBasicMaterial|THREE.PointsMaterial;
type Motif={group:THREE.Group;materials:FadeMaterial[]};

const clamp=(v:number,min=0,max=1)=>Math.max(min,Math.min(max,v));

function chapterProgress(index:number){
  const el=document.querySelector<HTMLElement>(`[data-oryzo-scene-index="${index}"]`);
  if(!el)return .5;
  const rect=el.getBoundingClientRect();
  return clamp((window.innerHeight-rect.top)/Math.max(window.innerHeight+rect.height,1));
}

function pose(chapter:number,local:number,p:number):Pose{
  const t=p-.5;
  if(chapter===0){
    const authored=[
      {x:-1.7,y:.15,z:-.1,s:1.58,rx:0,ry:-.08,rz:-.03},
      {x:3.05,y:1.55,z:-2.0,s:.64,rx:0,ry:.2,rz:.055},
      {x:2.65,y:-1.72,z:-3.1,s:.8,rx:0,ry:-.18,rz:-.045},
    ];
    const q=authored[local]??authored[0];
    return {...q,x:q.x+t*(local===0?-1.2:1.4),y:q.y+t*(local===2?.75:-.25),z:q.z-t*1.7};
  }
  if(chapter===1)return{x:2.35-t*3.25,y:-.05+t*.45,z:-.7-t*2.4,s:1.55,rx:0,ry:-.15+t*.18,rz:.02};
  if(chapter===2)return local===0?{x:-2.7+t*1.3,y:.8,z:-1.1-t*1.6,s:1.02,rx:0,ry:.16,rz:-.04}:{x:2.55-t*1.2,y:-.85,z:-2.15-t*1.5,s:1.08,rx:0,ry:-.17,rz:.04};
  if(chapter===3)return{x:-2.1+t*3.1,y:.35-t*.65,z:-.4-t*2.6,s:1.6,rx:0,ry:.11-t*.18,rz:-.025+t*.04};
  if(chapter===4){const a=(local-2)*.43;return{x:Math.sin(a)*4.45+t*(local-2)*.28,y:Math.cos(a*1.25)*.88-1.0,z:-1.1-Math.abs(local-2)*1.12-t*1.45,s:local===2?1.12:.76,rx:0,ry:-a*.34+t*.09,rz:a*.06};}
  if(chapter===5)return{x:2.0-t*2.0,y:.25,z:-.55-t*2.4,s:1.72,rx:0,ry:-.12+t*.15,rz:.01};
  if(chapter===6)return{x:t*.4,y:.25-t*.42,z:-.25-t*3.1,s:1.62+t*.22,rx:0,ry:t*.12,rz:-t*.02};
  if(chapter===7)return local===0?{x:-2.35+t*.6,y:.05,z:-1.0-t*1.6,s:1.12,rx:0,ry:.13,rz:-.03}:{x:2.4-t*.6,y:-.15,z:-1.65-t*1.6,s:1.12,rx:0,ry:-.13,rz:.03};
  if(chapter===8)return local===0?{x:-2.0+t*.9,y:.9-t*.55,z:-.65-t*2.2,s:1.15,rx:0,ry:.11,rz:-.035}:{x:2.05-t*.9,y:-.95+t*.55,z:-1.55-t*1.9,s:1.05,rx:0,ry:-.12,rz:.035};
  if(chapter===9)return local===0?{x:-2.05+t*1.55,y:0,z:-.45-t*2.4,s:1.56,rx:0,ry:.09-t*.14,rz:-.018}:{x:2.55-t*1.7,y:.1,z:-2.25-t*1.8,s:1.18,rx:0,ry:-.1+t*.14,rz:.015};
  if(chapter===10){const a=(local/6)*Math.PI*2+p*.46;const r=local%2?3.05:3.8;return{x:Math.cos(a)*r,y:Math.sin(a)*2.05,z:-1.0-(local%3)*.95-t*1.2,s:local===0?1.04:.76,rx:0,ry:-Math.cos(a)*.13,rz:a*.025};}
  return{x:0,y:0,z:-1,s:1,rx:0,ry:0,rz:0};
}

function buildMotif(index:number,color:number):Motif{
  const group=new THREE.Group();group.position.set(0,0,-4.8);
  const materials:FadeMaterial[]=[];
  const meshMat=()=>{const m=new THREE.MeshBasicMaterial({color,wireframe:true,transparent:true,opacity:0,depthWrite:false});materials.push(m);return m};
  const lineMat=()=>{const m=new THREE.LineBasicMaterial({color,transparent:true,opacity:0,depthWrite:false});materials.push(m);return m};
  const pointMat=(size=.04)=>{const m=new THREE.PointsMaterial({color,size,transparent:true,opacity:0,depthWrite:false});materials.push(m);return m};
  const ring=(r:number,t=.025)=>{const m=new THREE.Mesh(new THREE.TorusGeometry(r,t,6,96),meshMat());group.add(m);return m};
  const node=(x:number,y:number,z:number,s=.08)=>{const m=new THREE.Mesh(new THREE.SphereGeometry(s,12,8),meshMat());m.position.set(x,y,z);group.add(m);return m};

  if(index===0){ring(2.9,.018).rotation.x=Math.PI*.5;ring(2.1,.015).rotation.y=Math.PI*.5;ring(1.35,.012).rotation.set(.6,.35,.2)}
  else if(index===1){const m=new THREE.Mesh(new THREE.IcosahedronGeometry(2.25,2),meshMat());m.scale.set(1.15,.78,.9);group.add(m)}
  else if(index===2){ring(2.4,.022);const b=ring(2.1,.02);b.rotation.x=Math.PI*.5;const c=ring(1.75,.018);c.rotation.y=Math.PI*.5}
  else if(index===3){const pts=[new THREE.Vector3(-3,-.6,0),new THREE.Vector3(-1.5,.55,.2),new THREE.Vector3(0,-.2,0),new THREE.Vector3(1.65,.7,-.1),new THREE.Vector3(3,-.45,.1)];const geo=new THREE.BufferGeometry().setFromPoints(pts);group.add(new THREE.Line(geo,lineMat()));pts.forEach(p=>node(p.x,p.y,p.z,.1))}
  else if(index===4){for(let i=0;i<5;i++){const a=(i/5)*Math.PI*2;const r=ring(.55+i*.14,.012);r.position.set(Math.cos(a)*2.7,Math.sin(a)*1.6,(i-2)*-.3);r.rotation.set(a*.2,a*.3,a)}}
  else if(index===5){for(let i=0;i<3;i++){const geo=new THREE.EdgesGeometry(new THREE.BoxGeometry(4.8-i*.7,3.1-i*.45,.12));const frame=new THREE.LineSegments(geo,lineMat());frame.position.z=-i*.6;frame.rotation.z=(i-1)*.04;group.add(frame)}}
  else if(index===6){ring(2.4,.025);ring(1.55,.018);ring(.7,.014);node(0,0,.1,.12)}
  else if(index===7){for(let i=0;i<10;i++){const a=(i/10)*Math.PI*2;node(Math.cos(a)*(2.2+(i%2)*.65),Math.sin(a)*1.55,(i%3)*-.3,.075)}}
  else if(index===8){const globe=new THREE.Mesh(new THREE.SphereGeometry(1.85,24,16),meshMat());group.add(globe);const o1=ring(2.75,.015);o1.rotation.x=.7;const o2=ring(2.45,.012);o2.rotation.y=1.05}
  else if(index===9){const count=220;const arr=new Float32Array(count*3);for(let i=0;i<count;i++){const u=Math.random(),v=Math.random(),theta=2*Math.PI*u,phi=Math.acos(2*v-1),r=2.1;arr[i*3]=r*Math.sin(phi)*Math.cos(theta);arr[i*3+1]=r*Math.cos(phi);arr[i*3+2]=r*Math.sin(phi)*Math.sin(theta)}const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.BufferAttribute(arr,3));group.add(new THREE.Points(geo,pointMat(.035)));ring(2.8,.012).rotation.x=.55}
  else {for(let i=0;i<6;i++){const a=(i/6)*Math.PI*2;node(Math.cos(a)*2.7,Math.sin(a)*1.8,(i%2)*-.45,.11)}ring(3.05,.015)}
  return{group,materials};
}

export default function OryzoStoryWorld({sceneIndex}:{sceneIndex:number}){
  const host=useRef<HTMLDivElement>(null);
  const sceneRef=useRef(sceneIndex);sceneRef.current=sceneIndex;

  useEffect(()=>{
    const mount=host.current;if(!mount)return;
    const envColors=ENVIRONMENTS.map(env=>({bg:new THREE.Color(env.bg),accent:new THREE.Color(env.accent),fill:new THREE.Color(env.fill)}));
    const scene=new THREE.Scene();scene.background=envColors[0].bg.clone();scene.fog=new THREE.FogExp2(envColors[0].bg,.034);
    const camera=new THREE.PerspectiveCamera(41,window.innerWidth/window.innerHeight,.1,80);camera.position.set(0,.05,8.4);
    const renderer=new THREE.WebGLRenderer({antialias:true,alpha:false,powerPreference:'high-performance'});
    renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,1.8));renderer.setSize(window.innerWidth,window.innerHeight);renderer.outputColorSpace=THREE.SRGBColorSpace;mount.appendChild(renderer.domElement);

    const ambient=new THREE.AmbientLight(envColors[0].fill,1.05);scene.add(ambient);
    const key=new THREE.PointLight(envColors[0].accent,16,24);key.position.set(5,2,6);scene.add(key);
    const fill=new THREE.PointLight(envColors[0].fill,8,20);fill.position.set(-5,-2,4);scene.add(fill);

    const loader=new THREE.TextureLoader();const records:PlaneRecord[]=[];const planeAspect=4.8/3.1;
    STARTS.forEach((start,chapter)=>{
      const env=ENVIRONMENTS[chapter];
      for(let local=0;local<COUNTS[chapter];local++){
        const name=ASSETS[start+local];const texture=loader.load('/photos/'+encodeURIComponent(name));texture.colorSpace=THREE.SRGBColorSpace;
        const material=new THREE.ShaderMaterial({vertexShader:vertex,fragmentShader:fragment,transparent:true,side:THREE.DoubleSide,depthWrite:false,uniforms:{uTexture:{value:texture},uTime:{value:0},uMotion:{value:0},uProgress:{value:.5},uOpacity:{value:0},uImageAspect:{value:planeAspect},uPlaneAspect:{value:planeAspect},uTint:{value:new THREE.Color(env.tint)},uTintAmount:{value:env.amount}}});
        texture.onUpdate=()=>{const img=texture.image as {naturalWidth?:number;naturalHeight?:number;width?:number;height?:number}|undefined;const w=img?.naturalWidth??img?.width??0,h=img?.naturalHeight??img?.height??0;if(w&&h)material.uniforms.uImageAspect.value=w/h};
        const mesh=new THREE.Mesh(new THREE.PlaneGeometry(4.8,3.1,20,14),material);mesh.renderOrder=chapter*10+local;scene.add(mesh);records.push({mesh,chapter,local,texture});
      }
    });

    const dustGeometry=new THREE.BufferGeometry();const pts=new Float32Array(900);for(let i=0;i<pts.length;i+=3){pts[i]=(Math.random()-.5)*26;pts[i+1]=(Math.random()-.5)*15;pts[i+2]=-Math.random()*26+4}dustGeometry.setAttribute('position',new THREE.BufferAttribute(pts,3));
    const dustMaterial=new THREE.PointsMaterial({color:envColors[0].fill,size:.018,transparent:true,opacity:.16,depthWrite:false});const dust=new THREE.Points(dustGeometry,dustMaterial);scene.add(dust);
    const motifs=ENVIRONMENTS.map((_,index)=>buildMotif(index,envColors[index].accent.getHex()));motifs.forEach(m=>scene.add(m.group));

    const pointer={x:0,y:0};const onPointer=(e:PointerEvent)=>{pointer.x=(e.clientX/window.innerWidth-.5)*2;pointer.y=(e.clientY/window.innerHeight-.5)*2};window.addEventListener('pointermove',onPointer,{passive:true});
    let chapterFloat=sceneRef.current,local=.5,last=.5,raf=0;const clock=new THREE.Clock();const look=new THREE.Vector3(0,0,-1.7);const bgTarget=new THREE.Color();
    const loop=()=>{
      raf=requestAnimationFrame(loop);const time=clock.getElapsedTime();const current=Math.max(0,Math.min(10,sceneRef.current));chapterFloat+=(current-chapterFloat)*.045;const target=chapterProgress(current);last=local;local+=(target-local)*.075;const velocity=Math.abs(local-last);
      const next=Math.min(current+1,10),transition=clamp((local-.78)/.22);bgTarget.copy(envColors[current].bg).lerp(envColors[next].bg,transition);const background=scene.background as THREE.Color;background.lerp(bgTarget,.045);const fog=scene.fog as THREE.FogExp2;fog.color.copy(background);fog.density+=(ENVIRONMENTS[current].fog-fog.density)*.04;key.color.lerp(envColors[current].accent,.045);fill.color.lerp(envColors[current].fill,.045);ambient.color.lerp(envColors[current].fill,.035);dustMaterial.color.lerp(envColors[current].fill,.04);

      records.forEach(record=>{
        const distance=Math.abs(chapterFloat-record.chapter);const visible=clamp(1-distance*.92);const p=record.chapter===current?local:(record.chapter<current?1:0);const q=pose(record.chapter,record.local,p);const hidden=q.z-Math.min(distance,1)*6.4;
        record.mesh.position.x+=(q.x-record.mesh.position.x)*.085;record.mesh.position.y+=(q.y-record.mesh.position.y)*.085;record.mesh.position.z+=(hidden-record.mesh.position.z)*.085;record.mesh.rotation.x+=(q.rx-record.mesh.rotation.x)*.08;record.mesh.rotation.y+=(q.ry-record.mesh.rotation.y)*.08;record.mesh.rotation.z+=(q.rz-record.mesh.rotation.z)*.08;record.mesh.scale.lerp(new THREE.Vector3(q.s,q.s,1),.085);
        const u=record.mesh.material.uniforms;u.uTime.value=time;u.uProgress.value=p;u.uOpacity.value+=(visible*.96-u.uOpacity.value)*.12;u.uMotion.value+=(clamp(velocity*120+Math.abs(p-.5)*.12)-u.uMotion.value)*.1;
      });

      motifs.forEach((motif,index)=>{const distance=Math.abs(chapterFloat-index);const visible=clamp(1-distance*1.25);motif.materials.forEach(material=>material.opacity+=(visible*.12-material.opacity)*.065);motif.group.position.z+=((-4.8-Math.min(distance,1)*4.2)-motif.group.position.z)*.06;motif.group.rotation.y+=.0015*(index%2?1:-1);motif.group.rotation.z=Math.sin(time*.12+index)*.05+local*.05});
      const travel=local-.5;const desiredX=Math.sin(current*.73)*.42+travel*.74+pointer.x*.12;const desiredY=Math.cos(current*.61)*.18-travel*.2-pointer.y*.08;const desiredZ=8.35-Math.sin(local*Math.PI)*.38;camera.position.x+=(desiredX-camera.position.x)*.04;camera.position.y+=(desiredY-camera.position.y)*.04;camera.position.z+=(desiredZ-camera.position.z)*.04;look.x+=(Math.sin(current*.54)*.15+travel*.2-look.x)*.045;look.y+=(Math.cos(current*.48)*.07-look.y)*.045;camera.lookAt(look);
      dust.rotation.y=time*.003;dust.position.z=local*-1;renderer.render(scene,camera);
    };loop();

    const resize=()=>{camera.aspect=window.innerWidth/window.innerHeight;camera.updateProjectionMatrix();renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,1.8));renderer.setSize(window.innerWidth,window.innerHeight)};window.addEventListener('resize',resize);
    return()=>{cancelAnimationFrame(raf);window.removeEventListener('resize',resize);window.removeEventListener('pointermove',onPointer);records.forEach(({mesh,texture})=>{mesh.geometry.dispose();mesh.material.dispose();texture.dispose()});dustGeometry.dispose();dustMaterial.dispose();motifs.forEach(({group,materials})=>{group.traverse(obj=>{const renderable=obj as THREE.Mesh|THREE.Line|THREE.Points;if(renderable.geometry)renderable.geometry.dispose()});materials.forEach(material=>material.dispose())});renderer.dispose();if(renderer.domElement.parentNode===mount)mount.removeChild(renderer.domElement)};
  },[]);

  return <div ref={host} className={styles.world} aria-hidden="true"/>;
}
