'use client';

import Script from 'next/script';
import { useEffect, useRef, useState } from 'react';
import styles from './CesiumNetworkGlobe.module.css';

declare global{interface Window{Cesium?:any;CESIUM_BASE_URL?:string}}

type Layer='all'|'medical'|'dental'|'diagnostic'|'pharmacy';
type Point={lon:number;lat:number;type:Layer;label?:string;count?:number};
type RegionFocus={lon:number;lat:number;height:number;nonce:number};
type Hover={x:number;y:number;title:string;detail:string}|null;
type Props={points:readonly Point[];layer:Layer;mode:'coordinates'|'aggregate'|'loading';focus?:RegionFocus;onExplore?:()=>void};

const BASE='https://cesium.com/downloads/cesiumjs/releases/1.143/Build/Cesium/';
const SOURCE=`${BASE}Cesium.js`;
const WIDGET_CSS=`${BASE}Widgets/widgets.css`;
const COLORS:Record<Exclude<Layer,'all'>,string>={medical:'#7fe8ff',dental:'#b48bff',diagnostic:'#8ab5ff',pharmacy:'#e7be74'};
const LABELS:Record<Exclude<Layer,'all'>,string>={medical:'Medical',dental:'Dental',diagnostic:'Diagnostics',pharmacy:'Pharmacy'};

function pointType(type:Layer):Exclude<Layer,'all'>{return type==='all'?'medical':type}

if(typeof window!=='undefined')window.CESIUM_BASE_URL=BASE;

