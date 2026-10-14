// Optional local preview; production GitHub Pages needs no Node or build step.
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const {execFile} = require('node:child_process');
const root = __dirname, port = Number(process.env.PORT || 8080);
if(!Number.isInteger(port) || port<1 || port>65535)throw new Error('PORT must be between 1 and 65535');
const mime = {'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.mjs':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.wasm':'application/wasm','.task':'application/octet-stream','.png':'image/png','.md':'text/plain; charset=utf-8'};
http.createServer((req,res)=>{
  try {
    const requested = decodeURIComponent(new URL(req.url,'http://localhost').pathname);
    const file = path.resolve(root,'.'+requested+(requested.endsWith('/')?'index.html':''));
    if(file!==root && !file.startsWith(root+path.sep)){res.writeHead(403);res.end('Forbidden');return;}
    fs.stat(file,(error,stat)=>{
      if(error||!stat.isFile()){res.writeHead(404);res.end('Not found');return;}
      res.writeHead(200,{'Content-Type':mime[path.extname(file)] || 'application/octet-stream','Content-Length':stat.size,'Cache-Control':'no-cache'});
      const input=fs.createReadStream(file);input.on('error',()=>res.destroy());input.pipe(res);
    });
  } catch {res.writeHead(400);res.end('Bad request');}
}).on('error',error=>{
  console.error(error.code==='EADDRINUSE'?`Port ${port} is busy. Close the previous preview or choose a different PORT.`:error.message);
  process.exitCode=1;
}).listen(port,'127.0.0.1',()=>{
  const url=`http://localhost:${port}`;
  console.log(`Local preview: ${url}`);
  if(process.argv.includes('--open') && process.platform==='win32'){
    execFile('powershell.exe',['-NoProfile','-NonInteractive','-Command',`Start-Process '${url}'`],{windowsHide:true},error=>{if(error)console.error('Please open the Local preview URL manually.');});
  }
});
