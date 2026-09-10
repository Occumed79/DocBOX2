'use client';

import { useEffect, useRef } from 'react';
import * as THREE from 'three';

type Milestone = { year:string; title:string; image:string };

function yearTexture(year:string){
  const canvas=document.createElement('canvas');canvas.width=1024;canvas.height=512;const ctx=canvas.getContext('2d')!;ctx.clearRect(0,0,1024,512);ctx.font='900 310px Arial';ctx.textAlign='center';ctx.textBaseline='middle';ctx.strokeStyle='rgba(133,231,247,.72)';ctx.lineWidth=3;ctx.strokeText(year,512,270);ctx.fillStyle='rgba(11,29,38,.2)';ctx.fillText(year,512,270);const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;return texture;
}

export default function HistoryWorld({progress,milestones}:{progress:number;milestones:readonly Milestone[]}){
  const host=useRef<HTMLDivElement>(null),progressRef=useRef(progress);progressRef.current=progress;
  useEffect(()=>{const el=host.current;if(!el)return;const scene=new THREE.Scene();scene.background=new THREE.Color(0x061015);scene.fog=new THREE.FogExp2(0x061015,.026);const camera=new THREE.PerspectiveCamera(46,el.clientWidth/el.clientHeight,.1,180);camera.position.set(0,.4,9);
    const renderer=new THREE.WebGLRenderer({antialias:true,powerPreference:'high-performance'});renderer.setPixelRatio(Math.min(devicePixelRatio,1.8));renderer.setSize(el.clientWidth,el.clientHeight);renderer.outputColorSpace=THREE.SRGBColorSpace;el.appendChild(renderer.domElement);
    scene.add(new THREE.HemisphereLight(0x9defff,0x061017,1.6));const key=new THREE.PointLight(0x7ee8ff,70,30);camera.add(key);scene.add(camera);
    const loader=new THREE.TextureLoader();const groups=milestones.map((item,i)=>{const group=new THREE.Group();const side=i%2?-1:1;group.position.set(side*(2.7+Math.sin(i)*.65),Math.sin(i*.88)*1.25,-i*11);
      const frame=new THREE.Mesh(new THREE.PlaneGeometry(5.6,3.55,16,10),new THREE.MeshStandardMaterial({map:loader.load('/photos/'+encodeURIComponent(item.image)),transparent:true,opacity:.9,roughness:.62,metalness:.08,side:THREE.DoubleSide}));frame.rotation.y=side*-.24;group.add(frame);
      const border=new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(5.72,3.67,.12)),new THREE.LineBasicMaterial({color:i%3===0?0xd3a65f:0x69dff6,transparent:true,opacity:.65}));border.rotation.y=frame.rotation.y;group.add(border);
      const year=new THREE.Sprite(new THREE.SpriteMaterial({map:yearTexture(item.year),transparent:true,depthWrite:false,opacity:.54}));year.scale.set(7.7,3.85,1);year.position.set(-side*3.8,1.8,-2.4);group.add(year);
      const plinth=new THREE.Mesh(new THREE.BoxGeometry(1.4,.05,7),new THREE.MeshStandardMaterial({color:0x17343e,emissive:0x0b4656,emissiveIntensity:.6,metalness:.65,roughness:.32}));plinth.position.set(0,-2,-.5);group.add(plinth);scene.add(group);return group});
    const pathPoints=milestones.map((_,i)=>new THREE.Vector3(Math.sin(i*.85)*1.2,-1.95,-i*11));const curve=new THREE.CatmullRomCurve3(pathPoints);const path=new THREE.Mesh(new THREE.TubeGeometry(curve,180,.025,6,false),new THREE.MeshBasicMaterial({color:0x63dff5,transparent:true,opacity:.48}));scene.add(path);
    for(let i=0;i<milestones.length;i++){const arch=new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(10,7,.08)),new THREE.LineBasicMaterial({color:i%2?0x2a6976:0x63527d,transparent:true,opacity:.18}));arch.position.z=-i*11-3;scene.add(arch)}
    const dustGeo=new THREE.BufferGeometry(),dust=new Float32Array(3600);for(let i=0;i<dust.length;i+=3){dust[i]=(Math.random()-.5)*20;dust[i+1]=(Math.random()-.5)*11;dust[i+2]=-Math.random()*milestones.length*12}dustGeo.setAttribute('position',new THREE.BufferAttribute(dust,3));const particles=new THREE.Points(dustGeo,new THREE.PointsMaterial({color:0x85e7f6,size:.035,transparent:true,opacity:.58,depthWrite:false}));scene.add(particles);
    let raf=0,current=0;const draw=(time:number)=>{raf=requestAnimationFrame(draw);const goal=progressRef.current*(milestones.length-1)*11;current+=(goal-current)*.055;const phase=current/11;camera.position.z=9-current;camera.position.x=Math.sin(phase*.85)*1.25;camera.position.y=.25+Math.sin(phase*1.25)*.42;camera.rotation.z=Math.sin(phase*.7)*.025;camera.lookAt(Math.sin((phase+.4)*.85)*.65,0,camera.position.z-8);groups.forEach((group,i)=>{const distance=Math.abs(phase-i);group.rotation.z=Math.sin(time*.00035+i)*.018;group.position.y=Math.sin(i*.88)*1.25+Math.sin(time*.00025+i)*.12;group.scale.setScalar(.84+Math.max(0,1-distance)*.18)});particles.position.z=(current%11);particles.rotation.z=time*.000015;renderer.render(scene,camera)};draw(0);
    const resize=()=>{camera.aspect=el.clientWidth/el.clientHeight;camera.updateProjectionMatrix();renderer.setSize(el.clientWidth,el.clientHeight)};addEventListener('resize',resize);return()=>{cancelAnimationFrame(raf);removeEventListener('resize',resize);renderer.dispose();el.removeChild(renderer.domElement)};
  },[milestones]);return <div ref={host} className="history-world" aria-hidden="true"/>;
}
