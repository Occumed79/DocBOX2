'use client';

import {useEffect,useRef} from 'react';
import * as THREE from 'three';
import {HISTORY_LINE_COUNT,HISTORY_WORLD_LENGTH} from '../history/historyMath';
import {sampleMandoline} from './historyMandoline';
import {tryCreateCinematicRenderer} from './rendererQuality';

type Mode='timeline'|'milestone'|'story';
type Props={progress:number;transition:number;mode:Mode;storyScroll:number;seed:number};

const SEGMENTS=300;
const clamp=(v:number,min=0,max=1)=>Math.max(min,Math.min(max,v));
const smooth=(a:number,b:number,v:number)=>{const t=clamp((v-a)/(b-a));return t*t*(3-2*t)};

function seeded(seed:number){
  let s=(seed||1)>>>0;
  return()=>{s=(s*1664525+1013904223)>>>0;return s/4294967296};
}

function circleTexture(){
  const canvas=document.createElement('canvas');
  canvas.width=128;canvas.height=128;
  const ctx=canvas.getContext('2d');
  if(!ctx)return new THREE.Texture();
  const g=ctx.createRadialGradient(64,64,0,64,64,64);
  g.addColorStop(0,'rgba(255,255,255,.98)');
  g.addColorStop(.10,'rgba(255,255,255,.78)');
  g.addColorStop(.34,'rgba(190,239,255,.28)');
  g.addColorStop(1,'rgba(150,210,255,0)');
  ctx.fillStyle=g;ctx.fillRect(0,0,128,128);
  const texture=new THREE.CanvasTexture(canvas);texture.needsUpdate=true;return texture;
}

function createSphereGeometry(count:number,seedValue:number){
  const rand=seeded(seedValue+33);
  const positions=new Float32Array(count*3);
  const randoms=new Float32Array(count);
  for(let i=0;i<count;i++){
    const u=rand(),v=rand();
    const theta=u*Math.PI*2;
    const phi=Math.acos(2*v-1);
    const shell=.72+Math.pow(rand(),.48)*.30;
    positions[i*3]=Math.sin(phi)*Math.cos(theta)*shell;
    positions[i*3+1]=Math.cos(phi)*shell;
    positions[i*3+2]=Math.sin(phi)*Math.sin(theta)*shell;
    randoms[i]=rand();
  }
  const geometry=new THREE.BufferGeometry();
  geometry.setAttribute('position',new THREE.BufferAttribute(positions,3));
  geometry.setAttribute('aRand',new THREE.BufferAttribute(randoms,1));
  return geometry;
}

function bubbleMaterial(){
  return new THREE.ShaderMaterial({
    transparent:true,
    depthWrite:false,
    blending:THREE.AdditiveBlending,
    uniforms:{uTime:{value:0},uAlpha:{value:0},uPointScale:{value:2.3}},
    vertexShader:`
      precision highp float;
      attribute float aRand;
      uniform float uTime;
      uniform float uPointScale;
      varying float vRand;
      varying float vRim;
      varying float vTop;
      void main(){
        vec3 n=normalize(position);
        float wave=
          sin(position.y*9.0+uTime*.82+aRand*5.0)*.028+
          cos(position.x*11.0-uTime*.56+aRand*7.0)*.019+
          sin(position.z*8.0+uTime*.37)*.015;
        vec3 p=position+n*wave;
        p.x+=sin(p.y*5.0+uTime*.22)*.020;
        p.y+=cos(p.x*4.0-uTime*.18)*.018;
        vec4 mv=modelViewMatrix*vec4(p,1.0);
        vec3 viewN=normalize(mat3(modelViewMatrix)*n);
        vRim=pow(1.0-abs(viewN.z),1.12);
        vTop=smoothstep(.15,.88,n.y);
        vRand=aRand;
        gl_Position=projectionMatrix*mv;
        gl_PointSize=uPointScale*(.62+aRand*.94)*(8.0/max(1.0,-mv.z));
      }`,
    fragmentShader:`
      precision highp float;
      uniform float uAlpha;
      varying float vRand;
      varying float vRim;
      varying float vTop;
      void main(){
        vec2 q=gl_PointCoord-.5;
        float d=length(q);
        if(d>.5)discard;
        float soft=smoothstep(.5,.04,d);
        float sparkle=.28+step(.84,vRand)*.72;
        vec3 cyan=vec3(.50,.89,1.0);
        vec3 color=mix(cyan,vec3(1.0),clamp(.28+vRim*.52+vTop*.28,0.0,1.0));
        float alpha=uAlpha*soft*(.12+vRim*.78+vTop*.16)*sparkle;
        gl_FragColor=vec4(color,alpha);
      }`
  });
}

