'use client';

import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import styles from './SpecialtyField.module.css';
import { configureCinematicRenderer } from '../immersive/rendererQuality';

type Item={id:string;label:string;color:string};
type Visual={group:THREE.Group;mesh:THREE.Mesh<THREE.BufferGeometry,THREE.MeshStandardMaterial>;rings:THREE.Mesh[];item:Item;index:number};

function geometryFor(index:number):THREE.BufferGeometry{
  if(index===0)return new THREE.IcosahedronGeometry(1.3,3);
  if(index===1)return new THREE.TorusKnotGeometry(.9,.26,150,20,2,3);
  if(index===2)return new THREE.OctahedronGeometry(1.34,2);
  if(index===3)return new THREE.SphereGeometry(1.15,48,32);
  if(index===4)return new THREE.TorusGeometry(1.0,.31,24,120);
  return new THREE.CapsuleGeometry(.72,1.35,12,24);
}

export default function SpecialtyField({items,selectedId}:{items:readonly Item[];selectedId:string;onSelect:(id:string)=>void}){
  const mount=useRef<HTMLDivElement>(null);
  const selectedRef=useRef(selectedId);selectedRef.current=selectedId;

  useEffect(()=>{
    const host=mount.current;if(!host)return;
    const scene=new THREE.Scene();
    const camera=new THREE.PerspectiveCamera(42,Math.max(1,host.clientWidth)/Math.max(1,host.clientHeight),.1,80);
    camera.position.set(0,.15,9.5);
    const renderer=configureCinematicRenderer(new THREE.WebGLRenderer({antialias:true,alpha:true,powerPreference:'high-performance'}),{exposure:1.02});
    renderer.setSize(host.clientWidth,host.clientHeight);renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,1.8));host.appendChild(renderer.domElement);

    scene.add(new THREE.HemisphereLight(0xeafaff,0x020406,.92));
    const key=new THREE.PointLight(0xffffff,18,22);key.position.set(5,5,6);scene.add(key);
    const rim=new THREE.PointLight(0x79e8ff,14,18);rim.position.set(-2,-2,3);scene.add(rim);

    const visuals:Visual[]=items.map((item,index)=>{
      const color=new THREE.Color(item.color);
      const group=new THREE.Group();
      const material=new THREE.MeshStandardMaterial({color:0x101417,emissive:color,emissiveIntensity:.8,metalness:.7,roughness:.16,transparent:true,opacity:0});
      const mesh=new THREE.Mesh(geometryFor(index),material);group.add(mesh);
      const rings=[1.7,2.15,2.55].map((radius,ringIndex)=>{
        const ring=new THREE.Mesh(new THREE.TorusGeometry(radius,.018-ringIndex*.002,8,120),new THREE.MeshBasicMaterial({color,transparent:true,opacity:0,blending:THREE.AdditiveBlending,depthWrite:false}));
        ring.rotation.set(.62+ringIndex*.32,index*.18+ringIndex*.21,.22+ringIndex*.17);group.add(ring);return ring;
      });
      group.position.set(2.35,.12,-.4);group.scale.setScalar(.72);scene.add(group);return{group,mesh,rings,item,index};
    });

    const dustGeo=new THREE.BufferGeometry();const dust=new Float32Array(1200);for(let i=0;i<dust.length;i+=3){dust[i]=(Math.random()-.5)*16;dust[i+1]=(Math.random()-.5)*10;dust[i+2]=3-Math.random()*20}dustGeo.setAttribute('position',new THREE.BufferAttribute(dust,3));
    const dustMat=new THREE.PointsMaterial({color:0xd7f8ff,size:.018,transparent:true,opacity:.23,depthWrite:false});const dustField=new THREE.Points(dustGeo,dustMat);scene.add(dustField);

    const backRing=new THREE.Mesh(new THREE.TorusGeometry(3.4,.012,7,140),new THREE.MeshBasicMaterial({color:0xffffff,transparent:true,opacity:.05,depthWrite:false}));backRing.rotation.x=1.16;backRing.rotation.z=.32;backRing.position.set(2.35,0,-2.4);scene.add(backRing);

    const pointer={x:0,y:0};const move=(event:PointerEvent)=>{pointer.x=(event.clientX/window.innerWidth-.5)*2;pointer.y=(event.clientY/window.innerHeight-.5)*2};window.addEventListener('pointermove',move,{passive:true});
    let raf=0,start=performance.now(),lastSelected=-1;
    const loop=(now:number)=>{
      raf=requestAnimationFrame(loop);const t=(now-start)/1000;const selectedIndex=Math.max(0,visuals.findIndex(visual=>visual.item.id===selectedRef.current));
      if(selectedIndex!==lastSelected){lastSelected=selectedIndex;const color=new THREE.Color(visuals[selectedIndex]?.item.color??'#72dcff');rim.color.copy(color);dustMat.color.copy(color).lerp(new THREE.Color(0xffffff),.45)}
      visuals.forEach((visual,index)=>{
        const active=index===selectedIndex;const material=visual.mesh.material;
        material.opacity+=((active?1:0)-material.opacity)*(active?.11:.16);material.emissiveIntensity+=((active?2.25:.4)-material.emissiveIntensity)*.08;
        const targetScale=active?1:0.68;visual.group.scale.lerp(new THREE.Vector3(targetScale,targetScale,targetScale),.09);
        visual.group.position.x+=((active?2.35:3.4)-visual.group.position.x)*.075;visual.group.position.z+=((active?.2:-3.8)-visual.group.position.z)*.085;visual.group.position.y+=((active?.12:1.4)-visual.group.position.y)*.07;
        visual.mesh.rotation.x=t*(index%2?.075:-.06)+index*.2;visual.mesh.rotation.y=t*(index%2?.11:-.09)+index*.16;
        visual.rings.forEach((ring,ringIndex)=>{const mat=ring.material as THREE.MeshBasicMaterial;mat.opacity+=(((active?.34-ringIndex*.07:0))-mat.opacity)*.1;ring.rotation.z=t*((index+ringIndex)%2?.045:-.038)+ringIndex*.4});
        visual.group.visible=material.opacity>.008||active;
      });
      camera.position.x+=(pointer.x*.12-camera.position.x)*.025;camera.position.y+=(.15+pointer.y*.09-camera.position.y)*.025;camera.lookAt(1.45,.08,-.55);
      backRing.rotation.z=t*.018;dustField.rotation.y=t*.004;renderer.render(scene,camera);
    };loop(performance.now());

    const resize=()=>{camera.aspect=Math.max(1,host.clientWidth)/Math.max(1,host.clientHeight);camera.updateProjectionMatrix();renderer.setSize(host.clientWidth,host.clientHeight);renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,1.8))};window.addEventListener('resize',resize);
    return()=>{cancelAnimationFrame(raf);window.removeEventListener('resize',resize);window.removeEventListener('pointermove',move);scene.traverse(object=>{const mesh=object as THREE.Mesh;if(mesh.geometry)mesh.geometry.dispose();const material=mesh.material;if(Array.isArray(material))material.forEach(x=>x.dispose());else material?.dispose()});renderer.dispose();if(renderer.domElement.parentNode===host)host.removeChild(renderer.domElement)};
  },[items]);

  return <section className={styles.root} aria-label="Selected provider specialty visual"><div ref={mount} className={styles.canvas}/></section>;
}
