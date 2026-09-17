'use client';

import { useEffect, useRef, useState, type MouseEvent as ReactMouseEvent } from 'react';
import { useRouter } from 'next/navigation';
import * as THREE from 'three';
import { addPortalArchitecture } from './PortalArchitecture';
import { tryCreateCinematicRenderer } from './rendererQuality';
import styles from './ZeroTechPortalHub.module.css';

type Portal={id:string;href:string;number:string;title:string;note:string;tone:string};
type NodeRecord={group:THREE.Group;ring:THREE.Mesh;outer:THREE.Mesh;inner:THREE.Mesh;shader:THREE.ShaderMaterial;base:THREE.Vector3;portal:Portal};
type CentralLightRig={group:THREE.Group;update:(time:number,entry:number)=>void};

const CYAN=0x0df6ff;
const POS=[
  [0,3.18,-2.25],
  [3.78,.92,-1.72],
  [2.52,-2.0,-1.42],
  [-2.52,-2.0,-1.42],
  [-3.78,.92,-1.72],
] as const;
const clamp=(v:number,min=0,max=1)=>Math.max(min,Math.min(max,v));
const easeInOut=(t:number)=>{const x=clamp(t);return x<.5?4*x*x*x:1-Math.pow(-2*x+2,3)/2};

const VERT=`varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`;
const FRAG=`
precision highp float;
varying vec2 vUv;
uniform float uTime;
uniform float uHover;
float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453123);}
void main(){
 vec2 p=vUv-.5;float r=length(p);float a=atan(p.y,p.x);
 float spiral=.5+.5*sin(a*8.-r*31.+uTime*2.5);
 float pulse=.5+.5*sin(r*41.-uTime*2.0);
 float core=smoothstep(.49,.07,r);float edge=smoothstep(.50,.34,r)-smoothstep(.34,.16,r);
 float noise=hash(floor((p+.5)*110.)+floor(uTime*2.));
 vec3 c=mix(vec3(.01,.32,.36),vec3(.05,.96,1.),.44+.56*spiral);
 float alpha=core*(.055+.12*spiral+.06*pulse)+edge*(.18+.34*uHover)+noise*.016*core;
 gl_FragColor=vec4(c,alpha*(.82+.65*uHover));
}`;

