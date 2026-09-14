'use client';

import { useEffect, useRef, useState, type CSSProperties } from 'react';
import * as THREE from 'three';
import styles from './SpecialtyField.module.css';
import { configureCinematicRenderer } from '../immersive/rendererQuality';

type Item={id:string;label:string;color:string};
type FadeMaterial=THREE.MeshStandardMaterial|THREE.MeshPhysicalMaterial|THREE.MeshBasicMaterial;

type BuiltObject={group:THREE.Group;materials:FadeMaterial[]};

function rememberOpacity<T extends FadeMaterial>(material:T,target:number){
  material.transparent=true;material.opacity=0;material.userData.targetOpacity=target;return material;
}
function metal(color:THREE.Color,target=1){return rememberOpacity(new THREE.MeshStandardMaterial({color:0x11181d,emissive:color,emissiveIntensity:1.8,metalness:.72,roughness:.18}),target)}
function glow(color:THREE.Color,target=.55){return rememberOpacity(new THREE.MeshBasicMaterial({color,blending:THREE.AdditiveBlending,depthWrite:false}),target)}
function glass(color:THREE.Color,target=.44){return rememberOpacity(new THREE.MeshPhysicalMaterial({color:0xbdefff,emissive:color,emissiveIntensity:.35,metalness:.05,roughness:.08,transmission:.35,thickness:.35}),target)}
function add(root:THREE.Group,geometry:THREE.BufferGeometry,material:FadeMaterial,position:[number,number,number]=[0,0,0],rotation:[number,number,number]=[0,0,0],scale:[number,number,number]=[1,1,1]){
  const mesh=new THREE.Mesh(geometry,material);mesh.position.set(...position);mesh.rotation.set(...rotation);mesh.scale.set(...scale);root.add(mesh);return mesh;
}

function buildSpecialtyObject(index:number,color:THREE.Color):BuiltObject{
  const group=new THREE.Group();const materials:FadeMaterial[]=[];
  const use=<T extends FadeMaterial>(material:T)=>{materials.push(material);return material};

  if(index===0){
    const main=use(metal(color));const edge=use(glow(color,.34));
    add(group,new THREE.BoxGeometry(.58,2.35,.55),main);add(group,new THREE.BoxGeometry(1.95,.58,.55),main);
    add(group,new THREE.IcosahedronGeometry(1.55,2),edge,[0,0,-.18],[0,0,.3],[1,.78,.82]);
    add(group,new THREE.TorusGeometry(1.9,.018,8,110),edge,[0,0,-.6],[1.1,.2,.28]);
  }else if(index===1){
    const enamel=use(metal(color));const highlight=use(glow(color,.3));
    [[-.4,.35,0],[.4,.35,0],[-.35,-.05,.12],[.35,-.05,.12]].forEach(([x,y,z])=>add(group,new THREE.SphereGeometry(.55,28,20),enamel,[x,y,z],[0,0,0],[1,.9,.82]));
    add(group,new THREE.CapsuleGeometry(.22,.8,8,18),enamel,[-.3,-.9,0],[0,0,.12],[.9,1.15,.82]);
    add(group,new THREE.CapsuleGeometry(.22,.8,8,18),enamel,[.3,-.9,0],[0,0,-.12],[.9,1.15,.82]);
    add(group,new THREE.TorusGeometry(1.72,.025,8,100),highlight,[0,-.05,-.55],[1.22,.12,.05]);
  }else if(index===2){
    const tube=use(glass(color,.5));const cap=use(metal(color,.92));const liquid=use(glow(color,.48));
    add(group,new THREE.CylinderGeometry(.56,.56,2.25,40,1,true),tube,[0,0,0]);
    add(group,new THREE.CylinderGeometry(.63,.63,.38,40),cap,[0,1.18,0]);
    add(group,new THREE.CylinderGeometry(.46,.46,.78,36),liquid,[0,-.62,0]);
    add(group,new THREE.TorusGeometry(1.55,.045,10,100),liquid,[0,.02,0],[1.08,.22,.15]);
    add(group,new THREE.TorusGeometry(1.95,.018,8,110),liquid,[0,.02,-.7],[.68,.86,.25]);
  }else if(index===3){
    const main=use(metal(color));const pulse=use(glow(color,.38));
    add(group,new THREE.SphereGeometry(.9,36,26),main,[0,0,-.12]);
    add(group,new THREE.BoxGeometry(.45,2.15,.42),main,[0,0,.42]);add(group,new THREE.BoxGeometry(1.75,.45,.42),main,[0,0,.42]);
    add(group,new THREE.TorusGeometry(1.6,.03,8,100),pulse,[0,0,-.55],[1.16,.14,.16]);
    const points=[new THREE.Vector3(-1.35,0,0),new THREE.Vector3(-.7,0,0),new THREE.Vector3(-.35,.48,0),new THREE.Vector3(.05,-.52,0),new THREE.Vector3(.42,.28,0),new THREE.Vector3(1.3,.28,0)];
    const geo=new THREE.BufferGeometry().setFromPoints(points);const lineMaterial=use(glow(color,.72));const line=new THREE.Line(geo,lineMaterial);line.position.z=.9;group.add(line);
  }else if(index===4){
    const ear=use(metal(color));const wave=use(glow(color,.42));
    add(group,new THREE.TorusGeometry(1.05,.2,20,100,4.9),ear,[.1,0,0],[0,0,.7],[1,.78,1]);
    add(group,new THREE.TorusGeometry(.48,.13,18,80,4.6),ear,[.3,-.08,.08],[0,0,.7],[1,.78,1]);
    [1.55,2.0,2.45].forEach((radius,i)=>add(group,new THREE.TorusGeometry(radius,.018,7,100,3.2),wave,[.2,0,-.5-i*.16],[0,0,-.02],[1,.72,1]));
    add(group,new THREE.SphereGeometry(.16,18,12),wave,[-.3,-.12,.45]);
  }else{
    const vial=use(metal(color));const body=use(glass(color,.52));const dose=use(glow(color,.42));
    add(group,new THREE.CylinderGeometry(.7,.7,1.85,40),body,[0,-.1,0]);
    add(group,new THREE.CylinderGeometry(.76,.76,.42,40),vial,[0,1.05,0]);
    add(group,new THREE.CylinderGeometry(.58,.58,.58,36),dose,[0,-.58,0]);
    add(group,new THREE.TorusGeometry(.72,.025,8,100),dose,[0,.15,.35],[Math.PI/2,0,0]);
    add(group,new THREE.CylinderGeometry(.1,.1,2.35,18),vial,[1.28,.15,-.2],[0,0,-.58]);
    add(group,new THREE.ConeGeometry(.055,.95,12),dose,[2.05,.72,-.2],[0,0,-.58]);
  }
  return{group,materials};
}

