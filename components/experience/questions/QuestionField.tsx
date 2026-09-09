'use client';

import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import styles from './QuestionField.module.css';

const NODE_POSITIONS = [
  new THREE.Vector3(-2.9, 1.35, -1.2),
  new THREE.Vector3(2.2, 1.7, -2.6),
  new THREE.Vector3(3.2, -0.65, -1.5),
  new THREE.Vector3(-1.8, -1.75, -2.25),
] as const;

export default function QuestionField({count,active}:{count:number;active:number}){
  const host=useRef<HTMLDivElement>(null);
  const activeRef=useRef(active);activeRef.current=active;

  useEffect(()=>{
    const el=host.current;if(!el)return;
    const scene=new THREE.Scene();scene.fog=new THREE.FogExp2(0x07151c,.055);
    const camera=new THREE.PerspectiveCamera(45,el.clientWidth/el.clientHeight,.1,70);camera.position.set(0,.15,10.5);
    const renderer=new THREE.WebGLRenderer({antialias:true,alpha:true,powerPreference:'high-performance'});renderer.setPixelRatio(Math.min(devicePixelRatio,2));renderer.setSize(el.clientWidth,el.clientHeight);renderer.outputColorSpace=THREE.SRGBColorSpace;el.appendChild(renderer.domElement);

    scene.add(new THREE.HemisphereLight(0xb9efff,0x061117,.8));
    const cyan=new THREE.PointLight(0x67dff4,18,18);cyan.position.set(3,2,5);scene.add(cyan);
    const violet=new THREE.PointLight(0x7755ff,10,18);violet.position.set(-4,-1,-2);scene.add(violet);

    const nodes:THREE.Group[]=[];
    for(let i=0;i<Math.max(1,count);i++){
      const position=NODE_POSITIONS[i]??new THREE.Vector3(0,0,-2-i);
      const group=new THREE.Group();group.position.copy(position);
      const coreMat=new THREE.MeshStandardMaterial({color:0x0b232d,emissive:0x65ddf3,emissiveIntensity:.55,metalness:.45,roughness:.2});
      const core=new THREE.Mesh(new THREE.SphereGeometry(.18,20,14),coreMat);group.add(core);
      const ring=new THREE.Mesh(new THREE.TorusGeometry(.43,.018,8,48),new THREE.MeshBasicMaterial({color:0x6ee8ff,transparent:true,opacity:.42,blending:THREE.AdditiveBlending}));ring.rotation.x=.62+i*.13;group.add(ring);
      const orbit=new THREE.Mesh(new THREE.TorusGeometry(.72,.008,6,52),new THREE.MeshBasicMaterial({color:i%2?0xb18cff:0x6ee8ff,transparent:true,opacity:.15}));orbit.rotation.set(1.1,i*.3,.4);group.add(orbit);
      scene.add(group);nodes.push(group);
    }

    const linePositions:number[]=[];
    for(let i=0;i<nodes.length;i++){
      for(let j=i+1;j<nodes.length;j++){
        const a=nodes[i].position,b=nodes[j].position;
        linePositions.push(a.x,a.y,a.z,b.x,b.y,b.z);
      }
    }
    const lineGeo=new THREE.BufferGeometry();lineGeo.setAttribute('position',new THREE.Float32BufferAttribute(linePositions,3));
    const lineMat=new THREE.LineBasicMaterial({color:0x5edff4,transparent:true,opacity:.12});
    const lines=new THREE.LineSegments(lineGeo,lineMat);scene.add(lines);

    const dustGeo=new THREE.BufferGeometry();const dust=new Float32Array(1200);
    for(let i=0;i<dust.length;i+=3){dust[i]=(Math.random()-.5)*18;dust[i+1]=(Math.random()-.5)*10;dust[i+2]=3-Math.random()*24}
    dustGeo.setAttribute('position',new THREE.BufferAttribute(dust,3));const dustMat=new THREE.PointsMaterial({color:0x7be7ff,size:.024,transparent:true,opacity:.3,depthWrite:false});const dustField=new THREE.Points(dustGeo,dustMat);scene.add(dustField);

    const pointer={x:0,y:0};const onPointer=(event:PointerEvent)=>{pointer.x=(event.clientX/window.innerWidth-.5)*2;pointer.y=(event.clientY/window.innerHeight-.5)*2};window.addEventListener('pointermove',onPointer,{passive:true});
    let raf=0;const clock=new THREE.Clock();
    const loop=()=>{
      raf=requestAnimationFrame(loop);const t=clock.getElapsedTime();
      nodes.forEach((group,i)=>{
        const isActive=i===activeRef.current;const wanted=isActive?1.34:1;
        group.scale.lerp(new THREE.Vector3(wanted,wanted,wanted),.08);
        const core=group.children[0] as THREE.Mesh<THREE.SphereGeometry,THREE.MeshStandardMaterial>;
        core.material.emissiveIntensity+=((isActive?2.8:.55)-core.material.emissiveIntensity)*.08;
        group.rotation.z=Math.sin(t*.4+i)*.025;
        group.position.y=(NODE_POSITIONS[i]?.y??0)+Math.sin(t*.55+i)*.07;
        const ring=group.children[1] as THREE.Mesh;ring.rotation.z=t*(i%2?.16:-.13)+i;
        const orbit=group.children[2] as THREE.Mesh;orbit.rotation.z=-t*(i%2?.09:-.075);
      });
      camera.position.x+=(pointer.x*.22-camera.position.x)*.02;camera.position.y+=(.15-pointer.y*.10-camera.position.y)*.02;camera.lookAt(pointer.x*.12,-pointer.y*.08,-1.8);
      lines.rotation.z=Math.sin(t*.13)*.02;dustField.rotation.y=t*.004;renderer.render(scene,camera);
    };loop();

    const resize=()=>{camera.aspect=el.clientWidth/el.clientHeight;camera.updateProjectionMatrix();renderer.setSize(el.clientWidth,el.clientHeight)};window.addEventListener('resize',resize);
    return()=>{cancelAnimationFrame(raf);window.removeEventListener('resize',resize);window.removeEventListener('pointermove',onPointer);scene.traverse(object=>{const mesh=object as THREE.Mesh;if(mesh.geometry)mesh.geometry.dispose();const material=mesh.material;if(Array.isArray(material))material.forEach(m=>m.dispose());else material?.dispose()});dustGeo.dispose();dustMat.dispose();lineGeo.dispose();lineMat.dispose();renderer.dispose();if(renderer.domElement.parentNode===el)el.removeChild(renderer.domElement)};
  },[count]);

  return <div ref={host} className={styles.field} aria-hidden="true"><div className={styles.veil}/></div>;
}
