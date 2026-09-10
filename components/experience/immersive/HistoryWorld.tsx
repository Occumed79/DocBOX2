'use client';

import { useEffect, useRef } from 'react';
import * as THREE from 'three';

type Milestone = { year:string; image:string };
type CameraBeat = {side:number;lift:number;push:number;lookSide:number;lookLift:number;fov:number;roll:number};

type Exhibit = {
  group:THREE.Group;
  photo:THREE.Mesh<THREE.PlaneGeometry,THREE.MeshBasicMaterial>;
  label:THREE.Mesh<THREE.PlaneGeometry,THREE.MeshBasicMaterial>;
  ghost:THREE.Mesh<THREE.PlaneGeometry,THREE.MeshBasicMaterial>;
  frame:THREE.Mesh;
  edge:THREE.LineSegments;
  anchor:THREE.Vector3;
};

const CAMERA_BEATS:readonly CameraBeat[]=[
  {side:-.2,lift:.16,push:.15,lookSide:.08,lookLift:.02,fov:43,roll:-.008},
  {side:1.0,lift:.38,push:-.28,lookSide:-.46,lookLift:.12,fov:47,roll:.022},
  {side:-.72,lift:-.08,push:.62,lookSide:.3,lookLift:-.05,fov:38.5,roll:-.016},
  {side:.18,lift:-.32,push:.24,lookSide:-.08,lookLift:.18,fov:42,roll:.009},
  {side:-1.18,lift:.5,push:-.42,lookSide:.52,lookLift:-.08,fov:49,roll:-.027},
  {side:.88,lift:.08,push:.28,lookSide:-.38,lookLift:.05,fov:43,roll:.019},
  {side:-.4,lift:.42,push:.82,lookSide:.12,lookLift:-.12,fov:37,roll:-.011},
  {side:1.12,lift:-.18,push:-.2,lookSide:-.5,lookLift:.15,fov:47.5,roll:.024},
  {side:-.58,lift:-.5,push:.58,lookSide:.22,lookLift:.24,fov:40,roll:-.018},
  {side:0,lift:.2,push:.18,lookSide:0,lookLift:.04,fov:44,roll:0},
];

function yearTexture(year:string,ghost=false){
  const canvas=document.createElement('canvas');canvas.width=1400;canvas.height=520;
  const ctx=canvas.getContext('2d')!;ctx.clearRect(0,0,canvas.width,canvas.height);
  ctx.textBaseline='alphabetic';ctx.textAlign='left';ctx.font='900 330px Arial, Helvetica, sans-serif';ctx.lineWidth=ghost?5:2;
  if(ghost){ctx.strokeStyle='rgba(122,232,250,.9)';ctx.strokeText(year,32,375)}
  else{ctx.fillStyle='#eafcff';ctx.fillText(year,32,375);ctx.fillStyle='rgba(117,229,255,.2)';ctx.fillRect(0,430,canvas.width,2);ctx.font='700 27px Arial, Helvetica, sans-serif';ctx.letterSpacing='9px';ctx.fillStyle='#72e6ff';ctx.fillText('OCCU-MED ARCHIVE',40,484)}
  const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;texture.needsUpdate=true;return texture;
}

function clamp(value:number,min=0,max=1){return Math.max(min,Math.min(max,value))}
function smooth(value:number){const t=clamp(value);return t*t*(3-2*t)}
function mix(a:number,b:number,t:number){return a+(b-a)*t}
function beatFor(index:number){return CAMERA_BEATS[Math.min(CAMERA_BEATS.length-1,Math.max(0,index))]??CAMERA_BEATS[0]}

