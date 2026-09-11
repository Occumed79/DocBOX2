'use client';

import Script from 'next/script';
import { useEffect, useRef, useState } from 'react';
import styles from './CesiumNetworkGlobe.module.css';

declare global{interface Window{Cesium?:any}}

type Layer='all'|'medical'|'dental'|'diagnostic'|'pharmacy';
type Point={lon:number;lat:number;type:Layer;label?:string;count?:number};
type Region={id:string;label:string;lon:number;lat:number;height:number};
type Props={points:readonly Point[];layer:Layer;focus?:Region;mode:'coordinates'|'aggregate'|'loading';onExplore?:()=>void};

const SOURCE='https://cesium.com/downloads/cesiumjs/releases/1.143/Build/Cesium/Cesium.js';

export default function CesiumNetworkGlobe({points,layer,focus,mode,onExplore}:Props){
  const hostRef=useRef<HTMLDivElement|null>(null);
  const viewerRef=useRef<any>(null);
  const[loaded,setLoaded]=useState(Boolean(typeof window!=='undefined'&&window.Cesium));
  const[ready,setReady]=useState(false);

  useEffect(()=>{
    const Cesium=window.Cesium;
    if(!loaded||!Cesium||!hostRef.current||viewerRef.current)return;
    const viewer=new Cesium.Viewer(hostRef.current,{animation:false,timeline:false,geocoder:false,homeButton:false,baseLayerPicker:false,sceneModePicker:false,navigationHelpButton:false,fullscreenButton:false,infoBox:false,selectionIndicator:false});
    viewerRef.current=viewer;
    viewer.scene.backgroundColor=Cesium.Color.fromCssColorString('#02070b');
    viewer.scene.globe.baseColor=Cesium.Color.fromCssColorString('#04131a');
    viewer.scene.globe.showGroundAtmosphere=true;
    viewer.scene.skyAtmosphere.show=true;
    viewer.camera.setView({destination:Cesium.Cartesian3.fromDegrees(-18,18,19500000)});
    const markExplore=()=>onExplore?.();
    viewer.scene.canvas.addEventListener('pointerdown',markExplore,{passive:true});
    setReady(true);
    return()=>{viewer.scene.canvas.removeEventListener('pointerdown',markExplore);if(!viewer.isDestroyed())viewer.destroy();viewerRef.current=null};
  },[loaded,onExplore]);

  useEffect(()=>{
    const viewer=viewerRef.current,Cesium=window.Cesium;
    if(!ready||!viewer||!Cesium)return;
    viewer.entities.removeAll();
    const showAll=layer==='all';
    for(const point of points){
      if(!showAll&&point.type!==layer)continue;
      viewer.entities.add({position:Cesium.Cartesian3.fromDegrees(point.lon,point.lat,mode==='aggregate'?18000:3500),point:{pixelSize:mode==='aggregate'?7:4,color:Cesium.Color.fromCssColorString('#7fe8ff'),outlineColor:Cesium.Color.BLACK,outlineWidth:1}});
    }
  },[layer,mode,points,ready]);

  useEffect(()=>{
    const viewer=viewerRef.current,Cesium=window.Cesium;
    if(!ready||!viewer||!Cesium||!focus)return;
    viewer.camera.flyTo({destination:Cesium.Cartesian3.fromDegrees(focus.lon,focus.lat,focus.height),duration:1.6});
  },[focus,ready]);

  return <div className={styles.root}>
    <Script src={SOURCE} strategy="afterInteractive" onLoad={()=>setLoaded(true)}/>
    <div ref={hostRef} className={styles.cesium} aria-label="Interactive 3D globe of anonymized Occu-Med provider locations"/>
    <div className={styles.vignette} aria-hidden="true"/>
    {!ready&&<div className={styles.loading}><i/><span>INITIALIZING GLOBAL NETWORK</span></div>}
    <div className={styles.status}><span>CESIUMJS / GLOBAL NETWORK</span><b>{points.length.toLocaleString()}</b><small>NETWORK NODES</small></div>
  </div>;
}
