import {HISTORY_LINE_COUNT,HISTORY_WORLD_LENGTH} from '../history/historyMath';

export const MANDOLINE_LINE_LENGTH=24;
export const MANDOLINE_LINE_SPACE=5.12;
export const MANDOLINE_LINE_THICKNESS=.03;
export const MANDOLINE_UV_SCALE=15;
export const MANDOLINE_NOISE_AMOUNT=2;
export const MANDOLINE_NOISE_SCALE_X=5.3;
export const MANDOLINE_NOISE_SCALE_Y=3.46;

const strengths=[.5,.5,.25,.25] as const;
const phases=[0,.25,.5,.75] as const;
const harmonics=[2,-2,4,-4] as const;
const temporal=[4,8,-4,-16] as const;
const yFactors=[.05,1,1,1] as const;

function bell(x:number,center:number,width:number){
  const d=(x-center)/width;
  return Math.exp(-d*d);
}

export type MandolineSample={
  x:number;
  y:number;
  z:number;
  brightness:number;
  spread:number;
};

export function normalizedLane(lane:number){
  return (lane-(HISTORY_LINE_COUNT-1)/2)/((HISTORY_LINE_COUNT-1)/2);
}

export function sampleMandoline(x:number,lane:number,time:number):MandolineSample{
  const laneN=normalizedLane(lane);
  const local=x/MANDOLINE_LINE_LENGTH;
  const normalizedX=x/HISTORY_WORLD_LENGTH;

  let harmonicY=0;
  let harmonicZ=0;
  for(let i=0;i<4;i++){
    const phase=local*harmonics[i]+laneN*MANDOLINE_NOISE_SCALE_Y+phases[i]*Math.PI*2+time*.012*temporal[i];
    harmonicY+=Math.sin(phase)*strengths[i]*yFactors[i];
    harmonicZ+=Math.cos(phase*.82+phases[3-i]*Math.PI)*strengths[i];
  }

  const fanA=bell(normalizedX,.20,.105);
  const pinchA=bell(normalizedX,.31,.055);
  const valley=bell(normalizedX,.48,.13);
  const crest=bell(normalizedX,.61,.095);
  const fanB=bell(normalizedX,.75,.09);
  const pinchB=bell(normalizedX,.84,.048);

  const spread=.32+fanA*1.28+fanB*.94+valley*.48-pincha(pinchA)*.28-pincha(pinchB)*.22;
  const twist=Math.sin(x*.112+time*.018)*(.35+fanA*.85+fanB*.55)+Math.sin(x*.31+.8)*.14;
  const laneY=laneN*spread*1.65;
  const laneZ=laneN*(.58+fanA*.42+fanB*.32);
  const twistedY=laneY*Math.cos(twist)-laneZ*Math.sin(twist);
  const twistedZ=laneY*Math.sin(twist)+laneZ*Math.cos(twist);

  const centerY=
    Math.sin(x*.105+.8)*.84+
    Math.sin(x*.245-1.1)*.31-
    valley*1.20+
    crest*1.22+
    Math.sin(x*.046+time*.018)*.25;

  const micro=(harmonicY/MANDOLINE_NOISE_SCALE_X)*MANDOLINE_NOISE_AMOUNT*.22;
  const depthWave=(harmonicZ/MANDOLINE_NOISE_SCALE_Y)*MANDOLINE_NOISE_AMOUNT*.20;
  const core=Math.exp(-Math.pow(laneN/.18,2));

  return {
    x,
    y:centerY+twistedY+micro,
    z:-1.12+twistedZ+depthWave,
    brightness:.16+core*.72+(1-Math.abs(laneN))*.10,
    spread
  };
}

function pincha(value:number){
  return Math.min(1,value*1.35);
}

export function sampleMandolineForProgress(progress:number,lane:number,time:number){
  return sampleMandoline(Math.max(0,Math.min(1,progress))*HISTORY_WORLD_LENGTH,lane,time);
}
