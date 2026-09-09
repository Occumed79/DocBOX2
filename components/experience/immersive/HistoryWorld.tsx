'use client';

import { useEffect, useRef } from 'react';
import * as THREE from 'three';

type Milestone = { year:string; image:string };

function yearTexture(year:string){
  const canvas=document.createElement('canvas');
  canvas.width=1200;canvas.height=420;
  const ctx=canvas.getContext('2d')!;
  ctx.clearRect(0,0,canvas.width,canvas.height);
  ctx.fillStyle='rgba(117,229,255,.18)';
  ctx.fillRect(0,352,canvas.width,2);
  ctx.font='900 260px Arial, Helvetica, sans-serif';
  ctx.textBaseline='alphabetic';
  ctx.letterSpacing='-14px';
  ctx.fillStyle='#eafcff';
  ctx.fillText(year,30,300);
  ctx.font='700 28px Arial, Helvetica, sans-serif';
  ctx.letterSpacing='8px';
  ctx.fillStyle='#72e6ff';
  ctx.fillText('OCCU-MED ARCHIVE',38,390);
  const texture=new THREE.CanvasTexture(canvas);
  texture.colorSpace=THREE.SRGBColorSpace;
  texture.needsUpdate=true;
  return texture;
}

export default function HistoryWorld({progress,milestones}:{progress:number;milestones:readonly Milestone[]}){
  const host=useRef<HTMLDivElement>(null);
  const value=useRef(progress);value.current=progress;

  useEffect(()=>{
    const el=host.current;if(!el)return;
    const scene=new THREE.Scene();
    scene.background=new THREE.Color(0x02070c);
    scene.fog=new THREE.Fog(0x02070c,8,58);
    const camera=new THREE.PerspectiveCamera(46,el.clientWidth/el.clientHeight,.1,140);
    camera.position.set(0,.4,7.5);
    const renderer=new THREE.WebGLRenderer({antialias:true,powerPreference:'high-performance'});
    renderer.setPixelRatio(Math.min(devicePixelRatio,2));renderer.setSize(el.clientWidth,el.clientHeight);renderer.outputColorSpace=THREE.SRGBColorSpace;el.appendChild(renderer.domElement);

    scene.add(new THREE.AmbientLight(0xa8eaff,.9));
    const cyan=new THREE.PointLight(0x4cddff,34,35);cyan.position.set(4,3,4);scene.add(cyan);
    const violet=new THREE.PointLight(0x7154ff,24,30);violet.position.set(-5,-2,-8);scene.add(violet);

    const loader=new THREE.TextureLoader();
    const groups:THREE.Group[]=[];
    const disposables:Array<THREE.Material|THREE.BufferGeometry|THREE.Texture>=[];

    milestones.forEach((item,i)=>{
      const group=new THREE.Group();
      const side=i%2===0?-1:1;
      group.position.set(side*2.25,Math.sin(i*.82)*.75,-i*8.2);

      const photoMaterial=new THREE.MeshBasicMaterial({map:loader.load('/photos/'+encodeURIComponent(item.image)),transparent:true,opacity:.86,side:THREE.DoubleSide,depthWrite:false});
      const photoGeometry=new THREE.PlaneGeometry(5.1,3.3);
      const photo=new THREE.Mesh(photoGeometry,photoMaterial);
      photo.position.x=side*.55;photo.rotation.y=side*-.26;group.add(photo);
      disposables.push(photoGeometry,photoMaterial,photoMaterial.map!);

      const frame=new THREE.Mesh(new THREE.TorusGeometry(3.05,.02,8,120),new THREE.MeshBasicMaterial({color:i%3===0?0xb18cff:0x72e6ff,transparent:true,opacity:.38}));
      frame.rotation.x=Math.PI/2;frame.rotation.z=i*.37;group.add(frame);
      disposables.push(frame.geometry,frame.material as THREE.Material);

      const texture=yearTexture(item.year);
      const labelMaterial=new THREE.MeshBasicMaterial({map:texture,transparent:true,depthWrite:false,side:THREE.DoubleSide});
      const labelGeometry=new THREE.PlaneGeometry(5.8,2.03);
      const label=new THREE.Mesh(labelGeometry,labelMaterial);
      label.position.set(-side*3.4,1.55,-.4);label.rotation.y=side*.12;group.add(label);
      disposables.push(texture,labelMaterial,labelGeometry);

      const marker=new THREE.Mesh(new THREE.SphereGeometry(.08,12,12),new THREE.MeshBasicMaterial({color:0xdafaff}));marker.position.set(0,0,1.2);group.add(marker);disposables.push(marker.geometry,marker.material as THREE.Material);
      scene.add(group);groups.push(group);
    });

    const railPoints=milestones.map((_,i)=>new THREE.Vector3(0,0,-i*8.2));
    const railGeo=new THREE.BufferGeometry().setFromPoints(railPoints);
    const railMat=new THREE.LineBasicMaterial({color:0x3bc8e9,transparent:true,opacity:.38});
    scene.add(new THREE.Line(railGeo,railMat));disposables.push(railGeo,railMat);

    const dustGeo=new THREE.BufferGeometry();const dust=new Float32Array(3000);
    for(let i=0;i<dust.length;i+=3){dust[i]=(Math.random()-.5)*18;dust[i+1]=(Math.random()-.5)*12;dust[i+2]=8-Math.random()*milestones.length*9}
    dustGeo.setAttribute('position',new THREE.BufferAttribute(dust,3));
    const dustMat=new THREE.PointsMaterial({color:0x7be7ff,size:.035,transparent:true,opacity:.62,depthWrite:false});
    const dustField=new THREE.Points(dustGeo,dustMat);scene.add(dustField);disposables.push(dustGeo,dustMat);

    const tunnel=new THREE.Group();
    for(let i=0;i<12;i++){
      const ring=new THREE.Mesh(new THREE.TorusGeometry(4.7+(i%3)*.35,.018,6,100),new THREE.MeshBasicMaterial({color:i%2?0x6d55ff:0x49d8f4,transparent:true,opacity:.11}));
      ring.position.z=-i*7;ring.rotation.set(Math.PI/2+i*.015,i*.05,i*.23);tunnel.add(ring);disposables.push(ring.geometry,ring.material as THREE.Material);
    }
    scene.add(tunnel);

    let raf=0;const clock=new THREE.Clock();
    const draw=()=>{
      raf=requestAnimationFrame(draw);
      const t=clock.getElapsedTime();
      const travel=value.current*Math.max(0,milestones.length-1)*8.2;
      camera.position.z=7.5-travel;
      camera.position.x=Math.sin(value.current*Math.PI*6)*.72;
      camera.position.y=.35+Math.cos(value.current*Math.PI*4)*.32;
      camera.rotation.z=Math.sin(value.current*Math.PI*5)*.018;
      camera.lookAt(Math.sin(value.current*Math.PI*2)*.2,0,camera.position.z-7);
      groups.forEach((group,i)=>{
        const focus=Math.abs((travel/8.2)-i);
        const scale=1+Math.max(0,1-focus)*.09;
        group.scale.lerp(new THREE.Vector3(scale,scale,scale),.08);
        group.rotation.z=Math.sin(t*.35+i)*.012;
        group.position.y=Math.sin(i*.82)*.75+Math.sin(t*.28+i)*.08;
      });
      dustField.position.z=-travel*.05;
      dustField.rotation.z=t*.008;
      tunnel.rotation.z=t*.006;
      renderer.render(scene,camera);
    };
    draw();

    const resize=()=>{camera.aspect=el.clientWidth/el.clientHeight;camera.updateProjectionMatrix();renderer.setSize(el.clientWidth,el.clientHeight)};
    addEventListener('resize',resize);
    return()=>{
      cancelAnimationFrame(raf);removeEventListener('resize',resize);
      disposables.forEach(item=>item.dispose());renderer.dispose();if(renderer.domElement.parentNode===el)el.removeChild(renderer.domElement);
    };
  },[milestones]);

  return <div ref={host} style={{position:'fixed',inset:0}} aria-hidden="true"/>;
}
