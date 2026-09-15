import type {HistoryItem} from './historyData';

export const HISTORY_WORLD_LENGTH=142;
export const HISTORY_LINE_COUNT=32;
export const HISTORY_TRANSITION_MS=2800;

export function clampHistoryProgress(value:number){
  return Math.max(0,Math.min(1,value));
}

export function applyWheelDelta(target:number,deltaY:number,maxProgress=1){
  const worldDelta=Math.max(-5,Math.min(5,deltaY*.01));
  return Math.max(0,Math.min(maxProgress,target+worldDelta/HISTORY_WORLD_LENGTH));
}

export function historyWorldX(progress:number){
  return clampHistoryProgress(progress)*HISTORY_WORLD_LENGTH;
}

export function nearestHistoryItem(items:readonly HistoryItem[],progress:number){
  if(!items.length)return null;
  return items.reduce((closest,item)=>
    Math.abs(item.position-progress)<Math.abs(closest.position-progress)?item:closest
  ,items[0]);
}

export function smoothHistoryStep(value:number){
  const x=clampHistoryProgress(value);
  return x*x*(3-2*x);
}
