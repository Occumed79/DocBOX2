export type NetworkRenderPoint={lat:number;lon:number;type:string;label?:string;count?:number};

type Buffers={geo:WebGLBuffer;color:WebGLBuffer;size:WebGLBuffer;rank:WebGLBuffer};

const VERTEX=`
attribute vec2 aGeo;
attribute vec3 aColor;
attribute float aSize;
attribute float aRank;
uniform float uZoom;
uniform vec2 uPan;
uniform vec2 uViewport;
uniform float uDpr;
uniform float uAggregate;
varying vec3 vColor;
varying float vAlpha;
void main(){
  float detail=smoothstep(.92,2.75,uZoom);
  float threshold=mix(.12,1.0,detail);
  float keep=max(uAggregate,step(aRank,threshold));
  vec2 clip=aGeo*uZoom+vec2((uPan.x*2.0)/max(uViewport.x,1.0),(-uPan.y*2.0)/max(uViewport.y,1.0));
  if(keep<.5){
    gl_Position=vec4(2.0,2.0,0.0,1.0);
    gl_PointSize=0.0;
  }else{
    gl_Position=vec4(clip,0.0,1.0);
    float coordinateSize=mix(1.45,2.7,detail);
    gl_PointSize=min(18.0,mix(coordinateSize,aSize,uAggregate)*uDpr*sqrt(max(uZoom,.35)));
  }
  vColor=aColor;
  vAlpha=uAggregate>.5?clamp(.48+uZoom*.12,.5,.92):mix(.34,.9,detail);
}`;

const FRAGMENT=`
precision mediump float;
varying vec3 vColor;
varying float vAlpha;
void main(){
  vec2 p=gl_PointCoord-.5;
  float d=length(p);
  if(d>.5)discard;
  float core=1.0-smoothstep(.04,.22,d);
  float halo=1.0-smoothstep(.12,.5,d);
  vec3 color=vColor*(.7+core*.75);
  float alpha=(halo*.45+core*.65)*vAlpha;
  gl_FragColor=vec4(color,alpha);
}`;

function shader(gl:WebGLRenderingContext,type:number,source:string){
  const value=gl.createShader(type);if(!value)throw new Error('Unable to create network shader.');
  gl.shaderSource(value,source);gl.compileShader(value);
  if(!gl.getShaderParameter(value,gl.COMPILE_STATUS)){const message=gl.getShaderInfoLog(value)||'Network shader compile failed.';gl.deleteShader(value);throw new Error(message)}
  return value;
}

function parseColor(value:string){
  const normalized=value.startsWith('#')?value.slice(1):value;
  const n=Number.parseInt(normalized,16);
  if(!Number.isFinite(n))return [0.51,0.92,1] as const;
  return [((n>>16)&255)/255,((n>>8)&255)/255,(n&255)/255] as const;
}

function stableRank(lon:number,lat:number,index:number){
  const value=Math.sin(lon*12.9898+lat*78.233+index*.137)*43758.5453;
  return value-Math.floor(value);
}

