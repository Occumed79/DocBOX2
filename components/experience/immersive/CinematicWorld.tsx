'use client';

import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import styles from './CinematicWorld.module.css';

const ASSETS = [
  'Founders.png','Founders copy.png','California - Hawaii Map.png','Concerned provider.png',
  'EMPLOYEE ID.png','Diverse Healthcare Team Portrait (1).png','Friendly Medical Appointment Call.png',
  'Medical Eval.png','Calm Clinic Blood Draw (1).png','Dental Eval.png','Audiometry.png',
  'Pharmacist Administering a Vaccine(1) (1).png','EXAM REPORT.png','Fitness Determination.png',
  'Diverse Workforce.png','Diverse Workforce2.png','International Certification.png','Vaccine Schedule.png',
  'Facilities.png','International Network.png','Corevalue.png','Corevalue2.png','Corevalue3.png',
  'Corevalue4.png','Corevalue5.png','Corevalue6.png',
] as const;

const CHAPTER_STARTS = [0,3,4,6,7,12,13,14,16,18,20] as const;
const CHAPTER_COUNTS = [3,1,2,1,5,1,1,2,2,2,6] as const;
const CHAPTER_HUES = [.54,.57,.61,.49,.53,.58,.46,.63,.59,.52,.66] as const;

type Pose = { x:number; y:number; z:number; s:number; rx:number; ry:number; rz:number };
type PlaneRecord = { mesh:THREE.Mesh<THREE.PlaneGeometry,THREE.MeshBasicMaterial>; chapter:number; local:number };

const clamp = (v:number,min=0,max=1) => Math.max(min,Math.min(max,v));
const mix = (a:number,b:number,t:number) => a + (b-a)*t;

function poseFor(chapter:number, local:number, progress:number):Pose {
  const p = progress - .5;
  switch (chapter) {
    case 0: {
      const poses = [
        {x:-1.8,y:.2,z:-.3,s:1.36,rx:0,ry:-.08,rz:-.025},
        {x:3.35,y:1.55,z:-1.7,s:.58,rx:0,ry:.22,rz:.07},
        {x:2.25,y:-1.8,z:-2.9,s:.76,rx:.02,ry:-.2,rz:-.055},
      ];
      const o=poses[local]??poses[0];
      return {...o,x:o.x+p*(local===0?-1.4:1.8),y:o.y+p*(local===2?1.2:-.4),z:o.z-p*2.3,rz:o.rz+p*.09};
    }
    case 1:
      return {x:2.7+p*-3.1,y:-.1+p*.45,z:-.9-p*2.6,s:1.42+p*.25,rx:0,ry:-.16+p*.2,rz:.025+p*.04};
    case 2:
      return local===0
        ? {x:-3.05+p*1.6,y:1.1-p*.5,z:-1.2-p*2.2,s:.9+p*.18,rx:0,ry:.2-p*.15,rz:-.065}
        : {x:2.6-p*1.2,y:-1.0+p*.8,z:-2.2-p*1.5,s:1.05-p*.12,rx:0,ry:-.22+p*.15,rz:.055};
    case 3:
      return {x:-2.25+p*3.4,y:.55-p*1.1,z:-.5-p*3.0,s:1.55-p*.25,rx:0,ry:.12-p*.24,rz:-.03+p*.06};
    case 4: {
      const angle=(local-2)*.42;
      return {x:Math.sin(angle)*4.6+p*(local-2)*.38,y:Math.cos(angle*1.3)*.95-1.05,z:-1.4-Math.abs(local-2)*1.35-p*2.0,s:local===2?1.05:.73,rx:0,ry:-angle*.42+p*.12,rz:angle*.09+p*.035};
    }
    case 5:
      return {x:2.1-p*2.2,y:.2+p*.35,z:-.8-p*2.8,s:1.62-p*.2,rx:.015,ry:-.14+p*.2,rz:.015};
    case 6:
      return {x:p*.65,y:.35-p*.55,z:-.45-p*3.6,s:1.55+p*.35,rx:0,ry:p*.18,rz:-p*.03};
    case 7:
      return local===0
        ? {x:-2.55+p*.8,y:.1-p*.35,z:-1.15-p*2.0,s:1.03,rx:0,ry:.16,rz:-.035+p*.02}
        : {x:2.55-p*.8,y:-.25+p*.4,z:-1.8-p*2.0,s:1.03,rx:0,ry:-.16,rz:.035-p*.02};
    case 8:
      return local===0
        ? {x:-2.15+p*1.2,y:1.05-p*.9,z:-.8-p*2.8,s:1.06,rx:0,ry:.13,rz:-.04}
        : {x:2.2-p*1.2,y:-1.05+p*.9,z:-1.7-p*2.1,s:.96,rx:0,ry:-.14,rz:.045};
    case 9:
      return local===0
        ? {x:-2.15+p*2.0,y:0,z:-.6-p*3.2,s:1.48,rx:0,ry:.1-p*.2,rz:-.02}
        : {x:2.65-p*2.3,y:.15,z:-2.6-p*2.4,s:1.12+p*.22,rx:0,ry:-.12+p*.2,rz:.018};
    case 10: {
      const a=(local/6)*Math.PI*2 + progress*.6;
      const r=local%2?3.25:4.15;
      return {x:Math.cos(a)*r,y:Math.sin(a)*2.15,z:-1.0-(local%3)*1.1-p*1.6,s:local===0?1.02:.72,rx:0,ry:-Math.cos(a)*.18,rz:a*.05};
    }
    default:
      return {x:0,y:0,z:-1,s:1,rx:0,ry:0,rz:0};
  }
}

