'use client';

import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import styles from './CinematicWorld.module.css';

const ASSETS = ['Founders.png','Founders copy.png','California - Hawaii Map.png','Concerned provider.png','EMPLOYEE ID.png','Diverse Healthcare Team Portrait (1).png','Friendly Medical Appointment Call.png','Medical Eval.png','Calm Clinic Blood Draw (1).png','Dental Eval.png','Audiometry.png','Pharmacist Administering a Vaccine(1) (1).png','EXAM REPORT.png','Fitness Determination.png','Diverse Workforce.png','Diverse Workforce2.png','International Certification.png','Vaccine Schedule.png','Facilities.png','International Network.png','Corevalue.png','Corevalue2.png','Corevalue3.png','Corevalue4.png','Corevalue5.png','Corevalue6.png'] as const;
const CHAPTERS = [[0,3],[3,4],[4,6],[6,7],[7,12],[12,13],[13,14],[14,16],[16,18],[18,20],[20,26]] as const;
const PALETTES = [0x07141c,0x170d12,0x061821,0x101324,0x051a20,0x161109,0x071b18,0x11131a,0x081526,0x031a22,0x17120d];

type Target = { x:number;y:number;z:number;rx?:number;ry?:number;rz?:number;s?:number;opacity?:number };
function targetFor(chapter:number, local:number, count:number, p:number):Target {
  const center=local-(count-1)/2;
  switch(chapter){
    case 0:return [
      {x:-1.15-p*1.2,y:.15-p*.2,z:1.2+p*1.4,ry:.12-p*.2,s:1.78+p*.38,opacity:Math.max(.12,1-p*.42)},
      {x:3.8-p*2.4,y:-.8+p*.35,z:-6+p*4.6,ry:-.4+p*.28,rz:.05,s:.62+p*.42,opacity:Math.max(0,(p-.22)*1.5)},
      {x:-4.6+p*2.1,y:2.8-p*2.2,z:-10+p*6.8,ry:.55-p*.2,rz:-.14,s:.48+p*.36,opacity:Math.max(0,(p-.64)*2.5)},
    ][local];
    case 1:return{x:2.8-p*6.2,y:0,z:-2+p*4,ry:-.48+p*.8,s:1.65};
    case 2:return local===0?{x:-3.6+p*2.5,y:1.1,z:-1+p*2,ry:.5,s:.8}:{x:2.5-p*1.2,y:-.4,z:-4+p*3,ry:-.34,s:1.35};
    case 3:return{x:-2.8+p*5.5,y:.2-p*.8,z:-2+p*3,rz:-.12+p*.2,s:1.48};
    case 4:{const phase=Math.max(0,Math.min(1,p*count-local));return{x:(local%2?1:-1)*(4.8-phase*2.2),y:(local-2)*1.25,z:-local*3+phase*3.8,ry:(local%2?-.45:.45)*(1-phase),rz:center*.07,s:.72+phase*.56,opacity:Math.max(.08,1-Math.abs(p*(count-1)-local)*.5)}}
    case 5:return{x:1.8-p*3.4,y:0,z:-2+p*4,ry:-.1+p*.3,rz:-.08,s:1.75};
    case 6:return{x:0,y:.3,z:-5+p*7,rx:-.05,ry:(p-.5)*.25,s:1.35+p*.55};
    case 7:return{x:center*5.2+(p-.5)*(local? -2:2),y:local?1.1:-.8,z:-2+local*1.2,ry:center*-.35,s:1.15};
    case 8:return{x:center*4.3,y:center*1.7,z:-2+center*-2+p*2,ry:center*-.4,rz:center*.1,s:1.15};
    case 9:return{x:center*4.6-p*center*2,y:center*1.2,z:-3+local*1.8,ry:center*-.45,s:1.2};
    default:{const angle=local/count*Math.PI*2+p*.65;return{x:Math.cos(angle)*4.4,y:Math.sin(angle)*2.5,z:-3+Math.sin(angle)*2,ry:-angle+Math.PI/2,rz:angle*.08,s:.7+(local===Math.round(p*(count-1))?.35:0),opacity:.42+(local===Math.round(p*(count-1))?.58:0)}}
  }
}

