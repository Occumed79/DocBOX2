'use client';

import {useEffect,useRef} from 'react';
import * as THREE from 'three';
import {tryCreateCinematicRenderer} from './rendererQuality';

type Mode='timeline'|'milestone'|'story';
type Props={progress:number;transition:number;mode:Mode;storyScroll:number;seed:number};

const clamp=(v:number,min=0,max=1)=>Math.max(min,Math.min(max,v));
const smooth=(a:number,b:number,v:number)=>{const t=clamp((v-a)/(b-a));return t*t*(3-2*t)};
const WORLD=142;
const LINES=32;
const SEGMENTS=260;

function seeded(seed:number){let s=(seed||1)>>>0;return()=>{s=(s*1664525+1013904223)>>>0;return s/4294967296}}
function ribbonY(x:number,line:number,time:number){
  const lane=(line-(LINES-1)/2)/((LINES-1)/2);
  const spine=1.08*Math.sin(x*.225+time*.065)+.48*Math.sin(x*.51+1.18-time*.021)+.22*Math.cos(x*.93+.4);
  const weave=.19*Math.sin(x*.69+line*.29+time*.11)+.11*Math.cos(x*.34-line*.23-time*.08);
  const spread=lane*(.38+.32*(.5+.5*Math.sin(x*.29+time*.045)));
  return spine+weave+spread;
}
function ribbonZ(x:number,line:number,time:number){
  const lane=(line-(LINES-1)/2)/((LINES-1)/2);
  return -1.1+lane*.46+.18*Math.cos(x*.41+line*.17-time*.05);
}
function circleTexture(){
  const canvas=document.createElement('canvas');canvas.width=128;canvas.height=128;
  const ctx=canvas.getContext('2d')!;const g=ctx.createRadialGradient(64,64,0,64,64,64);
  g.addColorStop(0,'rgba(255,255,255,.95)');g.addColorStop(.12,'rgba(255,255,255,.7)');g.addColorStop(.36,'rgba(190,239,255,.28)');g.addColorStop(1,'rgba(150,210,255,0)');ctx.fillStyle=g;ctx.fillRect(0,0,128,128);
  const tex=new THREE.CanvasTexture(canvas);tex.needsUpdate=true;return tex;
}
function createSphereGeometry(count:number,seedValue:number){
  const rand=seeded(seedValue+33);const positions=new Float32Array(count*3);const randoms=new Float32Array(count);
  for(let i=0;i<count;i++){
    const u=rand(),v=rand(),theta=u*Math.PI*2,phi=Math.acos(2*v-1);
    const shell=.78+Math.pow(rand(),.58)*.22;
    const x=Math.sin(phi)*Math.cos(theta)*shell,y=Math.cos(phi)*shell,z=Math.sin(phi)*Math.sin(theta)*shell;
    positions[i*3]=x;positions[i*3+1]=y;positions[i*3+2]=z;randoms[i]=rand();
  }
  const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.BufferAttribute(positions,3));geometry.setAttribute('aRand',new THREE.BufferAttribute(randoms,1));return geometry;
}
function bubbleMaterial(){
  return new THREE.ShaderMaterial({transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,vertexShader:`
    precision highp float;
    attribute float aRand;
    uniform float uTime;
    uniform float uAlpha;
    uniform float uPointScale;
    varying float vRand;
    varying float vRim;
    void main(){
      vec3 n=normalize(position);
      float wave=sin(position.y*9.0+uTime*.82+aRand*5.0)*.026+cos(position.x*11.0-uTime*.56+aRand*7.0)*.018+sin(position.z*8.0+uTime*.37)*.014;
      vec3 p=position+n*wave;
      p.x+=sin(p.y*5.0+uTime*.22)*.018;
      p.y+=cos(p.x*4.0-uTime*.18)*.016;
      vec4 mv=modelViewMatrix*vec4(p,1.0);
      vec3 viewN=normalize(mat3(modelViewMatrix)*n);
      vRim=pow(1.0-abs(viewN.z),1.15);
      vRand=aRand;
      gl_Position=projectionMatrix*mv;
      gl_PointSize=uPointScale*(.72+aRand*.78)*(8.0/max(1.0,-mv.z));
    }`,fragmentShader:`
    precision highp float;
    uniform float uAlpha;
    varying float vRand;
    varying float vRim;
    void main(){
      vec2 q=gl_PointCoord-.5;float d=length(q);if(d>.5)discard;
      float soft=smoothstep(.5,.05,d);
      float sparkle=step(.86,vRand)*.62+.38;
      vec3 color=mix(vec3(.55,.91,1.0),vec3(1.0),.58+vRim*.42);
      float alpha=uAlpha*soft*(.18+vRim*.84)*sparkle;
      gl_FragColor=vec4(color,alpha);
    }`,uniforms:{uTime:{value:0},uAlpha:{value:0},uPointScale:{value:2.3}}});
}

