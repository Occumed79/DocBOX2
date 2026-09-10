import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

export type PortalArchitecture = {
  group: THREE.Group;
  update: (time:number,pointerX:number) => void;
};

const ASTRONAUT_URL='https://modelviewer.dev/shared-assets/models/Astronaut.glb';

function buildFallbackTraveler(){
  const traveler=new THREE.Group();
  const suit=new THREE.MeshStandardMaterial({color:0xdce8ed,roughness:.42,metalness:.18});
  const dark=new THREE.MeshStandardMaterial({color:0x213844,roughness:.48,metalness:.24});
  const visorMat=new THREE.MeshStandardMaterial({color:0x06141d,metalness:.88,roughness:.08,emissive:0x124b63,emissiveIntensity:.7});
  const glow=new THREE.MeshStandardMaterial({color:0xc9f7ff,emissive:0x58dfff,emissiveIntensity:2.5,roughness:.18,metalness:.28});

  const torso=new THREE.Mesh(new THREE.CapsuleGeometry(.62,1.1,8,20),suit);torso.position.y=-.35;traveler.add(torso);
  const chest=new THREE.Mesh(new THREE.BoxGeometry(.72,.38,.14),dark);chest.position.set(0,-.12,.58);traveler.add(chest);
  const chestLight=new THREE.Mesh(new THREE.BoxGeometry(.36,.055,.035),glow);chestLight.position.set(.06,-.08,.665);traveler.add(chestLight);
  const helmetShell=new THREE.Mesh(new THREE.SphereGeometry(.72,36,24),suit);helmetShell.position.y=1.05;traveler.add(helmetShell);
  const visor=new THREE.Mesh(new THREE.SphereGeometry(.6,36,20,0,Math.PI*2,0,Math.PI*.53),visorMat);visor.position.set(0,1.03,.34);visor.rotation.x=Math.PI/2;traveler.add(visor);
  const neck=new THREE.Mesh(new THREE.CylinderGeometry(.34,.42,.16,24),dark);neck.position.y=.52;traveler.add(neck);
  const backpack=new THREE.Mesh(new THREE.BoxGeometry(.95,1.35,.42),dark);backpack.position.set(0,-.3,-.58);traveler.add(backpack);

  [-1,1].forEach(side=>{
    const shoulder=new THREE.Mesh(new THREE.SphereGeometry(.25,16,12),suit);shoulder.position.set(side*.73,.15,0);traveler.add(shoulder);
    const arm=new THREE.Mesh(new THREE.CapsuleGeometry(.16,.75,6,12),suit);arm.position.set(side*.9,-.38,0);arm.rotation.z=side*.12;traveler.add(arm);
    const glove=new THREE.Mesh(new THREE.SphereGeometry(.18,14,10),dark);glove.position.set(side*.98,-.88,.03);traveler.add(glove);
    const leg=new THREE.Mesh(new THREE.CapsuleGeometry(.2,.95,7,14),suit);leg.position.set(side*.3,-1.65,0);leg.rotation.z=side*.03;traveler.add(leg);
    const boot=new THREE.Mesh(new THREE.BoxGeometry(.4,.25,.65),dark);boot.position.set(side*.3,-2.32,.12);traveler.add(boot);
  });

  const hose=new THREE.Mesh(new THREE.TorusGeometry(.52,.03,8,36,Math.PI*1.25),new THREE.MeshStandardMaterial({color:0x6d8793,metalness:.45,roughness:.4}));hose.position.set(.56,-.08,-.2);hose.rotation.set(.2,1.05,.5);traveler.add(hose);
  traveler.scale.setScalar(.98);
  return traveler;
}