export default function HistoryWorld({progress,milestones}:{progress:number;milestones:readonly Milestone[]}){
  const host=useRef<HTMLDivElement>(null);const value=useRef(progress);value.current=progress;

  useEffect(()=>{
    const el=host.current;if(!el)return;
    const scene=new THREE.Scene();scene.background=new THREE.Color(0x02070c);scene.fog=new THREE.Fog(0x02070c,7,68);
    const camera=new THREE.PerspectiveCamera(45,el.clientWidth/el.clientHeight,.1,180);camera.position.set(0,.4,8.5);
    const renderer=new THREE.WebGLRenderer({antialias:true,powerPreference:'high-performance'});renderer.setPixelRatio(Math.min(devicePixelRatio,2));renderer.setSize(el.clientWidth,el.clientHeight);renderer.outputColorSpace=THREE.SRGBColorSpace;el.appendChild(renderer.domElement);
    scene.add(new THREE.HemisphereLight(0xa8eaff,0x05090d,.92));
    const cyan=new THREE.PointLight(0x4cddff,34,35);cyan.position.set(4,3,4);scene.add(cyan);
    const violet=new THREE.PointLight(0x7154ff,24,30);violet.position.set(-5,-2,-8);scene.add(violet);
    const gold=new THREE.PointLight(0xd8a457,10,20);gold.position.set(0,2,0);scene.add(gold);

    const count=Math.max(2,milestones.length);
    const pathPoints=Array.from({length:count},(_,i)=>new THREE.Vector3(Math.sin(i*.82)*2.15,Math.cos(i*.61)*.78,8.5-i*9.1));
    const path=new THREE.CatmullRomCurve3(pathPoints,false,'catmullrom',.48);
    const loader=new THREE.TextureLoader();const exhibits:Exhibit[]=[];const disposables:Array<THREE.Material|THREE.BufferGeometry|THREE.Texture>=[];

    milestones.forEach((item,i)=>{
      const t=count===1?0:i/(count-1);const center=path.getPoint(t);const tangent=path.getTangent(t).normalize();const side=i%2===0?-1:1;
      const lateral=new THREE.Vector3(-tangent.z*.42,0,tangent.x*.42).normalize().multiplyScalar(side*(2.65+(i%3)*.35));
      const anchor=center.clone().add(lateral).add(tangent.clone().multiplyScalar(-4.4));
      const group=new THREE.Group();group.position.copy(anchor);

      const photoTexture=loader.load('/photos/'+encodeURIComponent(item.image));photoTexture.colorSpace=THREE.SRGBColorSpace;
      const photoMaterial=new THREE.MeshBasicMaterial({map:photoTexture,transparent:true,opacity:.28,side:THREE.DoubleSide,depthWrite:false});
      const photoGeometry=new THREE.PlaneGeometry(5.15,3.32);const photo=new THREE.Mesh(photoGeometry,photoMaterial);photo.rotation.y=side*-.18;photo.position.set(side*.35,-.05,.1);group.add(photo);disposables.push(photoGeometry,photoMaterial,photoTexture);

      const edgeMaterial=new THREE.LineBasicMaterial({color:i%3===0?0xb18cff:0x72e6ff,transparent:true,opacity:.24});
      const edgeGeometry=new THREE.EdgesGeometry(new THREE.BoxGeometry(5.3,3.47,.08));const edge=new THREE.LineSegments(edgeGeometry,edgeMaterial);edge.rotation.y=photo.rotation.y;edge.position.copy(photo.position);group.add(edge);disposables.push(edgeGeometry,edgeMaterial);

      const frameMaterial=new THREE.MeshBasicMaterial({color:i%3===0?0xb18cff:0x72e6ff,transparent:true,opacity:.16,blending:THREE.AdditiveBlending});
      const frame=new THREE.Mesh(new THREE.TorusGeometry(3.18,.016,8,120),frameMaterial);frame.rotation.set(Math.PI/2,.08*i,i*.37);frame.position.z=-.55;group.add(frame);disposables.push(frame.geometry,frameMaterial);

      const yearMap=yearTexture(item.year);const labelMaterial=new THREE.MeshBasicMaterial({map:yearMap,transparent:true,opacity:.35,depthWrite:false,side:THREE.DoubleSide});
      const labelGeometry=new THREE.PlaneGeometry(5.8,2.15);const label=new THREE.Mesh(labelGeometry,labelMaterial);label.position.set(-side*3.35,1.7,-.7);label.rotation.y=side*.14;group.add(label);disposables.push(yearMap,labelMaterial,labelGeometry);

      const ghostMap=yearTexture(item.year,true);const ghostMaterial=new THREE.MeshBasicMaterial({map:ghostMap,transparent:true,opacity:.02,depthWrite:false,side:THREE.DoubleSide,blending:THREE.AdditiveBlending});
      const ghostGeometry=new THREE.PlaneGeometry(11.5,4.25);const ghost=new THREE.Mesh(ghostGeometry,ghostMaterial);ghost.position.set(-side*.7,.25,-3.6);ghost.rotation.y=side*.05;group.add(ghost);disposables.push(ghostMap,ghostMaterial,ghostGeometry);

      const markerMaterial=new THREE.MeshBasicMaterial({color:0xdafaff});const marker=new THREE.Mesh(new THREE.SphereGeometry(.085,12,12),markerMaterial);marker.position.set(-side*.4,0,.9);group.add(marker);disposables.push(marker.geometry,markerMaterial);
      const stalkMaterial=new THREE.LineBasicMaterial({color:0x62dff5,transparent:true,opacity:.18});const stalkGeometry=new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(-side*.4,0,.9),lateral.clone().multiplyScalar(-.7)]);group.add(new THREE.Line(stalkGeometry,stalkMaterial));disposables.push(stalkGeometry,stalkMaterial);

      group.lookAt(center.clone().add(tangent.clone().multiplyScalar(-7)));scene.add(group);exhibits.push({group,photo,label,ghost,frame,edge,anchor});
    });

    const pathSamples=path.getPoints(220);const railGeo=new THREE.BufferGeometry().setFromPoints(pathSamples);const railMat=new THREE.LineBasicMaterial({color:0x3bc8e9,transparent:true,opacity:.28});scene.add(new THREE.Line(railGeo,railMat));disposables.push(railGeo,railMat);
    const secondaryGeo=new THREE.BufferGeometry().setFromPoints(pathSamples.map((point,i)=>point.clone().add(new THREE.Vector3(Math.sin(i*.23)*.22,.42,0))));const secondaryMat=new THREE.LineBasicMaterial({color:0x785aff,transparent:true,opacity:.09});scene.add(new THREE.Line(secondaryGeo,secondaryMat));disposables.push(secondaryGeo,secondaryMat);

    const chambers=new THREE.Group();
    milestones.forEach((_,i)=>{
      const t=i/(count-1);const center=path.getPoint(t);const tangent=path.getTangent(t).normalize();
      const gateMaterial=new THREE.LineBasicMaterial({color:i%3===0?0xb18cff:0x5ddff4,transparent:true,opacity:.08});
      const gateGeometry=new THREE.EdgesGeometry(new THREE.BoxGeometry(11.4,6.7,.12));const gate=new THREE.LineSegments(gateGeometry,gateMaterial);gate.position.copy(center.clone().add(tangent.clone().multiplyScalar(-5.8)));gate.quaternion.setFromUnitVectors(new THREE.Vector3(0,0,-1),tangent);chambers.add(gate);disposables.push(gateGeometry,gateMaterial);
      const floorMaterial=new THREE.MeshBasicMaterial({color:0x64e1f4,transparent:true,opacity:.055,side:THREE.DoubleSide,blending:THREE.AdditiveBlending});
      const floorRing=new THREE.Mesh(new THREE.RingGeometry(1.1,3.8,80),floorMaterial);floorRing.position.copy(center.clone().add(new THREE.Vector3(0,-2.4,-3)));floorRing.rotation.x=-Math.PI/2;chambers.add(floorRing);disposables.push(floorRing.geometry,floorMaterial);
    });
    scene.add(chambers);

    const dustGeo=new THREE.BufferGeometry();const dust=new Float32Array(4500);for(let i=0;i<dust.length;i+=3){dust[i]=(Math.random()-.5)*22;dust[i+1]=(Math.random()-.5)*13;dust[i+2]=12-Math.random()*milestones.length*10.5}dustGeo.setAttribute('position',new THREE.BufferAttribute(dust,3));const dustMat=new THREE.PointsMaterial({color:0x7be7ff,size:.032,transparent:true,opacity:.52,depthWrite:false});const dustField=new THREE.Points(dustGeo,dustMat);scene.add(dustField);disposables.push(dustGeo,dustMat);

    const ribbons=new THREE.Group();for(let i=0;i<18;i++){const t=(i+.5)/18;const point=path.getPoint(t);const tangent=path.getTangent(t);const material=new THREE.MeshBasicMaterial({color:i%2?0x6d55ff:0x49d8f4,transparent:true,opacity:.065,side:THREE.DoubleSide,blending:THREE.AdditiveBlending});const ring=new THREE.Mesh(new THREE.TorusGeometry(4.2+(i%3)*.42,.012,6,96),material);ring.position.copy(point);ring.quaternion.setFromUnitVectors(new THREE.Vector3(0,0,-1),tangent);ring.rotateZ(i*.41);ribbons.add(ring);disposables.push(ring.geometry,material)}scene.add(ribbons);

    let raf=0;const clock=new THREE.Clock();let smoothProgress=0;
    const right=new THREE.Vector3(),lookRight=new THREE.Vector3(),lookTarget=new THREE.Vector3();
    const draw=()=>{
      raf=requestAnimationFrame(draw);const time=clock.getElapsedTime();smoothProgress+=(value.current-smoothProgress)*.07;const p=clamp(smoothProgress,0,.997);const position=path.getPoint(p),ahead=path.getPoint(clamp(p+.026,0,1)),tangent=path.getTangent(p).normalize();
      const milestoneFloat=p*Math.max(1,milestones.length-1);const beatAIndex=Math.floor(milestoneFloat),beatBIndex=Math.min(milestones.length-1,beatAIndex+1),beatMix=smooth(milestoneFloat-beatAIndex);const beatA=beatFor(beatAIndex),beatB=beatFor(beatBIndex);
      const side=mix(beatA.side,beatB.side,beatMix),lift=mix(beatA.lift,beatB.lift,beatMix),push=mix(beatA.push,beatB.push,beatMix),lookSide=mix(beatA.lookSide,beatB.lookSide,beatMix),lookLift=mix(beatA.lookLift,beatB.lookLift,beatMix),fov=mix(beatA.fov,beatB.fov,beatMix),roll=mix(beatA.roll,beatB.roll,beatMix);
      right.set(-tangent.z,0,tangent.x).normalize();lookRight.copy(right);
      camera.position.copy(position).addScaledVector(right,side).addScaledVector(tangent,push);camera.position.y+=lift+Math.sin(p*Math.PI*9)*.08;
      lookTarget.copy(ahead).addScaledVector(lookRight,lookSide);lookTarget.y+=lookLift;camera.lookAt(lookTarget);camera.rotation.z+=((roll+Math.sin(p*Math.PI*8)*.006)-camera.rotation.z)*.08;camera.fov+=(fov-camera.fov)*.075;camera.updateProjectionMatrix();
      exhibits.forEach((exhibit,i)=>{
        const distance=Math.abs(milestoneFloat-i),focus=clamp(1-distance,0,1),near=clamp(1-distance*.45,0,1),targetScale=1+focus*.18;
        exhibit.group.scale.lerp(new THREE.Vector3(targetScale,targetScale,targetScale),.075);exhibit.group.position.y=exhibit.anchor.y+Math.sin(time*.35+i)*.075;exhibit.group.rotation.z=Math.sin(time*.27+i)*.01;
        exhibit.photo.position.z=.1+focus*.34;exhibit.photo.material.opacity+=(.12+near*.72-exhibit.photo.material.opacity)*.08;
        exhibit.label.material.opacity+=(.12+focus*.88-exhibit.label.material.opacity)*.09;exhibit.ghost.material.opacity+=(.015+focus*.22-exhibit.ghost.material.opacity)*.08;
        exhibit.ghost.scale.setScalar(.96+focus*.13);(exhibit.frame.material as THREE.MeshBasicMaterial).opacity=.06+near*.28;(exhibit.edge.material as THREE.LineBasicMaterial).opacity=.08+focus*.54;
        exhibit.frame.rotation.z+=i%2?.0014:-.0012;
      });
      cyan.position.copy(position).add(new THREE.Vector3(4,3,5));violet.position.copy(position).add(new THREE.Vector3(-5,-2,-8));gold.position.copy(position).add(new THREE.Vector3(Math.sin(milestoneFloat)*2.4,1.7,-1));
      dustField.position.z=tangent.z*p*1.5;dustField.rotation.z=time*.006;ribbons.rotation.z=Math.sin(time*.09)*.018;renderer.render(scene,camera);
    };draw();

    const resize=()=>{camera.aspect=el.clientWidth/el.clientHeight;camera.updateProjectionMatrix();renderer.setSize(el.clientWidth,el.clientHeight)};window.addEventListener('resize',resize);
    return()=>{cancelAnimationFrame(raf);window.removeEventListener('resize',resize);disposables.forEach(item=>item.dispose());renderer.dispose();if(renderer.domElement.parentNode===el)el.removeChild(renderer.domElement)};
  },[milestones]);

  return <div ref={host} style={{position:'fixed',inset:0}} aria-hidden="true"/>;
}