function cameraShot(chapter:number,p:number){
  const shots=[
    {x:-.7+p*1.1,y:.15-p*.18,z:10-p*1.7,roll:(p-.5)*-.018,fov:39-p*3,tx:-.4+p*.5,ty:0},
    {x:1.4-p*3.1,y:-.3+p*.7,z:11-p*2.2,roll:(p-.5)*.07,fov:51-p*9,tx:-.8+p*1.5,ty:.2},
    {x:-1.5+p*3,y:.7-p*1.1,z:12-p*3.4,roll:.04-p*.08,fov:48+p*5,tx:(p-.5)*1.2,ty:0},
    {x:2.2-p*4.1,y:-.6+p*1.4,z:10.8-p*.8,roll:-.035+p*.025,fov:43+p*7,tx:1.2-p*2.2,ty:-.1},
    {x:Math.sin(p*Math.PI*2)*1.3,y:.9-p*1.8,z:12-p*5.2,roll:Math.sin(p*Math.PI)*.055,fov:56-p*13,tx:Math.sin(p*5)*.6,ty:(p-.5)*-.5},
    {x:-2.5+p*3.8,y:1.2-p*1.3,z:13-p*4.6,roll:.06-p*.09,fov:57-p*17,tx:.6,ty:0},
    {x:.3-p*.7,y:-.7+p*1.2,z:14-p*7,roll:(p-.5)*.025,fov:62-p*25,tx:0,ty:.15},
    {x:-1.8+p*3.6,y:.2+Math.sin(p*Math.PI)*.7,z:11.5-p*1.5,roll:-.04+p*.08,fov:46+p*7,tx:0,ty:.1},
    {x:2.6-p*4.8,y:1-p*1.6,z:13-p*4,roll:.07-p*.12,fov:55-p*12,tx:-.6+p*1.2,ty:0},
    {x:-2.8+p*5.1,y:-.8+p*1.5,z:12-p*3.2,roll:-.06+p*.08,fov:52+p*6,tx:1-p*2,ty:.1},
    {x:Math.cos(p*Math.PI*1.5)*1.8,y:Math.sin(p*Math.PI)*.8,z:13-p*4.8,roll:Math.sin(p*Math.PI*2)*.06,fov:58-p*15,tx:0,ty:0},
  ];
  return shots[chapter]??shots[10];
}

const vertex=`varying vec2 vUv;uniform float uTime;uniform float uBend;uniform float uProgress;void main(){vUv=uv;vec3 p=position;float edge=pow(abs(uv.x-.5)*2.,2.);p.z+=edge*uBend;p.z+=sin(uv.y*8.+uTime*1.2+uProgress*5.)*.035*uBend;p.x+=sin(uv.y*3.14159)*uBend*.08;gl_Position=projectionMatrix*modelViewMatrix*vec4(p,1.);}`;
const fragment=`varying vec2 vUv;uniform sampler2D uMap;uniform float uOpacity;uniform float uProgress;uniform float uReveal;float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}void main(){vec2 uv=vUv;uv.x+=(uv.y-.5)*sin(uProgress*3.14159)*.035;uv=(uv-.5)*(1.-sin(uProgress*3.14159)*.035)+.5;float aperture=smoothstep(-.04,.13,uReveal-abs(uv.y-.5)*.22);vec4 c=texture2D(uMap,uv);float edge=smoothstep(0.,.13,uv.x)*smoothstep(0.,.13,1.-uv.x)*smoothstep(0.,.11,uv.y)*smoothstep(0.,.11,1.-uv.y);float grain=hash(gl_FragCoord.xy);float dissolve=smoothstep(.08,.72,uOpacity*1.25+hash(floor(vUv*95.))*.28);c.rgb*=.86+grain*.15;c.rgb=mix(c.rgb,c.rgb*vec3(.63,.85,.91),pow(1.-edge,1.7));gl_FragColor=vec4(c.rgb,c.a*uOpacity*edge*aperture*dissolve);}`;

