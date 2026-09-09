'use client';

import { useEffect, useRef } from 'react';
import * as THREE from 'three';

type Milestone = { year:string; image:string };

type Exhibit = {
  group:THREE.Group;
  photo:THREE.Mesh<THREE.PlaneGeometry,THREE.MeshBasicMaterial>;
  label:THREE.Mesh<THREE.PlaneGeometry,THREE.MeshBasicMaterial>;
  frame:THREE.Mesh;
  anchor:THREE.Vector3;
};

function yearTexture(year:string){
  const canvas=document.createElement('canvas');
  canvas.width=1200;canvas.height=420;
  const ctx=canvas.getContext('2d')!;
  ctx.clearRect(0,0,canvas.width,canvas.height);
  ctx.fillStyle='rgba(117,229,255,.18)';ctx.fillRect(0,352,canvas.width,2);
  ctx.font='900 260px Arial, Helvetica, sans-serif';ctx.textBaseline='alphabetic';ctx.letterSpacing='-14px';ctx.fillStyle='#eafcff';ctx.fillText(year,30,300);
  ctx.font='700 28px Arial, Helvetica, sans-serif';ctx.letterSpacing='8px';ctx.fillStyle='#72e6ff';ctx.fillText('OCCU-MED ARCHIVE',38,390);
  const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;texture.needsUpdate=true;return texture;
}

function clamp(value:number,min=0,max=1){return Math.max(min,Math.min(max,value))}

