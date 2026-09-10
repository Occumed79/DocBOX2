'use client';

import { useEffect, useRef, useState, type MouseEvent as ReactMouseEvent } from 'react';
import { useRouter } from 'next/navigation';
import * as THREE from 'three';
import styles from './PortalOrbitalNav.module.css';
import { addPortalArchitecture } from './PortalArchitecture';

type Portal = { id:string; href:string; number:string; title:string; note:string; tone:string };
type PortalNode = {
  group:THREE.Group;
  ring:THREE.Mesh;
  outer:THREE.Mesh;
  inner:THREE.Mesh;
  shader:THREE.ShaderMaterial;
  portal:Portal;
  index:number;
  base:THREE.Vector3;
  target:THREE.Vector3;
};

const POS = [[-4.45,1.95,-1.3],[4.35,1.85,-2.5],[4.55,-1.5,-1.2],[-4.45,-1.55,-2.25],[0,3.55,-3.2]] as const;
const COLORS:Record<string,number>={gold:0xe8b96c,cyan:0x78e8ff,violet:0xb18cff,blue:0x7da7ff,white:0xeefaff};
const clamp=(v:number,min=0,max=1)=>Math.max(min,Math.min(max,v));
const ease=(t:number)=>1-Math.pow(1-clamp(t),3);

const PORTAL_VERTEX=`
varying vec2 vUv;
void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}
`;

const PORTAL_FRAGMENT=`
precision highp float;
varying vec2 vUv;
uniform float uTime;
uniform float uHover;
uniform vec3 uColor;
float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453123);}
void main(){
  vec2 p=vUv-.5;
  float r=length(p);
  float a=atan(p.y,p.x);
  float wave=.5+.5*sin(a*9.0-r*28.0+uTime*2.6);
  float wave2=.5+.5*sin(a*5.0+r*34.0-uTime*1.9);
  float grain=hash(floor((p+.5)*90.0)+floor(uTime*2.0));
  float core=smoothstep(.49,.04,r);
  float edge=smoothstep(.50,.30,r)-smoothstep(.30,.10,r);
  float alpha=core*(.12+.16*wave+.09*wave2)+edge*(.18+.18*uHover)+grain*.025*core;
  vec3 color=uColor*(.55+wave*.45)+vec3(.35,.55,.8)*wave2*.18;
  gl_FragColor=vec4(color,alpha*(.85+.5*uHover));
}
`;

function addDrone(scene:THREE.Scene){
  const drone=new THREE.Group();drone.position.set(2.8,4.45,-5.4);drone.scale.setScalar(.7);
  const coreMat=new THREE.MeshStandardMaterial({color:0x173b52,metalness:.72,roughness:.18,emissive:0x2bbbd7,emissiveIntensity:.8});
  const core=new THREE.Mesh(new THREE.IcosahedronGeometry(.58,1),coreMat);drone.add(core);
  const wingMat=new THREE.MeshStandardMaterial({color:0x193341,metalness:.55,roughness:.32,emissive:0x163e4d,emissiveIntensity:.55});
  [-1,1].forEach(side=>{
    const wing=new THREE.Mesh(new THREE.BoxGeometry(1.6,.07,.55),wingMat);wing.position.x=side*1.05;wing.rotation.z=side*.08;drone.add(wing);
    const tip=new THREE.PointLight(0x62e8ff,7,5);tip.position.set(side*1.82,0,.05);drone.add(tip);
  });
  scene.add(drone);return drone;
}

