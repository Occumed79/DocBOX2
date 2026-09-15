'use client';

import Image from 'next/image';
import {useEffect,useMemo,useRef,useState,type CSSProperties,type PointerEvent as ReactPointerEvent} from 'react';
import HistoryWorld from '../immersive/HistoryWorld';
import {sampleMandolineForProgress} from '../immersive/historyMandoline';
import {HISTORY_CATEGORIES,HISTORY_ITEMS,historyItemById,type HistoryCategory,type HistoryItem} from './historyData';
import {applyWheelDelta,clampHistoryProgress,HISTORY_TRANSITION_MS,nearestHistoryItem,smoothHistoryStep} from './historyMath';
import styles from './HistoryExperience.module.css';

function nodeScreenY(item:HistoryItem){
  const sample=sampleMandolineForProgress(item.position,item.lane,0);
  return Math.max(28,Math.min(78,52-sample.y*5.1));
}

export default function HistoryExperience(){
  const root=useRef<HTMLElement>(null);
  const drag=useRef<{x:number;value:number}|null>(null);
  const progressRef=useRef(0);
  const targetRef=useRef(0);
  const rafRef=useRef(0);
  const transitionRaf=useRef(0);
  const transitionStart=useRef(0);
  const storyScroller=useRef<HTMLDivElement>(null);

  const [progress,setProgress]=useState(0);
  const [hovered,setHovered]=useState<string|null>(null);
  const [selectedId,setSelectedId]=useState<string|null>(null);
  const [transition,setTransition]=useState(0);
  const [storyScroll,setStoryScroll]=useState(0);
  const [filterOpen,setFilterOpen]=useState(false);
  const [filter,setFilter]=useState<'ALL'|HistoryCategory>('ALL');
  const [sound,setSound]=useState(false);
  const [accessible,setAccessible]=useState(false);

  const selected=useMemo(()=>historyItemById(selectedId),[selectedId]);
  const filteredItems=useMemo(
    ()=>filter==='ALL'?HISTORY_ITEMS:HISTORY_ITEMS.filter(item=>item.category===filter),
    [filter]
  );
  const related=useMemo(
    ()=>selected?.related?.map(historyItemById).filter((item):item is HistoryItem=>Boolean(item))??[],
    [selected]
  );

  useEffect(()=>{
    const animate=()=>{
      const difference=targetRef.current-progressRef.current;
      progressRef.current+=difference*.03;
      if(Math.abs(difference)<.00008)progressRef.current=targetRef.current;
      setProgress(progressRef.current);
      rafRef.current=requestAnimationFrame(animate);
    };
    rafRef.current=requestAnimationFrame(animate);
    return()=>cancelAnimationFrame(rafRef.current);
  },[]);

  useEffect(()=>{
    const node=root.current;
    if(!node||selectedId)return;
    const onWheel=(event:WheelEvent)=>{
      event.preventDefault();
      targetRef.current=applyWheelDelta(targetRef.current,event.deltaY);
    };
    const onKey=(event:KeyboardEvent)=>{
      if(event.key==='ArrowRight'||event.key==='PageDown'){
        event.preventDefault();targetRef.current=clampHistoryProgress(targetRef.current+.035);
      }
      if(event.key==='ArrowLeft'||event.key==='PageUp'){
        event.preventDefault();targetRef.current=clampHistoryProgress(targetRef.current-.035);
      }
      if(event.key==='Home'){event.preventDefault();targetRef.current=0;}
      if(event.key==='End'){event.preventDefault();targetRef.current=1;}
    };
    node.addEventListener('wheel',onWheel,{passive:false});
    window.addEventListener('keydown',onKey);
    return()=>{
      node.removeEventListener('wheel',onWheel);
      window.removeEventListener('keydown',onKey);
    };
  },[selectedId]);

  useEffect(()=>()=>{
    if(transitionRaf.current)cancelAnimationFrame(transitionRaf.current);
  },[]);

  const focusItem=(item:HistoryItem)=>{
    targetRef.current=item.position;
  };

  const openItem=(item:HistoryItem)=>{
    targetRef.current=item.position;
    setHovered(null);
    setFilterOpen(false);

    if(selected?.kind==='story'&&item.kind==='story'){
      setSelectedId(item.id);
      setStoryScroll(0);
      setTransition(1);
      requestAnimationFrame(()=>storyScroller.current?.scrollTo({top:0,behavior:'smooth'}));
      return;
    }

    setSelectedId(item.id);
    setStoryScroll(0);
    setTransition(0);
    requestAnimationFrame(()=>storyScroller.current?.scrollTo({top:0}));
    transitionStart.current=performance.now();
    const tick=(now:number)=>{
      const t=clampHistoryProgress((now-transitionStart.current)/HISTORY_TRANSITION_MS);
      setTransition(smoothHistoryStep(t));
      if(t<1)transitionRaf.current=requestAnimationFrame(tick);
    };
    transitionRaf.current=requestAnimationFrame(tick);
  };

  const closeStory=()=>{
    if(transitionRaf.current)cancelAnimationFrame(transitionRaf.current);
    const started=performance.now();
    const from=transition;
    const tick=(now:number)=>{
      const t=clampHistoryProgress((now-started)/850);
      setTransition(from*(1-smoothHistoryStep(t)));
      if(t<1)transitionRaf.current=requestAnimationFrame(tick);
      else{
        setSelectedId(null);
        setStoryScroll(0);
      }
    };
    transitionRaf.current=requestAnimationFrame(tick);
  };

  const onStoryScroll=()=>{
    const element=storyScroller.current;
    if(!element)return;
    setStoryScroll(clampHistoryProgress(element.scrollTop/Math.max(1,element.clientHeight)));
  };

  const pointerDown=(event:ReactPointerEvent<HTMLElement>)=>{
    if(selectedId)return;
    drag.current={x:event.clientX,value:targetRef.current};
    event.currentTarget.setPointerCapture?.(event.pointerId);
  };

  const pointerMove=(event:ReactPointerEvent<HTMLElement>)=>{
    if(!drag.current||selectedId)return;
    targetRef.current=clampHistoryProgress(
      drag.current.value-(event.clientX-drag.current.x)/Math.max(500,window.innerWidth)*.92
    );
  };

  const pointerUp=()=>{drag.current=null;};

  const selectFilter=(category:'ALL'|HistoryCategory)=>{
    setFilter(category);
    setFilterOpen(false);
    const candidates=category==='ALL'?HISTORY_ITEMS:HISTORY_ITEMS.filter(item=>item.category===category);
    const nearest=nearestHistoryItem(candidates,progressRef.current);
    if(nearest)targetRef.current=nearest.position;
  };

  return <main
    ref={root}
    className={styles.root}
    style={{'--history-progress':progress} as CSSProperties}
    onPointerDown={pointerDown}
    onPointerMove={pointerMove}
    onPointerUp={pointerUp}
    onPointerCancel={pointerUp}
  >
    <HistoryWorld
      progress={progress}
      transition={transition}
      mode={selected?.kind??'timeline'}
      storyScroll={storyScroll}
      seed={selected?HISTORY_ITEMS.indexOf(selected):0}
    />
    <div className={styles.vignette}/>

    <header className={styles.header}>
      <a className={styles.brand} href="/experience#provider-portals"><span>OCCU-MED</span><i/></a>
      <button className={styles.backTop} onClick={selected?closeStory:()=>window.location.assign('/experience#provider-portals')}>
        {selected?'BACK TO EXPERIENCE':'HISTORY & EVOLUTION'}
      </button>
      <button className={styles.sound} aria-pressed={sound} onClick={()=>setSound(value=>!value)}>
        {sound?'SOUND ON':'SOUND OFF'}
      </button>
    </header>

    {!selected&&<>
      <div className={styles.filterWrap} data-open={filterOpen||undefined}>
        <button className={styles.filterCurrent} aria-expanded={filterOpen} onClick={()=>setFilterOpen(value=>!value)}>
          <span>{filter==='ALL'?'FILTER':filter}</span><i/>
        </button>
        <div className={styles.filterList}>
          {HISTORY_CATEGORIES.map((category,index)=><button
            key={category}
            style={{'--delay':`${index*.06}s`} as CSSProperties}
            data-active={filter===category||undefined}
            onClick={()=>selectFilter(category)}
          >{category}</button>)}
        </div>
      </div>

      <nav className={styles.timelineOverlay} aria-label="Occu-Med history timeline">
        {filteredItems.map(item=>{
          const x=50+(item.position-progress)*128;
          const y=nodeScreenY(item);
          const visible=x>-18&&x<118;
          const isHover=hovered===item.id;
          return <button
            key={item.id}
            className={item.kind==='milestone'?styles.milestoneNode:styles.storyNode}
            data-history-node
            data-category={item.category}
            data-kind={item.kind}
            data-hover={isHover||undefined}
            onMouseEnter={()=>setHovered(item.id)}
            onMouseLeave={()=>setHovered(null)}
            onFocus={()=>{setHovered(item.id);focusItem(item);}}
            onBlur={()=>setHovered(null)}
            onClick={event=>{event.stopPropagation();openItem(item);}}
            style={{left:`${x}%`,top:`${y}%`,opacity:visible?1:0,pointerEvents:visible?'auto':'none'} as CSSProperties}
          >
            <i className={styles.nodeCore}/>
            {item.kind==='milestone'&&<>
              <i className={styles.nodeRing}/><i className={styles.nodeRing2}/><i className={styles.nodeRing3}/><i className={styles.nodeRing4}/>
            </>}
            <span className={styles.nodeLabel}><b>{item.year}</b><strong>{item.title}</strong><em>{item.category}</em></span>
          </button>;
        })}
      </nav>

      <div className={styles.navigationHint}><span>DRAG OR SCROLL TO EXPLORE</span><i/></div>
      <div className={styles.progressYears}><span>1979</span><i><b style={{transform:`scaleX(${progress})`}}/></i><span>TODAY</span></div>
      <button className={styles.accessibleToggle} onClick={()=>setAccessible(true)}>MILESTONES / STORIES</button>
    </>}

    {selected&&<div
      ref={storyScroller}
      className={styles.storyScroller}
      onScroll={onStoryScroll}
      data-kind={selected.kind}
      data-story-mode={selected.kind==='story'?'bubble':'milestone'}
    >
      <section className={selected.kind==='story'?styles.bubbleHero:styles.milestoneHero}>
        {selected.kind==='story'?<>
          <svg className={styles.relatedPaths} viewBox="0 0 1000 560" preserveAspectRatio="none" aria-hidden="true">
            <path d="M0,325 C190,405 280,215 430,305 S720,420 1000,292"/>
            <path d="M0,265 C150,190 265,385 438,292 S720,162 1000,240"/>
          </svg>
          <div className={styles.bubbleTitle}><span>{selected.category}</span><h1>{selected.title}</h1></div>
          <div className={styles.bubbleMeta}><i/><div><b>{selected.person??selected.year}</b><span>{selected.detail??selected.summary}</span></div></div>
          {related.slice(0,2).map((item,index)=><button
            key={item.id}
            className={styles.relatedBubble}
            data-side={index===0?'left':'right'}
            onClick={()=>openItem(item)}
          ><i/><strong>{item.title}</strong><span>{item.category}</span></button>)}
          <div className={styles.scrollRead}>SCROLL TO READ CONTENT <i/></div>
        </>:<>
          <div className={styles.milestoneEyebrow}><span>{selected.year}</span><b>{selected.category}</b></div>
          <h1>{selected.title}</h1>
          <p>{selected.summary}</p>
          {selected.image&&<figure className={styles.milestoneImage}>
            <Image src={`/photos/${encodeURIComponent(selected.image)}`} alt="" fill sizes="74vw" priority/>
          </figure>}
          <div className={styles.scrollRead}>SCROLL TO READ CONTENT <i/></div>
        </>}
      </section>

      <article className={styles.storyContent}>
        <div className={styles.storyContentGrid}>
          <aside><span>{selected.kind==='story'?'COMPANY STORY':'MILESTONE'}</span><b>{selected.year}</b><em>{selected.category}</em></aside>
          <div><h2>{selected.title}</h2><p>{selected.body}</p></div>
        </div>
        {related.length>0&&<section className={styles.relatedMemories}>
          <h3>Related memories</h3>
          <div>{related.map(item=><button key={item.id} onClick={()=>openItem(item)}><i/><span>{item.year}</span><strong>{item.title}</strong><em>{item.category}</em></button>)}</div>
        </section>}
        <footer className={styles.storyFooter}>
          <button onClick={closeStory}>BACK TO EXPERIENCE</button>
          <a href="/experience#provider-portals">EXIT HISTORY & EVOLUTION</a>
        </footer>
      </article>
    </div>}

    {accessible&&<section className={styles.accessiblePanel} role="dialog" aria-modal="true" aria-label="History milestones and company stories">
      <header><div><span>OCCU-MED</span><h2>History & Evolution</h2></div><button onClick={()=>setAccessible(false)}>CLOSE ×</button></header>
      <div className={styles.accessibleTabs}><b>MILESTONES</b><span>COMPANY STORIES</span></div>
      <div className={styles.accessibleRows}>{HISTORY_ITEMS.map(item=><button
        key={item.id}
        onClick={()=>{setAccessible(false);focusItem(item);openItem(item);}}
      ><span>{item.kind==='milestone'?item.year:'STORY'}</span><strong>{item.title}</strong><em>{item.category}</em><b>→</b></button>)}</div>
    </section>}
  </main>;
}
