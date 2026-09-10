'use client';

import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { configureCinematicRenderer } from './rendererQuality';

const PORTAL_VERTEX=`
varying vec2 vUv;
void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}
`;

const PORTAL_FRAGMENT=`
precision highp float;
varying vec2 vUv;
uniform float uTime;
uniform float uProgress;
float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453123);}
void main(){
  vec2 p=vUv-.5;
  float r=length(p);
  float a=atan(p.y,p.x);
  float swirl=.5+.5*sin(a*12.0-r*38.0+uTime*2.2);
  float bands=.5+.5*sin(r*46.0-uTime*2.7);
  float grain=hash(floor(vUv*120.0)+floor(uTime*2.0));
  float mask=smoothstep(.5,.04,r);
  vec3 cyan=vec3(.22,.82,1.0),violet=vec3(.48,.28,1.0);
  vec3 color=mix(cyan,violet,swirl*.5+bands*.2);
  float alpha=mask*(.18+.36*swirl+.16*bands+grain*.035)*(0.35+uProgress*.75);
  gl_FragColor=vec4(color,alpha);
}`;

export default function DiveWorld({progress}:{progress:number}){
  const host=useRef<HTMLDivElement>(null);const progressRef=useRef(progress);progressRef.current=progress;

  useEffect(()=>{
    const el=host.current;if(!el)return;
    const scene=new THREE.Scene();scene.fog=new THREE.FogExp2(0x02070d,.038);
    const camera=new THREE.PerspectiveCamera(56,el.clientWidth/el.clientHeight,.1,180);camera.position.set(0,0,10);
    const renderer=configureCinematicRenderer(new THREE.WebGLRenderer({alpha:false,antialias:true,powerPreference:'high-performance'}),{exposure:1.08});renderer.setSize(el.clientWidth,el.clientHeight);renderer.setClearColor(0x02070d,1);el.appendChild(renderer.domElement);

    scene.add(new THREE.HemisphereLight(0x8ddfff,0x05060b,.9));
    const cyanLight=new THREE.PointLight(0x59dff4,24,30);cyanLight.position.set(4,3,5);scene.add(cyanLight);
    const violetLight=new THREE.PointLight(0x7254ff,18,30);violetLight.position.set(-4,-5,-18);scene.add(violetLight);

    const path=new THREE.CatmullRomCurve3([
      new THREE.Vector3(0,0,10),new THREE.Vector3(1.5,-5,-8),new THREE.Vector3(-2,-12,-25),new THREE.Vector3(2.3,-18,-43),new THREE.Vector3(-1.2,-24,-61),new THREE.Vector3(0,-29,-78),
    ],false,'catmullrom',.42);

    const disposables:Array<THREE.BufferGeometry|THREE.Material>=[];
    const tunnelGeometry=new THREE.TubeGeometry(path,180,7.4,10,false);const tunnelMaterial=new THREE.MeshBasicMaterial({color:0x24556b,wireframe:true,transparent:true,opacity:.055,side:THREE.BackSide,blending:THREE.AdditiveBlending});const tunnel=new THREE.Mesh(tunnelGeometry,tunnelMaterial);scene.add(tunnel);disposables.push(tunnelGeometry,tunnelMaterial);
    const gates:THREE.Group[]=[];
    for(let i=0;i<14;i++){
      const t=(i+1)/15;const point=path.getPoint(t);const tangent=path.getTangent(t).normalize();
      const gate=new THREE.Group();gate.position.copy(point);
      const ringMat=new THREE.MeshStandardMaterial({color:i%3===0?0x7755ff:0x54dff4,emissive:i%3===0?0x4b2ca8:0x147d93,emissiveIntensity:2.1,metalness:.58,roughness:.2,transparent:true,opacity:.62});
      const ring=new THREE.Mesh(new THREE.TorusGeometry(3.2+(i%4)*.42,.045+(i%2)*.02,10,96),ringMat);ring.rotation.x=Math.PI/2;gate.add(ring);disposables.push(ring.geometry,ringMat);
      const outerMat=new THREE.MeshBasicMaterial({color:i%2?0x88eaff:0xa889ff,transparent:true,opacity:.14,blending:THREE.AdditiveBlending});
      const outer=new THREE.Mesh(new THREE.TorusGeometry(4.2+(i%3)*.34,.012,6,96),outerMat);outer.rotation.set(Math.PI/2,.12*i,.26*i);gate.add(outer);disposables.push(outer.geometry,outerMat);
      gate.quaternion.setFromUnitVectors(new THREE.Vector3(0,0,-1),tangent);
      scene.add(gate);gates.push(gate);
    }

    const shards:THREE.Mesh[]=[];
    const shardMat=new THREE.MeshStandardMaterial({color:0x173847,emissive:0x14667a,emissiveIntensity:.6,metalness:.6,roughness:.24,transparent:true,opacity:.78});
    for(let i=0;i<38;i++){
      const geometry=i%2?new THREE.TetrahedronGeometry(.34+Math.random()*.55):new THREE.BoxGeometry(.18+Math.random()*.48,.8+Math.random()*1.8,.12+Math.random()*.35);
      const shard=new THREE.Mesh(geometry,shardMat);const t=.08+Math.random()*.84;const center=path.getPoint(t);const angle=Math.random()*Math.PI*2;const radius=4.3+Math.random()*5.8;shard.position.set(center.x+Math.cos(angle)*radius,center.y+Math.sin(angle)*radius*.6,center.z+(Math.random()-.5)*5);shard.rotation.set(Math.random()*Math.PI,Math.random()*Math.PI,Math.random()*Math.PI);scene.add(shard);shards.push(shard);disposables.push(geometry);
    }
    disposables.push(shardMat);

    const shafts:THREE.Mesh[]=[];
    for(let i=0;i<18;i++){
      const t=.04+i/19*.91,center=path.getPoint(t),angle=i*2.399;
      const material=new THREE.MeshBasicMaterial({color:i%4===0?0x8b6cff:0x64e5ff,transparent:true,opacity:.08,blending:THREE.AdditiveBlending,depthWrite:false});
      const shaft=new THREE.Mesh(new THREE.CylinderGeometry(.018,.11,8+(i%5)*2,6,1,true),material);shaft.position.copy(center).add(new THREE.Vector3(Math.cos(angle)*(5.4+i%3),Math.sin(angle)*(4.2+i%2),0));shaft.rotation.set(Math.PI*.5,angle,.2);scene.add(shaft);shafts.push(shaft);disposables.push(shaft.geometry,material);
    }

    const dustGeo=new THREE.BufferGeometry();const dust=new Float32Array(4200);
    for(let i=0;i<dust.length;i+=3){dust[i]=(Math.random()-.5)*24;dust[i+1]=-Math.random()*42+6;dust[i+2]=14-Math.random()*112}
    dustGeo.setAttribute('position',new THREE.BufferAttribute(dust,3));const dustMat=new THREE.PointsMaterial({color:0xa2eeff,size:.04,transparent:true,opacity:.58,depthWrite:false});const dustField=new THREE.Points(dustGeo,dustMat);scene.add(dustField);disposables.push(dustGeo,dustMat);

    const portalGroup=new THREE.Group();const end=path.getPoint(1);portalGroup.position.copy(end).add(new THREE.Vector3(0,-.4,-4));
    const portalRingMat=new THREE.MeshStandardMaterial({color:0xdafaff,emissive:0x72e6ff,emissiveIntensity:3.2,metalness:.65,roughness:.12});
    const portalRing=new THREE.Mesh(new THREE.TorusGeometry(4.4,.12,18,120),portalRingMat);portalGroup.add(portalRing);disposables.push(portalRing.geometry,portalRingMat);
    const portalShader=new THREE.ShaderMaterial({vertexShader:PORTAL_VERTEX,fragmentShader:PORTAL_FRAGMENT,transparent:true,depthWrite:false,side:THREE.DoubleSide,blending:THREE.AdditiveBlending,uniforms:{uTime:{value:0},uProgress:{value:0}}});
    const portalCore=new THREE.Mesh(new THREE.CircleGeometry(4.22,96),portalShader);portalCore.position.z=.03;portalGroup.add(portalCore);disposables.push(portalCore.geometry,portalShader);
    const portalOuterMat=new THREE.MeshBasicMaterial({color:0x8e75ff,transparent:true,opacity:.25,blending:THREE.AdditiveBlending});
    const portalOuter=new THREE.Mesh(new THREE.TorusGeometry(5.25,.025,8,120),portalOuterMat);portalOuter.rotation.z=.4;portalGroup.add(portalOuter);disposables.push(portalOuter.geometry,portalOuterMat);scene.add(portalGroup);

    let raf=0;const clock=new THREE.Clock(),smoothed={value:0};
    const draw=()=>{
      raf=requestAnimationFrame(draw);const time=clock.getElapsedTime();smoothed.value+=(progressRef.current-smoothed.value)*.065;const p=Math.max(0,Math.min(.995,smoothed.value));
      const position=path.getPoint(p),ahead=path.getPoint(Math.min(1,p+.025));camera.position.copy(position);camera.lookAt(ahead);camera.rotation.z+=((Math.sin(p*Math.PI*7)*.13)-camera.rotation.z)*.06;camera.fov=56-Math.sin(p*Math.PI)*11;camera.updateProjectionMatrix();
      gates.forEach((gate,i)=>{gate.rotation.z=time*(i%2?.09:-.075)+i*.13;const distance=Math.abs(p-(i+1)/15);gate.scale.setScalar(1+Math.max(0,.08-distance)*2.2)});
      shards.forEach((shard,i)=>{shard.rotation.x+=.0015+(i%5)*.0003;shard.rotation.y+=.001+(i%4)*.00025});
      shafts.forEach((shaft,i)=>{shaft.rotation.z=time*(i%2?.014:-.011)+i*.2;(shaft.material as THREE.MeshBasicMaterial).opacity=.035+Math.sin(time*.7+i)*.018+Math.max(0,p-.55)*.08});
      dustField.position.z=-p*8;dustField.rotation.y=time*.004;portalRing.rotation.z=time*.11;portalOuter.rotation.z=-time*.06;portalShader.uniforms.uTime.value=time;portalShader.uniforms.uProgress.value=Math.max(0,(p-.58)/.42);portalRingMat.emissiveIntensity=3.2+Math.max(0,(p-.72)/.28)*4.5;
      renderer.render(scene,camera);
    };draw();

    const resize=()=>{camera.aspect=el.clientWidth/el.clientHeight;camera.updateProjectionMatrix();renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,2));renderer.setSize(el.clientWidth,el.clientHeight)};window.addEventListener('resize',resize);
    return()=>{cancelAnimationFrame(raf);window.removeEventListener('resize',resize);disposables.forEach(item=>item.dispose());renderer.dispose();if(renderer.domElement.parentNode===el)el.removeChild(renderer.domElement)};
  },[]);

  return <div ref={host} style={{position:'absolute',inset:0}} aria-hidden="true"/>;
}