function addCentralLight(scene:THREE.Scene):CentralLightRig{
  const group=new THREE.Group();
  group.position.z=-4.8;

  const makeBeam=(radiusTop:number,radiusBottom:number,height:number,opacity:number)=>{
    const material=new THREE.MeshBasicMaterial({color:0xb9fdff,transparent:true,opacity,depthWrite:false,side:THREE.DoubleSide,blending:THREE.AdditiveBlending});
    const beam=new THREE.Mesh(new THREE.CylinderGeometry(radiusTop,radiusBottom,height,48,1,true),material);
    beam.position.y=5.8;
    group.add(beam);
    return beam;
  };

  const outer=makeBeam(.42,4.8,18,.035);
  const middle=makeBeam(.16,2.35,17.5,.075);
  const inner=makeBeam(.055,.72,17,.16);

  const coreMaterial=new THREE.MeshBasicMaterial({color:0xeaffff,transparent:true,opacity:.92,depthWrite:false,blending:THREE.AdditiveBlending});
  const core=new THREE.Mesh(new THREE.SphereGeometry(.58,32,22),coreMaterial);
  core.position.y=8;
  group.add(core);

  const auraMaterial=new THREE.MeshBasicMaterial({color:CYAN,transparent:true,opacity:.12,depthWrite:false,blending:THREE.AdditiveBlending});
  const aura=new THREE.Mesh(new THREE.SphereGeometry(2.5,32,22),auraMaterial);
  aura.position.y=8;
  group.add(aura);

  const poolMaterial=new THREE.MeshBasicMaterial({color:CYAN,transparent:true,opacity:.11,depthWrite:false,side:THREE.DoubleSide,blending:THREE.AdditiveBlending});
  const pool=new THREE.Mesh(new THREE.CircleGeometry(5.4,96),poolMaterial);
  pool.rotation.x=-Math.PI/2;
  pool.position.y=-3.035;
  group.add(pool);

  const poolRing=new THREE.Mesh(new THREE.RingGeometry(2.2,5.9,120),new THREE.MeshBasicMaterial({color:0xc9feff,transparent:true,opacity:.055,depthWrite:false,side:THREE.DoubleSide,blending:THREE.AdditiveBlending}));
  poolRing.rotation.x=-Math.PI/2;
  poolRing.position.y=-3.025;
  group.add(poolRing);

  const light=new THREE.PointLight(0xb8fdff,92,34,1.6);
  light.position.set(0,7.7,0);
  group.add(light);
  const groundLight=new THREE.PointLight(CYAN,34,18,1.8);
  groundLight.position.set(0,-1.4,.5);
  group.add(groundLight);

  scene.add(group);
  return {
    group,
    update(time,entry){
      const pulse=.96+Math.sin(time*.58)*.035;
      core.scale.setScalar(pulse);
      aura.scale.setScalar(.96+Math.sin(time*.24)*.06);
      pool.scale.setScalar(.92+entry*.08+Math.sin(time*.19)*.012);
      poolRing.rotation.z=time*.017;
      outer.rotation.y=time*.006;
      middle.rotation.y=-time*.01;
      inner.rotation.y=time*.014;
      const reveal=.28+entry*.72;
      (outer.material as THREE.MeshBasicMaterial).opacity=.035*reveal;
      (middle.material as THREE.MeshBasicMaterial).opacity=.075*reveal;
      (inner.material as THREE.MeshBasicMaterial).opacity=.16*reveal;
      coreMaterial.opacity=.62+.30*entry;
      auraMaterial.opacity=.055+.065*entry;
      light.intensity=56+36*entry+Math.sin(time*.58)*4;
      groundLight.intensity=18+16*entry;
    }
  };
}