export default function HistoryWorld({progress,transition,mode,storyScroll,seed}:Props){
  const mount=useRef<HTMLDivElement>(null);
  const values=useRef({progress,transition,mode,storyScroll,seed});
  values.current={progress,transition,mode,storyScroll,seed};

  useEffect(()=>{
    const host=mount.current;
    if(!host)return;

    const renderer=tryCreateCinematicRenderer(
      {antialias:false,alpha:true,powerPreference:'high-performance'},
      {exposure:1.08}
    );
    if(!renderer){host.dataset.webgl='unavailable';return;}

    renderer.setClearColor(0x000000,0);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,3));
    renderer.setSize(host.clientWidth,host.clientHeight);
    renderer.autoClear=false;
    host.appendChild(renderer.domElement);

    const timelineScene=new THREE.Scene();
    const bubbleScene=new THREE.Scene();
    const timelineCamera=new THREE.PerspectiveCamera(34,host.clientWidth/host.clientHeight,.1,110);
    const bubbleCamera=new THREE.PerspectiveCamera(35,host.clientWidth/host.clientHeight,.1,70);
    timelineCamera.position.set(0,.8,11.4);
    bubbleCamera.position.set(0,.24,8.2);
    bubbleCamera.lookAt(0,0,0);

    const disposables:Array<{dispose:()=>void}>=[];
    const lines:Array<{geo:THREE.BufferGeometry;mat:THREE.LineBasicMaterial;arr:Float32Array;lane:number}>=[];

    for(let lane=0;lane<HISTORY_LINE_COUNT;lane++){
      const arr=new Float32Array(SEGMENTS*3);
      const geo=new THREE.BufferGeometry();
      geo.setAttribute('position',new THREE.BufferAttribute(arr,3));
      const centerDistance=Math.abs(lane-(HISTORY_LINE_COUNT-1)/2)/((HISTORY_LINE_COUNT-1)/2);
      const mat=new THREE.LineBasicMaterial({
        color:centerDistance<.10?0xc7ffff:0x9bdcf5,
        transparent:true,
        opacity:centerDistance<.10?.78:.13*(1-centerDistance*.30),
        blending:THREE.AdditiveBlending,
        depthWrite:false
      });
      timelineScene.add(new THREE.Line(geo,mat));
      lines.push({geo,mat,arr,lane});
      disposables.push(geo,mat);
    }

    const fireRand=seeded(3349);
    const fireCount=512;
    const fireArr=new Float32Array(fireCount*3);
    const fireX=new Float32Array(fireCount);
    const fireLane=new Uint8Array(fireCount);
    const fireOffset=new Float32Array(fireCount);
    for(let i=0;i<fireCount;i++){
      fireX[i]=fireRand()*HISTORY_WORLD_LENGTH;
      fireLane[i]=Math.floor(fireRand()*HISTORY_LINE_COUNT);
      fireOffset[i]=(fireRand()-.5)*.34;
    }
    const fireGeo=new THREE.BufferGeometry();
    fireGeo.setAttribute('position',new THREE.BufferAttribute(fireArr,3));
    const fireTex=circleTexture();
    const fireMat=new THREE.PointsMaterial({map:fireTex,color:0xe1ffff,size:.30,transparent:true,opacity:.74,blending:THREE.AdditiveBlending,depthWrite:false,alphaTest:.01});
    timelineScene.add(new THREE.Points(fireGeo,fireMat));
    disposables.push(fireGeo,fireMat,fireTex);

    const dustRand=seeded(8041);
    const dustCount=1450;
    const dustArr=new Float32Array(dustCount*3);
    for(let i=0;i<dustCount;i++){
      dustArr[i*3]=dustRand()*HISTORY_WORLD_LENGTH;
      dustArr[i*3+1]=(dustRand()-.5)*13;
      dustArr[i*3+2]=-3-dustRand()*18;
    }
    const dustGeo=new THREE.BufferGeometry();
    dustGeo.setAttribute('position',new THREE.BufferAttribute(dustArr,3));
    const dustMat=new THREE.PointsMaterial({color:0xc9f8ff,size:.032,transparent:true,opacity:.42,blending:THREE.AdditiveBlending,depthWrite:false});
    timelineScene.add(new THREE.Points(dustGeo,dustMat));
    disposables.push(dustGeo,dustMat);

    const bokehRand=seeded(167);
    const bokehCount=64*3;
    const bokehArr=new Float32Array(bokehCount*3);
    for(let section=0;section<3;section++){
      for(let i=0;i<64;i++){
        const at=section*64+i;
        bokehArr[at*3]=section*50+bokehRand()*50;
        bokehArr[at*3+1]=(bokehRand()-.5)*11;
        bokehArr[at*3+2]=-6-bokehRand()*16;
      }
    }
    const bokehGeo=new THREE.BufferGeometry();
    bokehGeo.setAttribute('position',new THREE.BufferAttribute(bokehArr,3));
    const bokehTex=circleTexture();
    const bokehMat=new THREE.PointsMaterial({map:bokehTex,color:0xd9edff,size:2.35,transparent:true,opacity:.15,depthWrite:false,blending:THREE.AdditiveBlending});
    timelineScene.add(new THREE.Points(bokehGeo,bokehMat));
    disposables.push(bokehGeo,bokehMat,bokehTex);

    const sphereGroup=new THREE.Group();
    bubbleScene.add(sphereGroup);
    const centralGeo=createSphereGeometry(36000,71);
    const centralMat=bubbleMaterial();
    const central=new THREE.Points(centralGeo,centralMat);
    central.scale.setScalar(2.64);
    sphereGroup.add(central);
    disposables.push(centralGeo,centralMat);

    const satLeftGeo=createSphereGeometry(7200,193);
    const satRightGeo=createSphereGeometry(6400,269);
    const satLeftMat=bubbleMaterial();
    const satRightMat=bubbleMaterial();
    satLeftMat.uniforms.uPointScale.value=1.9;
    satRightMat.uniforms.uPointScale.value=1.9;
    const satLeft=new THREE.Points(satLeftGeo,satLeftMat);
    const satRight=new THREE.Points(satRightGeo,satRightMat);
    satLeft.scale.setScalar(.56);satLeft.position.set(-4.18,.28,.26);
    satRight.scale.setScalar(.50);satRight.position.set(4.10,-.68,.20);
    sphereGroup.add(satLeft,satRight);
    disposables.push(satLeftGeo,satRightGeo,satLeftMat,satRightMat);

    const glowTex=circleTexture();
    const topGlowMat=new THREE.SpriteMaterial({map:glowTex,color:0xffffff,transparent:true,opacity:0,blending:THREE.AdditiveBlending,depthWrite:false});
    const topGlow=new THREE.Sprite(topGlowMat);
    topGlow.scale.set(.72,.72,1);topGlow.position.set(-.46,1.58,1.82);
    sphereGroup.add(topGlow);
    disposables.push(glowTex,topGlowMat);

    let raf=0;
    let last=performance.now();
    let renderedProgress=values.current.progress;
    let trackingProgress=renderedProgress;
    const look=new THREE.Vector3();

    const draw=(now:number)=>{
      raf=requestAnimationFrame(draw);
      const dt=Math.min(.05,(now-last)/1000);last=now;
      const time=now/1000;
      const v=values.current;
      renderedProgress+=(v.progress-renderedProgress)*Math.min(1,dt*3.1);
      trackingProgress+=(v.progress-trackingProgress)*Math.min(1,dt*5.1);
      const cameraX=renderedProgress*HISTORY_WORLD_LENGTH;
      const trackingX=trackingProgress*HISTORY_WORLD_LENGTH;
      const timelineAlpha=1-smooth(.08,.60,v.transition);
      const bubbleAlpha=(v.mode==='story'?smooth(.22,.80,v.transition):0)*clamp(1-v.storyScroll*1.65,.10,1);

      for(const record of lines){
        for(let i=0;i<SEGMENTS;i++){
          const x=i/(SEGMENTS-1)*HISTORY_WORLD_LENGTH;
          const sample=sampleMandoline(x,record.lane,time);
          record.arr[i*3]=sample.x;
          record.arr[i*3+1]=sample.y;
          record.arr[i*3+2]=sample.z;
        }
        (record.geo.attributes.position as THREE.BufferAttribute).needsUpdate=true;
        const mid=Math.abs(record.lane-(HISTORY_LINE_COUNT-1)/2)/((HISTORY_LINE_COUNT-1)/2);
        record.mat.opacity=(mid<.10?.78:.13*(1-mid*.30))*timelineAlpha;
      }

      for(let i=0;i<fireCount;i++){
        const sample=sampleMandoline(fireX[i],fireLane[i],time*.82);
        fireArr[i*3]=sample.x;
        fireArr[i*3+1]=sample.y+fireOffset[i]+Math.sin(time*.7+i*.41)*.08;
        fireArr[i*3+2]=sample.z+Math.cos(i*.37)*.16;
      }
      (fireGeo.attributes.position as THREE.BufferAttribute).needsUpdate=true;
      fireMat.opacity=.72*timelineAlpha;
      dustMat.opacity=.40*timelineAlpha;
      bokehMat.opacity=.15*timelineAlpha;

      const cameraSample=sampleMandoline(cameraX,15.5,time);
      const lookSample=sampleMandoline(Math.min(HISTORY_WORLD_LENGTH,trackingX+3.2),15.5,time);
      timelineCamera.position.x+=(cameraX-timelineCamera.position.x)*Math.min(1,dt*3.2);
      timelineCamera.position.y+=(cameraSample.y+.82-timelineCamera.position.y)*Math.min(1,dt*2.0);
      timelineCamera.position.z+=(10.85+cameraSample.spread*.34-timelineCamera.position.z)*Math.min(1,dt*1.8);
      look.set(lookSample.x,lookSample.y-.05,lookSample.z-.12);
      timelineCamera.lookAt(look);

      const enter=smooth(.18,.64,v.transition);
      const settle=smooth(.58,1,v.transition);
      const overshoot=Math.sin(Math.min(1,enter)*Math.PI)*.17;
      sphereGroup.scale.setScalar(.70+enter*.38+overshoot-settle*.08);
      sphereGroup.position.x=(1-enter)*.48;
      sphereGroup.position.y=-.66+enter*.76-v.storyScroll*.30;
      sphereGroup.rotation.y=time*.017+(v.seed%7)*.17;
      sphereGroup.rotation.x=Math.sin(time*.12)*.024;
      central.rotation.y=time*.021;
      central.rotation.x=Math.sin(time*.16)*.018;
      centralMat.uniforms.uTime.value=time;
      centralMat.uniforms.uAlpha.value=bubbleAlpha;
      centralMat.uniforms.uPointScale.value=2.55;

      const satelliteAlpha=bubbleAlpha*smooth(.66,.96,v.transition);
      satLeftMat.uniforms.uTime.value=time+.7;
      satRightMat.uniforms.uTime.value=time+1.4;
      satLeftMat.uniforms.uAlpha.value=satelliteAlpha;
      satRightMat.uniforms.uAlpha.value=satelliteAlpha;
      satLeft.rotation.y=time*.034;
      satRight.rotation.y=-time*.030;
      topGlowMat.opacity=bubbleAlpha*.43*(.78+.22*Math.sin(time*2.35));

      renderer.clear();
      if(timelineAlpha>.002)renderer.render(timelineScene,timelineCamera);
      if(bubbleAlpha>.002)renderer.render(bubbleScene,bubbleCamera);
    };

    draw(performance.now());

    const resize=()=>{
      const width=Math.max(1,host.clientWidth),height=Math.max(1,host.clientHeight);
      timelineCamera.aspect=width/height;bubbleCamera.aspect=width/height;
      timelineCamera.updateProjectionMatrix();bubbleCamera.updateProjectionMatrix();
      renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,3));
      renderer.setSize(width,height);
    };
    window.addEventListener('resize',resize);

    return()=>{
      cancelAnimationFrame(raf);
      window.removeEventListener('resize',resize);
      for(const disposable of disposables)disposable.dispose();
      renderer.dispose();
      renderer.domElement.remove();
    };
  },[]);

  return <div
    ref={mount}
    data-history-world
    data-history-mandoline
    data-lines={HISTORY_LINE_COUNT}
    aria-hidden="true"
    style={{position:'absolute',inset:0,pointerEvents:'none'}}
  />;
}
