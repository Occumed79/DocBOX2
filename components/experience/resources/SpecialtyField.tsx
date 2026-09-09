'use client';

import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import styles from './SpecialtyField.module.css';

type Item={id:string;label:string;color:string};
const POS=[[-4.2,1.7,-1.4],[-1.5,2.1,-2.2],[1.8,1.9,-1.7],[4.3,.7,-2.4],[-2.6,-1.55,-1.5],[2.7,-1.65,-1.2]] as const;

export default function SpecialtyField({items,selectedId,onSelect}:{items:readonly Item[];selectedId:string;onSelect:(id:string)=>void}){
  const mount=useRef<HTMLDivElement>(null);
  const [labels,setLabels]=useState<Array<{x:number;y:number;visible:boolean}>>([]);
  const [hovered,setHovered]=useState(-1);

  useEffect(()=>{
    const host=mount.current;if(!host)return;
    const scene=new THREE.Scene();scene.fog=new THREE.FogExp2(0x071017,.045);
    const camera=new THREE.PerspectiveCamera(48,host.clientWidth/host.clientHeight,.1,80);camera.position.set(0,.35,11.5);
    const renderer=new THREE.WebGLRenderer({antialias:true,alpha:true,powerPreference:'high-performance'});renderer.setPixelRatio(Math.min(devicePixelRatio,2));renderer.setSize(host.clientWidth,host.clientHeight);renderer.outputColorSpace=THREE.SRGBColorSpace;host.appendChild(renderer.domElement);
    scene.add(new THREE.HemisphereLight(0xb7edff,0x061018,1.05));const key=new THREE.PointLight(0x79e8ff,22,22);key.position.set(0,4,5);scene.add(key);

    const nodes=items.map((item,i)=>{
      const group=new THREE.Group();const pos=POS[i]??[0,0,-1];group.position.set(pos[0],pos[1],pos[2]);
      const color=new THREE.Color(item.color);
      const orbMat=new THREE.MeshStandardMaterial({color:0x0b1f29,emissive:color,emissiveIntensity:.7,metalness:.55,roughness:.18,transparent:true,opacity:.88});
      const orb=new THREE.Mesh(new THREE.SphereGeometry(.68,28,20),orbMat);group.add(orb);
      const ring=new THREE.Mesh(new THREE.TorusGeometry(1.05,.035,8,72),new THREE.MeshBasicMaterial({color,transparent:true,opacity:.62,blending:THREE.AdditiveBlending}));ring.rotation.x=.55;ring.rotation.y=i*.25;group.add(ring);
      const orbit=new THREE.Mesh(new THREE.TorusGeometry(1.35,.012,6,80),new THREE.MeshBasicMaterial({color,transparent:true,opacity:.24}));orbit.rotation.set(1.05,i*.31,.4);group.add(orbit);
      const light=new THREE.PointLight(color,6,4);group.add(light);
      orb.userData={index:i};ring.userData={index:i};scene.add(group);return{group,orb,ring,orbit,item};
    });
    const interactive=nodes.flatMap(node=>[node.orb,node.ring]);

    const dustGeo=new THREE.BufferGeometry();const dust=new Float32Array(1500);for(let i=0;i<dust.length;i+=3){dust[i]=(Math.random()-.5)*26;dust[i+1]=(Math.random()-.5)*14;dust[i+2]=4-Math.random()*34}dustGeo.setAttribute('position',new THREE.BufferAttribute(dust,3));const dustMat=new THREE.PointsMaterial({color:0x91e9ff,size:.025,transparent:true,opacity:.42,depthWrite:false});const dustField=new THREE.Points(dustGeo,dustMat);scene.add(dustField);

    const pointer=new THREE.Vector2(9,9),ray=new THREE.Raycaster();let raf=0,start=performance.now(),targetX=0,targetY=.2;
    const move=(event:PointerEvent)=>{const rect=renderer.domElement.getBoundingClientRect();pointer.set((event.clientX-rect.left)/rect.width*2-1,-((event.clientY-rect.top)/rect.height)*2+1)};
    const click=()=>{ray.setFromCamera(pointer,camera);const hit=ray.intersectObjects(interactive)[0];if(!hit)return;const index=hit.object.userData.index as number;const node=nodes[index];if(node)onSelect(node.item.id)};
    renderer.domElement.addEventListener('pointermove',move);renderer.domElement.addEventListener('click',click);

    const loop=(now:number)=>{raf=requestAnimationFrame(loop);const t=(now-start)/1000;ray.setFromCamera(pointer,camera);const hit=ray.intersectObjects(interactive)[0];const index=hit?(hit.object.userData.index as number):-1;setHovered(current=>current===index?current:index);nodes.forEach((node,i)=>{const active=node.item.id===selectedId;const hot=i===index||active;const scale=hot?1.16:1;node.group.scale.lerp(new THREE.Vector3(scale,scale,scale),.08);(node.orb.material as THREE.MeshStandardMaterial).emissiveIntensity+=((hot?2.1:.7)-(node.orb.material as THREE.MeshStandardMaterial).emissiveIntensity)*.08;node.ring.rotation.z=t*(i%2?.12:-.1)+i*.3;node.orbit.rotation.z=-t*(i%2?.07:-.06);node.group.position.y=(POS[i]?.[1]??0)+Math.sin(t*.65+i)*.08});targetX+=(pointer.x*.32-targetX)*.025;targetY+=(.2+pointer.y*.16-targetY)*.025;camera.lookAt(targetX,targetY,-1.2);dustField.rotation.y=t*.006;setLabels(nodes.map(node=>{const p=node.group.position.clone().project(camera);return{x:(p.x*.5+.5)*host.clientWidth,y:(-.5*p.y+.5)*host.clientHeight,visible:p.z<1}}));renderer.render(scene,camera)};loop(performance.now());

    const resize=()=>{camera.aspect=host.clientWidth/host.clientHeight;camera.updateProjectionMatrix();renderer.setSize(host.clientWidth,host.clientHeight)};addEventListener('resize',resize);
    return()=>{cancelAnimationFrame(raf);removeEventListener('resize',resize);renderer.domElement.removeEventListener('pointermove',move);renderer.domElement.removeEventListener('click',click);scene.traverse(object=>{const mesh=object as THREE.Mesh;if(mesh.geometry)mesh.geometry.dispose();const material=mesh.material;if(Array.isArray(material))material.forEach(x=>x.dispose());else material?.dispose()});dustGeo.dispose();dustMat.dispose();renderer.dispose();if(renderer.domElement.parentNode===host)host.removeChild(renderer.domElement)};
  },[items,onSelect,selectedId]);

  return <section className={styles.root} aria-label="Provider specialty destinations"><div ref={mount} className={styles.canvas}/><div className={styles.labels}>{items.map((item,i)=><div key={item.id} className={styles.label} data-active={item.id===selectedId||hovered===i} style={{left:labels[i]?.x,top:labels[i]?.y,opacity:labels[i]?.visible?1:0,'--label-color':item.color} as React.CSSProperties}><small>{item.id===selectedId?'ACTIVE PATH':'SPECIALTY'}</small><b>{item.label}</b></div>)}</div><p className={styles.hint}>MOVE THROUGH THE FIELD · SELECT A SPECIALTY</p><div className={styles.fallback}>{items.map(item=><button key={item.id} type="button" aria-pressed={item.id===selectedId} onClick={()=>onSelect(item.id)} style={{'--fallback-color':item.color} as React.CSSProperties}>{item.label}</button>)}</div></section>;
}