export default function HistoryWorld({progress,transition,mode,storyScroll,seed}:Props){
  const mount=useRef<HTMLDivElement>(null);
  const values=useRef({progress,transition,mode,storyScroll,seed});values.current={progress,transition,mode,storyScroll,seed};

  useEffect(()=>{
    const host=mount.current;if(!host)return;
    const renderer=tryCreateCinematicRenderer({antialias:false,alpha:true,powerPreference:'high-performance'},{exposure:1.08});
    if(!renderer){host.dataset.webgl='unavailable';return}
    renderer.setClearColor(0x000000,0);renderer.setPixelRatio(Math.min(devicePixelRatio||1,2));renderer.setSize(host.clientWidth,host.clientHeight);renderer.autoClear=false;host.appendChild(renderer.domElement);

    const timelineScene=new THREE.Scene();const bubbleScene=new THREE.Scene();
    const timelineCamera=new THREE.PerspectiveCamera(35,host.clientWidth/host.clientHeight,.1,90);timelineCamera.position.set(0,.2,11.6);
    const bubbleCamera=new THREE.PerspectiveCamera(35,host.clientWidth/host.clientHeight,.1,60);bubbleCamera.position.set(0,.25,8.25);bubbleCamera.lookAt(0,0,0);
    const disposables:Array<{dispose:()=>void}>=[];

    const lineRecords:Array<{geo:THREE.BufferGeometry;mat:THREE.LineBasicMaterial;arr:Float32Array;line:THREE.Line}>=[];
    for(let lane=0;lane<LINES;lane++){
      const arr=new Float32Array(SEGMENTS*3);const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.BufferAttribute(arr,3));
      const dist=Math.abs(lane-(LINES-1)/2)/((LINES-1)/2);const mat=new THREE.LineBasicMaterial({color:lane===15||lane===16?0xaef9ff:0x9bdcf5,transparent:true,opacity:lane===15||lane===16?.72:.16*(1-dist*.36),blending:THREE.AdditiveBlending,depthWrite:false});
      const line=new THREE.Line(geo,mat);timelineScene.add(line);lineRecords.push({geo,mat,arr,line});disposables.push(geo,mat);
    }
    const glowGeo=new THREE.BufferGeometry();const glowArr=new Float32Array(SEGMENTS*3);glowGeo.setAttribute('position',new THREE.BufferAttribute(glowArr,3));const glowMat=new THREE.LineBasicMaterial({color:0xbfffff,transparent:true,opacity:.92,blending:THREE.AdditiveBlending,depthWrite:false});timelineScene.add(new THREE.Line(glowGeo,glowMat));disposables.push(glowGeo,glowMat);

    const dustRand=seeded(8041);const dustCount=1750,dustArr=new Float32Array(dustCount*3);
    for(let i=0;i<dustCount;i++){dustArr[i*3]=dustRand()*WORLD;dustArr[i*3+1]=(dustRand()-.5)*12;dustArr[i*3+2]=-2-dustRand()*16}
    const dustGeo=new THREE.BufferGeometry();dustGeo.setAttribute('position',new THREE.BufferAttribute(dustArr,3));const dustMat=new THREE.PointsMaterial({color:0xc9f8ff,size:.035,transparent:true,opacity:.48,blending:THREE.AdditiveBlending,depthWrite:false});const dust=new THREE.Points(dustGeo,dustMat);timelineScene.add(dust);disposables.push(dustGeo,dustMat);

    const fireRand=seeded(3349);const fireCount=250,fireArr=new Float32Array(fireCount*3);const fireBase=new Float32Array(fireCount);
    for(let i=0;i<fireCount;i++){fireBase[i]=fireRand()*WORLD;fireArr[i*3]=fireBase[i];fireArr[i*3+1]=0;fireArr[i*3+2]=0}
    const fireGeo=new THREE.BufferGeometry();fireGeo.setAttribute('position',new THREE.BufferAttribute(fireArr,3));const fireMat=new THREE.PointsMaterial({map:circleTexture(),color:0xd9ffff,size:.34,transparent:true,opacity:.76,blending:THREE.AdditiveBlending,depthWrite:false,alphaTest:.02});const fireflies=new THREE.Points(fireGeo,fireMat);timelineScene.add(fireflies);disposables.push(fireGeo,fireMat,fireMat.map!);

    const bokehRand=seeded(167);const bokehCount=56,bokehArr=new Float32Array(bokehCount*3);
    for(let i=0;i<bokehCount;i++){bokehArr[i*3]=bokehRand()*WORLD;bokehArr[i*3+1]=(bokehRand()-.5)*10;bokehArr[i*3+2]=-5-bokehRand()*13}
    const bokehGeo=new THREE.BufferGeometry();bokehGeo.setAttribute('position',new THREE.BufferAttribute(bokehArr,3));const bokehTex=circleTexture();const bokehMat=new THREE.PointsMaterial({map:bokehTex,color:0xd8ebff,size:2.2,transparent:true,opacity:.18,depthWrite:false,blending:THREE.AdditiveBlending});const bokeh=new THREE.Points(bokehGeo,bokehMat);timelineScene.add(bokeh);disposables.push(bokehGeo,bokehMat,bokehTex);

    const sphereGroup=new THREE.Group();bubbleScene.add(sphereGroup);
    const centralGeo=createSphereGeometry(30000,71);const centralMat=bubbleMaterial();const central=new THREE.Points(centralGeo,centralMat);central.scale.setScalar(2.64);central.position.set(-.05,.10,0);sphereGroup.add(central);disposables.push(centralGeo,centralMat);
    const satelliteGeo=createSphereGeometry(7600,193);const satLeftMat=bubbleMaterial();const satRightMat=bubbleMaterial();satLeftMat.uniforms.uPointScale.value=2.0;satRightMat.uniforms.uPointScale.value=2.0;
    const satLeft=new THREE.Points(satelliteGeo,satLeftMat);satLeft.scale.setScalar(.56);satLeft.position.set(-4.2,.22,.28);sphereGroup.add(satLeft);
    const satRight=new THREE.Points(satelliteGeo.clone(),satRightMat);satRight.scale.setScalar(.52);satRight.position.set(4.15,-.72,.24);sphereGroup.add(satRight);disposables.push(satelliteGeo,satLeftMat,satRight.geometry,satRightMat);

    const glowTex=circleTexture();const topGlow=new THREE.Sprite(new THREE.SpriteMaterial({map:glowTex,color:0xffffff,transparent:true,opacity:.0,blending:THREE.AdditiveBlending,depthWrite:false}));topGlow.scale.set(.65,.65,1);topGlow.position.set(-.45,1.55,1.85);sphereGroup.add(topGlow);disposables.push(topGlow.material,glowTex);

    let raf=0,last=performance.now(),smoothProgress=values.current.progress;
    const look=new THREE.Vector3();
    const draw=(now:number)=>{
      raf=requestAnimationFrame(draw);const dt=Math.min(.05,(now-last)/1000);last=now;const time=now/1000;const v=values.current;
      smoothProgress+=(v.progress-smoothProgress)*Math.min(1,dt*6.4);const cameraX=smoothProgress*WORLD;
      const timelineAlpha=1-smooth(.08,.58,v.transition);
      const isBubble=v.mode==='story';const bubbleAlpha=(isBubble?smooth(.24,.80,v.transition):0)*clamp(1-v.storyScroll*2,.15,1);

      for(let lane=0;lane<LINES;lane++){
        const rec=lineRecords[lane];
        for(let i=0;i<SEGMENTS;i++){const x=i/(SEGMENTS-1)*WORLD;rec.arr[i*3]=x;rec.arr[i*3+1]=ribbonY(x,lane,time);rec.arr[i*3+2]=ribbonZ(x,lane,time)}
        (rec.geo.attributes.position as THREE.BufferAttribute).needsUpdate=true;rec.mat.opacity=(lane===15||lane===16?.72:.13)*timelineAlpha;
      }
      for(let i=0;i<SEGMENTS;i++){const x=i/(SEGMENTS-1)*WORLD;glowArr[i*3]=x;glowArr[i*3+1]=ribbonY(x,15.5,time);glowArr[i*3+2]=-.73}
      (glowGeo.attributes.position as THREE.BufferAttribute).needsUpdate=true;glowMat.opacity=.92*timelineAlpha;
      for(let i=0;i<fireCount;i++){const x=fireBase[i];fireArr[i*3]=x;fireArr[i*3+1]=ribbonY(x,(i*7)%LINES,time)+Math.sin(time*.9+i)*.15;fireArr[i*3+2]=-.48+Math.cos(i*.42)*.22}
      (fireGeo.attributes.position as THREE.BufferAttribute).needsUpdate=true;fireMat.opacity=.7*timelineAlpha;dustMat.opacity=.42*timelineAlpha;bokehMat.opacity=.17*timelineAlpha;
      bokeh.position.x=Math.sin(time*.035)*1.4;dust.position.y=Math.sin(time*.09)*.08;

      timelineCamera.position.x+=(cameraX-timelineCamera.position.x)*.07;timelineCamera.position.y+=(Math.sin(smoothProgress*Math.PI*4)*.22-timelineCamera.position.y)*.04;timelineCamera.position.z+=(11.4+Math.sin(smoothProgress*Math.PI*2)*.32-timelineCamera.position.z)*.04;look.set(cameraX+1.55,0,-.85);timelineCamera.lookAt(look);

      const intro=smooth(.22,.62,v.transition),settle=smooth(.58,1,v.transition);
      const overshoot=Math.sin(Math.min(1,intro)*Math.PI)*.16;
      sphereGroup.scale.setScalar(.72+intro*.36+overshoot-settle*.08);
      sphereGroup.position.y=-.62+intro*.74-v.storyScroll*.28;
      sphereGroup.rotation.y=time*.018+(v.seed%7)*.17;sphereGroup.rotation.x=Math.sin(time*.13)*.025;
      centralMat.uniforms.uTime.value=time;centralMat.uniforms.uAlpha.value=bubbleAlpha;centralMat.uniforms.uPointScale.value=2.55;
      satLeftMat.uniforms.uTime.value=time+.7;satRightMat.uniforms.uTime.value=time+1.4;const satelliteAlpha=bubbleAlpha*smooth(.68,.96,v.transition);satLeftMat.uniforms.uAlpha.value=satelliteAlpha;satRightMat.uniforms.uAlpha.value=satelliteAlpha;
      satLeft.rotation.y=time*.035;satRight.rotation.y=-time*.031;central.rotation.y=time*.022;central.rotation.x=Math.sin(time*.17)*.018;
      (topGlow.material as THREE.SpriteMaterial).opacity=bubbleAlpha*.42*(.76+.24*Math.sin(time*2.4));

      renderer.clear();
      if(timelineAlpha>.002)renderer.render(timelineScene,timelineCamera);
      if(bubbleAlpha>.002)renderer.render(bubbleScene,bubbleCamera);
    };
    draw(performance.now());

    const resize=()=>{const w=Math.max(1,host.clientWidth),h=Math.max(1,host.clientHeight);timelineCamera.aspect=w/h;bubbleCamera.aspect=w/h;timelineCamera.updateProjectionMatrix();bubbleCamera.updateProjectionMatrix();renderer.setPixelRatio(Math.min(devicePixelRatio||1,2));renderer.setSize(w,h)};
    window.addEventListener('resize',resize);
    return()=>{cancelAnimationFrame(raf);window.removeEventListener('resize',resize);disposables.forEach(x=>x.dispose());renderer.dispose();renderer.domElement.remove()};
  },[]);

  return <div ref={mount} style={{position:'fixed',inset:0,zIndex:1,pointerEvents:'none'}} aria-hidden="true"/>;
}
