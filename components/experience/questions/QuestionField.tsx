'use client';

import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import styles from './QuestionField.module.css';

const STAGE_POSITIONS = [
  [[-3.0,1.35,-1.0],[2.25,1.7,-2.6],[3.15,-.72,-1.5],[-1.9,-1.75,-2.25]],
  [[-3.4,.72,-.7],[2.8,-.42,-2.7],[4.2,1.5,-4],[-3.8,-1.7,-4]],
  [[-2.45,1.75,-1.5],[2.7,1.05,-2.7],[.25,-1.7,-.75],[-4,-1.1,-4]],
  [[-3.0,-.95,-1.3],[.15,1.7,-2.4],[3.05,-.55,-1.1],[-.4,-2.4,-4]],
  [[-2.65,.35,-1.1],[2.8,.35,-2.1],[-4,-2,-4],[4,-2,-4]],
] as const;

const STAGE_COLORS = [0x6ee8ff,0x7aa8ff,0x70e8c5,0xb18cff,0xe6bd73] as const;
const CAMERA_POSES = [
  {x:0,y:.15,z:10.5,lx:0,ly:0,lz:-1.8,fov:45},
  {x:-.55,y:.45,z:11.2,lx:.15,ly:.05,lz:-2.0,fov:47},
  {x:.45,y:-.2,z:9.8,lx:.15,ly:.1,lz:-1.65,fov:43},
  {x:-.35,y:.55,z:10.8,lx:0,ly:-.15,lz:-2.15,fov:46},
  {x:.25,y:.05,z:9.7,lx:.2,ly:.1,lz:-1.45,fov:42},
] as const;

function geometryFor(index:number):THREE.BufferGeometry{
  if(index===0)return new THREE.SphereGeometry(.2,22,16);
  if(index===1)return new THREE.OctahedronGeometry(.23,1);
  if(index===2)return new THREE.IcosahedronGeometry(.23,1);
  return new THREE.TorusKnotGeometry(.16,.055,48,8,2,3);
}

