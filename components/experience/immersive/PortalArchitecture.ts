import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

export type PortalArchitecture = {
  group: THREE.Group;
  update: (time:number,pointerX:number) => void;
};

const ASTRONAUT_URL='https://modelviewer.dev/shared-assets/models/Astronaut.glb';

export function addPortalArchitecture(scene:THREE.Scene):PortalArchitecture {
  const group=new THREE.Group();
  const dark=new THREE.MeshStandardMaterial({color:0x07141c,metalness:.56,roughness:.36});
  const dark2=new THREE.MeshStandardMaterial({color:0x0c202a,metalness:.46,roughness:.42});
  const cyan=new THREE.MeshBasicMaterial({color:0x62e6ff,transparent:true,opacity:.35,blending:THREE.AdditiveBlending});
  const violet=new THREE.MeshBasicMaterial({color:0x8067ff,transparent:true,opacity:.22,blending:THREE.AdditiveBlending});

  const platform=new THREE.Mesh(new THREE.CylinderGeometry(4.15,4.65,.38,72),dark);
  platform.position.y=-3.06;
  group.add(platform);

  const platformRing=new THREE.Mesh(new THREE.TorusGeometry(3.55,.035,10,128),cyan);
  platformRing.rotation.x=Math.PI/2;
  platformRing.position.y=-2.84;
  group.add(platformRing);

  const innerRing=new THREE.Mesh(new THREE.TorusGeometry(2.35,.018,8,120),violet);
  innerRing.rotation.x=Math.PI/2;
  innerRing.position.y=-2.82;
  group.add(innerRing);

  const astronautRoot=new THREE.Group();
  astronautRoot.position.z=.62;
  astronautRoot.visible=false;
  group.add(astronautRoot);

  const loader=new GLTFLoader();
  loader.load(ASTRONAUT_URL,gltf=>{
    const model=gltf.scene;
    model.traverse(object=>{
      const mesh=object as THREE.Mesh;
      if(!mesh.isMesh)return;
      mesh.castShadow=false;
      mesh.receiveShadow=false;
      const material=mesh.material;
      const apply=(mat:THREE.Material)=>{
        if('metalness' in mat)(mat as THREE.MeshStandardMaterial).metalness=Math.max((mat as THREE.MeshStandardMaterial).metalness??0,.08);
        if('roughness' in mat)(mat as THREE.MeshStandardMaterial).roughness=Math.min((mat as THREE.MeshStandardMaterial).roughness??1,.72);
      };
      if(Array.isArray(material))material.forEach(apply);else if(material)apply(material);
    });

    const box=new THREE.Box3().setFromObject(model);
    const size=box.getSize(new THREE.Vector3());
    const targetHeight=4.75;
    const scale=targetHeight/Math.max(size.y,.001);
    model.scale.setScalar(scale);

    const scaledBox=new THREE.Box3().setFromObject(model);
    const scaledCenter=scaledBox.getCenter(new THREE.Vector3());
    const scaledSize=scaledBox.getSize(new THREE.Vector3());
    model.position.x-=scaledCenter.x;
    model.position.z-=scaledCenter.z;
    model.position.y+=-2.82-(scaledCenter.y-scaledSize.y*.5);
    model.rotation.y=Math.PI*.03;

    astronautRoot.add(model);
    astronautRoot.visible=true;
  },undefined,()=>{
    astronautRoot.visible=false;
  });

  const monoliths:THREE.Group[]=[];
  for(let i=0;i<12;i++){
    // Keep the camera-to-traveler sightline open. The Zero-style architecture should frame the astronaut, not slice through the central silhouette.
    if(i===3||i===9)continue;
    const angle=(i/12)*Math.PI*2;
    const radius=i%2?8.3:9.7;
    const pylon=new THREE.Group();
    pylon.position.set(Math.cos(angle)*radius,-1.15,Math.sin(angle)*radius-4.2);
    pylon.rotation.y=-angle+Math.PI/2;

    const height=3.7+(i%4)*.72;
    const body=new THREE.Mesh(new THREE.BoxGeometry(.38,height,.86),i%3===0?dark2:dark);
    body.position.y=height*.5-1.65;
    pylon.add(body);

    const slit=new THREE.Mesh(new THREE.BoxGeometry(.025,height*.62,.38),i%3===0?violet:cyan);
    slit.position.set(.205,height*.5-1.5,.02);
    pylon.add(slit);

    const cap=new THREE.Mesh(new THREE.BoxGeometry(.62,.12,1.05),dark2);
    cap.position.y=height-1.62;
    pylon.add(cap);

    group.add(pylon);
    monoliths.push(pylon);
  }

  const arches:THREE.Mesh[]=[];
  for(let i=0;i<5;i++){
    const material=i%2?violet:cyan;
    const arch=new THREE.Mesh(new THREE.TorusGeometry(6.4+i*.82,.018,8,128,Math.PI*1.12),material);
    arch.position.set(0,1.1,-5.5-i*2.7);
    arch.rotation.set(0,i*.09,Math.PI*.94);
    group.add(arch);
    arches.push(arch);
  }

  const pathMaterial=new THREE.MeshBasicMaterial({color:0x66e4fa,transparent:true,opacity:.16,blending:THREE.AdditiveBlending});
  for(let i=0;i<7;i++){
    const strip=new THREE.Mesh(new THREE.BoxGeometry(.018,.008,13+i*1.8),pathMaterial);
    strip.position.set((i-3)*.42,-2.79,-3.5-i*.45);
    strip.rotation.x=.01;
    group.add(strip);
  }

  const ceiling=new THREE.Group();
  for(let i=0;i<8;i++){
    const blade=new THREE.Mesh(new THREE.BoxGeometry(.045,.45,6.5),i%2?violet:cyan);
    blade.position.set((i-3.5)*1.05,5.4,-6.5-i*.65);
    blade.rotation.z=(i-3.5)*.015;
    ceiling.add(blade);
  }
  group.add(ceiling);

  const distant=new THREE.Group();
  for(let i=0;i<18;i++){
    const h=1.7+Math.random()*4.4;
    const tower=new THREE.Mesh(new THREE.BoxGeometry(.18+Math.random()*.35,h,.18+Math.random()*.4),dark2);
    const angle=Math.random()*Math.PI*2;
    const radius=11+Math.random()*12;
    tower.position.set(Math.cos(angle)*radius,h*.5-3.0,Math.sin(angle)*radius-8);
    distant.add(tower);
  }
  group.add(distant);

  scene.add(group);

  return {
    group,
    update(time,pointerX){
      platformRing.rotation.z=time*.035;
      innerRing.rotation.z=-time*.024;
      arches.forEach((arch,i)=>{arch.rotation.y=i*.09+Math.sin(time*.16+i)*.025});
      monoliths.forEach((pylon,i)=>{pylon.position.y=Math.sin(time*.22+i)*.035-1.15});
      ceiling.rotation.y=Math.sin(time*.08)*.015+pointerX*.006;
      distant.rotation.y=Math.sin(time*.035)*.01;
      if(astronautRoot.visible){
        astronautRoot.rotation.y=Math.sin(time*.28)*.045+pointerX*.022;
        astronautRoot.position.y=Math.sin(time*.7)*.025;
      }
    }
  };
}
