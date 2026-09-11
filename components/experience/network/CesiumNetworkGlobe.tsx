'use client';

import Script from 'next/script';
import { useEffect, useRef, useState } from 'react';
import styles from './CesiumNetworkGlobe.module.css';

declare global{interface Window{Cesium?:any}}

type Layer='all'|'medical'|'dental'|'diagnostic'|'pharmacy';
type Point={lon:number;lat:number;type:Layer;label?:string;count?:number};
type Props={points:readonly Point[];layer:Layer;mode:'coordinates'|'aggregate'|'loading'};

const SOURCE='https://cesium.com/downloads/cesiumjs/releases/1.143/Build/Cesium/Cesium.js';
const COLORS:Record<Exclude<Layer,'all'>,string>={medical:'#7fe8ff',dental:'#b48bff',diagnostic:'#8ab5ff',pharmacy:'#e7be74'};

function pointType(type:Layer):Exclude<Layer,'all'>{return type==='all'?'medical':type}

export default function CesiumNetworkGlobe({points,layer,mode}:Props){
  const hostRef=useRef<HTMLDivElement|null>(null);
  const viewerRef=useRef<any>(null);
  const[loaded,setLoaded]=useState(Boolean(typeof window!=='undefined'&&window.Cesium));
  const[ready,setReady]=useState(false);
  const token=process.env.NEXT_PUBLIC_CESIUM_ION_TOKEN?.trim()||'';

  useEffect(()=>{
    const Cesium=window.Cesium;
    if(!loaded||!Cesium||!hostRef.current||viewerRef.current)return;
    if(token)Cesium.Ion.defaultAccessToken=token;
    const viewer=new Cesium.Viewer(hostRef.current,{animation:false,timeline:false,geocoder:false,homeButton:false,baseLayerPicker:false,sceneModePicker:false,navigationHelpButton:false,fullscreenButton:false,infoBox:false,selectionIndicator:false,terrain:token?Cesium.Terrain.fromWorldTerrain({requestVertexNormals:true,requestWaterMask:true}):undefined});
    viewerRef.current=viewer;
    viewer.scene.backgroundColor=Cesium.Color.fromCssColorString('#02070b');
    viewer.scene.globe.baseColor=Cesium.Color.fromCssColorString('#04131a');
    viewer.scene.globe.showGroundAtmosphere=true;
    viewer.scene.skyAtmosphere.show=true;
    viewer.scene.screenSpaceCameraController.enableInputs=false;
    viewer.camera.setView({destination:Cesium.Cartesian3.fromDegrees(-18,18,19500000)});
    const handleView=(event:Event)=>{
      const detail=(event as CustomEvent<{zoom:number;panX:number;panY:number}>).detail;
      if(!detail)return;
      const rect=hostRef.current?.getBoundingClientRect();if(!rect)return;
      const zoom=Math.max(.8,detail.zoom||1);
      const baseX=rect.width/2-detail.panX/zoom;
      const baseY=rect.height/2-detail.panY/zoom;
      const lon=(baseX/rect.width)*360-180;
      const lat=90-(baseY/rect.height)*180;
      const height=19500000/Math.pow(zoom,1.35);
      viewer.camera.flyTo({destination:Cesium.Cartesian3.fromDegrees(lon,Math.max(-80,Math.min(80,lat)),height),duration:.45});
    };
    window.addEventListener('docbox:network-view',handleView);
    setReady(true);
    return()=>{window.removeEventListener('docbox:network-view',handleView);if(!viewer.isDestroyed())viewer.destroy();viewerRef.current=null};
  },[loaded,token]);

  useEffect(()=>{
    const viewer=viewerRef.current,Cesium=window.Cesium;
    if(!ready||!viewer||!Cesium)return;
    viewer.entities.removeAll();
    const showAll=layer==='all';
    for(const point of points){
      if(!showAll&&point.type!==layer)continue;
      const type=pointType(point.type);
      viewer.entities.add({position:Cesium.Cartesian3.fromDegrees(point.lon,point.lat,mode==='aggregate'?18000:3500),point:{pixelSize:mode==='aggregate'?7:4,color:Cesium.Color.fromCssColorString(COLORS[type]),outlineColor:Cesium.Color.BLACK,outlineWidth:1}});
    }
  },[layer,mode,points,ready]);

  return <div className={styles.root}>
    <Script src={SOURCE} strategy="afterInteractive" onLoad={()=>setLoaded(true)}/>
    <div ref={hostRef} className={styles.cesium} aria-label="Interactive 3D globe of anonymized Occu-Med provider locations"/>
    <div className={styles.vignette} aria-hidden="true"/>
    {!ready&&<div className={styles.loading}><i/><span>INITIALIZING GLOBAL NETWORK</span></div>}
    <div className={styles.status}><span>{token?'CESIUM ION / WORLD TERRAIN':'CESIUMJS / GLOBAL NETWORK'}</span><b>{points.length.toLocaleString()}</b><small>NETWORK NODES</small></div>
  </div>;
}