export default function CinematicWorld({sceneIndex}:{sceneIndex:number}){
  const host=useRef<HTMLDivElement>(null),chapterRef=useRef(sceneIndex);chapterRef.current=Math.min(10,sceneIndex);
  useEffect(()=>{const el=host.current;if(!el)return;const scene=new THREE.Scene();scene.fog=new THREE.FogExp2(PALETTES[0],.043);const camera=new THREE.PerspectiveCamera(42,innerWidth/innerHeight,.1,80);camera.position.z=10;
    const renderer=new THREE.WebGLRenderer({alpha:false,antialias:true,powerPreference:'high-performance'});renderer.setPixelRatio(Math.min(devicePixelRatio,1.75));renderer.setSize(innerWidth,innerHeight);renderer.outputColorSpace=THREE.SRGBColorSpace;el.appendChild(renderer.domElement);
    const loader=new THREE.TextureLoader();const meshes=ASSETS.map((asset,i)=>{const uniforms={uMap:{value:loader.load('/photos/'+encodeURIComponent(asset))},uTime:{value:0},uBend:{value:.38},uProgress:{value:0},uOpacity:{value:0},uReveal:{value:0}};uniforms.uMap.value.colorSpace=THREE.SRGBColorSpace;const material=new THREE.ShaderMaterial({uniforms,vertexShader:vertex,fragmentShader:fragment,transparent:true,depthWrite:false,side:THREE.DoubleSide});const mesh=new THREE.Mesh(new THREE.PlaneGeometry(5.4,3.45,28,18),material);mesh.position.z=-30;scene.add(mesh);return mesh});
    const dustGeo=new THREE.BufferGeometry(),dust=new Float32Array(2400);for(let i=0;i<dust.length;i+=3){dust[i]=(Math.random()-.5)*24;dust[i+1]=(Math.random()-.5)*14;dust[i+2]=(Math.random()-.5)*32}dustGeo.setAttribute('position',new THREE.BufferAttribute(dust,3));const dustField=new THREE.Points(dustGeo,new THREE.PointsMaterial({color:0x8deaff,size:.022,transparent:true,opacity:.45,depthWrite:false}));scene.add(dustField);
    const veil=new THREE.Mesh(new THREE.PlaneGeometry(30,18,20,12),new THREE.MeshBasicMaterial({color:0x071923,transparent:true,opacity:.13,wireframe:true}));veil.position.z=-8;scene.add(veil);
    let raf=0,currentChapter=0,localProgress=0,currentFov=42;const read=()=>{currentChapter=chapterRef.current;const active=document.querySelector<HTMLElement>('[data-scene][data-active]');localProgress=Number(active?.style.getPropertyValue('--scene-progress')||0)};
    const render=(now:number)=>{raf=requestAnimationFrame(render);read();const range=CHAPTERS[currentChapter]??CHAPTERS[10],count=range[1]-range[0];const bg=new THREE.Color(PALETTES[currentChapter]);renderer.setClearColor(bg,1);scene.fog!.color.lerp(bg,.08);const eased=localProgress*localProgress*(3-2*localProgress);
      meshes.forEach((mesh,i)=>{const material=mesh.material as THREE.ShaderMaterial;let owner=-1;for(let c=0;c<CHAPTERS.length;c++){if(i>=CHAPTERS[c][0]&&i<CHAPTERS[c][1]){owner=c;break}}const inside=owner===currentChapter;const incoming=owner===currentChapter+1&&eased>.76;const outgoing=owner===currentChapter-1&&eased<.16;material.uniforms.uTime.value=now*.001;material.uniforms.uProgress.value=eased;if(!inside&&!incoming&&!outgoing){material.uniforms.uOpacity.value*=.82;mesh.position.z-=.08;return}const ownerRange=CHAPTERS[owner],ownerCount=ownerRange[1]-ownerRange[0],ownerProgress=inside?eased:incoming?Math.max(0,(eased-.76)/.24):Math.max(.82,eased+.84);const target=targetFor(owner,i-ownerRange[0],ownerCount,ownerProgress);if(incoming){target.z-=6*(1-ownerProgress);target.opacity=(target.opacity??.8)*ownerProgress}if(outgoing){target.z+=7*(1-eased/.16);target.opacity=(target.opacity??.8)*(eased/.16)}mesh.position.lerp(new THREE.Vector3(target.x,target.y,target.z),.075);mesh.rotation.x+=((target.rx??0)-mesh.rotation.x)*.07;mesh.rotation.y+=((target.ry??0)-mesh.rotation.y)*.07;mesh.rotation.z+=((target.rz??0)-mesh.rotation.z)*.07;const scale=target.s??1;mesh.scale.lerp(new THREE.Vector3(scale,scale,scale),.07);material.uniforms.uOpacity.value+=((target.opacity??.92)-material.uniforms.uOpacity.value)*.08;material.uniforms.uReveal.value=Math.min(1,material.uniforms.uReveal.value+.035);material.uniforms.uBend.value=.18+Math.abs(Math.sin(eased*Math.PI))*((currentChapter===4||currentChapter===10)?.85:.36)});
      const shot=cameraShot(currentChapter,eased);camera.position.x+=(shot.x-camera.position.x)*.045;camera.position.y+=(shot.y-camera.position.y)*.045;camera.position.z+=(shot.z-camera.position.z)*.045;camera.rotation.z+=(shot.roll-camera.rotation.z)*.045;currentFov+=(shot.fov-currentFov)*.04;camera.fov=currentFov;camera.updateProjectionMatrix();camera.lookAt(shot.tx,shot.ty,0);camera.rotation.z=shot.roll;dustField.rotation.y=now*.000025+currentChapter*.12;dustField.position.x=Math.sin(eased*Math.PI*2)*1.8;dustField.position.z=(eased-.5)*8;veil.rotation.z=Math.sin(now*.00008+currentChapter)*.1;veil.position.x=Math.sin(eased*Math.PI+currentChapter)*2.2;veil.scale.setScalar(.85+Math.sin(eased*Math.PI)*.45);renderer.render(scene,camera)};render(0);
    const resize=()=>{camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight)};addEventListener('resize',resize);return()=>{cancelAnimationFrame(raf);removeEventListener('resize',resize);meshes.forEach(mesh=>(mesh.material as THREE.Material).dispose());renderer.dispose();el.removeChild(renderer.domElement)};
  },[]);return <div ref={host} className={styles.world} aria-hidden="true"/>;
}
