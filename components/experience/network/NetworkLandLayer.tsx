'use client';

import { createPortal } from 'react-dom';
import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react';
import styles from './NetworkLandLayer.module.css';

type Position = [number, number];
type Polygon = Position[][];
type MultiPolygon = Position[][][];
type Geometry = { type: 'Polygon'; coordinates: Polygon } | { type: 'MultiPolygon'; coordinates: MultiPolygon };
type FeatureCollection = { features?: Array<{ geometry?: Geometry | null }> };

type View = { zoom: number; panX: number; panY: number };

const SOURCE = 'https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_110m_land.geojson';
const clamp = (value:number,min:number,max:number)=>Math.min(max,Math.max(min,value));

function project(lon:number,lat:number,width:number,height:number,view:View){
  const baseX=((lon+180)/360)*width;
  const baseY=((90-lat)/180)*height;
  return {
    x:(baseX-width/2)*view.zoom+width/2+view.panX,
    y:(baseY-height/2)*view.zoom+height/2+view.panY,
  };
}

function drawRing(ctx:CanvasRenderingContext2D,ring:Position[],width:number,height:number,view:View){
  if(!ring.length)return;
  let started=false;
  for(const coordinate of ring){
    const p=project(coordinate[0],coordinate[1],width,height,view);
    if(!started){ctx.moveTo(p.x,p.y);started=true}else ctx.lineTo(p.x,p.y);
  }
  ctx.closePath();
}

export default function NetworkLandLayer(){
  const [host,setHost]=useState<HTMLElement|null>(null);
  const canvasRef=useRef<HTMLCanvasElement|null>(null);
  const landRef=useRef<FeatureCollection|null>(null);
  const viewRef=useRef<View>({zoom:1,panX:0,panY:0});
  const dragRef=useRef<{x:number;y:number;panX:number;panY:number}|null>(null);
  const rafRef=useRef(0);

  useEffect(()=>{
    let cancelled=false;
    const locate=()=>{
      if(cancelled)return;
      const pointCanvas=document.querySelector<HTMLCanvasElement>('main canvas');
      const parent=pointCanvas?.parentElement;
      if(parent){
        const position=getComputedStyle(parent).position;
        if(position==='static')parent.style.position='relative';
        setHost(parent);
        return;
      }
      window.setTimeout(locate,120);
    };
    locate();
    return()=>{cancelled=true};
  },[]);

  useEffect(()=>{
    let cancelled=false;
    fetch(SOURCE,{cache:'force-cache'})
      .then(response=>{if(!response.ok)throw new Error('Natural Earth land layer unavailable');return response.json()})
      .then((payload:FeatureCollection)=>{if(cancelled)return;landRef.current=payload;window.dispatchEvent(new Event('docbox:network-land-ready'))})
      .catch(()=>{landRef.current=null});
    return()=>{cancelled=true};
  },[]);

  useEffect(()=>{
    if(!host)return;
    const canvas=canvasRef.current;
    if(!canvas)return;

    const draw=()=>{
      rafRef.current=0;
      const rect=host.getBoundingClientRect();
      const width=Math.max(1,Math.floor(rect.width));
      const height=Math.max(1,Math.floor(rect.height));
      const dpr=Math.min(window.devicePixelRatio||1,2);
      canvas.width=Math.floor(width*dpr);
      canvas.height=Math.floor(height*dpr);
      canvas.style.width=`${width}px`;
      canvas.style.height=`${height}px`;
      const ctx=canvas.getContext('2d');
      if(!ctx)return;
      ctx.setTransform(dpr,0,0,dpr,0,0);
      ctx.clearRect(0,0,width,height);

      const view=viewRef.current;
      ctx.save();
      ctx.beginPath();
      ctx.strokeStyle='rgba(128,225,241,.34)';
      ctx.fillStyle='rgba(41,105,119,.18)';
      ctx.lineWidth=Math.max(.55,Math.min(1.4,.7*Math.sqrt(view.zoom)));

      for(const feature of landRef.current?.features??[]){
        const geometry=feature.geometry;
        if(!geometry)continue;
        if(geometry.type==='Polygon'){
          for(const ring of geometry.coordinates)drawRing(ctx,ring,width,height,view);
        }else{
          for(const polygon of geometry.coordinates){
            for(const ring of polygon)drawRing(ctx,ring,width,height,view);
          }
        }
      }
      ctx.fill('evenodd');
      ctx.stroke();

      // Latitude/longitude reference lines make geography legible without turning the atlas into a dashboard.
      ctx.strokeStyle='rgba(118,215,233,.075)';
      ctx.lineWidth=.6;
      for(let lon=-120;lon<=120;lon+=60){
        ctx.beginPath();
        const a=project(lon,-80,width,height,view);const b=project(lon,80,width,height,view);
        ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.stroke();
      }
      for(let lat=-60;lat<=60;lat+=30){
        ctx.beginPath();
        const a=project(-180,lat,width,height,view);const b=project(180,lat,width,height,view);
        ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.stroke();
      }
      ctx.restore();
    };

    const queue=()=>{if(!rafRef.current)rafRef.current=requestAnimationFrame(draw)};
    const onDown=(event:PointerEvent)=>{
      dragRef.current={x:event.clientX,y:event.clientY,panX:viewRef.current.panX,panY:viewRef.current.panY};
    };
    const onMove=(event:PointerEvent)=>{
      const drag=dragRef.current;if(!drag)return;
      viewRef.current={...viewRef.current,panX:drag.panX+event.clientX-drag.x,panY:drag.panY+event.clientY-drag.y};
      queue();
    };
    const onUp=()=>{dragRef.current=null};
    const onWheel=(event:WheelEvent)=>{
      viewRef.current={...viewRef.current,zoom:clamp(viewRef.current.zoom*(event.deltaY>0?.9:1.1),.8,5)};
      queue();
    };
    const onClick=(event:MouseEvent)=>{
      const target=event.target as HTMLElement|null;
      if(target?.closest('button')?.textContent?.toLowerCase().includes('reset')){
        viewRef.current={zoom:1,panX:0,panY:0};queue();
      }
    };
    const observer=new ResizeObserver(queue);
    observer.observe(host);
    host.addEventListener('pointerdown',onDown);
    host.addEventListener('pointermove',onMove);
    host.addEventListener('pointerup',onUp);
    host.addEventListener('pointercancel',onUp);
    host.addEventListener('wheel',onWheel,{passive:true});
    host.addEventListener('click',onClick);
    window.addEventListener('docbox:network-land-ready',queue);
    queue();

    return()=>{
      observer.disconnect();
      host.removeEventListener('pointerdown',onDown);
      host.removeEventListener('pointermove',onMove);
      host.removeEventListener('pointerup',onUp);
      host.removeEventListener('pointercancel',onUp);
      host.removeEventListener('wheel',onWheel);
      host.removeEventListener('click',onClick);
      window.removeEventListener('docbox:network-land-ready',queue);
      if(rafRef.current)cancelAnimationFrame(rafRef.current);
    };
  },[host]);

  if(!host)return null;
  return createPortal(<canvas ref={canvasRef} className={styles.layer} aria-hidden="true"/>,host);
}
