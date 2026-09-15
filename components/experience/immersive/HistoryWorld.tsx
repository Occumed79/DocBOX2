'use client';

import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { tryCreateCinematicRenderer } from './rendererQuality';

type Milestone={year:string;major:boolean};
type Marker={group:THREE.Group;year:THREE.Sprite;orbits:THREE.Group;core:THREE.Mesh;major:boolean;x:number};
const clamp=(v:number)=>Math.max(0,Math.min(1,v));

function labelTexture(label:string){
  const canvas=document.createElement('canvas');canvas.width=512;canvas.height=180;
  const ctx=canvas.getContext('2d')!;ctx.font=`700 ${label==='TODAY'?68:92}px Arial`;ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillStyle='white';ctx.fillText(label,256,90);
  const map=new THREE.CanvasTexture(canvas);map.colorSpace=THREE.SRGBColorSpace;return map;
}

/** A shaped centerline shared by the mandoline. Local envelopes create pinch,
 * spread, twist, crests and valleys rather than parallel sine-wave copies. */
function ribbonPoint(t:number,strand:number,lastX:number){
  const x=t*lastX;
  const pinch=.14+.86*(.38+.62*Math.pow(Math.sin(t*Math.PI*3.15+.3),2));
  const spread=1+1.1*Math.exp(-Math.pow((t-.72)/.11,2));
  const u=(strand-15.5)/15.5;
  const twist=t*Math.PI*5.2+u*.7;
  const crest=Math.sin(t*Math.PI*2.25)*1.25+Math.sin(t*Math.PI*7.4+.6)*.34;
  const valley=-1.15*Math.exp(-Math.pow((t-.47)/.085,2));
  const width=2.75*pinch*spread;
  return new THREE.Vector3(x,crest+valley+u*width*Math.cos(twist),-2.8+u*width*.62*Math.sin(twist)-Math.sin(t*Math.PI*4)*.35);
}

