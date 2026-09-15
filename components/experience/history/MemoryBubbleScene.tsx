'use client';

import {useEffect,useRef} from 'react';
import * as THREE from 'three';
import {tryCreateCinematicRenderer} from '../immersive/rendererQuality';

/** The memory view owns a separate camera and particle field.  Keeping it out of
 * the timeline scene lets the sphere arrive with its own scale and timing. */
export default function MemoryBubbleScene(){
  const host=useRef<HTMLDivElement>(null);
  useEffect(()=>{
    const el=host.current;if(!el)return;
    const scene=new THREE.Scene();
    const camera=new THREE.PerspectiveCamera(36,el.clientWidth/el.clientHeight,.1,80);camera.position.set(0,0,16);
    const renderer=tryCreateCinematicRenderer({alpha:true,antialias:true,powerPreference:'high-performance'},{exposure:1.35});
    if(!renderer){el.dataset.webgl='unavailable';return} renderer.setClearColor(0x000000,0);el.appendChild(renderer.domElement);
    const group=new THREE.Group();group.position.set(1.65,-.35,0);group.scale.setScalar(1.36);scene.add(group);
    const dispose:Array<THREE.BufferGeometry|THREE.Material>=[];
    const makeShell=(count:number,radius:number,size:number,color:number,opacity:number)=>{
      const points=new Float32Array(count*3),colors=new Float32Array(count*3),base=new THREE.Color(color);
      for(let i=0;i<count;i++){
        const y=1-2*(i+.5)/count,angle=i*2.399963+Math.sin(i*.17)*.16,r=radius*(.91+Math.random()*.14);
        const halo=Math.max(0,y)*.34+Math.random()*.18;
        points.set([Math.cos(angle)*Math.sqrt(1-y*y)*r,y*r,Math.sin(angle)*Math.sqrt(1-y*y)*r],i*3);
        colors.set([Math.min(1,base.r+halo),Math.min(1,base.g+halo),Math.min(1,base.b+halo)],i*3);
      }
      const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.BufferAttribute(points,3));geo.setAttribute('color',new THREE.BufferAttribute(colors,3));
      const mat=new THREE.PointsMaterial({size,vertexColors:true,transparent:true,opacity,depthWrite:false,blending:THREE.AdditiveBlending,sizeAttenuation:true});group.add(new THREE.Points(geo,mat));dispose.push(geo,mat);
    };
    makeShell(11800,4.25,.037,0x4b9fe4,.72);makeShell(3800,3.65,.06,0x3665bc,.28);makeShell(1250,4.42,.075,0xa9ecff,.38);
    const rimGeo=new THREE.RingGeometry(4.18,4.28,160),rimMat=new THREE.MeshBasicMaterial({color:0x9eefff,transparent:true,opacity:.13,side:THREE.DoubleSide,blending:THREE.AdditiveBlending,depthWrite:false});
    const rim=new THREE.Mesh(rimGeo,rimMat);rim.rotation.x=.12;group.add(rim);dispose.push(rimGeo,rimMat);
    let raf=0,start=performance.now();const draw=()=>{raf=requestAnimationFrame(draw);const t=(performance.now()-start)/1000;const settle=1-Math.exp(-t*2.1);group.position.x=1.65*(1-settle);group.position.y=-.35*(1-settle);const scale=1+(1-settle)*.36;group.scale.setScalar(scale);group.rotation.y=t*.055;group.rotation.z=Math.sin(t*.28)*.025;renderer.render(scene,camera)};draw();
    const resize=()=>{camera.aspect=el.clientWidth/Math.max(1,el.clientHeight);camera.updateProjectionMatrix();renderer.setPixelRatio(Math.min(devicePixelRatio,2));renderer.setSize(el.clientWidth,el.clientHeight)};resize();addEventListener('resize',resize);
    return()=>{cancelAnimationFrame(raf);removeEventListener('resize',resize);dispose.forEach(x=>x.dispose());renderer.dispose();renderer.domElement.remove()};
  },[]);
  return <div ref={host} className="memory-bubble-webgl"/>;
}