export default function PortalOrbitalNav({portals,agreementOnly=false,onEnter,autoEnter=false,entryProgress=1}:{portals:readonly Portal[];agreementOnly?:boolean;onEnter?:()=>void;autoEnter?:boolean;entryProgress?:number}){
  const mount=useRef<HTMLDivElement>(null);
  const beginTravelRef=useRef<(index:number)=>void>(()=>{});
  const onEnterRef=useRef(onEnter);onEnterRef.current=onEnter;
  const entryRef=useRef(entryProgress);entryRef.current=entryProgress;
  const domFocusRef=useRef(-1);
  const router=useRouter();
  const [labels,setLabels]=useState<Array<{x:number;y:number;visible:boolean}>>([]);
  const [active,setActive]=useState(-1);

  useEffect(()=>{
    const host=mount.current;if(!host)return;
    const shown=agreementOnly?portals.slice(-1):portals;
    const scene=new THREE.Scene();scene.fog=new THREE.FogExp2(0x020811,.032);
    const camera=new THREE.PerspectiveCamera(47,host.clientWidth/host.clientHeight,.1,110);camera.position.set(0,.85,agreementOnly?12.5:17.4);
    const renderer=new THREE.WebGLRenderer({antialias:true,alpha:false,powerPreference:'high-performance'});renderer.setPixelRatio(Math.min(devicePixelRatio,2));renderer.setSize(host.clientWidth,host.clientHeight);renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.setClearColor(0x020810,1);host.appendChild(renderer.domElement);

    scene.add(new THREE.HemisphereLight(0x7fbfff,0x061018,1.25));
    const key=new THREE.DirectionalLight(0xe0f8ff,3.8);key.position.set(5,8,7);scene.add(key);
    const rim=new THREE.PointLight(0x7e56ff,48,24);rim.position.set(-4,2,-1);scene.add(rim);
    const front=new THREE.PointLight(0x5edfff,22,16);front.position.set(2,-1,6);scene.add(front);

    const floorMat=new THREE.MeshStandardMaterial({color:0x06131b,roughness:.84,metalness:.08,transparent:true,opacity:.9});
    const floor=new THREE.Mesh(new THREE.PlaneGeometry(38,38),floorMat);floor.rotation.x=-Math.PI/2;floor.position.y=-3.12;scene.add(floor);
    const grid=new THREE.GridHelper(38,38,0x2d6577,0x102934);grid.position.y=-3.1;scene.add(grid);
    const halo=new THREE.Mesh(new THREE.RingGeometry(1.2,4.2,96),new THREE.MeshBasicMaterial({color:0x2ecde9,transparent:true,opacity:.075,side:THREE.DoubleSide,blending:THREE.AdditiveBlending}));halo.rotation.x=-Math.PI/2;halo.position.y=-3.06;scene.add(halo);

    const architecture=addPortalArchitecture(scene);
    const drone=addDrone(scene);

    const starsGeo=new THREE.BufferGeometry();
    const starPos=new Float32Array(2400);
    for(let i=0;i<starPos.length;i+=3){starPos[i]=(Math.random()-.5)*42;starPos[i+1]=(Math.random()-.5)*24;starPos[i+2]=6-Math.random()*50}
    starsGeo.setAttribute('position',new THREE.BufferAttribute(starPos,3));
    const stars=new THREE.Points(starsGeo,new THREE.PointsMaterial({color:0x8ddff4,size:.03,transparent:true,opacity:.7,depthWrite:false}));scene.add(stars);

    const nodes:PortalNode[]=shown.map((portal,i)=>{
      const color=COLORS[portal.tone]||0x78e8ff;
      const position=agreementOnly?[0,.15,-1.1]:POS[i];
      const base=new THREE.Vector3(position[0],position[1],position[2]);
      const group=new THREE.Group();group.position.copy(base);
      const ringMaterial=new THREE.MeshStandardMaterial({color,emissive:color,emissiveIntensity:2.4,metalness:.65,roughness:.16});
      const ring=new THREE.Mesh(new THREE.TorusGeometry(1.08,.095,18,96),ringMaterial);group.add(ring);
      const outer=new THREE.Mesh(new THREE.TorusGeometry(1.36,.018,8,96),new THREE.MeshBasicMaterial({color,transparent:true,opacity:.36,blending:THREE.AdditiveBlending}));outer.rotation.z=.38;group.add(outer);
      const rear=new THREE.Mesh(new THREE.TorusGeometry(1.58,.012,6,96),new THREE.MeshBasicMaterial({color,transparent:true,opacity:.14,blending:THREE.AdditiveBlending}));rear.rotation.z=-.34;rear.position.z=-.08;group.add(rear);
      const shader=new THREE.ShaderMaterial({vertexShader:PORTAL_VERTEX,fragmentShader:PORTAL_FRAGMENT,transparent:true,depthWrite:false,side:THREE.DoubleSide,blending:THREE.AdditiveBlending,uniforms:{uTime:{value:0},uHover:{value:0},uColor:{value:new THREE.Color(color)}}});
      const inner=new THREE.Mesh(new THREE.CircleGeometry(.98,72),shader);inner.position.z=.015;group.add(inner);
      ring.userData={index:i,href:portal.href};inner.userData={index:i,href:portal.href};rear.userData={index:i,href:portal.href};
      scene.add(group);return{group,ring,outer,inner,shader,portal,index:i,base,target:base.clone()};
    });

    const interactive=nodes.flatMap(node=>[node.ring,node.inner]);
    const pointer=new THREE.Vector2(9,9),ray=new THREE.Raycaster();
    let hovered=-1,targetX=0,targetY=.6,raf=0,start=performance.now();
    let travelIndex=-1,travelStart=0,navigationTimer=0;
    const travelFrom=new THREE.Vector3(),travelTo=new THREE.Vector3(),travelLook=new THREE.Vector3();

    const beginTravel=(index:number)=>{
      if(travelIndex>=0)return;
      const node=nodes[index];if(!node)return;
      travelIndex=index;travelStart=performance.now();travelFrom.copy(camera.position);
      const portalPosition=node.group.getWorldPosition(new THREE.Vector3());
      const approach=camera.position.clone().sub(portalPosition).normalize().multiplyScalar(.34);
      travelTo.copy(portalPosition).add(approach);travelLook.copy(portalPosition);
      setActive(index);
      navigationTimer=window.setTimeout(()=>{const enter=onEnterRef.current;enter?.();if(!enter)router.push(node.portal.href)},920);
    };
    beginTravelRef.current=beginTravel;

    const move=(event:PointerEvent)=>{const rect=renderer.domElement.getBoundingClientRect();pointer.set((event.clientX-rect.left)/rect.width*2-1,-((event.clientY-rect.top)/rect.height)*2+1)};
    const leave=()=>{pointer.set(9,9);if(travelIndex<0&&domFocusRef.current<0)setActive(-1)};
    const click=()=>{ray.setFromCamera(pointer,camera);const hit=ray.intersectObjects(interactive)[0];if(!hit)return;beginTravel(hit.object.userData.index as number)};
    renderer.domElement.addEventListener('pointermove',move);renderer.domElement.addEventListener('pointerleave',leave);renderer.domElement.addEventListener('click',click);

    const resize=()=>{camera.aspect=host.clientWidth/host.clientHeight;camera.updateProjectionMatrix();renderer.setSize(host.clientWidth,host.clientHeight)};addEventListener('resize',resize);
    const loop=(now:number)=>{
      raf=requestAnimationFrame(loop);const t=(now-start)/1000;const entry=agreementOnly?1:clamp(entryRef.current);
      ray.setFromCamera(pointer,camera);const hit=travelIndex<0?ray.intersectObjects(interactive)[0]:undefined;hovered=hit?(hit.object.userData.index as number):-1;
      const focusIndex=travelIndex>=0?travelIndex:(domFocusRef.current>=0?domFocusRef.current:hovered);
      if(travelIndex<0)setActive(current=>current===focusIndex?current:focusIndex);

      nodes.forEach((node,i)=>{
        const focused=i===focusIndex;
        const muted=focusIndex>=0&&!focused;
        node.target.set(
          node.base.x*(focused?.86:muted?1.045:1),
          node.base.y*(focused?.9:muted?1.02:1),
          node.base.z+(focused?1.55:muted?-1.3:0)
        );
        node.group.position.lerp(node.target,.075);
        const entryScale=.68+entry*.32;
        const wanted=entryScale*(focused?1.32:muted?.84:1);
        node.group.scale.lerp(new THREE.Vector3(wanted,wanted,wanted),.085);
        const ringMat=node.ring.material as THREE.MeshStandardMaterial;
        const ringEnergy=focused?5.8:muted?1.15:2.4;
        ringMat.emissiveIntensity+=((ringEnergy*(.35+entry*.65))-ringMat.emissiveIntensity)*.09;
        const outerMat=node.outer.material as THREE.MeshBasicMaterial;
        const outerOpacity=focused?.76:muted?.12:.36;
        outerMat.opacity+=((outerOpacity*entry)-outerMat.opacity)*.09;
        node.shader.uniforms.uTime.value=t;
        node.shader.uniforms.uHover.value+=(((focused?1:0)-node.shader.uniforms.uHover.value)*.08);
        node.ring.rotation.z=Math.sin(t*.55+i)*.07;
        node.outer.rotation.z=.38+t*(i%2?.055:-.048);
        node.inner.rotation.z=t*(i%2?.045:-.038);
      });

      drone.rotation.x=Math.sin(t*.38)*.16;drone.rotation.y=t*.22;drone.position.y=4.45+Math.sin(t*.7)*.12;drone.scale.setScalar(.48+entry*.22);
      stars.rotation.y=t*.003;halo.rotation.z=t*.025;architecture.update(t,pointer.x);
      const focusedNode=focusIndex>=0?nodes[focusIndex]:undefined;
      const focusX=focusedNode?.group.position.x??0;
      architecture.group.position.x+=((-focusX*.08)-architecture.group.position.x)*.035;
      architecture.group.position.z+=(((1-entry)*-3.2)-architecture.group.position.z)*.055;
      architecture.group.rotation.y+=((focusedNode?-focusX*.018:0)-architecture.group.rotation.y)*.035;
      const architectureScale=.86+entry*.14;architecture.group.scale.lerp(new THREE.Vector3(architectureScale,architectureScale,architectureScale),.055);
      (scene.fog as THREE.FogExp2).density=.044-entry*.012+(focusedNode?.0015:0);
      front.position.x+=(focusX*.18-front.position.x+2)*.03;
      rim.position.x+=((-4-focusX*.08)-rim.position.x)*.03;

      if(travelIndex>=0){
        const p=ease((now-travelStart)/880);camera.position.lerpVectors(travelFrom,travelTo,p);camera.fov=47-p*20;camera.updateProjectionMatrix();camera.lookAt(travelLook);
      }else{
        const focused=focusedNode?.group.position;
        const desiredX=focused?focused.x*.27:pointer.x*.42;
        const desiredY=focused?focused.y*.18:.42+entry*.18+pointer.y*.2;
        targetX+=(desiredX-targetX)*.035;targetY+=(desiredY-targetY)*.035;
        const baseZ=17.4-entry*3.7-(focused?.72:0);
        const cameraX=(focused?focused.x*.065:0)+pointer.x*(focused?.08:.25);
        const cameraY=.48+entry*.37+(focused?focused.y*.025:0)-pointer.y*(focused?.05:.12);
        camera.position.x+=(cameraX-camera.position.x)*.025;
        camera.position.y+=(cameraY-camera.position.y)*.025;
        camera.position.z+=(baseZ-camera.position.z)*.045;
        const targetFov=focused?43.2:47-(1-entry)*4;
        camera.fov+=(targetFov-camera.fov)*.04;camera.updateProjectionMatrix();camera.lookAt(targetX,targetY,-.5-entry*.2+(focused?.18:0));
      }

      setLabels(nodes.map(node=>{const p=node.group.getWorldPosition(new THREE.Vector3()).project(camera);return{x:(p.x*.5+.5)*host.clientWidth,y:(-.5*p.y+.5)*host.clientHeight,visible:p.z<1&&entry>.28}}));
      renderer.render(scene,camera);
    };loop(performance.now());

    return()=>{
      beginTravelRef.current=()=>{};cancelAnimationFrame(raf);if(navigationTimer)window.clearTimeout(navigationTimer);removeEventListener('resize',resize);
      renderer.domElement.removeEventListener('pointermove',move);renderer.domElement.removeEventListener('pointerleave',leave);renderer.domElement.removeEventListener('click',click);
      scene.traverse(object=>{const mesh=object as THREE.Mesh;if(mesh.geometry)mesh.geometry.dispose();const material=mesh.material;if(Array.isArray(material))material.forEach(item=>item.dispose());else material?.dispose()});renderer.dispose();if(renderer.domElement.parentNode===host)host.removeChild(renderer.domElement);
    };
  },[agreementOnly,portals,router]);

  useEffect(()=>{
    if(!autoEnter||!agreementOnly)return;
    const timer=window.setTimeout(()=>beginTravelRef.current(0),80);
    return()=>window.clearTimeout(timer);
  },[agreementOnly,autoEnter]);

  const shown=agreementOnly?portals.slice(-1):portals;
  const enterFromLabel=(event:ReactMouseEvent<HTMLAnchorElement>,index:number)=>{event.preventDefault();beginTravelRef.current(index)};
  return <nav className={styles.root} data-agreement-only={agreementOnly?true:undefined} aria-label="Spatial provider portals"><div ref={mount} className={styles.canvas}/><div className={styles.labels}>{shown.map((portal,i)=><a key={portal.id} href={portal.href} data-active={active===i} data-muted={active>=0&&active!==i} data-anchor={i===4?'top':i===0||i===3?'left':'right'} onClick={event=>enterFromLabel(event,i)} onFocus={()=>{domFocusRef.current=i;setActive(i)}} onBlur={()=>{domFocusRef.current=-1;setActive(-1)}} style={{left:labels[i]?.x,top:labels[i]?.y,opacity:labels[i]?.visible?1:0}}><small>{portal.number} / PORTAL</small><strong>{portal.title}</strong><span>{portal.note}</span></a>)}</div><p className={styles.hint}>MOVE TO FOCUS · SELECT A PORTAL TO TRAVEL</p></nav>;
}