export function createNetworkPointRenderer(canvas:HTMLCanvasElement,colors:Record<string,string>){
  const gl=canvas.getContext('webgl',{antialias:true,alpha:true,premultipliedAlpha:false});
  if(!gl)return null;

  const vertex=shader(gl,gl.VERTEX_SHADER,VERTEX),fragment=shader(gl,gl.FRAGMENT_SHADER,FRAGMENT);
  const program=gl.createProgram();if(!program)throw new Error('Unable to create network shader program.');
  gl.attachShader(program,vertex);gl.attachShader(program,fragment);gl.linkProgram(program);gl.deleteShader(vertex);gl.deleteShader(fragment);
  if(!gl.getProgramParameter(program,gl.LINK_STATUS)){const message=gl.getProgramInfoLog(program)||'Network shader link failed.';gl.deleteProgram(program);throw new Error(message)}

  const geo=gl.createBuffer(),color=gl.createBuffer(),size=gl.createBuffer(),rank=gl.createBuffer();
  if(!geo||!color||!size||!rank){gl.deleteProgram(program);throw new Error('Unable to allocate network GPU buffers.')}
  const buffers:Buffers={geo,color,size,rank};
  const geoLocation=gl.getAttribLocation(program,'aGeo'),colorLocation=gl.getAttribLocation(program,'aColor'),sizeLocation=gl.getAttribLocation(program,'aSize'),rankLocation=gl.getAttribLocation(program,'aRank');
  const zoomLocation=gl.getUniformLocation(program,'uZoom'),panLocation=gl.getUniformLocation(program,'uPan'),viewportLocation=gl.getUniformLocation(program,'uViewport'),dprLocation=gl.getUniformLocation(program,'uDpr'),aggregateLocation=gl.getUniformLocation(program,'uAggregate');

  gl.useProgram(program);
  gl.enable(gl.BLEND);gl.blendFunc(gl.SRC_ALPHA,gl.ONE_MINUS_SRC_ALPHA);gl.disable(gl.DEPTH_TEST);
  let pointCount=0,lastPoints:readonly NetworkRenderPoint[]|null=null,lastMode='',aggregateMode=0;

  const bind=(buffer:WebGLBuffer,location:number,sizePerVertex:number,data:Float32Array)=>{
    gl.bindBuffer(gl.ARRAY_BUFFER,buffer);gl.bufferData(gl.ARRAY_BUFFER,data,gl.STATIC_DRAW);gl.enableVertexAttribArray(location);gl.vertexAttribPointer(location,sizePerVertex,gl.FLOAT,false,0,0);
  };

  const setData=(points:readonly NetworkRenderPoint[],mode:'coordinates'|'aggregate')=>{
    if(points===lastPoints&&mode===lastMode)return;
    lastPoints=points;lastMode=mode;aggregateMode=mode==='aggregate'?1:0;pointCount=points.length;
    const geoData=new Float32Array(pointCount*2),colorData=new Float32Array(pointCount*3),sizeData=new Float32Array(pointCount),rankData=new Float32Array(pointCount);
    for(let i=0;i<pointCount;i++){
      const point=points[i];geoData[i*2]=point.lon/180;geoData[i*2+1]=point.lat/90;
      const rgb=parseColor(colors[point.type]??colors.all??'#82ebff');colorData[i*3]=rgb[0];colorData[i*3+1]=rgb[1];colorData[i*3+2]=rgb[2];
      sizeData[i]=mode==='aggregate'?Math.min(12,4.8+Math.sqrt(point.count??1)*.14):2.15;
      rankData[i]=mode==='aggregate'?0:stableRank(point.lon,point.lat,i);
    }
    gl.useProgram(program);bind(buffers.geo,geoLocation,2,geoData);bind(buffers.color,colorLocation,3,colorData);bind(buffers.size,sizeLocation,1,sizeData);bind(buffers.rank,rankLocation,1,rankData);
  };

  const render=(width:number,height:number,dpr:number,zoom:number,panX:number,panY:number)=>{
    const pixelWidth=Math.max(1,Math.floor(width*dpr)),pixelHeight=Math.max(1,Math.floor(height*dpr));
    if(canvas.width!==pixelWidth||canvas.height!==pixelHeight){canvas.width=pixelWidth;canvas.height=pixelHeight;canvas.style.width=`${width}px`;canvas.style.height=`${height}px`}
    gl.viewport(0,0,pixelWidth,pixelHeight);gl.clearColor(.01,.055,.075,0);gl.clear(gl.COLOR_BUFFER_BIT);gl.useProgram(program);
    gl.uniform1f(zoomLocation,zoom);gl.uniform2f(panLocation,panX,panY);gl.uniform2f(viewportLocation,width,height);gl.uniform1f(dprLocation,dpr);gl.uniform1f(aggregateLocation,aggregateMode);
    gl.drawArrays(gl.POINTS,0,pointCount);
  };

  return {
    setData,
    render,
    dispose(){gl.deleteBuffer(buffers.geo);gl.deleteBuffer(buffers.color);gl.deleteBuffer(buffers.size);gl.deleteBuffer(buffers.rank);gl.deleteProgram(program)},
  };
}

export type NetworkPointRenderer=NonNullable<ReturnType<typeof createNetworkPointRenderer>>;
