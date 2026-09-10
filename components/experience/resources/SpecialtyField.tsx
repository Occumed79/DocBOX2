'use client';

import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import styles from './SpecialtyField.module.css';
import { configureCinematicRenderer } from '../immersive/rendererQuality';

type Item={id:string;label:string;color:string};
type NodeRecord={group:THREE.Group;mesh:THREE.Mesh<THREE.BufferGeometry,THREE.MeshStandardMaterial>;ring:THREE.Mesh;orbit:THREE.Mesh;item:Item;base:THREE.Vector3};
const POS=[[-4.2,1.7,-1.4],[-1.5,2.1,-2.2],[1.8,1.9,-1.7],[4.3,.7,-2.4],[-2.6,-1.55,-1.5],[2.7,-1.65,-1.2]] as const;

function geometryFor(index:number):THREE.BufferGeometry{
  if(index===0)return new THREE.IcosahedronGeometry(.72,2);
  if(index===1)return new THREE.TorusKnotGeometry(.5,.15,96,14,2,3);
  if(index===2)return new THREE.OctahedronGeometry(.76,1);
  if(index===3)return new THREE.SphereGeometry(.68,32,22);
  if(index===4)return new THREE.TorusGeometry(.58,.18,18,72);
  return new THREE.CapsuleGeometry(.44,.78,8,16);
}

