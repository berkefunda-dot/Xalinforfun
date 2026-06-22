#!/usr/bin/env node
/* =====================================================================
   Sisli Fener Konağı — YEREL SUNUCU
   DM yanıtlarını, giriş yapmış olduğun Claude Code ABONELİĞİN üzerinden
   (claude CLI, headless) üretir → API anahtarı yok, API ücreti yok.
   Görsel için isteğe bağlı: yerel Stable Diffusion (AUTOMATIC1111) veya Gemini.

   Çalıştır:  node server.js     →  http://127.0.0.1:8787/
   ===================================================================== */

const http = require("http");
const fs   = require("fs");
const os   = require("os");
const path = require("path");
const { spawn } = require("child_process");

const PORT     = process.env.PORT || 8787;
const HOST     = "127.0.0.1";
const ROOT     = __dirname;

// --- Görsel ayarları (isteğe bağlı, ortam değişkeniyle) ---
// Yerel Stable Diffusion (AUTOMATIC1111 webui --api):  SD_URL=http://127.0.0.1:7860
const SD_URL     = process.env.SD_URL     || "";
// Gemini ücretsiz kotası:  GEMINI_KEY=...
const GEMINI_KEY = process.env.GEMINI_KEY || "";

/* ---------- statik dosya servisi ---------- */
const MIME = {".html":"text/html; charset=utf-8",".js":"text/javascript",".css":"text/css",
  ".png":"image/png",".svg":"image/svg+xml",".md":"text/markdown; charset=utf-8",".ico":"image/x-icon"};
function serveStatic(req,res){
  let p = decodeURIComponent(req.url.split("?")[0]);
  if(p==="/"||p==="") p="/index.html";
  const file = path.join(ROOT, path.normalize(p).replace(/^(\.\.[\/\\])+/,""));
  if(!file.startsWith(ROOT)){ res.writeHead(403); return res.end("forbidden"); }
  fs.readFile(file,(err,data)=>{
    if(err){ res.writeHead(404); return res.end("not found"); }
    res.writeHead(200,{"content-type":MIME[path.extname(file)]||"application/octet-stream"});
    res.end(data);
  });
}

/* ---------- gövde okuma ---------- */
function readBody(req){
  return new Promise((resolve,reject)=>{
    let b=""; req.on("data",c=>{ b+=c; if(b.length>5e6) req.destroy(); });
    req.on("end",()=>{ try{ resolve(b?JSON.parse(b):{}); }catch(e){ reject(e); } });
    req.on("error",reject);
  });
}
function sendJson(res,code,obj){ res.writeHead(code,{"content-type":"application/json"}); res.end(JSON.stringify(obj)); }

/* ---------- DM: claude CLI (abonelik) ---------- */
const MODEL_ALIAS = { "claude-opus-4-8":"opus", "claude-sonnet-4-6":"sonnet", "claude-haiku-4-5-20251001":"haiku" };

function callClaude(fullPrompt, model){
  return new Promise((resolve,reject)=>{
    const alias = MODEL_ALIAS[model] || "sonnet";
    const args = ["-p","--output-format","json","--model",alias,"--max-turns","1"];
    // Büyük sistem+bağlam metni stdin ile gönderilir (Windows komut-satırı uzunluk limiti aşılmasın diye).
    const child = spawn("claude", args, { shell:true, cwd: os.tmpdir() });
    let out="", err="";
    child.stdout.on("data",d=>out+=d);
    child.stderr.on("data",d=>err+=d);
    child.on("error",e=>reject(new Error("claude başlatılamadı: "+e.message)));
    child.on("close",code=>{
      if(code!==0) return reject(new Error("claude çıkış kodu "+code+": "+(err||out).slice(0,300)));
      try{
        const env = JSON.parse(out);              // {type:'result', result:'...', ...}
        const text = env.result || env.text || "";
        resolve(text);
      }catch(e){ reject(new Error("claude çıktısı parse edilemedi: "+out.slice(0,300))); }
    });
    child.stdin.write(fullPrompt);
    child.stdin.end();
  });
}

