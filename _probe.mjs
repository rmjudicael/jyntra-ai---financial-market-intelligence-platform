import fs from "node:fs";
const env = Object.fromEntries(fs.readFileSync('.env','utf8').split(/\r?\n/).filter(l=>l.includes('=')&&!l.trim().startsWith('#')).map(l=>{const i=l.indexOf('=');return [l.slice(0,i).trim(), l.slice(i+1).trim()];}));
const base = env.META_API_ENDPOINT.replace(/\/$/,'');
const H = { Authorization: 'Bearer '+env.META_API_KEY, 'Content-Type':'application/json' };
const b64 = fs.readFileSync('_probe_img.b64','utf8');
const img = 'data:image/webp;base64,'+b64;
const input=[{role:'user',content:[{type:'input_text',text:'apple'},{type:'input_image',image_url:img}]}];
for (const body of [
 {model:'sam-3.1',input,modalities:['image']},
 {model:'sam-3.1',input,tools:[{type:'image_generation'}]},
 {model:'sam-3.1',input,tools:[{type:'mask_generation'}]},
 {model:'sam-3.1',input,instructions:'You are a segmentation model. Reply with JSON.'},
]){ try{ const r=await fetch(base+'/responses',{method:'POST',headers:H,body:JSON.stringify(body),signal:AbortSignal.timeout(120000)}); const t=await r.text(); console.log('###',JSON.stringify(body.tools||body.modalities||'plain'),r.status,t.slice(0,900)); }catch(e){ console.log('ERR',e.message); } }