function sceneProgress(index:number) {
  const element=document.querySelector<HTMLElement>(`[data-scene-index="${index}"]`);
  if(!element) return .5;
  const rect=element.getBoundingClientRect();
  return clamp((window.innerHeight-rect.top)/Math.max(window.innerHeight+rect.height,1));
}

export default function CinematicWorld({ sceneIndex }:{ sceneIndex:number }) {
  const host=useRef<HTMLDivElement>(null);
  const chapterRef=useRef(sceneIndex);
  chapterRef.current=sceneIndex;

  useEffect(()=>{
    const element=host.current;
    if(!element) return;

    const scene=new THREE.Scene();
    scene.fog=new THREE.FogExp2(0x02070b,.052);
    const camera=new THREE.PerspectiveCamera(43,window.innerWidth/window.innerHeight,.1,80);
    camera.position.set(0,0,8.5);

    const renderer=new THREE.WebGLRenderer({alpha:false,antialias:true,powerPreference:'high-performance'});
    renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,2));
    renderer.setSize(window.innerWidth,window.innerHeight);
    renderer.outputColorSpace=THREE.SRGBColorSpace;
    element.appendChild(renderer.domElement);

    scene.add(new THREE.AmbientLight(0xffffff,.95));
    const key=new THREE.PointLight(0x68ddff,28,28);
    key.position.set(5,3,7);
    scene.add(key);
    const violet=new THREE.PointLight(0x7755ff,16,24);
    violet.position.set(-5,-2,3);
    scene.add(violet);

    const textureLoader=new THREE.TextureLoader();
    const records:PlaneRecord[]=[];
    for(let chapter=0;chapter<CHAPTER_STARTS.length;chapter++){
      const start=CHAPTER_STARTS[chapter];
      const count=CHAPTER_COUNTS[chapter];
      for(let local=0;local<count;local++){
        const asset=ASSETS[start+local];
        const material=new THREE.MeshBasicMaterial({
          map:textureLoader.load('/photos/'+encodeURIComponent(asset)),
          transparent:true,
          opacity:0,
          side:THREE.DoubleSide,
          depthWrite:false,
          toneMapped:false,
        });
        const geometry=new THREE.PlaneGeometry(4.7,3.05,1,1);
        const mesh=new THREE.Mesh(geometry,material);
        mesh.renderOrder=10+local;
        scene.add(mesh);
        records.push({mesh,chapter,local});
      }
    }

    const dustGeometry=new THREE.BufferGeometry();
    const dust=new Float32Array(2400);
    for(let i=0;i<dust.length;i+=3){
      dust[i]=(Math.random()-.5)*30;
      dust[i+1]=(Math.random()-.5)*18;
      dust[i+2]=-Math.random()*35+5;
    }
    dustGeometry.setAttribute('position',new THREE.BufferAttribute(dust,3));
    const dustField=new THREE.Points(dustGeometry,new THREE.PointsMaterial({color:0x83e6ff,size:.025,transparent:true,opacity:.42,depthWrite:false}));
    scene.add(dustField);

    const orbitGroup=new THREE.Group();
    for(let i=0;i<4;i++){
      const ring=new THREE.Mesh(
        new THREE.TorusGeometry(3.6+i*1.35,.012,6,120),
        new THREE.MeshBasicMaterial({color:i%2?0x7656ff:0x4ecbe8,transparent:true,opacity:.11})
      );
      ring.rotation.set(Math.PI*.5+i*.11,i*.17,i*.3);
      orbitGroup.add(ring);
    }
    scene.add(orbitGroup);

    const pointer={x:0,y:0};
    const onPointer=(event:PointerEvent)=>{
      pointer.x=(event.clientX/window.innerWidth-.5)*2;
      pointer.y=(event.clientY/window.innerHeight-.5)*2;
    };
    window.addEventListener('pointermove',onPointer,{passive:true});

    let chapterFloat=0;
    let local=.5;
    let raf=0;
    const clock=new THREE.Clock();

    const render=()=>{
      raf=requestAnimationFrame(render);
      const elapsed=clock.getElapsedTime();
      const targetChapter=Math.min(Math.max(chapterRef.current,0),10);
      chapterFloat += (targetChapter-chapterFloat)*.045;
      local += (sceneProgress(targetChapter)-local)*.08;

      const hue=CHAPTER_HUES[targetChapter]??.56;
      const background=new THREE.Color().setHSL(hue,.46,.035+Math.sin(local*Math.PI)*.014);
      renderer.setClearColor(background,1);
      scene.fog!.color.copy(background);

      records.forEach(({mesh,chapter,local:assetIndex})=>{
        const chapterDistance=Math.abs(chapterFloat-chapter);
        const visibility=clamp(1-chapterDistance*.9);
        const chapterProgress=chapter===targetChapter?local:(chapter<targetChapter?1:0);
        const pose=poseFor(chapter,assetIndex,chapterProgress);
        const transition=clamp(visibility);
        const hiddenZ=pose.z-7*Math.min(1,chapterDistance);

        mesh.position.x += (pose.x-mesh.position.x)*.09;
        mesh.position.y += (pose.y-mesh.position.y)*.09;
        mesh.position.z += (hiddenZ-mesh.position.z)*.09;
        mesh.rotation.x += (pose.rx-mesh.rotation.x)*.08;
        mesh.rotation.y += (pose.ry-mesh.rotation.y)*.08;
        mesh.rotation.z += (pose.rz-mesh.rotation.z)*.08;
        const pulse=1+Math.sin(elapsed*.42+assetIndex)*.008;
        const scale=pose.s*pulse;
        mesh.scale.x += (scale-mesh.scale.x)*.09;
        mesh.scale.y += (scale-mesh.scale.y)*.09;
        mesh.scale.z=1;
        mesh.material.opacity += ((transition*.92)-mesh.material.opacity)*.12;
      });

      const cameraX=pointer.x*.28 + Math.sin(chapterFloat*.9)*.22;
      const cameraY=-pointer.y*.18 + Math.cos(chapterFloat*.72)*.14;
      camera.position.x += (cameraX-camera.position.x)*.035;
      camera.position.y += (cameraY-camera.position.y)*.035;
      camera.position.z=8.5-mix(0,.7,Math.sin(local*Math.PI));
      camera.rotation.z=Math.sin(chapterFloat*.8+local*Math.PI)*.012;
      camera.lookAt(pointer.x*.09,-pointer.y*.06,-1.8);

      orbitGroup.rotation.z=elapsed*.012+chapterFloat*.12;
      orbitGroup.rotation.y=Math.sin(elapsed*.08)*.12;
      orbitGroup.position.z=-4-local*1.5;
      dustField.rotation.y=elapsed*.006;
      dustField.position.z=local*-1.2;

      renderer.render(scene,camera);
    };
    render();

    const resize=()=>{
      camera.aspect=window.innerWidth/window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,2));
      renderer.setSize(window.innerWidth,window.innerHeight);
    };
    window.addEventListener('resize',resize);

    return()=>{
      cancelAnimationFrame(raf);
      window.removeEventListener('resize',resize);
      window.removeEventListener('pointermove',onPointer);
      records.forEach(({mesh})=>{
        mesh.geometry.dispose();
        mesh.material.map?.dispose();
        mesh.material.dispose();
      });
      dustGeometry.dispose();
      (dustField.material as THREE.PointsMaterial).dispose();
      orbitGroup.children.forEach(child=>{
        const mesh=child as THREE.Mesh;
        mesh.geometry?.dispose();
        (mesh.material as THREE.Material)?.dispose();
      });
      renderer.dispose();
      if(renderer.domElement.parentNode===element) element.removeChild(renderer.domElement);
    };
  },[]);

  return <div ref={host} className={styles.world} aria-hidden="true"/>;
}