export default function SpecialtyField({items,selectedId,onSelect}:{items:readonly Item[];selectedId:string;onSelect:(id:string)=>void}){
  const mount=useRef<HTMLDivElement>(null);
  const selectedRef=useRef(selectedId);selectedRef.current=selectedId;
  const selectRef=useRef(onSelect);selectRef.current=onSelect;
  const [labels,setLabels]=useState<Array<{x:number;y:number;visible:boolean}>>([]);
  const [hovered,setHovered]=useState(-1);

  useEffect(()=>{
    const host=mount.current;if(!host)return;
    const scene=new THREE.Scene();scene.fog=new THREE.FogExp2(0x071017,.045);
    const camera=new THREE.PerspectiveCamera(48,host.clientWidth/host.clientHeight,.1,80);camera.position.set(0,.35,16);
    const renderer=configureCinematicRenderer(new THREE.WebGLRenderer({antialias:true,alpha:true,powerPreference:'high-performance'}),{exposure:1.05});renderer.setSize(host.clientWidth,host.clientHeight);host.appendChild(renderer.domElement);
    scene.add(new THREE.HemisphereLight(0xb7edff,0x061018,1.05));const key=new THREE.PointLight(0x79e8ff,22,22);key.position.set(0,4,5);scene.add(key);

    const nodes:NodeRecord[]=items.map((item,i)=>{
      const group=new THREE.Group();const pos=POS[i]??[0,0,-1];const base=new THREE.Vector3(pos[0],pos[1],pos[2]);group.position.copy(base);
      const color=new THREE.Color(item.color);
      const orbMat=new THREE.MeshStandardMaterial({color:0x0b1f29,emissive:color,emissiveIntensity:.7,metalness:.58,roughness:.16,transparent:true,opacity:.9});
      const mesh=new THREE.Mesh(geometryFor(i),orbMat);group.add(mesh);
      const ring=new THREE.Mesh(new THREE.TorusGeometry(1.08,.032,8,72),new THREE.MeshBasicMaterial({color,transparent:true,opacity:.58,blending:THREE.AdditiveBlending}));ring.rotation.x=.55;ring.rotation.y=i*.25;group.add(ring);
      const orbit=new THREE.Mesh(new THREE.TorusGeometry(1.42,.011,6,80),new THREE.MeshBasicMaterial({color,transparent:true,opacity:.2}));orbit.rotation.set(1.05,i*.31,.4);group.add(orbit);
      const light=new THREE.PointLight(color,6,4);group.add(light);mesh.userData={index:i};ring.userData={index:i};scene.add(group);return{group,mesh,ring,orbit,item,base};
    });
    const interactive=nodes.flatMap(node=>[node.mesh,node.ring]);

    const links=new THREE.Group();
    nodes.forEach((node,i)=>{const material=new THREE.LineBasicMaterial({color:new THREE.Color(node.item.color),transparent:true,opacity:.09});const geometry=new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0,0,-4.5),node.base.clone().multiplyScalar(.88)]);const line=new THREE.Line(geometry,material);line.userData={index:i};links.add(line)});scene.add(links);

    const arrival=new THREE.Group();
    for(let i=0;i<5;i++){const material=new THREE.MeshBasicMaterial({color:i%2?0x8b6cff:0x64e5ff,transparent:true,opacity:.24-i*.025,blending:THREE.AdditiveBlending,depthWrite:false});const ring=new THREE.Mesh(new THREE.TorusGeometry(3.9+i*.72,.018+i*.004,7,96),material);ring.position.z=4.2-i*.55;ring.rotation.set(Math.PI*.5+i*.025,i*.06,i*.22);arrival.add(ring)}scene.add(arrival);

    const dustGeo=new THREE.BufferGeometry();const dust=new Float32Array(1800);for(let i=0;i<dust.length;i+=3){dust[i]=(Math.random()-.5)*26;dust[i+1]=(Math.random()-.5)*14;dust[i+2]=7-Math.random()*38}dustGeo.setAttribute('position',new THREE.BufferAttribute(dust,3));const dustMat=new THREE.PointsMaterial({color:0x91e9ff,size:.025,transparent:true,opacity:.42,depthWrite:false});const dustField=new THREE.Points(dustGeo,dustMat);scene.add(dustField);

    const pointer=new THREE.Vector2(9,9),ray=new THREE.Raycaster();let raf=0,start=performance.now(),targetX=0,targetY=.2;
    const move=(event:PointerEvent)=>{const rect=renderer.domElement.getBoundingClientRect();pointer.set((event.clientX-rect.left)/rect.width*2-1,-((event.clientY-rect.top)/rect.height)*2+1)};
    const leave=()=>{pointer.set(9,9);setHovered(-1)};
    const click=()=>{ray.setFromCamera(pointer,camera);const hit=ray.intersectObjects(interactive)[0];if(!hit)return;const index=hit.object.userData.index as number;const node=nodes[index];if(node)selectRef.current(node.item.id)};
    renderer.domElement.addEventListener('pointermove',move);renderer.domElement.addEventListener('pointerleave',leave);renderer.domElement.addEventListener('click',click);

    const loop=(now:number)=>{
      raf=requestAnimationFrame(loop);const t=(now-start)/1000;const arrivalProgress=Math.min(1,t/1.45);ray.setFromCamera(pointer,camera);const hit=ray.intersectObjects(interactive)[0];const index=hit?(hit.object.userData.index as number):-1;setHovered(current=>current===index?current:index);
      nodes.forEach((node,i)=>{const active=node.item.id===selectedRef.current;const hot=i===index||active;const scale=hot?1.18:1;node.group.scale.lerp(new THREE.Vector3(scale,scale,scale),.08);node.group.position.x+=(node.base.x-(hot?Math.sign(node.base.x)*.12:0)-node.group.position.x)*.06;node.group.position.y=node.base.y+Math.sin(t*.65+i)*.08;node.group.position.z+=(node.base.z+(active?.36:0)-node.group.position.z)*.06;node.mesh.material.emissiveIntensity+=((hot?2.25:.7)-node.mesh.material.emissiveIntensity)*.08;node.mesh.rotation.x=t*(i%2?.09:-.075)+i*.12;node.mesh.rotation.y=t*(i%2?.12:-.1);node.ring.rotation.z=t*(i%2?.12:-.1)+i*.3;node.orbit.rotation.z=-t*(i%2?.07:-.06)});
      arrival.children.forEach((child,i)=>{const ring=child as THREE.Mesh<THREE.TorusGeometry,THREE.MeshBasicMaterial>;ring.scale.setScalar(1+arrivalProgress*(1.4+i*.12));ring.material.opacity=(.24-i*.025)*(1-arrivalProgress);ring.rotation.z=t*(i%2?.18:-.15)+i*.2});arrival.visible=arrivalProgress<.995;
      const destinationZ=11.5;camera.position.z+=(destinationZ-camera.position.z)*.045;targetX+=(pointer.x*.32-targetX)*.025;targetY+=(.2+pointer.y*.16-targetY)*.025;camera.lookAt(targetX,targetY,-1.2);links.rotation.z=Math.sin(t*.12)*.012;dustField.rotation.y=t*.006;
      setLabels(nodes.map(node=>{const p=node.group.getWorldPosition(new THREE.Vector3()).project(camera);return{x:(p.x*.5+.5)*host.clientWidth,y:(-.5*p.y+.5)*host.clientHeight,visible:p.z<1}}));renderer.render(scene,camera)
    };loop(performance.now());

    const resize=()=>{camera.aspect=host.clientWidth/host.clientHeight;camera.updateProjectionMatrix();renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,2));renderer.setSize(host.clientWidth,host.clientHeight)};addEventListener('resize',resize);
    return()=>{cancelAnimationFrame(raf);removeEventListener('resize',resize);renderer.domElement.removeEventListener('pointermove',move);renderer.domElement.removeEventListener('pointerleave',leave);renderer.domElement.removeEventListener('click',click);scene.traverse(object=>{const mesh=object as THREE.Mesh;if(mesh.geometry)mesh.geometry.dispose();const material=mesh.material;if(Array.isArray(material))material.forEach(x=>x.dispose());else material?.dispose()});renderer.dispose();if(renderer.domElement.parentNode===host)host.removeChild(renderer.domElement)};
  },[items]);

  return <section className={styles.root} aria-label="Provider specialty destinations"><div ref={mount} className={styles.canvas}/><div className={styles.labels}>{items.map((item,i)=><button key={item.id} type="button" className={styles.label} data-active={item.id===selectedId||hovered===i} onFocus={()=>setHovered(i)} onBlur={()=>setHovered(-1)} onClick={()=>onSelect(item.id)} style={{left:labels[i]?.x,top:labels[i]?.y,opacity:labels[i]?.visible?1:0,'--label-color':item.color} as React.CSSProperties}><small>{item.id===selectedId?'ACTIVE PATH':'SPECIALTY'}</small><b>{item.label}</b></button>)}</div><p className={styles.hint}>MOVE THROUGH THE FIELD · SELECT A SPECIALTY</p><div className={styles.fallback}>{items.map(item=><button key={item.id} type="button" aria-pressed={item.id===selectedId} onClick={()=>onSelect(item.id)} style={{'--fallback-color':item.color} as React.CSSProperties}>{item.label}</button>)}</div></section>;
}