export default function QuestionField({count,active,stageIndex}:{count:number;active:number;stageIndex:number}){
  const host=useRef<HTMLDivElement>(null);
  const activeRef=useRef(active);activeRef.current=active;
  const countRef=useRef(count);countRef.current=count;
  const stageRef=useRef(stageIndex);stageRef.current=Math.max(0,Math.min(4,stageIndex));

  useEffect(()=>{
    const el=host.current;if(!el)return;
    const scene=new THREE.Scene();scene.fog=new THREE.FogExp2(0x07151c,.055);
    const camera=new THREE.PerspectiveCamera(45,el.clientWidth/el.clientHeight,.1,70);camera.position.set(0,.15,10.5);
    const lookTarget=new THREE.Vector3(0,0,-1.8);
    const renderer=new THREE.WebGLRenderer({antialias:true,alpha:true,powerPreference:'high-performance'});renderer.setPixelRatio(Math.min(devicePixelRatio,2));renderer.setSize(el.clientWidth,el.clientHeight);renderer.outputColorSpace=THREE.SRGBColorSpace;el.appendChild(renderer.domElement);

    scene.add(new THREE.HemisphereLight(0xb9efff,0x061117,.8));
    const fieldLight=new THREE.PointLight(STAGE_COLORS[0],20,20);fieldLight.position.set(3,2,5);scene.add(fieldLight);
    const violet=new THREE.PointLight(0x7755ff,9,18);violet.position.set(-4,-1,-2);scene.add(violet);

    const nodes:Array<{group:THREE.Group;core:THREE.Mesh<THREE.BufferGeometry,THREE.MeshStandardMaterial>;ring:THREE.Mesh<THREE.TorusGeometry,THREE.MeshBasicMaterial>;orbit:THREE.Mesh<THREE.TorusGeometry,THREE.MeshBasicMaterial>}>=[];
    for(let i=0;i<4;i++){
      const p=STAGE_POSITIONS[0][i];
      const group=new THREE.Group();group.position.set(p[0],p[1],p[2]);
      const coreMat=new THREE.MeshStandardMaterial({color:0x0b232d,emissive:STAGE_COLORS[0],emissiveIntensity:.55,metalness:.48,roughness:.18,transparent:true,opacity:.9});
      const core=new THREE.Mesh(geometryFor(i),coreMat);group.add(core);
      const ringMat=new THREE.MeshBasicMaterial({color:STAGE_COLORS[0],transparent:true,opacity:.42,blending:THREE.AdditiveBlending,depthWrite:false});
      const ring=new THREE.Mesh(new THREE.TorusGeometry(.44+i*.035,.017,8,54),ringMat);ring.rotation.x=.62+i*.13;group.add(ring);
      const orbitMat=new THREE.MeshBasicMaterial({color:i%2?0xb18cff:STAGE_COLORS[0],transparent:true,opacity:.14,blending:THREE.AdditiveBlending,depthWrite:false});
      const orbit=new THREE.Mesh(new THREE.TorusGeometry(.72+i*.04,.008,6,58),orbitMat);orbit.rotation.set(1.1,i*.3,.4);group.add(orbit);
      scene.add(group);nodes.push({group,core,ring,orbit});
    }

    const lineArray=new Float32Array(36);
    const lineGeo=new THREE.BufferGeometry();const lineAttribute=new THREE.BufferAttribute(lineArray,3);lineGeo.setAttribute('position',lineAttribute);
    const lineMat=new THREE.LineBasicMaterial({color:STAGE_COLORS[0],transparent:true,opacity:.13});const lines=new THREE.LineSegments(lineGeo,lineMat);scene.add(lines);

    const corridor=new THREE.Group();
    for(let i=0;i<6;i++){
      const mat=new THREE.MeshBasicMaterial({color:STAGE_COLORS[0],transparent:true,opacity:.06,wireframe:true,blending:THREE.AdditiveBlending,depthWrite:false});
      const ring=new THREE.Mesh(new THREE.TorusGeometry(2.7+i*.62,.012,6,72),mat);ring.position.z=-3.5-i*1.2;ring.rotation.set(Math.PI*.5,i*.05,i*.25);corridor.add(ring);
    }
    scene.add(corridor);

    const dustGeo=new THREE.BufferGeometry();const dust=new Float32Array(1500);
    for(let i=0;i<dust.length;i+=3){dust[i]=(Math.random()-.5)*18;dust[i+1]=(Math.random()-.5)*10;dust[i+2]=3-Math.random()*25}
    dustGeo.setAttribute('position',new THREE.BufferAttribute(dust,3));const dustMat=new THREE.PointsMaterial({color:STAGE_COLORS[0],size:.024,transparent:true,opacity:.3,depthWrite:false});const dustField=new THREE.Points(dustGeo,dustMat);scene.add(dustField);

    const pointer={x:0,y:0};const onPointer=(event:PointerEvent)=>{pointer.x=(event.clientX/window.innerWidth-.5)*2;pointer.y=(event.clientY/window.innerHeight-.5)*2};window.addEventListener('pointermove',onPointer,{passive:true});
    let raf=0;const clock=new THREE.Clock();const stageColor=new THREE.Color(STAGE_COLORS[0]);
    const loop=()=>{
      raf=requestAnimationFrame(loop);const t=clock.getElapsedTime();const stage=stageRef.current;const activeCount=Math.max(0,Math.min(4,countRef.current));const colorTarget=new THREE.Color(STAGE_COLORS[stage]);stageColor.lerp(colorTarget,.055);
      fieldLight.color.copy(stageColor);lineMat.color.copy(stageColor);dustMat.color.copy(stageColor);
      corridor.children.forEach((child,i)=>{const mesh=child as THREE.Mesh<THREE.TorusGeometry,THREE.MeshBasicMaterial>;mesh.material.color.copy(stageColor);mesh.material.opacity=.035+(i%3)*.014;mesh.rotation.z=t*(i%2?.025:-.02)+stage*.12+i*.08});

      nodes.forEach((node,i)=>{
        const tuple=STAGE_POSITIONS[stage][i];const target=new THREE.Vector3(tuple[0],tuple[1],tuple[2]);const visible=i<activeCount;const isActive=visible&&i===activeRef.current;
        if(isActive){target.x*=.86;target.y*=.82;target.z+=.72}
        node.group.position.lerp(target,.065);
        const wanted=visible?(isActive?1.42:1):.001;node.group.scale.lerp(new THREE.Vector3(wanted,wanted,wanted),.09);node.group.visible=node.group.scale.x>.01;
        node.core.material.emissive.lerp(stageColor,.08);node.core.material.emissiveIntensity+=((isActive?3.1:.6)-node.core.material.emissiveIntensity)*.08;node.core.material.opacity+=(visible?.92:0-node.core.material.opacity)*.08;
        node.ring.material.color.lerp(stageColor,.08);node.ring.material.opacity+=((isActive?.72:.38)-node.ring.material.opacity)*.08;node.orbit.material.opacity+=((isActive?.32:.12)-node.orbit.material.opacity)*.08;
        node.group.rotation.z=Math.sin(t*.4+i+stage*.5)*.025;node.core.rotation.x=t*(i%2?.08:-.065);node.core.rotation.y=t*(i%2?.11:-.09);node.ring.rotation.z=t*(i%2?.16:-.13)+i;node.orbit.rotation.z=-t*(i%2?.09:-.075);
      });

      let cursor=0;
      for(let i=0;i<activeCount;i++)for(let j=i+1;j<activeCount;j++){
        const a=nodes[i].group.position,b=nodes[j].group.position;
        lineArray[cursor++]=a.x;lineArray[cursor++]=a.y;lineArray[cursor++]=a.z;lineArray[cursor++]=b.x;lineArray[cursor++]=b.y;lineArray[cursor++]=b.z;
      }
      lineGeo.setDrawRange(0,cursor/3);lineAttribute.needsUpdate=true;lineMat.opacity=.08+(activeRef.current>=0?.09:0);

      const pose=CAMERA_POSES[stage];camera.position.x+=(pose.x+pointer.x*.2-camera.position.x)*.035;camera.position.y+=(pose.y-pointer.y*.1-camera.position.y)*.035;camera.position.z+=(pose.z-camera.position.z)*.035;
      lookTarget.x+=(pose.lx+pointer.x*.1-lookTarget.x)*.04;lookTarget.y+=(pose.ly-pointer.y*.06-lookTarget.y)*.04;lookTarget.z+=(pose.lz-lookTarget.z)*.04;camera.fov+=(pose.fov-camera.fov)*.035;camera.updateProjectionMatrix();camera.lookAt(lookTarget);camera.rotation.z+=(Math.sin(stage*.8)*.018-camera.rotation.z)*.03;
      dustField.rotation.y=t*.004+stage*.035;dustField.position.z=Math.sin(t*.12)*.25;renderer.render(scene,camera);
    };loop();

    const resize=()=>{camera.aspect=el.clientWidth/el.clientHeight;camera.updateProjectionMatrix();renderer.setSize(el.clientWidth,el.clientHeight)};window.addEventListener('resize',resize);
    return()=>{cancelAnimationFrame(raf);window.removeEventListener('resize',resize);window.removeEventListener('pointermove',onPointer);scene.traverse(object=>{const mesh=object as THREE.Mesh;if(mesh.geometry)mesh.geometry.dispose();const material=mesh.material;if(Array.isArray(material))material.forEach(m=>m.dispose());else material?.dispose()});renderer.dispose();if(renderer.domElement.parentNode===el)el.removeChild(renderer.domElement)};
  },[]);

  return <div ref={host} className={styles.field} aria-hidden="true"><div className={styles.veil}/></div>;
}
