'use client';

import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { tryCreateCinematicRenderer } from './rendererQuality';

type Milestone = { year:string; image:string };
type NodeVisual = {
  group:THREE.Group;
  year:THREE.Mesh<THREE.PlaneGeometry,THREE.MeshBasicMaterial>;
  photo:THREE.Mesh<THREE.PlaneGeometry,THREE.MeshBasicMaterial>;
  halo:THREE.Points<THREE.BufferGeometry,THREE.PointsMaterial>;
  orb:THREE.Mesh<THREE.IcosahedronGeometry,THREE.MeshBasicMaterial>;
  x:number;
};

const clamp=(v:number,min=0,max=1)=>Math.max(min,Math.min(max,v));
const mix=(a:number,b:number,t:number)=>a+(b-a)*t;

function yearTexture(year:string){
  const canvas=document.createElement('canvas');
  canvas.width=1600;canvas.height=620;
  const ctx=canvas.getContext('2d')!;
  ctx.clearRect(0,0,canvas.width,canvas.height);
  ctx.textBaseline='middle';ctx.textAlign='center';
  ctx.font=`800 ${year==='TODAY'?220:360}px Arial, Helvetica, sans-serif`;
  ctx.fillStyle='#ffffff';
  ctx.fillText(year,canvas.width/2,canvas.height/2-12);
  const texture=new THREE.CanvasTexture(canvas);
  texture.colorSpace=THREE.SRGBColorSpace;
  texture.needsUpdate=true;
  return texture;
}

function particleCloud(count:number,radius:number,stretch=1){
  const geometry=new THREE.BufferGeometry();
  const data=new Float32Array(count*3);
  for(let i=0;i<count;i++){
    const u=Math.random(),v=Math.random();
    const theta=u*Math.PI*2,phi=Math.acos(2*v-1);
    const r=radius*(.22+Math.pow(Math.random(),.42)*.78);
    data[i*3]=Math.sin(phi)*Math.cos(theta)*r*stretch;
    data[i*3+1]=Math.cos(phi)*r;
    data[i*3+2]=Math.sin(phi)*Math.sin(theta)*r*.65;
  }
  geometry.setAttribute('position',new THREE.BufferAttribute(data,3));
  return geometry;
}