export default function ZeroTechPortalHub({portals,entryProgress=1}:{portals:readonly Portal[];entryProgress?:number}){
  const mount=useRef<HTMLDivElement>(null);
  const router=useRouter();
  const entryRef=useRef(entryProgress);entryRef.current=entryProgress;
  const focusRef=useRef(-1);
  const travelRef=useRef<(index:number)=>void>(()=>{});
  const [active,setActive]=useState(-1);
  const [labels,setLabels]=useState<Array<{x:number;y:number;visible:boolean}>>([]);
  const [travelling,setTravelling]=useState(false);
  const [webglAvailable,setWebglAvailable]=useState(true);

  useEffect(()=>{
    const host=mount.current;if(!host)return;
    const scene=new THREE.Scene();scene.fog=new THREE.FogExp2(0x000000,.029);
    const camera=new THREE.PerspectiveCamera(47,host.clientWidth/host.clientHeight,.1,120);camera.position.set(0,.72,17.6);
    const renderer=tryCreateCinematicRenderer({antialias:true,powerPreference:'high-performance'},{exposure:1.08});
    if(!renderer){
      setWebglAvailable(false);
      travelRef.current=(index:number)=>{const portal=portals[index];if(!portal)return;setActive(index);setTravelling(true);router.push(portal.href)};
      return()=>{travelRef.current=()=>{}};
    }
    renderer.setClearColor(0x000000,1);renderer.setSize(host.clientWidth,host.clientHeight);renderer.setPixelRatio(Math.min(devicePixelRatio||1,2));host.appendChild(renderer.domElement);

    scene.add(new THREE.HemisphereLight(0xffffff,0x000000,.72));
    const key=new THREE.DirectionalLight(0xffffff,3.3);key.position.set(5,8,7);scene.add(key);
    const rim=new THREE.PointLight(CYAN,62,26);rim.position.set(-4,2,-1);scene.add(rim);
    const front=new THREE.PointLight(CYAN,25,17);front.position.set(2,-1,6);scene.add(front);

    const floor=new THREE.Mesh(new THREE.PlaneGeometry(42,42),new THREE.MeshStandardMaterial({color:0x010303,roughness:.9,metalness:.06}));floor.rotation.x=-Math.PI/2;floor.position.y=-3.12;scene.add(floor);
    const grid=new THREE.GridHelper(42,42,CYAN,0x061a1c);grid.position.y=-3.1;scene.add(grid);
    const halo=new THREE.Mesh(new THREE.RingGeometry(1.2,4.4,110),new THREE.MeshBasicMaterial({color:CYAN,transparent:true,opacity:.07,side:THREE.DoubleSide,blending:THREE.AdditiveBlending}));halo.rotation.x=-Math.PI/2;halo.position.y=-3.06;scene.add(halo);

    const architecture=addPortalArchitecture(scene);
    const centralLight=addCentralLight(scene);

    const starsGeo=new THREE.BufferGeometry();const starsArray=new Float32Array(3000);for(let i=0;i<starsArray.length;i+=3){starsArray[i]=(Math.random()-.5)*46;starsArray[i+1]=(Math.random()-.5)*26;starsArray[i+2]=5-Math.random()*54}starsGeo.setAttribute('position',new THREE.BufferAttribute(starsArray,3));
    const stars=new THREE.Points(starsGeo,new THREE.PointsMaterial({color:0xbdfcff,size:.025,transparent:true,opacity:.52,depthWrite:false}));scene.add(stars);

    const portalLayer=new THREE.Group();portalLayer.name='portal-interaction-layer';scene.add(portalLayer);
    const nodes:NodeRecord[]=portals.map((portal,index)=>{
      const [x,y,z]=POS[index]??[0,0,-2];const base=new THREE.Vector3(x,y,z);const group=new THREE.Group();group.position.copy(base);
      const ringMat=new THREE.MeshStandardMaterial({color:CYAN,emissive:CYAN,emissiveIntensity:2.6,metalness:.8,roughness:.1});
      const ring=new THREE.Mesh(new THREE.TorusGeometry(1.02,.085,16,96),ringMat);group.add(ring);
      const outer=new THREE.Mesh(new THREE.TorusGeometry(1.34,.016,7,96),new THREE.MeshBasicMaterial({color:CYAN,transparent:true,opacity:.38,blending:THREE.AdditiveBlending}));outer.rotation.z=.36;group.add(outer);
      const shader=new THREE.ShaderMaterial({vertexShader:VERT,fragmentShader:FRAG,transparent:true,depthWrite:false,side:THREE.DoubleSide,blending:THREE.AdditiveBlending,uniforms:{uTime:{value:0},uHover:{value:0}}});
      const inner=new THREE.Mesh(new THREE.CircleGeometry(.94,72),shader);inner.position.z=.018;group.add(inner);
      ring.userData.index=index;inner.userData.index=index;portalLayer.add(group);return{group,ring,outer,inner,shader,base,portal};
    });

    const interactive=nodes.flatMap(n=>[n.ring,n.inner]);const pointer=new THREE.Vector2(9,9),ray=new THREE.Raycaster();
    let raf=0,start=performance.now(),hovered=-1,travelIndex=-1,travelStart=0,navigationTimer=0;
    const travelFrom=new THREE.Vector3(),portalCenter=new THREE.Vector3(),approach=new THREE.Vector3(),through=new THREE.Vector3(),look=new THREE.Vector3(0,.35,-1);

    const beginTravel=(index:number)=>{
      if(travelIndex>=0)return;const node=nodes[index];if(!node)return;
      travelIndex=index;travelStart=performance.now();travelFrom.copy(camera.position);node.group.getWorldPosition(portalCenter);
      const forward=new THREE.Vector3(0,0,-1).applyQuaternion(node.group.getWorldQuaternion(new THREE.Quaternion())).normalize();
      approach.copy(portalCenter).addScaledVector(forward,-.55);through.copy(portalCenter).addScaledVector(forward,4.2);setActive(index);setTravelling(true);
      navigationTimer=window.setTimeout(()=>router.push(node.portal.href),1280);
    };travelRef.current=beginTravel;

    const move=(e:PointerEvent)=>{const rect=renderer.domElement.getBoundingClientRect();pointer.set((e.clientX-rect.left)/rect.width*2-1,-((e.clientY-rect.top)/rect.height)*2+1)};
    const leave=()=>{pointer.set(9,9)};
    const click=()=>{ray.setFromCamera(pointer,camera);const hit=ray.intersectObjects(interactive)[0];if(hit)beginTravel(hit.object.userData.index as number)};
    renderer.domElement.addEventListener('pointermove',move);renderer.domElement.addEventListener('pointerleave',leave);renderer.domElement.addEventListener('click',click);

    const resize=()=>{camera.aspect=host.clientWidth/host.clientHeight;camera.updateProjectionMatrix();renderer.setSize(host.clientWidth,host.clientHeight);renderer.setPixelRatio(Math.min(devicePixelRatio||1,2))};window.addEventListener('resize',resize);
    const loop=(now:number)=>{
      raf=requestAnimationFrame(loop);const t=(now-start)/1000,entry=clamp(entryRef.current);
      ray.setFromCamera(pointer,camera);const hit=travelIndex<0?ray.intersectObjects(interactive)[0]:undefined;hovered=hit?(hit.object.userData.index as number):-1;
      const focus=travelIndex>=0?travelIndex:(focusRef.current>=0?focusRef.current:hovered);if(travelIndex<0)setActive(v=>v===focus?v:focus);

      nodes.forEach((node,index)=>{
        const selected=index===focus,muted=focus>=0&&!selected;const radial=index/Math.max(nodes.length,1)*Math.PI*2;
        const breathing=1+Math.sin(t*.42+radial)*.018;const entryScale=.62+entry*.38;const scale=entryScale*breathing*(selected?1.28:muted?.86:1);
        node.group.scale.lerp(new THREE.Vector3(scale,scale,scale),.08);
        const targetZ=node.base.z+(selected?1.25:muted?-1.0:0);node.group.position.x+=(node.base.x*(selected?.93:1)-node.group.position.x)*.06;node.group.position.y+=(node.base.y*(selected?.94:1)-node.group.position.y)*.06;node.group.position.z+=(targetZ-node.group.position.z)*.06;
        const ringMat=node.ring.material as THREE.MeshStandardMaterial;ringMat.emissiveIntensity+=(((selected?7.2:muted?1.0:2.6)*entry)-ringMat.emissiveIntensity)*.09;
        (node.outer.material as THREE.MeshBasicMaterial).opacity+=(((selected?.9:muted?.09:.38)*entry)-(node.outer.material as THREE.MeshBasicMaterial).opacity)*.09;
        node.shader.uniforms.uTime.value=t;node.shader.uniforms.uHover.value+=(((selected?1:0)-node.shader.uniforms.uHover.value)*.08);
        node.ring.rotation.z=Math.sin(t*.5+index)*.055;node.outer.rotation.z=.36+t*(index%2?.045:-.045);node.inner.rotation.z=t*(index%2?.036:-.032);
      });

      stars.rotation.y=t*.0028;halo.rotation.z=t*.022;architecture.update(t,pointer.x);centralLight.update(t,entry);
      portalLayer.position.z+=(0-portalLayer.position.z)*.05;
      const focused=focus>=0?nodes[focus]:undefined;const focusX=focused?.group.position.x??0;
      architecture.group.position.x+=((-focusX*.075)-architecture.group.position.x)*.035;architecture.group.position.z+=(((1-entry)*-3.6)-architecture.group.position.z)*.05;architecture.group.rotation.y+=((focused?-focusX*.016:0)-architecture.group.rotation.y)*.035;
      const s=.84+entry*.16;architecture.group.scale.lerp(new THREE.Vector3(s,s,s),.05);rim.position.x+=((-4-focusX*.07)-rim.position.x)*.03;front.position.x+=((2+focusX*.14)-front.position.x)*.03;

      if(travelIndex>=0){
        const elapsed=(now-travelStart)/1280;
        if(elapsed<.58){const p=easeInOut(elapsed/.58);camera.position.lerpVectors(travelFrom,approach,p);camera.fov=47-p*9;camera.updateProjectionMatrix();camera.lookAt(portalCenter)}
        else {const p=easeInOut((elapsed-.58)/.42);camera.position.lerpVectors(approach,through,p);camera.fov=38-p*20;camera.updateProjectionMatrix();camera.lookAt(portalCenter.clone().add(new THREE.Vector3(0,0,-5)))}
      }else{
        const targetX=focused?focused.group.position.x*.24:pointer.x*.38;const targetY=focused?focused.group.position.y*.15:.56+pointer.y*.16;const z=17.6-entry*3.8-(focused?.65:0);
        camera.position.x+=(targetX*.18-camera.position.x)*.028;camera.position.y+=(targetY-camera.position.y)*.028;camera.position.z+=(z-camera.position.z)*.043;look.x+=(targetX-look.x)*.035;look.y+=(targetY*.28-look.y)*.035;look.z+=(-.75-look.z)*.035;camera.fov+=((focused?43:47)-camera.fov)*.04;camera.updateProjectionMatrix();camera.lookAt(look);
      }

      setLabels(nodes.map(node=>{const p=node.group.getWorldPosition(new THREE.Vector3()).project(camera);return{x:(p.x*.5+.5)*host.clientWidth,y:(-.5*p.y+.5)*host.clientHeight,visible:p.z<1&&entry>.26}}));renderer.render(scene,camera);
    };loop(performance.now());

    return()=>{travelRef.current=()=>{};cancelAnimationFrame(raf);if(navigationTimer)clearTimeout(navigationTimer);window.removeEventListener('resize',resize);renderer.domElement.removeEventListener('pointermove',move);renderer.domElement.removeEventListener('pointerleave',leave);renderer.domElement.removeEventListener('click',click);scene.traverse(obj=>{const o=obj as THREE.Mesh;if(o.geometry)o.geometry.dispose();const m=o.material;if(Array.isArray(m))m.forEach(x=>x.dispose());else m?.dispose()});renderer.dispose();if(renderer.domElement.parentNode===host)host.removeChild(renderer.domElement)};
  },[portals,router]);

  const enter=(event:ReactMouseEvent<HTMLAnchorElement>,index:number)=>{event.preventDefault();travelRef.current(index)};
  const fallbackPositions=[['50%','25%'],['70%','42%'],['64%','66%'],['36%','66%'],['30%','42%']] as const;
  return <section className={styles.root} data-travelling={travelling?true:undefined} data-webgl={webglAvailable?'available':'unavailable'}>
    <div className={styles.wordmark} aria-hidden="true"><span>PROVIDER</span><span>WORLD</span></div>
    <div className={styles.kicker}><span>OCCU-MED / PROVIDER WORLD</span><b>CHOOSE A PATH</b></div>
    <div ref={mount} className={styles.canvas} data-astronaut-base/>
    <div className={styles.centralLightMarker} data-central-light aria-hidden="true"/>
    <nav className={styles.portalOverlay} data-portal-overlay aria-label="Provider world portals">
      <div className={styles.labels}>{portals.map((portal,index)=><a key={portal.id} href={portal.href} data-active={active===index} data-muted={active>=0&&active!==index} onClick={e=>enter(e,index)} onFocus={()=>{focusRef.current=index;setActive(index)}} onBlur={()=>{focusRef.current=-1;setActive(-1)}} style={webglAvailable?{left:labels[index]?.x,top:labels[index]?.y,opacity:labels[index]?.visible?1:0}:{left:fallbackPositions[index]?.[0]??'50%',top:fallbackPositions[index]?.[1]??'50%',opacity:1}}><small>{portal.number}</small><strong>{portal.title}</strong></a>)}</div>
    </nav>
    <p className={styles.hint}>{webglAvailable?'MOVE TO FOCUS · SELECT TO ENTER':'SELECT A PATH TO ENTER'}</p>
  </section>;
}
