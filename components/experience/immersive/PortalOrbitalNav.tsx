'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import * as THREE from 'three';
import styles from './PortalOrbitalNav.module.css';

type Portal = { id:string; href:string; number:string; title:string; note:string; tone:string };
const POS = [[-4,1.8,-1],[4,1.7,-2],[4,-1.7,-1],[-4,-1.7,-2],[0,-2.8,1]] as const;
const COLORS:Record<string,number>={gold:0xe8b96c,cyan:0x78e8ff,violet:0xb18cff,blue:0x7da7ff,white:0xeefaff};

export default function PortalOrbitalNav({portals, agreementOnly=false, onEnter}:{portals:readonly Portal[];agreementOnly?:boolean;onEnter?:()=>void}){
  const mount=useRef<HTMLDivElement>(null); const router=useRouter();
  const [labels,setLabels]=useState<Array<{x:number;y:number;visible:boolean}>>([]); const [active,setActive]=useState(-1);
  useEffect(()=>{
    const host=mount.current;if(!host)return;
    const scene=new THREE.Scene();scene.fog=new THREE.FogExp2(0x020811,.035);
    const camera=new THREE.PerspectiveCamera(48,host.clientWidth/host.clientHeight,.1,100);camera.position.set(0,1,agreementOnly?12:13);
    const renderer=new THREE.WebGLRenderer({antialias:true,alpha:true});renderer.setPixelRatio(Math.min(devicePixelRatio,2));renderer.setSize(host.clientWidth,host.clientHeight);renderer.outputColorSpace=THREE.SRGBColorSpace;host.appendChild(renderer.domElement);
    scene.add(new THREE.AmbientLight(0x4b74a8,1.2));const key=new THREE.DirectionalLight(0xc8eeff,4);key.position.set(4,7,6);scene.add(key);const rim=new THREE.PointLight(0x7e56ff,45,20);rim.position.set(-4,2,-2);scene.add(rim);
    const floor=new THREE.GridHelper(30,30,0x245b72,0x102b3a);floor.position.y=-3.3;scene.add(floor);
    // A deliberately modelled character: grouped lit geometry, never DOM illustration.
    const astronaut=new THREE.Group(); const suit=new THREE.MeshStandardMaterial({color:0xdce8ed,roughness:.35,metalness:.25});
    const body=new THREE.Mesh(new THREE.CapsuleGeometry(.72,1.65,8,18),suit);body.position.y=-.5;astronaut.add(body);
    const helmet=new THREE.Mesh(new THREE.SphereGeometry(.82,32,20),suit);helmet.position.y=1.05;astronaut.add(helmet);
    const visor=new THREE.Mesh(new THREE.SphereGeometry(.68,32,16,0,Math.PI*2,0,Math.PI*.52),new THREE.MeshStandardMaterial({color:0x071827,metalness:.8,roughness:.12,emissive:0x123d51,emissiveIntensity:.5}));visor.position.set(0,1.05,.35);visor.rotation.x=Math.PI/2;astronaut.add(visor);
    [-1,1].forEach(s=>{const limb=new THREE.Mesh(new THREE.CapsuleGeometry(.18,1.3,6,10),suit);limb.position.set(s*.92,-.45,0);limb.rotation.z=s*.18;astronaut.add(limb)});scene.add(astronaut);
    const satellite=new THREE.Mesh(new THREE.IcosahedronGeometry(.75,1),new THREE.MeshStandardMaterial({color:0x173b52,wireframe:true,emissive:0x49cfee,emissiveIntensity:1}));satellite.position.set(1.8,3,-3);scene.add(satellite);
    const starsGeo=new THREE.BufferGeometry();const starPos=new Float32Array(900);for(let i=0;i<starPos.length;i++)starPos[i]=(Math.random()-.5)*35;starsGeo.setAttribute('position',new THREE.BufferAttribute(starPos,3));scene.add(new THREE.Points(starsGeo,new THREE.PointsMaterial({color:0x8ddff4,size:.035,transparent:true,opacity:.65})));
    const portalData=(agreementOnly?portals.slice(-1):portals).map((p,i)=>{const ring=new THREE.Mesh(new THREE.TorusGeometry(1.05,.115,16,64),new THREE.MeshStandardMaterial({color:COLORS[p.tone]||0x78e8ff,emissive:COLORS[p.tone]||0x78e8ff,emissiveIntensity:2,metalness:.5,roughness:.2}));const pos=agreementOnly?[0,0,-1]:POS[i];ring.position.set(pos[0],pos[1],pos[2]);ring.userData={index:i,href:p.href};scene.add(ring);return ring});
    const pointer=new THREE.Vector2(9,9),ray=new THREE.Raycaster();let hovered=-1,targetX=0,targetY=1,travel=false,start=performance.now(),raf=0;
    const move=(e:PointerEvent)=>{const r=renderer.domElement.getBoundingClientRect();pointer.set((e.clientX-r.left)/r.width*2-1,-((e.clientY-r.top)/r.height)*2+1);};
    const click=()=>{ray.setFromCamera(pointer,camera);const hit=ray.intersectObjects(portalData)[0];if(!hit)return;travel=true;const idx=hit.object.userData.index as number;setActive(idx);setTimeout(()=>{onEnter?.();if(!onEnter)router.push(hit.object.userData.href)},850)};
    renderer.domElement.addEventListener('pointermove',move);renderer.domElement.addEventListener('click',click);
    const resize=()=>{camera.aspect=host.clientWidth/host.clientHeight;camera.updateProjectionMatrix();renderer.setSize(host.clientWidth,host.clientHeight)};addEventListener('resize',resize);
    const loop=(now:number)=>{raf=requestAnimationFrame(loop);const t=(now-start)/1000;ray.setFromCamera(pointer,camera);const hit=ray.intersectObjects(portalData)[0];hovered=hit?(hit.object.userData.index as number):-1;setActive(a=>a===hovered?a:hovered);portalData.forEach((o,i)=>{const wanted=i===hovered?1.18:1;o.scale.lerp(new THREE.Vector3(wanted,wanted,wanted),.09);const material=o.material as THREE.MeshStandardMaterial;material.emissiveIntensity+=((i===hovered?4:2)-material.emissiveIntensity)*.08;o.rotation.z=Math.sin(t+i)*.08});
      astronaut.rotation.y=Math.sin(t*.55)*.12;satellite.rotation.x=t*.35;satellite.rotation.y=t*.2;
      targetX+=(pointer.x*.45-targetX)*.025;targetY+=(1+pointer.y*.22-targetY)*.025;if(travel){camera.position.z-=.24;camera.fov=Math.max(18,camera.fov-.5);camera.updateProjectionMatrix()}camera.lookAt(targetX,targetY,0);
      setLabels(portalData.map(o=>{const p=o.position.clone().project(camera);return{x:(p.x*.5+.5)*host.clientWidth,y:(-.5*p.y+.5)*host.clientHeight,visible:p.z<1}}));renderer.render(scene,camera)};loop(performance.now());
    return()=>{cancelAnimationFrame(raf);removeEventListener('resize',resize);renderer.domElement.removeEventListener('pointermove',move);renderer.domElement.removeEventListener('click',click);renderer.dispose();host.removeChild(renderer.domElement)};
  },[agreementOnly,onEnter,portals,router]);
  const shown=agreementOnly?portals.slice(-1):portals;
  return <nav className={styles.root} aria-label="Spatial provider portals"><div ref={mount} className={styles.canvas}/><div className={styles.labels}>{shown.map((p,i)=><a key={p.id} href={p.href} data-active={active===i} style={{left:labels[i]?.x,top:labels[i]?.y,opacity:labels[i]?.visible?1:0}}><small>{p.number} / PORTAL</small><strong>{p.title}</strong><span>{p.note}</span></a>)}</div><p className={styles.hint}>DRAG YOUR FOCUS · SELECT A RING TO TRAVEL</p></nav>
}
