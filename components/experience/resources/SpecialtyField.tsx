'use client';

import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import styles from './SpecialtyField.module.css';
import { configureCinematicRenderer } from '../immersive/rendererQuality';

type Item={id:string;label:string;color:string};

function geometryFor(index:number):THREE.BufferGeometry{
  if(index===0)return new THREE.IcosahedronGeometry(1.3,3);
  if(index===1)return new THREE.TorusKnotGeometry(.9,.26,150,20,2,3);
  if(index===2)return new THREE.OctahedronGeometry(1.34,2);
  if(index===3)return new THREE.SphereGeometry(1.15,48,32);
  if(index===4)return new THREE.TorusGeometry(1.0,.31,24,120);
  return new THREE.CapsuleGeometry(.72,1.35,12,24);
}

export default function SpecialtyField({items,selectedId}:{items:readonly Item[];selectedId:string}){
  const mount=useRef<HTMLDivElement>(null);
  const selectedRef=useRef(selectedId);selectedRef.current=selectedId;

  useEffect(()=>{
    const host=mount.current;if(!host||!items.length)return;
    const scene=new THREE.Scene();
    const camera=new THREE.PerspectiveCamera(42,Math.max(1,host.clientWidth)/Math.max(1,host.clientHeight),.1,80);camera.position.set(0,.15,9.5);
    const renderer=configureCinematicRenderer(new THREE.WebGLRenderer({antialias:true,alpha:true,powerPreference:'high-performance'}),{exposure:1.02});
    renderer.setSize(host.clientWidth,host.clientHeight);renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,1.8));host.appendChild(renderer.domElement);

    scene.add(new THREE.HemisphereLight(0xeafaff,0x020406,.92));
    const key=new THREE.PointLight(0xffffff,18,22);key.position.set(5,5,6);scene.add(key);
    const rim=new THREE.PointLight(new THREE.Color(items[0].color),14,18);rim.position.set(-2,-2,3);scene.add(rim);

    const group=new THREE.Group();group.position.set(2.35,.12,.2);scene.add(group);
    const material=new THREE.MeshStandardMaterial({color:0x101417,emissive:new THREE.Color(items[0].color),emissiveIntensity:2.25,metalness:.7,roughness:.16,transparent:true,opacity:1});
    const mesh=new THREE.Mesh(geometryFor(0),material);group.add(mesh);
    const ringMaterials=[0,1,2].map(()=>new THREE.MeshBasicMaterial({color:new THREE.Color(items[0].color),transparent:true,opacity:0,blending:THREE.AdditiveBlending,depthWrite:false}));
    const rings=[1.7,2.15,2.55].map((radius,index)=>{const ring=new THREE.Mesh(new THREE.TorusGeometry(radius,.018-index*.002,8,120),ringMaterials[index]);ring.rotation.set(.62+index*.32,index*.21,.22+index*.17);group.add(ring);return ring});

    const dustGeo=new THREE.BufferGeometry();const dust=new Float32Array(1200);for(let i=0;i<dust.length;i+=3){dust[i]=(Math.random()-.5)*16;dust[i+1]=(Math.random()-.5)*10;dust[i+2]=3-Math.random()*20}dustGeo.setAttribute('position',new THREE.BufferAttribute(dust,3));
    const dustMat=new THREE.PointsMaterial({color:0xd7f8ff,size:.018,transparent:true,opacity:.23,depthWrite:false});const dustField=new THREE.Points(dustGeo,dustMat);scene.add(dustField);
    const backRingMat=new THREE.MeshBasicMaterial({color:0xffffff,transparent:true,opacity:.05,depthWrite:false});const backRing=new THREE.Mesh(new THREE.TorusGeometry(3.4,.012,7,140),backRingMat);backRing.rotation.x=1.16;backRing.rotation.z=.32;backRing.position.set(2.35,0,-2.4);scene.add(backRing);

    const pointer={x:0,y:0};const move=(event:PointerEvent)=>{pointer.x=(event.clientX/window.innerWidth-.5)*2;pointer.y=(event.clientY/window.innerHeight-.5)*2};window.addEventListener('pointermove',move,{passive:true});
    let raf=0,start=performance.now(),currentIndex=0,targetIndex=0,transition=1;
    const applySelection=(index:number)=>{
      const next=items[index]??items[0];
      const color=new THREE.Color(next.color);material.emissive.copy(color);rim.color.copy(color);dustMat.color.copy(color).lerp(new THREE.Color(0xffffff),.45);ringMaterials.forEach(ringMaterial=>ringMaterial.color.copy(color));
      mesh.geometry.dispose();mesh.geometry=geometryFor(index);currentIndex=index;transition=0;
    };
    const loop=(now:number)=>{
      raf=requestAnimationFrame(loop);const t=(now-start)/1000;targetIndex=Math.max(0,items.findIndex(item=>item.id===selectedRef.current));if(targetIndex!==currentIndex)applySelection(targetIndex);
      transition=Math.min(1,transition+.055);const eased=1-Math.pow(1-transition,3);const scale=.72+eased*.28;group.scale.setScalar(scale);group.position.x=2.35+(1-eased)*.7;group.position.z=.2-(1-eased)*2.6;group.position.y=.12+(1-eased)*.65;material.opacity=eased;material.emissiveIntensity=1.1+eased*1.15;
      mesh.rotation.x=t*(currentIndex%2?.075:-.06)+currentIndex*.2;mesh.rotation.y=t*(currentIndex%2?.11:-.09)+currentIndex*.16;
      rings.forEach((ring,index)=>{ringMaterials[index].opacity=eased*(.34-index*.07);ring.rotation.z=t*((currentIndex+index)%2?.045:-.038)+index*.4});
      camera.position.x+=(pointer.x*.12-camera.position.x)*.025;camera.position.y+=(.15+pointer.y*.09-camera.position.y)*.025;camera.lookAt(1.45,.08,-.55);backRing.rotation.z=t*.018;dustField.rotation.y=t*.004;renderer.render(scene,camera);
    };loop(performance.now());

    const resize=()=>{camera.aspect=Math.max(1,host.clientWidth)/Math.max(1,host.clientHeight);camera.updateProjectionMatrix();renderer.setSize(host.clientWidth,host.clientHeight);renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,1.8))};window.addEventListener('resize',resize);
    return()=>{cancelAnimationFrame(raf);window.removeEventListener('resize',resize);window.removeEventListener('pointermove',move);scene.traverse(object=>{const renderable=object as THREE.Mesh|THREE.Points;if(renderable.geometry)renderable.geometry.dispose();const objectMaterial=renderable.material;if(Array.isArray(objectMaterial))objectMaterial.forEach(item=>item.dispose());else objectMaterial?.dispose()});renderer.dispose();if(renderer.domElement.parentNode===host)host.removeChild(renderer.domElement)};
  },[items]);

  return <section className={styles.root} aria-label="Selected provider specialty visual"><div ref={mount} className={styles.canvas}/></section>;
}