export default function CesiumNetworkGlobe({points,layer,mode,focus,onExplore}:Props){
  const hostRef=useRef<HTMLDivElement|null>(null);
  const viewerRef=useRef<any>(null);
  const pointCollectionRef=useRef<any>(null);
  const interactionTimerRef=useRef<ReturnType<typeof setTimeout>|null>(null);
  const autoRotateRef=useRef(true);
  const[loaded,setLoaded]=useState(Boolean(typeof window!=='undefined'&&window.Cesium));
  const[ready,setReady]=useState(false);
  const[error,setError]=useState(false);
  const[hover,setHover]=useState<Hover>(null);
  const[visibleCount,setVisibleCount]=useState(0);
  const token=process.env.NEXT_PUBLIC_CESIUM_ION_TOKEN?.trim()||'';

  useEffect(()=>{
    if(document.querySelector('link[data-docbox-cesium]'))return;
    const link=document.createElement('link');link.rel='stylesheet';link.href=WIDGET_CSS;link.dataset.docboxCesium='true';document.head.appendChild(link);
  },[]);

  useEffect(()=>{
    const Cesium=window.Cesium;
    if(!loaded||!Cesium||!hostRef.current||viewerRef.current)return;
    try{
      if(token)Cesium.Ion.defaultAccessToken=token;
      const viewer=new Cesium.Viewer(hostRef.current,{animation:false,timeline:false,geocoder:false,homeButton:false,baseLayerPicker:false,sceneModePicker:false,navigationHelpButton:false,fullscreenButton:false,infoBox:false,selectionIndicator:false,terrain:token?Cesium.Terrain.fromWorldTerrain({requestVertexNormals:true,requestWaterMask:true}):undefined});
      viewerRef.current=viewer;
      const scene=viewer.scene;
      scene.backgroundColor=Cesium.Color.fromCssColorString('#02070b');
      scene.globe.baseColor=Cesium.Color.fromCssColorString('#04131a');
      scene.globe.showGroundAtmosphere=true;
      scene.globe.enableLighting=true;
      scene.globe.depthTestAgainstTerrain=false;
      scene.skyAtmosphere.show=true;
      scene.highDynamicRange=true;
      scene.fog.enabled=true;
      scene.fog.density=.00018;
      scene.screenSpaceCameraController.minimumZoomDistance=120000;
      scene.screenSpaceCameraController.maximumZoomDistance=28000000;
      viewer.camera.setView({destination:Cesium.Cartesian3.fromDegrees(-22,18,18500000),orientation:{heading:Cesium.Math.toRadians(8),pitch:Cesium.Math.toRadians(-72),roll:0}});

      const collection=scene.primitives.add(new Cesium.PointPrimitiveCollection());
      pointCollectionRef.current=collection;
      const handler=new Cesium.ScreenSpaceEventHandler(scene.canvas);
      const pauseAutoplay=()=>{onExplore?.();autoRotateRef.current=false;if(interactionTimerRef.current)clearTimeout(interactionTimerRef.current);interactionTimerRef.current=setTimeout(()=>{autoRotateRef.current=true},6500)};
      handler.setInputAction((movement:any)=>{
        const picked=scene.pick(movement.endPosition);const meta=picked?.id??picked?.primitive?.id;
        if(!meta||meta.kind!=='provider'){setHover(null);return}
        const type=pointType(meta.type as Layer);
        setHover({x:movement.endPosition.x,y:movement.endPosition.y,title:`${LABELS[type]} node`,detail:`${meta.lat.toFixed(2)}°, ${meta.lon.toFixed(2)}°${meta.count?` · ${meta.count.toLocaleString()} records`:''}`});
      },Cesium.ScreenSpaceEventType.MOUSE_MOVE);
      handler.setInputAction(()=>pauseAutoplay(),Cesium.ScreenSpaceEventType.LEFT_DOWN);
      handler.setInputAction(()=>pauseAutoplay(),Cesium.ScreenSpaceEventType.WHEEL);
      const tick=()=>{if(autoRotateRef.current&&viewer.camera.positionCartographic.height>7200000&&!viewer.camera._currentFlight)viewer.camera.rotate(Cesium.Cartesian3.UNIT_Z,-.000055)};
      viewer.clock.onTick.addEventListener(tick);
      setReady(true);setError(false);
      return()=>{
        if(interactionTimerRef.current)clearTimeout(interactionTimerRef.current);
        handler.destroy();viewer.clock.onTick.removeEventListener(tick);pointCollectionRef.current=null;
        if(!viewer.isDestroyed())viewer.destroy();viewerRef.current=null;
      };
    }catch{setError(true);setReady(false)}
  },[loaded,onExplore,token]);

  useEffect(()=>{
    const collection=pointCollectionRef.current,Cesium=window.Cesium;
    if(!ready||!collection||!Cesium)return;
    collection.removeAll();
    const showAll=layer==='all';let count=0;
    for(const point of points){
      if(!showAll&&point.type!==layer)continue;
      const type=pointType(point.type),aggregate=mode==='aggregate';
      const pixelSize=aggregate?Math.min(15,6+Math.log10((point.count??1)+1)*2):4.4;
      collection.add({
        position:Cesium.Cartesian3.fromDegrees(point.lon,point.lat,aggregate?18000:5200),
        pixelSize,
        color:Cesium.Color.fromCssColorString(COLORS[type]).withAlpha(aggregate?.96:.82),
        outlineColor:Cesium.Color.fromCssColorString('#031017').withAlpha(.8),
        outlineWidth:aggregate?1.5:.65,
        scaleByDistance:new Cesium.NearFarScalar(250000,1.75,22000000,.48),
        translucencyByDistance:new Cesium.NearFarScalar(300000,.98,24000000,.42),
        id:{kind:'provider',type,lat:point.lat,lon:point.lon,count:point.count??0}
      });
      count++;
    }
    setVisibleCount(count);
  },[layer,mode,points,ready]);

  useEffect(()=>{
    const viewer=viewerRef.current,Cesium=window.Cesium;
    if(!ready||!viewer||!Cesium||!focus)return;
    autoRotateRef.current=false;setHover(null);
    viewer.camera.flyTo({destination:Cesium.Cartesian3.fromDegrees(focus.lon,focus.lat,focus.height),orientation:{heading:Cesium.Math.toRadians(focus.lon*.035),pitch:Cesium.Math.toRadians(focus.height>12000000?-72:-78),roll:0},duration:1.65,easingFunction:Cesium.EasingFunction.CUBIC_IN_OUT,complete:()=>{autoRotateRef.current=true}});
  },[focus,ready]);

  return <div className={styles.root}>
    <Script src={SOURCE} strategy="afterInteractive" onLoad={()=>setLoaded(true)} onError={()=>setError(true)}/>
    <div ref={hostRef} className={styles.cesium} aria-label="Interactive 3D globe of anonymized Occu-Med provider locations"/>
    <div className={styles.vignette} aria-hidden="true"/>
    {!ready&&!error&&<div className={styles.loading}><i/><span>INITIALIZING GLOBAL NETWORK</span></div>}
    {error&&<div className={styles.error}><b>3D globe unavailable</b><span>The provider dataset remains intact. Reload to retry the Cesium scene.</span></div>}
    {hover&&<div className={styles.tooltip} style={{left:hover.x,top:hover.y}}><b>{hover.title}</b><small>{hover.detail}</small></div>}
    <div className={styles.status}><span>{token?'CESIUM ION / WORLD TERRAIN':'CESIUMJS / GLOBAL NETWORK'}</span><b>{visibleCount.toLocaleString()}</b><small>VISIBLE NODES</small></div>
  </div>;
}
