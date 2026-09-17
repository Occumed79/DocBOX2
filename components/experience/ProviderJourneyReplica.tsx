'use client';

import Image from 'next/image';
import { useEffect, useRef, useState, type CSSProperties } from 'react';
import OryzoStoryWorld from './immersive/OryzoStoryWorld';
import ZeroTechPortalHub from './immersive/ZeroTechPortalHub';
import { PORTALS, STORY } from './ProviderJourneyStoryData';
import styles from './ProviderJourneyReplica.module.css';

const P='/photos/';
const clamp=(v:number,min=0,max=1)=>Math.max(min,Math.min(max,v));

function MaskedTitle({title}:{title:string}){
  return <h2 aria-label={title}>{title.split(/\s+/).map((word,index)=><span key={`${word}-${index}`} className={styles.word} data-story-word>{word}</span>)}</h2>;
}

export default function ProviderJourneyReplica(){
  const root=useRef<HTMLElement|null>(null);
  const [active,setActive]=useState(0);
  const [portalEntry,setPortalEntry]=useState(0);

  useEffect(()=>{
    const node=root.current;if(!node)return;
    const scenes=Array.from(node.querySelectorAll<HTMLElement>('[data-oryzo-scene]'));
    const arrival=node.querySelector<HTMLElement>('[data-zero-arrival]');
    const hero=node.querySelector<HTMLElement>('[data-oryzo-hero]');
    let raf=0;
    const update=()=>{
      raf=0;const vh=Math.max(1,window.innerHeight);let nearest=0,nearestDistance=Infinity;
      if(hero){const rect=hero.getBoundingClientRect();const p=clamp(-rect.top/Math.max(hero.offsetHeight-vh*.54,vh*.46));hero.style.setProperty('--hero-progress',p.toFixed(4))}
      scenes.forEach((scene,index)=>{
        const rect=scene.getBoundingClientRect();const p=clamp((vh-rect.top)/Math.max(vh+rect.height,1));scene.style.setProperty('--scene-progress',p.toFixed(4));
        const distance=Math.abs(rect.top+rect.height*.5-vh*.5);if(distance<nearestDistance){nearestDistance=distance;nearest=index}
        const enter=clamp((p-.03)/.24),leave=clamp((.98-p)/.22);scene.style.setProperty('--scene-alpha',Math.min(enter,leave).toFixed(4));
        Array.from(scene.querySelectorAll<HTMLElement>('[data-story-word]')).forEach((word,wordIndex)=>{
          const wordEnter=clamp((p-.04-Math.min(wordIndex,8)*.014)/.20);const wordLeave=clamp((.965-p-Math.min(wordIndex,7)*.004)/.19);const side=wordIndex%2===0?-1:1;
          const x=(1-wordEnter)*side*(54+wordIndex*8)+(1-wordLeave)*-side*32;const y=(1-wordEnter)*(wordIndex%3-1)*20+(1-wordLeave)*-26;
          word.style.transform=`translate3d(${x}px,${y}px,0)`;word.style.opacity=String(clamp(Math.min(wordEnter,wordLeave)*1.15));
        });
      });
      setActive(nearest);
      if(arrival){const rect=arrival.getBoundingClientRect();const p=clamp((vh-rect.top)/(vh*.92));setPortalEntry(v=>Math.abs(v-p)>.003?p:v)}
    };
    const queue=()=>{if(!raf)raf=requestAnimationFrame(update)};update();window.addEventListener('scroll',queue,{passive:true});window.addEventListener('resize',queue);
    return()=>{window.removeEventListener('scroll',queue);window.removeEventListener('resize',queue);if(raf)cancelAnimationFrame(raf)};
  },[]);

  return <main ref={root} className={styles.root} style={{'--portal-entry':portalEntry.toFixed(4)} as CSSProperties}>
    <div className={styles.storyWorld} aria-hidden="true"><OryzoStoryWorld sceneIndex={active}/></div>

    <section className={styles.hero} data-oryzo-hero>
      <div className={styles.heroTag}>OCCU-MED / EST. 1979</div>
      <div className={styles.heroTitle} aria-label="Built around the job"><span>Built</span><span>Around</span><em>The Job.</em></div>
      <p className={styles.heroCopy}>From one research question to a global medical network: what does this person actually need to do?</p>
      <div className={styles.heroMeta}><span>MEDICAL / DENTAL / DEPLOYMENT</span><span>SCROLL ↓</span></div>
    </section>

    <section className={styles.story} id="cinematic-story">
      {STORY.map((scene,index)=><section key={scene.chapter} id={`story-${index+1}`} className={styles.scene} data-oryzo-scene data-oryzo-scene-index={index} data-mode={scene.mode} style={{minHeight:`${scene.scrollVh}svh`} as CSSProperties}>
        <div className={styles.mobileMedia}>{scene.images.map((image,imageIndex)=><figure key={image} className={styles.mobileFrame} style={{'--image-index':imageIndex} as CSSProperties}><Image src={`${P}${encodeURIComponent(image)}`} alt={`${scene.title} — visual ${imageIndex+1} of ${scene.images.length}`} fill sizes="92vw"/></figure>)}</div>
        <div className={styles.copy}><span className={styles.chapter}>{scene.chapter}</span><MaskedTitle title={scene.title}/><p>{scene.body}</p></div>
        <aside className={styles.fact}><b>{scene.fact}</b><span>{scene.factLabel}</span></aside>
        <div className={styles.caption}><i/><span>{scene.caption}</span></div>
      </section>)}
    </section>

    <section id="provider-portals" className={styles.zeroArrival} data-zero-arrival data-scene-role="astronaut-portal-hub">
      <div className={styles.portalBridge} aria-hidden="true"><i/><i/><i/></div>
      <ZeroTechPortalHub portals={PORTALS} entryProgress={portalEntry}/>
    </section>
  </main>;
}