/* ---------- Görsel: yerel SD veya Gemini ---------- */
async function genImageLocalSD(prompt){
  const r = await fetch(SD_URL.replace(/\/$/,"")+"/sdapi/v1/txt2img",{
    method:"POST", headers:{"content-type":"application/json"},
    body: JSON.stringify({ prompt, negative_prompt:"text, letters, words, watermark, lowres",
      steps:22, width:768, height:512, cfg_scale:6.5, sampler_name:"DPM++ 2M" })
  });
  if(!r.ok) throw new Error("SD "+r.status);
  const j = await r.json();
  const b64 = j.images && j.images[0];
  if(!b64) throw new Error("SD görsel döndürmedi");
  return "data:image/png;base64,"+b64;
}
const GEMINI_IMG_MODELS = ["gemini-2.5-flash-image","gemini-2.5-flash-image-preview"];
async function genImageGemini(prompt){
  let lastErr;
  for(const model of GEMINI_IMG_MODELS){
    try{
      const url = "https://generativelanguage.googleapis.com/v1beta/models/"+model+":generateContent?key="+encodeURIComponent(GEMINI_KEY);
      const r = await fetch(url,{ method:"POST", headers:{"content-type":"application/json"},
        body: JSON.stringify({ contents:[{ parts:[{ text:prompt }] }],
          generationConfig:{ responseModalities:["TEXT","IMAGE"] } }) });
      if(!r.ok){ let d=""; try{ d=(await r.json()).error?.message||""; }catch(e){} lastErr=new Error("Gemini "+r.status+": "+d); if(r.status===404) continue; throw lastErr; }
      const j = await r.json();
      const part = (j.candidates?.[0]?.content?.parts||[]).find(p=>p.inlineData||p.inline_data);
      const d = part && (part.inlineData||part.inline_data);
      if(!d){ lastErr=new Error("Gemini görsel döndürmedi (kota?)"); continue; }
      return `data:${d.mimeType||d.mime_type||"image/png"};base64,${d.data}`;
    }catch(e){ lastErr=e; }
  }
  throw lastErr || new Error("Gemini görsel üretilemedi");
}

/* ---------- yönlendirme ---------- */
const server = http.createServer(async (req,res)=>{
  try{
    if(req.method==="POST" && req.url==="/api/dm"){
      const { prompt, model } = await readBody(req);
      if(!prompt) return sendJson(res,400,{ok:false,error:"prompt gerekli"});
      const text = await callClaude(prompt, model);
      return sendJson(res,200,{ok:true, result:text});
    }
    if(req.method==="POST" && req.url==="/api/image"){
      const { prompt } = await readBody(req);
      if(SD_URL){ const url=await genImageLocalSD(prompt); return sendJson(res,200,{ok:true,dataUrl:url,via:"sd"}); }
      if(GEMINI_KEY){ const url=await genImageGemini(prompt); return sendJson(res,200,{ok:true,dataUrl:url,via:"gemini"}); }
      return sendJson(res,501,{ok:false,error:"Görsel sağlayıcı yapılandırılmadı (SD_URL veya GEMINI_KEY)"});
    }
    if(req.method==="GET" && req.url==="/api/health"){
      return sendJson(res,200,{ok:true, dm:"claude-cli", image: SD_URL?"local-sd":(GEMINI_KEY?"gemini":"none")});
    }
    if(req.method==="GET") return serveStatic(req,res);
    res.writeHead(405); res.end("method not allowed");
  }catch(e){
    sendJson(res,500,{ok:false,error:String(e.message||e)});
  }
});

server.listen(PORT,HOST,()=>{
  console.log("\n  🔍 Sisli Fener Konağı — yerel sunucu hazır");
  console.log("  ▶  http://"+HOST+":"+PORT+"/");
  console.log("  DM kaynağı: Claude Code aboneliğin (API ücreti yok)");
  console.log("  Görsel: "+(SD_URL?("yerel SD @ "+SD_URL):(GEMINI_KEY?"Gemini":"yok (degrade kart)")));
  console.log("  Durdurmak için Ctrl+C\n");
});