export function addPortalArchitecture(scene:THREE.Scene):PortalArchitecture {
  const group=new THREE.Group();
  const dark=new THREE.MeshStandardMaterial({color:0x07141c,metalness:.56,roughness:.36});
  const dark2=new THREE.MeshStandardMaterial({color:0x0c202a,metalness:.46,roughness:.42});
  const cyan=new THREE.MeshBasicMaterial({color:0x62e6ff,transparent:true,opacity:.35,blending:THREE.AdditiveBlending});
  const violet=new THREE.MeshBasicMaterial({color:0x8067ff,transparent:true,opacity:.22,blending:THREE.AdditiveBlending});

  const platform=new THREE.Mesh(new THREE.CylinderGeometry(4.15,4.65,.38,72),dark);platform.position.y=-3.06;group.add(platform);
  const platformRing=new THREE.Mesh(new THREE.TorusGeometry(3.55,.035,10,128),cyan);platformRing.rotation.x=Math.PI/2;platformRing.position.y=-2.84;group.add(platformRing);
  const innerRing=new THREE.Mesh(new THREE.TorusGeometry(2.35,.018,8,120),violet);innerRing.rotation.x=Math.PI/2;innerRing.position.y=-2.82;group.add(innerRing);

  const travelerRoot=new THREE.Group();travelerRoot.position.z=.62;group.add(travelerRoot);
  const fallback=buildFallbackTraveler();fallback.position.y=-.38;travelerRoot.add(fallback);
  let mixer:THREE.AnimationMixer|null=null;
  let lastTime=0;

  const loader=new GLTFLoader();
  loader.load(ASTRONAUT_URL,gltf=>{
    const model=gltf.scene;
    model.traverse(object=>{
      const mesh=object as THREE.Mesh;if(!mesh.isMesh)return;
      mesh.castShadow=false;mesh.receiveShadow=false;
      const material=mesh.material;
      const apply=(mat:THREE.Material)=>{
        if('metalness' in mat)(mat as THREE.MeshStandardMaterial).metalness=Math.max((mat as THREE.MeshStandardMaterial).metalness??0,.08);
        if('roughness' in mat)(mat as THREE.MeshStandardMaterial).roughness=Math.min((mat as THREE.MeshStandardMaterial).roughness??1,.72);
      };
      if(Array.isArray(material))material.forEach(apply);else if(material)apply(material);
    });

    const box=new THREE.Box3().setFromObject(model);const size=box.getSize(new THREE.Vector3());const targetHeight=4.75;const scale=targetHeight/Math.max(size.y,.001);model.scale.setScalar(scale);
    const scaledBox=new THREE.Box3().setFromObject(model);const scaledCenter=scaledBox.getCenter(new THREE.Vector3());const scaledSize=scaledBox.getSize(new THREE.Vector3());
    model.position.x-=scaledCenter.x;model.position.z-=scaledCenter.z;model.position.y+=-2.82-(scaledCenter.y-scaledSize.y*.5);model.rotation.y=Math.PI*.03;
    fallback.visible=false;travelerRoot.add(model);
    if(gltf.animations.length){mixer=new THREE.AnimationMixer(model);mixer.clipAction(gltf.animations[0]).play()}
  },undefined,()=>{fallback.visible=true});

  const monoliths:THREE.Group[]=[];
  for(let i=0;i<12;i++){
    if(i===3||i===9)continue;
    const angle=(i/12)*Math.PI*2;const radius=i%2?8.3:9.7;const pylon=new THREE.Group();pylon.position.set(Math.cos(angle)*radius,-1.15,Math.sin(angle)*radius-4.2);pylon.rotation.y=-angle+Math.PI/2;
    const height=3.7+(i%4)*.72;const body=new THREE.Mesh(new THREE.BoxGeometry(.38,height,.86),i%3===0?dark2:dark);body.position.y=height*.5-1.65;pylon.add(body);
    const slit=new THREE.Mesh(new THREE.BoxGeometry(.025,height*.62,.38),i%3===0?violet:cyan);slit.position.set(.205,height*.5-1.5,.02);pylon.add(slit);
    const cap=new THREE.Mesh(new THREE.BoxGeometry(.62,.12,1.05),dark2);cap.position.y=height-1.62;pylon.add(cap);group.add(pylon);monoliths.push(pylon);
  }

  const arches:THREE.Mesh[]=[];
  for(let i=0;i<5;i++){
    const material=i%2?violet:cyan;const arch=new THREE.Mesh(new THREE.TorusGeometry(6.4+i*.82,.018,8,128,Math.PI*1.12),material);arch.position.set(0,1.1,-5.5-i*2.7);arch.rotation.set(0,i*.09,Math.PI*.94);group.add(arch);arches.push(arch);
  }

  const pathMaterial=new THREE.MeshBasicMaterial({color:0x66e4fa,transparent:true,opacity:.16,blending:THREE.AdditiveBlending});
  for(let i=0;i<7;i++){const strip=new THREE.Mesh(new THREE.BoxGeometry(.018,.008,13+i*1.8),pathMaterial);strip.position.set((i-3)*.42,-2.79,-3.5-i*.45);strip.rotation.x=.01;group.add(strip)}

  const ceiling=new THREE.Group();
  for(let i=0;i<8;i++){const blade=new THREE.Mesh(new THREE.BoxGeometry(.045,.45,6.5),i%2?violet:cyan);blade.position.set((i-3.5)*1.05,5.4,-6.5-i*.65);blade.rotation.z=(i-3.5)*.015;ceiling.add(blade)}
  group.add(ceiling);

  const distant=new THREE.Group();
  for(let i=0;i<18;i++){const h=1.7+Math.random()*4.4;const tower=new THREE.Mesh(new THREE.BoxGeometry(.18+Math.random()*.35,h,.18+Math.random()*.4),dark2);const angle=Math.random()*Math.PI*2;const radius=11+Math.random()*12;tower.position.set(Math.cos(angle)*radius,h*.5-3.0,Math.sin(angle)*radius-8);distant.add(tower)}
  group.add(distant);

  const foreground=new THREE.Group();
  for(let i=0;i<6;i++){
    const side=i%2===0?-1:1;const frame=new THREE.Group();frame.position.set(side*(8.8+(i%3)*2.2),-.35,5.5-i*4.8);frame.rotation.set(0,side*(.12+i*.018),side*.025);
    const column=new THREE.Mesh(new THREE.BoxGeometry(.72,10.5,1.4),i%3===0?dark2:dark);column.position.y=.6;frame.add(column);
    const beam=new THREE.Mesh(new THREE.BoxGeometry(8.2,.48,1.1),i%3===0?dark2:dark);beam.position.set(-side*3.7,5.55,0);frame.add(beam);
    const edge=new THREE.Mesh(new THREE.BoxGeometry(.035,8.4,.08),i%2?violet:cyan);edge.position.set(-side*.39,.85,.72);frame.add(edge);foreground.add(frame);
  }
  group.add(foreground);

  const suspended:THREE.Mesh[]=[];
  for(let i=0;i<9;i++){const panel=new THREE.Mesh(new THREE.PlaneGeometry(.8+i%3*.5,2.1+i%2*.9),i%2?violet:cyan);panel.position.set((i%2?-1:1)*(6.2+(i%4)*1.35),1.2+(i%3)*1.55,-4-i*3.4);panel.rotation.y=(i%2?-1:1)*(.45+i*.035);group.add(panel);suspended.push(panel)}

  scene.add(group);

  return {
    group,
    update(time,pointerX){
      const delta=lastTime?Math.min(.05,Math.max(0,time-lastTime)):0;lastTime=time;mixer?.update(delta);
      platformRing.rotation.z=time*.035;innerRing.rotation.z=-time*.024;
      arches.forEach((arch,i)=>{arch.rotation.y=i*.09+Math.sin(time*.16+i)*.025});
      monoliths.forEach((pylon,i)=>{pylon.position.y=Math.sin(time*.22+i)*.035-1.15});
      ceiling.rotation.y=Math.sin(time*.08)*.015+pointerX*.006;distant.rotation.y=Math.sin(time*.035)*.01;foreground.position.z=Math.sin(time*.08)*.12;
      suspended.forEach((panel,i)=>{panel.position.y+=Math.sin(time*.28+i)*.0008;panel.rotation.z=Math.sin(time*.18+i)*.025});
      travelerRoot.rotation.y=Math.sin(time*.28)*.045+pointerX*.022;travelerRoot.position.y=Math.sin(time*.7)*.025;
      if(fallback.visible){fallback.rotation.z=Math.sin(time*.45)*.012;fallback.rotation.x=Math.sin(time*.32)*.008}
    }
  };
}