export default function HistoryWorld({progress,milestones}:{progress:number;milestones:readonly Milestone[]}){
  const host=useRef<HTMLDivElement>(null);const value=useRef(progress);value.current=progress;

  useEffect(()=>{
    const el=host.current;if(!el)return;
    const scene=new THREE.Scene();scene.background=new THREE.Color(0x02070c);scene.fog=new THREE.Fog(0x02070c,7,62);
    const camera=new THREE.PerspectiveCamera(45,el.clientWidth/el.clientHeight,.1,160);camera.position.set(0,.4,8.5);
    const renderer=new THREE.WebGLRenderer({antialias:true,powerPreference:'high-performance'});renderer.setPixelRatio(Math.min(devicePixelRatio,2));renderer.setSize(el.clientWidth,el.clientHeight);renderer.outputColorSpace=THREE.SRGBColorSpace;el.appendChild(renderer.domElement);
    scene.add(new THREE.HemisphereLight(0xa8eaff,0x05090d,.92));const cyan=new THREE.PointLight(0x4cddff,34,35);cyan.position.set(4,3,4);scene.add(cyan);const violet=new THREE.PointLight(0x7154ff,24,30);violet.position.set(-5,-2,-8);scene.add(violet);

    const count=Math.max(2,milestones.length);
    const pathPoints=Array.from({length:count},(_,i)=>new THREE.Vector3(
      Math.sin(i*.82)*2.15,
      Math.cos(i*.61)*.78,
      8.5-i*9.1
    ));
    const path=new THREE.CatmullRomCurve3(pathPoints,false,'catmullrom',.48);
    const loader=new THREE.TextureLoader();const exhibits:Exhibit[]=[];const disposables:Array<THREE.Material|THREE.BufferGeometry|THREE.Texture>=[];

    milestones.forEach((item,i)=>{
      const t=count===1?0:i/(count-1);const center=path.getPoint(t);const tangent=path.getTangent(t).normalize();const side=i%2===0?-1:1;
      const lateral=new THREE.Vector3(-tangent.z*.42,0,tangent.x*.42).normalize().multiplyScalar(side*(2.65+(i%3)*.35));
      const anchor=center.clone().add(lateral).add(tangent.clone().multiplyScalar(-4.4));
      const group=new THREE.Group();group.position.copy(anchor);

      const photoTexture=loader.load('/photos/'+encodeURIComponent(item.image));photoTexture.colorSpace=THREE.SRGBColorSpace;
      const photoMaterial=new THREE.MeshBasicMaterial({map:photoTexture,transparent:true,opacity:.34,side:THREE.DoubleSide,depthWrite:false});
      const photoGeometry=new THREE.PlaneGeometry(5.15,3.32);const photo=new THREE.Mesh(photoGeometry,photoMaterial);photo.rotation.y=side*-.18;photo.position.set(side*.35,-.05,0);group.add(photo);disposables.push(photoGeometry,photoMaterial,photoTexture);

      const frameMaterial=new THREE.MeshBasicMaterial({color:i%3===0?0xb18cff:0x72e6ff,transparent:true,opacity:.22,blending:THREE.AdditiveBlending});
      const frame=new THREE.Mesh(new THREE.TorusGeometry(3.12,.018,8,120),frameMaterial);frame.rotation.set(Math.PI/2,.08*i,i*.37);frame.position.z=-.35;group.add(frame);disposables.push(frame.geometry,frameMaterial);

      const yearMap=yearTexture(item.year);const labelMaterial=new THREE.MeshBasicMaterial({map:yearMap,transparent:true,opacity:.45,depthWrite:false,side:THREE.DoubleSide});
      const labelGeometry=new THREE.PlaneGeometry(5.8,2.03);const label=new THREE.Mesh(labelGeometry,labelMaterial);label.position.set(-side*3.3,1.62,-.55);label.rotation.y=side*.14;group.add(label);disposables.push(yearMap,labelMaterial,labelGeometry);

      const markerMaterial=new THREE.MeshBasicMaterial({color:0xdafaff});const marker=new THREE.Mesh(new THREE.SphereGeometry(.085,12,12),markerMaterial);marker.position.set(-side*.4,0,.9);group.add(marker);disposables.push(marker.geometry,markerMaterial);
      const stalkMaterial=new THREE.LineBasicMaterial({color:0x62dff5,transparent:true,opacity:.2});const stalkGeometry=new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(-side*.4,0,.9),lateral.clone().multiplyScalar(-.7)]);group.add(new THREE.Line(stalkGeometry,stalkMaterial));disposables.push(stalkGeometry,stalkMaterial);

      group.lookAt(center.clone().add(tangent.clone().multiplyScalar(-7)));scene.add(group);exhibits.push({group,photo,label,frame,anchor});
    });

    const pathSamples=path.getPoints(220);const railGeo=new THREE.BufferGeometry().setFromPoints(pathSamples);const railMat=new THREE.LineBasicMaterial({color:0x3bc8e9,transparent:true,opacity:.28});scene.add(new THREE.Line(railGeo,railMat));disposables.push(railGeo,railMat);
    const secondaryGeo=new THREE.BufferGeometry().setFromPoints(pathSamples.map((point,i)=>point.clone().add(new THREE.Vector3(Math.sin(i*.23)*.22,.42,0))));const secondaryMat=new THREE.LineBasicMaterial({color:0x785aff,transparent:true,opacity:.09});scene.add(new THREE.Line(secondaryGeo,secondaryMat));disposables.push(secondaryGeo,secondaryMat);

    const dustGeo=new THREE.BufferGeometry();const dust=new Float32Array(4500);for(let i=0;i<dust.length;i+=3){dust[i]=(Math.random()-.5)*22;dust[i+1]=(Math.random()-.5)*13;dust[i+2]=12-Math.random()*milestones.length*10.5}dustGeo.setAttribute('position',new THREE.BufferAttribute(dust,3));const dustMat=new THREE.PointsMaterial({color:0x7be7ff,size:.032,transparent:true,opacity:.52,depthWrite:false});const dustField=new THREE.Points(dustGeo,dustMat);scene.add(dustField);disposables.push(dustGeo,dustMat);

    const ribbons=new THREE.Group();for(let i=0;i<18;i++){const t=(i+.5)/18;const point=path.getPoint(t);const tangent=path.getTangent(t);const material=new THREE.MeshBasicMaterial({color:i%2?0x6d55ff:0x49d8f4,transparent:true,opacity:.075,side:THREE.DoubleSide,blending:THREE.AdditiveBlending});const ring=new THREE.Mesh(new THREE.TorusGeometry(4.2+(i%3)*.42,.012,6,96),material);ring.position.copy(point);ring.quaternion.setFromUnitVectors(new THREE.Vector3(0,0,-1),tangent);ring.rotateZ(i*.41);ribbons.add(ring);disposables.push(ring.geometry,material)}scene.add(ribbons);

    let raf=0;const clock=new THREE.Clock();let smoothProgress=0;
    const draw=()=>{
      raf=requestAnimationFrame(draw);const time=clock.getElapsedTime();smoothProgress+=(value.current-smoothProgress)*.07;const p=clamp(smoothProgress,0,.997);const position=path.getPoint(p),ahead=path.getPoint(clamp(p+.026,0,1)),tangent=path.getTangent(p);
      camera.position.copy(position);camera.position.y+=Math.sin(p*Math.PI*9)*.18;camera.position.x+=Math.cos(p*Math.PI*7)*.18;camera.lookAt(ahead);camera.rotation.z=Math.sin(p*Math.PI*8)*.025;camera.fov=45-Math.sin(p*Math.PI)*4;camera.updateProjectionMatrix();
      const milestoneFloat=p*Math.max(1,milestones.length-1);
      exhibits.forEach((exhibit,i)=>{
        const distance=Math.abs(milestoneFloat-i),focus=clamp(1-distance,0,1),near=clamp(1-distance*.45,0,1);const targetScale=1+focus*.16;
        exhibit.group.scale.lerp(new THREE.Vector3(targetScale,targetScale,targetScale),.075);exhibit.group.position.y=exhibit.anchor.y+Math.sin(time*.35+i)*.075;exhibit.group.rotation.z=Math.sin(time*.27+i)*.01;
        exhibit.photo.material.opacity+=(.18+near*.66-exhibit.photo.material.opacity)*.08;exhibit.label.material.opacity+=(.18+focus*.82-exhibit.label.material.opacity)*.09;
        (exhibit.frame.material as THREE.MeshBasicMaterial).opacity=.09+near*.3;exhibit.frame.rotation.z+=i%2?.0014:-.0012;
      });
      cyan.position.copy(position).add(new THREE.Vector3(4,3,5));violet.position.copy(position).add(new THREE.Vector3(-5,-2,-8));dustField.position.z=tangent.z*p*1.5;dustField.rotation.z=time*.006;ribbons.rotation.z=Math.sin(time*.09)*.018;renderer.render(scene,camera);
    };draw();

    const resize=()=>{camera.aspect=el.clientWidth/el.clientHeight;camera.updateProjectionMatrix();renderer.setSize(el.clientWidth,el.clientHeight)};window.addEventListener('resize',resize);
    return()=>{cancelAnimationFrame(raf);window.removeEventListener('resize',resize);disposables.forEach(item=>item.dispose());renderer.dispose();if(renderer.domElement.parentNode===el)el.removeChild(renderer.domElement)};
  },[milestones]);

  return <div ref={host} style={{position:'fixed',inset:0}} aria-hidden="true"/>;
}