export default function HistoryWorld({progress,milestones}:{progress:number;milestones:readonly Milestone[]}){
  const host=useRef<HTMLDivElement>(null),value=useRef(progress);value.current=progress;
  useEffect(()=>{
    const el=host.current;if(!el)return;
    const scene=new THREE.Scene();scene.background=new THREE.Color(0x06152d);scene.fog=new THREE.FogExp2(0x07142c,.012);
    const camera=new THREE.PerspectiveCamera(44,el.clientWidth/el.clientHeight,.1,260);camera.position.set(0,1,12);
    const renderer=tryCreateCinematicRenderer({antialias:true,alpha:false,powerPreference:'high-performance'},{exposure:1.15});if(!renderer){el.dataset.webgl='unavailable';return}
    renderer.setSize(el.clientWidth,el.clientHeight);el.appendChild(renderer.domElement);
    const dispose:Array<THREE.BufferGeometry|THREE.Material|THREE.Texture>=[],markers:Marker[]=[];
    const spacing=15,lastX=(milestones.length-1)*spacing;

    // 32 individually shaped, translucent strands form one volumetric mandoline.
    for(let s=0;s<32;s++){
      const points=[];for(let j=0;j<420;j++)points.push(ribbonPoint(j/419,s,lastX));
      const geo=new THREE.BufferGeometry().setFromPoints(points);
      const hue=.52+(s/31)*.18;const color=new THREE.Color().setHSL(hue,.9,.62);
      const mat=new THREE.LineBasicMaterial({color,transparent:true,opacity:.16+(1-Math.abs(s-15.5)/15.5)*.32,blending:THREE.AdditiveBlending,depthWrite:false});
      scene.add(new THREE.Line(geo,mat));dispose.push(geo,mat);
    }

    // Deep bokeh is deliberately distributed in z, with a brighter near-field of fireflies.
    for(const [count,size,opacity,zNear,zFar] of [[1900,.055,.34,-30,2],[340,.19,.13,-18,5]] as const){
      const a=new Float32Array(count*3);for(let i=0;i<count;i++){a[i*3]=Math.random()*(lastX+34)-17;a[i*3+1]=(Math.random()-.5)*18;a[i*3+2]=zNear+Math.random()*(zFar-zNear)}
      const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.BufferAttribute(a,3));const mat=new THREE.PointsMaterial({color:size>.1?0x75e8dd:0xa9c8ff,size,transparent:true,opacity,depthWrite:false,blending:THREE.AdditiveBlending});scene.add(new THREE.Points(geo,mat));dispose.push(geo,mat);
    }

    milestones.forEach((m,i)=>{
      const x=i*spacing,p=ribbonPoint(i/(milestones.length-1),16,lastX),group=new THREE.Group();group.position.copy(p);scene.add(group);
      const tex=labelTexture(m.year),mat=new THREE.SpriteMaterial({map:tex,transparent:true,opacity:m.major?.72:.32,depthWrite:false});const year=new THREE.Sprite(mat);year.scale.set(m.year==='TODAY'?4.8:4,1.4,1);year.position.set(m.major?0:1.2,m.major?2.1:.72,.2);group.add(year);dispose.push(tex,mat);
      const coreGeo=new THREE.IcosahedronGeometry(m.major?.22:.11,1),coreMat=new THREE.MeshBasicMaterial({color:m.major?0xc6e3ff:0x65dfd4,transparent:true,opacity:.9,blending:THREE.AdditiveBlending});const core=new THREE.Mesh(coreGeo,coreMat);group.add(core);dispose.push(coreGeo,coreMat);
      const orbits=new THREE.Group();group.add(orbits);
      if(m.major){
        const stemGeo=new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0,.15,0),new THREE.Vector3(0,1.25,0)]),stemMat=new THREE.LineBasicMaterial({color:0xb7d5ff,transparent:true,opacity:.5});orbits.add(new THREE.Line(stemGeo,stemMat));dispose.push(stemGeo,stemMat);
        for(let r=0;r<4;r++){const curve=new THREE.EllipseCurve(0,0,.42+r*.21,.16+r*.09,0,Math.PI*2,false,r*.35);const geo=new THREE.BufferGeometry().setFromPoints(curve.getPoints(72));const ringMat=new THREE.LineBasicMaterial({color:r%2?0x65f1df:0xa982ff,transparent:true,opacity:.32+r*.05,blending:THREE.AdditiveBlending});const ring=new THREE.LineLoop(geo,ringMat);ring.rotation.set(.65+r*.12,r*.31,r*.24);orbits.add(ring);dispose.push(geo,ringMat)}
      }
      markers.push({group,year,orbits,core,major:m.major,x});
    });

    const blue=new THREE.PointLight(0x216cff,42,45),violet=new THREE.PointLight(0x7342ff,34,40),teal=new THREE.PointLight(0x20d9bc,32,36);scene.add(blue,violet,teal);
    let raf=0,smooth=value.current;const clock=new THREE.Clock(),look=new THREE.Vector3();
    const draw=()=>{raf=requestAnimationFrame(draw);const time=clock.getElapsedTime();smooth+=(clamp(value.current)-smooth)*.045;const x=smooth*lastX;
      // Slow damping plus a curved flight path makes scrolling feel like mass moving through space.
      camera.position.x+=(x-3-camera.position.x)*.038;camera.position.y+=(Math.sin(smooth*Math.PI*3.2)*1.05-camera.position.y)*.025;camera.position.z+=(10.8+Math.cos(smooth*Math.PI*2.2)*1.25-camera.position.z)*.026;
      look.set(x+4,Math.sin(smooth*Math.PI*2.8)*.5,-2.1);camera.lookAt(look);camera.rotation.z=Math.sin(smooth*Math.PI*4)*.018;
      markers.forEach((m,i)=>{const d=Math.abs(i-smooth*(milestones.length-1)),near=clamp(1-d/2.5);m.year.material.opacity=(m.major?.28:.12)+near*(m.major?.65:.48);m.group.position.y=ribbonPoint(i/(milestones.length-1),16,lastX).y+Math.sin(time*.35+i)*.08;m.orbits.rotation.y+=.003+(i%3)*.0008;m.orbits.rotation.z=Math.sin(time*.18+i)*.2;m.core.scale.setScalar(1+near*.8)});
      blue.position.set(x-13,5,5);violet.position.set(x,0,2);teal.position.set(x+15,-3,1);renderer.render(scene,camera)};draw();
    const resize=()=>{camera.aspect=el.clientWidth/Math.max(1,el.clientHeight);camera.updateProjectionMatrix();renderer.setPixelRatio(Math.min(devicePixelRatio,2));renderer.setSize(el.clientWidth,el.clientHeight)};addEventListener('resize',resize);resize();
    return()=>{cancelAnimationFrame(raf);removeEventListener('resize',resize);dispose.forEach(x=>x.dispose());renderer.dispose();renderer.domElement.remove()};
  },[milestones]);
  return <div ref={host} className="history-world" style={{position:'fixed',inset:0,zIndex:0}} aria-hidden="true"/>;
}