function disposeBuiltObject(object:BuiltObject){
  object.group.traverse(child=>{const mesh=child as THREE.Mesh;if(mesh.geometry)mesh.geometry.dispose()});
  object.materials.forEach(material=>material.dispose());
}

export default function SpecialtyField({items,selectedId}:{items:readonly Item[];selectedId:string}){
  const mount=useRef<HTMLDivElement>(null);const selectedRef=useRef(selectedId);selectedRef.current=selectedId;
  const[webglAvailable,setWebglAvailable]=useState(true);
  const selected=items.find(item=>item.id===selectedId)??items[0];

  useEffect(()=>{
    const host=mount.current;if(!host||!items.length)return;
    const scene=new THREE.Scene();const camera=new THREE.PerspectiveCamera(42,Math.max(1,host.clientWidth)/Math.max(1,host.clientHeight),.1,80);camera.position.set(0,.15,9.5);
    let renderer:THREE.WebGLRenderer;
    try{
      renderer=configureCinematicRenderer(new THREE.WebGLRenderer({antialias:true,alpha:true,powerPreference:'high-performance'}),{exposure:1.02});
    }catch{
      setWebglAvailable(false);
      return;
    }
    renderer.setSize(host.clientWidth,host.clientHeight);renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,1.8));host.appendChild(renderer.domElement);
    scene.add(new THREE.HemisphereLight(0xeafaff,0x020406,.92));const key=new THREE.PointLight(0xffffff,18,22);key.position.set(5,5,6);scene.add(key);
    const rim=new THREE.PointLight(new THREE.Color(items[0].color),14,18);rim.position.set(-2,-2,3);scene.add(rim);

    const anchor=new THREE.Group();anchor.position.set(2.35,.12,.2);scene.add(anchor);
    let currentIndex=0;let built=buildSpecialtyObject(0,new THREE.Color(items[0].color));anchor.add(built.group);
    const orbitMaterials=[0,1,2].map(()=>rememberOpacity(new THREE.MeshBasicMaterial({color:new THREE.Color(items[0].color),blending:THREE.AdditiveBlending,depthWrite:false}),.3));
    const orbitRings=[1.9,2.38,2.82].map((radius,index)=>{const ring=new THREE.Mesh(new THREE.TorusGeometry(radius,.014-index*.002,7,120),orbitMaterials[index]);ring.rotation.set(.72+index*.26,index*.21,.22+index*.19);anchor.add(ring);return ring});

    const dustGeo=new THREE.BufferGeometry();const dust=new Float32Array(1200);for(let i=0;i<dust.length;i+=3){dust[i]=(Math.random()-.5)*16;dust[i+1]=(Math.random()-.5)*10;dust[i+2]=3-Math.random()*20}dustGeo.setAttribute('position',new THREE.BufferAttribute(dust,3));
    const dustMat=new THREE.PointsMaterial({color:0xd7f8ff,size:.018,transparent:true,opacity:.23,depthWrite:false});const dustField=new THREE.Points(dustGeo,dustMat);scene.add(dustField);
    const backRingMat=new THREE.MeshBasicMaterial({color:0xffffff,transparent:true,opacity:.05,depthWrite:false});const backRing=new THREE.Mesh(new THREE.TorusGeometry(3.4,.012,7,140),backRingMat);backRing.rotation.x=1.16;backRing.rotation.z=.32;backRing.position.set(2.35,0,-2.4);scene.add(backRing);

    const pointer={x:0,y:0};const move=(event:PointerEvent)=>{pointer.x=(event.clientX/window.innerWidth-.5)*2;pointer.y=(event.clientY/window.innerHeight-.5)*2};window.addEventListener('pointermove',move,{passive:true});
    let raf=0,start=performance.now(),transition=1;
    const swap=(index:number)=>{
      anchor.remove(built.group);disposeBuiltObject(built);currentIndex=index;const color=new THREE.Color(items[index]?.color??items[0].color);built=buildSpecialtyObject(index,color);anchor.add(built.group);rim.color.copy(color);dustMat.color.copy(color).lerp(new THREE.Color(0xffffff),.45);orbitMaterials.forEach(material=>material.color.copy(color));transition=0;
    };
    const loop=(now:number)=>{
      raf=requestAnimationFrame(loop);const t=(now-start)/1000;const nextIndex=Math.max(0,items.findIndex(item=>item.id===selectedRef.current));if(nextIndex!==currentIndex)swap(nextIndex);
      transition=Math.min(1,transition+.052);const eased=1-Math.pow(1-transition,3);const scale=.7+eased*.3;anchor.scale.setScalar(scale);anchor.position.x=2.35+(1-eased)*.72;anchor.position.z=.2-(1-eased)*2.7;anchor.position.y=.12+(1-eased)*.7;
      built.materials.forEach(material=>{const target=Number(material.userData.targetOpacity??1);material.opacity=target*eased;if(material instanceof THREE.MeshStandardMaterial||material instanceof THREE.MeshPhysicalMaterial)material.emissiveIntensity=.5+eased*1.45});
      built.group.rotation.x=Math.sin(t*.22+currentIndex)*.08;built.group.rotation.y=t*(currentIndex%2?.08:-.065)+currentIndex*.18;built.group.rotation.z=Math.sin(t*.17+currentIndex*.7)*.035;
      orbitRings.forEach((ring,index)=>{orbitMaterials[index].opacity=eased*(.28-index*.055);ring.rotation.z=t*((currentIndex+index)%2?.038:-.032)+index*.42});
      camera.position.x+=(pointer.x*.12-camera.position.x)*.025;camera.position.y+=(.15+pointer.y*.09-camera.position.y)*.025;camera.lookAt(1.45,.08,-.55);backRing.rotation.z=t*.018;dustField.rotation.y=t*.004;renderer.render(scene,camera);
    };loop(performance.now());

    const resize=()=>{camera.aspect=Math.max(1,host.clientWidth)/Math.max(1,host.clientHeight);camera.updateProjectionMatrix();renderer.setSize(host.clientWidth,host.clientHeight);renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,1.8))};window.addEventListener('resize',resize);
    return()=>{cancelAnimationFrame(raf);window.removeEventListener('resize',resize);window.removeEventListener('pointermove',move);disposeBuiltObject(built);orbitRings.forEach(ring=>ring.geometry.dispose());orbitMaterials.forEach(material=>material.dispose());dustGeo.dispose();dustMat.dispose();backRing.geometry.dispose();backRingMat.dispose();renderer.dispose();if(renderer.domElement.parentNode===host)host.removeChild(renderer.domElement)};
  },[items]);

  return <section className={styles.root} aria-label="Selected provider specialty visual" data-webgl={webglAvailable?'available':'unavailable'} style={{'--field-color':selected?.color??'#72dcff'} as CSSProperties}><div ref={mount} className={styles.canvas}/>{!webglAvailable&&<div className={styles.fallback}><i/><i/><i/><span>SELECTED PATH</span><strong>{selected?.label}</strong></div>}</section>;
}
