import {analyzeHand} from './gesture.js';
const $ = id => document.getElementById(id);
const canvas = $('drawing'), ctx = canvas.getContext('2d');
const W = canvas.width, H = canvas.height;
const brushes = [['pressure','压感'],['neon','霓虹'],['rainbow','彩虹'],['dust','星尘'],['ink','毛笔'],['spray','喷枪'],['emboss','浮雕'],['trail','拖尾'],['magic','魔术'],['erase','橡皮']];
const colors = [['#28e6ff','青色'],['#e646e6','品红'],['#78ff5a','荧光绿'],['#ffe63c','黄色'],['#ffa03c','橙色'],['#c85aff','紫色'],['#ffffff','白色']];
let brush = 'neon', previousBrush = 'neon', color = colors[0][0], size = 6, light = false;
let strokes = [], active = null, undoStack = [], redoStack = [], pointerId = null, move = null;
let stream = null, worker = null, running = false, starting = false, pending = false, frameId = 0, session = 0;
let pinching = false, smooth = null, lastGesture = '', gestureSince = 0, gestureFired = false;
let previousFrame = -1, lastSent = 0, fpsSince = 0, frameCount = 0;
const labels = {pinch:'捏合 · 绘画中',palm:'张开手掌',thumb:'竖拇指',fist:'握拳',point:'移动 · 已抬笔'};
function status(message, error = false) { $('status').textContent = message; $('status').classList.toggle('error',error); }
function snapshot() {
  undoStack.push(structuredClone(strokes));
  if (undoStack.length > 30) undoStack.shift();
  redoStack = [];
}
function ui() {
  $('strokeCount').textContent = `${strokes.length} 笔`;
  $('emptyHint').hidden = strokes.length > 0;
  $('undo').disabled = !undoStack.length;
  $('redo').disabled = !redoStack.length;
}
function endStroke() { active = null; pinching = false; $('cursor').classList.remove('drawing'); $('penState').textContent = '已抬笔'; ui(); }
function finishMove() { move = null; $('cursor').classList.remove('grabbing'); }
function releaseInput() { endStroke(); finishMove(); smooth = null; lastGesture = ''; gestureFired = false; $('cursor').hidden = true; }
function selectBrush(key) {
  endStroke(); brush = key;
  if (key !== 'erase') previousBrush = key;
  for (const b of $('brushes').children) b.classList.toggle('active',b.dataset.brush === key);
  for (const b of $('brushes').children) b.setAttribute('aria-pressed',String(b.dataset.brush === key));
}
function selectColor(value) {
  endStroke(); color = value;
  for (const b of $('colors').children) { b.classList.toggle('active',b.dataset.color === value); b.setAttribute('aria-pressed',String(b.dataset.color === value)); }
  $('colorLabel').textContent = colors.find(c => c[0] === value)[1];
}
for (const [key,label] of brushes) {
  const b = document.createElement('button'); b.textContent = label; b.dataset.brush = key;
  b.addEventListener('click',() => selectBrush(key)); $('brushes').append(b);
}
for (const [value,label] of colors) {
  const b = document.createElement('button'); b.dataset.color = value; b.style.setProperty('--swatch',value);
  b.setAttribute('aria-label',label); b.title = label;
  b.addEventListener('click',() => selectColor(value)); $('colors').append(b);
}
selectBrush(brush); selectColor(color);
$('size').addEventListener('input', e => { endStroke(); size = Number(e.target.value); $('sizeValue').value = size; });
$('sensitivity').addEventListener('input', e => { endStroke(); $('sensitivityValue').value = Number(e.target.value).toFixed(2); });
$('gestureActions').addEventListener('change',releaseInput);
$('mirror').addEventListener('change',() => {
  releaseInput(); const transform = $('mirror').checked ? 'scaleX(-1)' : 'none';
  $('video').style.transform = transform; $('handPreview').style.transform = transform;
});
// Each effect uses a deterministic seed: undo, redo and moving reproduce the same marks.
function random(seed) { const n = Math.sin(seed*127.1+311.7)*43758.5453; return n-Math.floor(n); }
function segment(s, index) {
  const b = s.points[index], a = s.points[Math.max(0,index-1)];
  const x = b.x+s.dx, y = b.y+s.dy, ax = a.x+s.dx, ay = a.y+s.dy;
  const distance = Math.hypot(b.x-a.x,b.y-a.y);
  let width = s.size, hue = s.color;
  if (s.brush === 'pressure') width = s.size*Math.max(.3,1.5-distance/25);
  if (s.brush === 'ink') width = s.size*(.45+.65*Math.abs(Math.sin(index*.10+1)));
  if (s.brush === 'rainbow') hue = `hsl(${b.length*.65%360} 95% 65%)`;
  ctx.save();
  ctx.globalCompositeOperation = s.brush === 'erase' ? 'destination-out' : 'source-over';
  ctx.lineCap = ctx.lineJoin = 'round'; ctx.strokeStyle = ctx.fillStyle = hue; ctx.lineWidth = width;
  if (s.brush === 'erase') ctx.lineWidth = width*3;
  if (['neon','rainbow','pressure','dust','trail','magic'].includes(s.brush)) { ctx.shadowColor = hue; ctx.shadowBlur = width*1.6; }
  if (s.brush === 'spray') {
    for (let i=0;i<20;i++) {
      const angle = random(index*51+i)*Math.PI*2, radius = Math.sqrt(random(index*71+i+500))*width*2;
      ctx.globalAlpha=.25; ctx.beginPath(); ctx.arc(x+Math.cos(angle)*radius,y+Math.sin(angle)*radius,.6+random(i+index)*1.3,0,Math.PI*2);ctx.fill();
    }
  } else {
    if (s.brush === 'emboss') { ctx.shadowColor='#0008';ctx.shadowBlur=3;ctx.shadowOffsetX=3;ctx.shadowOffsetY=3; }
    if (s.brush === 'trail') { ctx.globalAlpha=.35;ctx.lineWidth=width*2.5; }
    ctx.beginPath();ctx.moveTo(ax,ay);ctx.lineTo(x+.01,y+.01);ctx.stroke();
    if (s.brush === 'trail') { ctx.globalAlpha=1;ctx.lineWidth=width;ctx.stroke(); }
    if (s.brush === 'emboss') {
      ctx.shadowBlur=0;ctx.shadowOffsetX=ctx.shadowOffsetY=0;ctx.strokeStyle='#ffffffaa';ctx.lineWidth=width*.22;
      ctx.beginPath();ctx.moveTo(ax-width*.2,ay-width*.2);ctx.lineTo(x-width*.2,y-width*.2);ctx.stroke();
    }
    if (s.brush === 'dust') {
      for(let i=0;i<5;i++){ctx.globalAlpha=.25+random(index+i)*.6;ctx.beginPath();ctx.arc(x+(random(index*9+i)-.5)*width*6,y+(random(index*7+i+80)-.5)*width*6,random(i+index)*1.8+.5,0,Math.PI*2);ctx.fill();}
    }
    if (s.brush === 'magic' && (index===0 || Math.floor(b.length/35)!==Math.floor(a.length/35))) {
      ctx.beginPath();for(let i=0;i<10;i++){const theta=-Math.PI/2+i*Math.PI/5,r=i%2 ? width : width*2.5;ctx.lineTo(x+Math.cos(theta)*r,y+Math.sin(theta)*r);}ctx.closePath();ctx.fill();
    }
  }
  ctx.restore();
}
function redraw() { ctx.clearRect(0,0,W,H); for(const s of strokes) for(let i=0;i<s.points.length;i++) segment(s,i); ui(); }
function startStroke(point) {
  finishMove(); snapshot();
  active = {brush,color,size,dx:0,dy:0,points:[{...point,length:0}]};
  strokes.push(active); segment(active,0); ui();
}
function drawPoint(point) {
  if (!active) startStroke(point);
  else {
    const last = active.points.at(-1), distance = Math.hypot(point.x-last.x,point.y-last.y);
    if (distance < .7 && active.brush !== 'spray') return;
    // Break tracking jumps rather than drawing a line across the canvas.
    if (distance > W*.22) { endStroke();startStroke(point);return; }
    active.points.push({...point,length:last.length+distance});segment(active,active.points.length-1);
  }
  $('penState').textContent = brush === 'erase' ? '擦除中' : '落笔中';
}
function undo() {
  releaseInput(); if(!undoStack.length)return;
  redoStack.push(structuredClone(strokes));strokes=undoStack.pop();redraw();
}
function redo() {
  releaseInput();if(!redoStack.length)return;
  undoStack.push(structuredClone(strokes));strokes=redoStack.pop();redraw();
}
$('undo').addEventListener('click',undo);$('redo').addEventListener('click',redo);
$('clear').addEventListener('click',() => {if(strokes.length)$('clearDialog').showModal();});
$('clearDialog').addEventListener('close',() => {
  if($('clearDialog').returnValue==='confirm'){releaseInput();snapshot();strokes=[];redraw();}
});
$('background').addEventListener('click',() => {light=!light;$('canvasFrame').classList.toggle('light',light);});
function save() {
  endStroke();const exported=document.createElement('canvas');exported.width=W;exported.height=H;
  const out=exported.getContext('2d');out.fillStyle=light?'#f7f9fc':'#0a101a';out.fillRect(0,0,W,H);out.drawImage(canvas,0,0);
  exported.toBlob(blob => {
    if(!blob){status('图片保存失败，请重试。',true);return;}
    const url=URL.createObjectURL(blob),link=document.createElement('a');link.href=url;link.download=`隔空画画-${new Date().toISOString().replace(/[:.]/g,'-')}.png`;link.click();setTimeout(()=>URL.revokeObjectURL(url),10000);
  },'image/png');
}
$('save').addEventListener('click',save);
function pointerPoint(e) {const r=canvas.getBoundingClientRect();return {x:(e.clientX-r.left)/r.width*W,y:(e.clientY-r.top)/r.height*H};}
canvas.addEventListener('pointerdown',e => {
  if(pointerId!==null || (e.pointerType==='mouse' && e.button!==0))return;
  e.preventDefault();releaseInput();pointerId=e.pointerId;canvas.setPointerCapture(pointerId);drawPoint(pointerPoint(e));
});
canvas.addEventListener('pointermove',e => {if(e.pointerId===pointerId)drawPoint(pointerPoint(e));});
function pointerEnd(e){if(e.pointerId===pointerId){pointerId=null;releaseInput();}}
for(const event of ['pointerup','pointercancel','lostpointercapture'])canvas.addEventListener(event,pointerEnd);
window.addEventListener('keydown',e => {
  if(['INPUT','SELECT','TEXTAREA'].includes(e.target.tagName) || e.repeat || $('clearDialog').open)return;
  const key=e.key.toLowerCase();
  if((e.ctrlKey||e.metaKey)&&key==='z'){e.preventDefault();e.shiftKey?redo():undo();return;}
  if((e.ctrlKey||e.metaKey)&&key==='y'){e.preventDefault();redo();return;}
  if(e.ctrlKey||e.metaKey||e.altKey)return;
  if(key==='u')undo();
  if(key==='f')selectBrush(brushes[(brushes.findIndex(b=>b[0]===brush)+1)%brushes.length][0]);
  if(key==='e')selectBrush(brush==='erase'?previousBrush:'erase');
  if(key==='s'){e.preventDefault();save();}
  if(/^[1-7]$/.test(key))selectColor(colors[Number(key)-1][0]);
});
const edges=[[0,1],[1,2],[2,3],[3,4],[0,5],[5,6],[6,7],[7,8],[5,9],[9,10],[10,11],[11,12],[9,13],[13,14],[14,15],[15,16],[13,17],[0,17],[17,18],[18,19],[19,20]];
function preview(landmarks) {
  const c=$('handPreview'),g=c.getContext('2d');g.clearRect(0,0,c.width,c.height);if(!landmarks)return;
  g.strokeStyle='#79f2d1';g.lineWidth=2;g.fillStyle='#ffffff';
  for(const [a,b] of edges){g.beginPath();g.moveTo(landmarks[a].x*c.width,landmarks[a].y*c.height);g.lineTo(landmarks[b].x*c.width,landmarks[b].y*c.height);g.stroke();}
  for(const p of landmarks){g.beginPath();g.arc(p.x*c.width,p.y*c.height,2.5,0,Math.PI*2);g.fill();}
}
function mapPoint(p) {
  const x=$('mirror').checked?1-p.x:p.x;
  return {x:Math.max(0,Math.min(1,(x-.12)/.76))*W,y:Math.max(0,Math.min(1,(p.y-.10)/.8))*H};
}
function handResult(landmarks,timestamp) {
  if(document.hidden || $('clearDialog').open){releaseInput();return;}
  preview(landmarks);
  if(pointerId!==null)return;
  if(!landmarks){releaseInput();$('gestureLabel').textContent='未识别到手';$('penState').textContent='让手完整出现在镜头中';return;}
  const result=analyzeHand(landmarks,$('video').videoWidth/$('video').videoHeight,pinching,Number($('sensitivity').value));
  const gesture=result.gesture; $('gestureLabel').textContent=labels[gesture];
  const point=mapPoint(gesture==='palm'?result.palm:result.point);
  smooth=smooth?{x:smooth.x+(point.x-smooth.x)*.55,y:smooth.y+(point.y-smooth.y)*.55}:point;
  $('cursor').hidden=false;$('cursor').style.left=`${smooth.x/W*100}%`;$('cursor').style.top=`${smooth.y/H*100}%`;
  if(gesture!==lastGesture){gestureSince=timestamp;gestureFired=false;lastGesture=gesture;finishMove();}
  if(gesture==='pinch') {
    pinching=true;drawPoint(smooth);$('cursor').classList.add('drawing');return;
  }
  endStroke();
  if($('gestureActions').checked && timestamp-gestureSince>550 && !gestureFired) {
    gestureFired=true;
    if(gesture==='thumb'){undo();lastGesture=gesture;gestureFired=true;}
    if(gesture==='fist')selectBrush(brush==='erase'?previousBrush:'erase');
    if(gesture==='palm' && strokes.length){move={anchor:{...smooth},offsets:strokes.map(s=>({dx:s.dx,dy:s.dy})),saved:false};}
  }
  if(gesture==='palm' && move) {
    const dx=smooth.x-move.anchor.x,dy=smooth.y-move.anchor.y;
    if(!move.saved && Math.hypot(dx,dy)>3){snapshot();move.saved=true;}
    if(move.saved){strokes.forEach((s,i)=>{s.dx=move.offsets[i].dx+dx;s.dy=move.offsets[i].dy+dy;});redraw();}
    $('cursor').classList.add('grabbing');$('penState').textContent='移动整张画作 · 合拢手掌即可放下';
  }
}
function stopCamera(message='摄像头已关闭。仍可使用鼠标或触屏画画。') {
  session++;running=false;starting=false;cancelAnimationFrame(frameId);
  if(worker)worker.terminate();worker=null;
  if(stream)stream.getTracks().forEach(track=>track.stop());stream=null;$('video').srcObject=null;
  pending=false;previousFrame=-1;releaseInput();preview(null);
  $('cameraButton').disabled=false;$('cameraButton').textContent='开启摄像头';$('cameraBadge').textContent='未开启';$('cameraBadge').classList.remove('on');$('cameraPlaceholder').hidden=false;$('gestureLabel').textContent='等待手势';$('fps').textContent='— FPS';status(message);
}
function cameraError(error) {
  const messages={NotAllowedError:'摄像头权限未允许。请在地址栏的网站权限中允许摄像头后重试。',NotFoundError:'没有找到摄像头，请连接摄像头后重试。',NotReadableError:'摄像头可能被其他程序占用，请关闭占用程序后重试。',OverconstrainedError:'当前摄像头不支持请求的设置，请尝试其他设备。'};
  stopCamera();status(messages[error.name] || `启动失败：${error.message || error}。请确认完整上传 assets 文件夹，并使用新版浏览器。`,true);
}
function initWorker(token) {
  return new Promise((resolve,reject)=>{
    worker=new Worker(new URL('./tracker-worker.js',import.meta.url),{type:'module'});
    const timer=setTimeout(()=>reject(new Error('模型加载超时，请检查网站模型文件是否完整')),45000);
    worker.onerror=e=>{clearTimeout(timer);const error=new Error(e.message || '手势识别线程启动失败');if(starting)reject(error);else if(token===session)cameraError(error);};
    worker.onmessage=({data})=>{
      if(token!==session)return;
      if(data.type==='ready'){clearTimeout(timer);resolve();}
      else if(data.type==='error'){clearTimeout(timer);if(starting)reject(new Error(data.message));else cameraError(new Error(data.message));}
      else if(data.type==='result'){
        pending=false;handResult(data.landmarks,data.timestamp);frameCount++;
        if(data.timestamp-fpsSince>1000){$('fps').textContent=`${Math.round(frameCount*1000/(data.timestamp-fpsSince))} FPS`;fpsSince=data.timestamp;frameCount=0;}
      }
    };
    worker.postMessage({type:'init'});
  });
}
async function loop(timestamp) {
  if(!running)return;
  frameId=requestAnimationFrame(loop);
  if(document.hidden||pending||timestamp-lastSent<45||$('video').readyState<2||$('video').currentTime===previousFrame)return;
  previousFrame=$('video').currentTime;lastSent=timestamp;pending=true;
  const token=session;
  try {
    const image=await createImageBitmap($('video'));
    if(!running||token!==session){image.close();return;}
    worker.postMessage({type:'frame',image,timestamp},[image]);
  }catch(error){if(token===session)cameraError(error);}
}
async function startCamera() {
  if(running){stopCamera();return;}
  if(starting){stopCamera('已取消启动。允许摄像头权限后，可再次点击开启。');return;}
  if(!window.isSecureContext||!navigator.mediaDevices?.getUserMedia){status('摄像头需要 HTTPS 或 localhost。请部署到 GitHub Pages 后打开，或使用本地预览脚本。',true);return;}
  if(!window.Worker||!window.createImageBitmap){status('当前浏览器缺少手势识别所需能力，请使用新版 Chrome 或 Edge。',true);return;}
  const token=++session;starting=true;$('cameraButton').disabled=false;$('cameraButton').textContent='取消启动';status('请在浏览器地址栏附近的权限提示中允许摄像头。没有提示时，请检查网站摄像头权限。');
  const permissionNotice=setTimeout(()=>{if(token===session&&starting&&!stream)status('仍在等待摄像头授权。请检查地址栏的摄像头图标并允许访问；也可以点击“取消启动”重试。');},10000);
  try {
    const media=await navigator.mediaDevices.getUserMedia({video:{width:{ideal:640},height:{ideal:480},facingMode:'user'},audio:false});
    if(token!==session){media.getTracks().forEach(t=>t.stop());return;}
    stream=media;$('video').srcObject=media;await $('video').play();
    if(token!==session)return;
    $('handPreview').width=$('video').videoWidth;$('handPreview').height=$('video').videoHeight;
    $('cameraPlaceholder').hidden=true;$('cameraButton').textContent='取消启动';$('cameraBadge').textContent='加载模型';status('摄像头已打开，正在加载本地手势模型，请稍候。');
    await initWorker(token);if(token!==session)return;
    starting=false;running=true;fpsSince=performance.now();frameCount=0;
    $('cameraButton').disabled=false;$('cameraButton').textContent='关闭摄像头';$('cameraBadge').textContent='运行中';$('cameraBadge').classList.add('on');status('拇指与食指捏合即可绘画；松开手指立即抬笔。');
    media.getVideoTracks()[0].addEventListener('ended',()=>{if(token===session)stopCamera('摄像头连接已断开，请重新开启。');});
    frameId=requestAnimationFrame(loop);
  }catch(error){if(token===session)cameraError(error);}
  finally{clearTimeout(permissionNotice);}
}
$('cameraButton').addEventListener('click',startCamera);
document.addEventListener('visibilitychange',()=>{if(document.hidden){pointerId=null;releaseInput();}});
window.addEventListener('pagehide',()=>stopCamera());
ui();
window.__airCanvasBoot?.ready();