export default function HistoryWorld({progress,milestones}:{progress:number;milestones:readonly Milestone[]}){
  const host=useRef<HTMLDivElement>(null);
  const value=useRef(progress);value.current=progress;

  useEffect(()=>{
    const el=host.current;if(!el)return;
    const scene=new THREE.Scene();
    scene.background=new THREE.Color(0x07142d);
    scene.fog=new THREE.FogExp2(0x08132c,.018);
    const camera=new THREE.PerspectiveCamera(42,Math.max(1,el.clientWidth)/Math.max(1,el.clientHeight),.1,220);
    camera.position.set(0,.2,11.5);
    const renderer=tryCreateCinematicRenderer({antialias:true,alpha:false,powerPreference:'high-performance'},{exposure:1.08});
    if(!renderer){el.dataset.webgl='unavailable';return}
    renderer.setSize(el.clientWidth,el.clientHeight);el.appendChild(renderer.domElement);

    const disposables:Array<THREE.Material|THREE.BufferGeometry|THREE.Texture>=[];
    const nodes:NodeVisual[]=[];
    const spacing=13.5;
    const lastX=Math.max(1,milestones.length-1)*spacing;

    const ambient=new THREE.HemisphereLight(0xdceeff,0x170b3d,.65);scene.add(ambient);
    const blue=new THREE.PointLight(0x2479ff,34,38);blue.position.set(3,4,7);scene.add(blue);
    const violet=new THREE.PointLight(0x7c42ff,28,34);violet.position.set(-4,-2,3);scene.add(violet);

    // Continuous Nasdaq-like particle universe.
    const fieldGeo=new THREE.BufferGeometry();
    const fieldCount=6200,fieldData=new Float32Array(fieldCount*3);
    for(let i=0;i<fieldCount;i++){
      fieldData[i*3]=Math.random()*(lastX+30)-14;
      fieldData[i*3+1]=(Math.random()-.5)*17;
      fieldData[i*3+2]=-5-Math.random()*24;
    }
    fieldGeo.setAttribute('position',new THREE.BufferAttribute(fieldData,3));
    const fieldMat=new THREE.PointsMaterial({color:0xa9cfff,size:.028,transparent:true,opacity:.64,depthWrite:false,blending:THREE.AdditiveBlending});
    const field=new THREE.Points(fieldGeo,fieldMat);scene.add(field);disposables.push(fieldGeo,fieldMat);

    // Timeline spine and small chronological points.
    const railPoints:Array<THREE.Vector3>=[];
    for(let i=0;i<360;i++){const t=i/359;railPoints.push(new THREE.Vector3(t*lastX,-2.72,Math.sin(t*Math.PI*5)*.08))}
    const railGeo=new THREE.BufferGeometry().setFromPoints(railPoints);
    const railMat=new THREE.LineBasicMaterial({color:0x79a8ff,transparent:true,opacity:.28,blending:THREE.AdditiveBlending});
    scene.add(new THREE.Line(railGeo,railMat));disposables.push(railGeo,railMat);

    milestones.forEach((item,i)=>{
      const x=i*spacing;
      const side=i%2===0?-1:1;
      const group=new THREE.Group();group.position.set(x,side*.42,0);scene.add(group);

      const yearMap=yearTexture(item.year);
      const yearMat=new THREE.MeshBasicMaterial({map:yearMap,transparent:true,opacity:.18,depthWrite:false,side:THREE.DoubleSide,blending:THREE.AdditiveBlending});
      const yearGeo=new THREE.PlaneGeometry(item.year==='TODAY'?7.8:7.2,item.year==='TODAY'?3.05:2.8);
      const year=new THREE.Mesh(yearGeo,yearMat);year.position.set(0,1.85,-2.6);group.add(year);disposables.push(yearMap,yearMat,yearGeo);

      const texture=new THREE.TextureLoader().load('/photos/'+encodeURIComponent(item.image));texture.colorSpace=THREE.SRGBColorSpace;
      const photoMat=new THREE.MeshBasicMaterial({map:texture,transparent:true,opacity:.12,side:THREE.DoubleSide,depthWrite:false});
      const photoGeo=new THREE.PlaneGeometry(4.6,3.05);
      const photo=new THREE.Mesh(photoGeo,photoMat);photo.position.set(side*3.25,-.05,-.75);photo.rotation.y=-side*.18;group.add(photo);disposables.push(texture,photoMat,photoGeo);

      const haloGeo=particleCloud(620,2.5,1.55);
      const haloMat=new THREE.PointsMaterial({color:i%3===0?0xb58cff:0xdceeff,size:.035,transparent:true,opacity:.2,depthWrite:false,blending:THREE.AdditiveBlending});
      const halo=new THREE.Points(haloGeo,haloMat);halo.position.set(-side*.9,.2,-1.2);group.add(halo);disposables.push(haloGeo,haloMat);

      const orbGeo=new THREE.IcosahedronGeometry(.34,2);
      const orbMat=new THREE.MeshBasicMaterial({color:i%3===0?0x825cff:0x5aa9ff,wireframe:true,transparent:true,opacity:.22,blending:THREE.AdditiveBlending});
      const orb=new THREE.Mesh(orbGeo,orbMat);orb.position.set(0,-2.72,.12);group.add(orb);disposables.push(orbGeo,orbMat);

      const ringMat=new THREE.MeshBasicMaterial({color:0x94bdff,transparent:true,opacity:.1,side:THREE.DoubleSide,blending:THREE.AdditiveBlending});
      const ring=new THREE.Mesh(new THREE.RingGeometry(.5,.515,72),ringMat);ring.position.set(0,-2.72,.1);group.add(ring);disposables.push(ring.geometry,ringMat);

      nodes.push({group,year,photo,halo,orb,x});
    });

    // A few floating data-like sculptures make the space feel like a virtual exhibition.
    const sculptures=new THREE.Group();
    for(let i=0;i<14;i++){
      const mat=new THREE.MeshBasicMaterial({color:i%3===0?0x744cff:0x2f8dff,wireframe:true,transparent:true,opacity:.08,blending:THREE.AdditiveBlending});
      const geo=i%2===0?new THREE.TorusKnotGeometry(.5,.035,76,8,2,3):new THREE.OctahedronGeometry(.58,1);
      const mesh=new THREE.Mesh(geo,mat);mesh.position.set((i+.45)/(14.9)*lastX,(i%4-1.5)*1.9,-4.5-(i%3)*2.1);mesh.rotation.set(i*.28,i*.45,i*.19);sculptures.add(mesh);disposables.push(geo,mat);
    }
    scene.add(sculptures);

    let raf=0,smoothProgress=clamp(value.current),clock=new THREE.Clock();
    const target=new THREE.Vector3();
    const draw=()=>{
      raf=requestAnimationFrame(draw);
      const time=clock.getElapsedTime();
      smoothProgress+=(clamp(value.current)-smoothProgress)*.075;
      const p=clamp(smoothProgress);
      const x=p*lastX;
      const milestoneFloat=p*Math.max(1,milestones.length-1);

      camera.position.x+=(x-camera.position.x)*.09;
      camera.position.y+=((Math.sin(p*Math.PI*3)*.32)-camera.position.y)*.055;
      camera.position.z+=((10.8+Math.sin(p*Math.PI*2)*.55)-camera.position.z)*.055;
      target.set(x+1.65,0,-1.1);camera.lookAt(target);
      camera.rotation.z=Math.sin(p*Math.PI*5)*.012;

      nodes.forEach((node,i)=>{
        const distance=Math.abs(milestoneFloat-i);
        const focus=clamp(1-distance,0,1);
        const nearby=clamp(1-distance*.42,0,1);
        node.year.material.opacity+=(.07+focus*.91-node.year.material.opacity)*.08;
        node.year.scale.setScalar(.92+focus*.15);
        node.photo.material.opacity+=(.05+nearby*.72-node.photo.material.opacity)*.08;
        node.photo.position.z=-.75+focus*.7;
        node.photo.rotation.y+=(0-node.photo.rotation.y)*focus*.025;
        node.halo.material.opacity=.06+nearby*.62;
        node.halo.rotation.y+=.0015+(i%3)*.00035;
        node.halo.rotation.z=Math.sin(time*.12+i)*.08;
        node.orb.material.opacity=.12+focus*.72;
        node.orb.rotation.x=time*.25+i;node.orb.rotation.y=time*.32+i*.4;
        node.group.position.y=(i%2===0?-.42:.42)+Math.sin(time*.28+i)*.08;
      });
      field.position.x=x*.025;field.rotation.y=Math.sin(time*.04)*.012;
      sculptures.children.forEach((mesh,i)=>{mesh.rotation.x+=.0007+i*.00001;mesh.rotation.y+=.0011});
      blue.position.set(x+4,4,6);violet.position.set(x-4,-2,3);
      renderer.render(scene,camera);
    };
    draw();

    const resize=()=>{camera.aspect=Math.max(1,el.clientWidth)/Math.max(1,el.clientHeight);camera.updateProjectionMatrix();renderer.setPixelRatio(Math.min(devicePixelRatio||1,2));renderer.setSize(el.clientWidth,el.clientHeight)};
    window.addEventListener('resize',resize);
    return()=>{
      cancelAnimationFrame(raf);window.removeEventListener('resize',resize);
      disposables.forEach(item=>item.dispose());renderer.dispose();renderer.domElement.remove();
    };
  },[milestones]);

  return <div ref={host} style={{position:'fixed',inset:0,zIndex:0}} aria-hidden="true"/>;
}
