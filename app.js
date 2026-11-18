const $=id=>document.getElementById(id);
const defaults={name:"NEON PERFORMANCE",maxSpeed:240,maxRpm:8000,theme:"dark",accent:"#20c9ff",secondary:"#8b5cf6",speed:84,rpm:3.2,units:{speed:"KM/H",rpm:"x1000 RPM"},layout:"dual-dial",gaugeStyle:"neon",centerText:"D",subtitle:"DRIVE"};
let config={...defaults};
let selectedImage=null;
function json(){$("jsonEditor").value=JSON.stringify(config,null,2);$("jsonStatus").textContent="JSON HAZIR";}
function parseJsonWithControlRepair(raw){
 const original=String(raw??"").replace(/^\\uFEFF/,"").trim();
 const candidates=[original];
 const fenced=original.match(/```(?:json)?\\s*([\\s\\S]*?)\\s*```/i);
 if(fenced)candidates.push(fenced[1].trim());
 const first=original.indexOf("{"),last=original.lastIndexOf("}");
 if(first>=0&&last>first)candidates.push(original.slice(first,last+1));
 let lastError;
 for(const candidate of [...new Set(candidates)]){
  let cleaned="",inside=false,escaped=false;
  for(let i=0;i<candidate.length;i++){
   const ch=candidate[i],code=candidate.charCodeAt(i);
   if(inside){
    if(escaped){cleaned+=ch;escaped=false;continue;}
    if(ch==="\\\\"){cleaned+=ch;escaped=true;continue;}
    if(ch==='"'){cleaned+=ch;inside=false;continue;}
    if(code<32){cleaned+=ch==="\\n"?"\\\\n":ch==="\\r"?"\\\\r":ch==="\\t"?"\\\\t":"\\\\u"+code.toString(16).padStart(4,"0");continue;}
    cleaned+=ch;
   }else{if(ch==='"')inside=true;cleaned+=ch;}
  }
  const variants=[cleaned,
   cleaned.replace(/(["}\\]0-9]|true|false|null)([ \\t]*\\r?\\n[ \\t]*")(?=[^\\n"]*"\\s*:)/g,"$1,$2"),
   cleaned.replace(/,([ \\t\\r\\n]*[}\\]])/g,"$1")
  ];
  variants.push(variants[1].replace(/,([ \\t\\r\\n]*[}\\]])/g,"$1"));
  for(const variant of variants){try{return JSON.parse(variant);}catch(e){lastError=e;}}
 }
 const message=lastError?.message||"Yanıt geçerli JSON değil.";
 const pos=Number(message.match(/position (\\d+)/)?.[1]||0);
 const excerpt=original.slice(Math.max(0,pos-100),Math.min(original.length,pos+180));
 throw new Error("Sunucudan gelen yanıt JSON olarak okunamadı. "+message+" Yanıtın başlangıcı: "+original.slice(0,500)+" | Hata çevresi: "+excerpt);
}
function safeColor(v,f){return typeof v==="string"&&/^#[0-9a-fA-F]{6}$/.test(v)?v:f;}
function esc(v){return String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));}
function clamp(v,min,max){const n=Number(v);return Number.isFinite(n)?Math.min(max,Math.max(min,n)):min;}
function arcPath(cx,cy,r,start,end){const a=start*Math.PI/180,b=end*Math.PI/180,x1=cx+r*Math.cos(a),y1=cy+r*Math.sin(a),x2=cx+r*Math.cos(b),y2=cy+r*Math.sin(b);return "M "+x1.toFixed(2)+" "+y1.toFixed(2)+" A "+r+" "+r+" 0 "+(end-start>180?1:0)+" 1 "+x2.toFixed(2)+" "+y2.toFixed(2);}
function gauge(cx,cy,r,value,max,label,unit,color,style){
 const ratio=clamp(value,0,max)/max,start=-215,end=35,activeEnd=start+(end-start)*ratio;
 let marks="";
 for(let i=0;i<=20;i++){const a=(start+i/20*(end-start))*Math.PI/180,major=i%5===0,inner=r-(major?13:7);marks+='<line x1="'+(cx+inner*Math.cos(a)).toFixed(1)+'" y1="'+(cy+inner*Math.sin(a)).toFixed(1)+'" x2="'+(cx+r*Math.cos(a)).toFixed(1)+'" y2="'+(cy+r*Math.sin(a)).toFixed(1)+'" stroke="'+color+'" opacity="'+(major?".9":".35")+'" stroke-width="'+(major?2.8:1.4)+'"/>';}
 const stroke=style==="solid"?7:5;
 return '<path d="'+arcPath(cx,cy,r,-215,35)+'" fill="none" stroke="'+color+'" opacity=".15" stroke-width="'+stroke+'"/>'+marks+'<path d="'+arcPath(cx,cy,r,-215,activeEnd)+'" fill="none" stroke="'+color+'" stroke-width="'+stroke+'" stroke-linecap="round" filter="url(#glow)"/><text x="'+cx+'" y="'+(cy+12)+'" text-anchor="middle" class="dial-value">'+esc(label)+'</text><text x="'+cx+'" y="'+(cy+39)+'" text-anchor="middle" class="dial-unit">'+esc(unit)+'</text>';
}
function buildDial(){
 const maxSpeed=Number(config.maxSpeed)||240,maxRpm=Number(config.maxRpm)||8000;
 const speed=clamp(config.speed,0,maxSpeed),rpm=clamp(config.rpm,0,maxRpm/1000);
 const accent=safeColor(config.accent,defaults.accent),secondary=safeColor(config.secondary,defaults.secondary);
 const units=config.units&&typeof config.units==="object"?config.units:defaults.units;
 const layout=["dual-dial","single-dial","horizontal","minimal"].includes(config.layout)?config.layout:"dual-dial";
 const style=["neon","solid","minimal"].includes(config.gaugeStyle)?config.gaugeStyle:"neon";
 let body="";
 if(layout==="dual-dial"){
  body=gauge(190,185,112,speed,maxSpeed,String(Math.round(speed)).padStart(3,"0"),units.speed||"KM/H",accent,style)+gauge(570,185,112,rpm,maxRpm/1000,rpm.toFixed(1),units.rpm||"x1000 RPM",secondary,style);
  body+='<text x="380" y="143" text-anchor="middle" class="gear">'+esc(config.centerText||"D")+'</text><text x="380" y="169" text-anchor="middle" class="gear-label">'+esc(config.subtitle||"DRIVE")+'</text><rect x="310" y="195" width="140" height="38" rx="7" class="info-box"/><text x="380" y="219" text-anchor="middle" class="info-text">'+esc(config.centerInfo||"23°C  ·  412 KM")+'</text><text x="380" y="285" text-anchor="middle" class="bottom-info">P  R  <tspan class="active-gear">N</tspan>  D</text>';
 }else if(layout==="single-dial"){
  body=gauge(380,174,137,speed,maxSpeed,String(Math.round(speed)).padStart(3,"0"),units.speed||"KM/H",accent,style);
  body+='<text x="380" y="270" text-anchor="middle" class="gear-label">ENGINE '+rpm.toFixed(1)+' '+esc(units.rpm||"x1000 RPM")+'</text><rect x="310" y="291" width="140" height="30" rx="6" class="info-box"/><text x="380" y="311" text-anchor="middle" class="info-text">'+esc(config.centerText||"D")+' · '+esc(config.subtitle||"DRIVE")+'</text>';
 }else if(layout==="horizontal"){
  const sw=560*(speed/maxSpeed),rw=560*(rpm/(maxRpm/1000));
  body='<text x="100" y="105" class="gear-label">VEHICLE SPEED</text><text x="660" y="105" text-anchor="end" class="dial-value" style="font-size:42px">'+Math.round(speed)+' <tspan class="dial-unit">'+esc(units.speed||"KM/H")+'</tspan></text><rect x="100" y="125" width="560" height="13" rx="6" fill="'+accent+'" opacity=".15"/><rect x="100" y="125" width="'+sw+'" height="13" rx="6" fill="'+accent+'" filter="url(#glow)"/><text x="100" y="205" class="gear-label">ENGINE RPM</text><text x="660" y="205" text-anchor="end" class="dial-value" style="font-size:42px">'+rpm.toFixed(1)+' <tspan class="dial-unit">'+esc(units.rpm||"x1000 RPM")+'</tspan></text><rect x="100" y="225" width="560" height="13" rx="6" fill="'+secondary+'" opacity=".15"/><rect x="100" y="225" width="'+rw+'" height="13" rx="6" fill="'+secondary+'" filter="url(#glow)"/><text x="380" y="305" text-anchor="middle" class="gear">'+esc(config.centerText||"D")+'</text><text x="380" y="330" text-anchor="middle" class="gear-label">'+esc(config.subtitle||"DRIVE MODE")+'</text>';
 }else{
  body='<path d="'+arcPath(380,178,140,-215,35)+'" fill="none" stroke="'+accent+'" opacity=".15" stroke-width="4"/><path d="'+arcPath(380,178,140,-215,-215+250*(speed/maxSpeed))+'" fill="none" stroke="'+accent+'" stroke-width="5" stroke-linecap="round" filter="url(#glow)"/><text x="380" y="178" text-anchor="middle" class="dial-value" style="font-size:82px">'+Math.round(speed)+'</text><text x="380" y="210" text-anchor="middle" class="dial-unit">'+esc(units.speed||"KM/H")+'</text><text x="380" y="270" text-anchor="middle" class="gear-label">RPM '+rpm.toFixed(1)+' · '+esc(config.centerText||"D")+'</text><rect x="260" y="294" width="240" height="5" rx="2" fill="'+secondary+'" opacity=".25"/><rect x="260" y="294" width="'+(240*rpm/(maxRpm/1000))+'" height="5" rx="2" fill="'+secondary+'"/>';
 }
 $("dial").innerHTML='<defs><filter id="glow"><feGaussianBlur stdDeviation="4" result="blur"/><feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs>'+body;
 $("cluster").style.setProperty("--accent",accent);$("cluster").style.setProperty("--secondary",secondary);
 $("cluster").classList.toggle("light",config.theme==="light");
 $("clusterName").textContent=config.name||"CUSTOM DASHBOARD";
}
function render(){
 const max=Number(config.maxSpeed)||240,rpmMax=Number(config.maxRpm)||8000;
 buildDial();
 $("speedSlider").max=max;$("speedSlider").value=clamp(config.speed,0,max);$("speedLabel").textContent=clamp(config.speed,0,max)+" km/h";
 $("rpmSlider").max=rpmMax/1000;$("rpmSlider").value=clamp(config.rpm,0,rpmMax/1000);$("rpmLabel").textContent=Number(config.rpm||0).toFixed(1)+" x1000";
 $("nameInput").value=config.name||"";$("maxSpeed").value=String(max);$("maxRpm").value=String(rpmMax);
 $("accent").value=safeColor(config.accent,defaults.accent);$("colorValue").textContent=safeColor(config.accent,defaults.accent).toUpperCase();$("secondary").value=safeColor(config.secondary,defaults.secondary);$("secondaryValue").textContent=safeColor(config.secondary,defaults.secondary).toUpperCase();$("theme").value=config.theme||"dark";$("layout").value=config.layout||"dual-dial";$("gaugeStyle").value=config.gaugeStyle||"neon";$("centerText").value=config.centerText||"D";$("subtitle").value=config.subtitle||"DRIVE";
}
function applyEditor(){try{const next=JSON.parse($("jsonEditor").value);if(!next||typeof next!=="object"||Array.isArray(next))throw Error("JSON bir nesne olmalı");config={...defaults,...next};render();$("jsonStatus").textContent="GEÇERLİ JSON";$("jsonStatus").style.color="#39d99b";}catch(e){$("jsonStatus").textContent="JSON HATASI";$("jsonStatus").style.color="#ff7474";}}
let timer;$("jsonEditor").addEventListener("input",()=>{clearTimeout(timer);timer=setTimeout(applyEditor,250);});
$("applySettings").onclick=()=>commitConfig({...config,name:$("nameInput").value,maxSpeed:+$("maxSpeed").value,maxRpm:+$("maxRpm").value,accent:$("accent").value,secondary:$("secondary").value,theme:$("theme").value,layout:$("layout").value,gaugeStyle:$("gaugeStyle").value,centerText:$("centerText").value,subtitle:$("subtitle").value});
$("accent").oninput=()=>{$("colorValue").textContent=$("accent").value.toUpperCase();};
$("speedSlider").oninput=e=>{config.speed=+e.target.value;json();render();try{localStorage.setItem("kadran-ai-autosave",JSON.stringify(config));}catch{}};
$("rpmSlider").oninput=e=>{config.rpm=+e.target.value;json();render();try{localStorage.setItem("kadran-ai-autosave",JSON.stringify(config));}catch{}};

const undoStack=[],redoStack=[];
function commitConfig(next){undoStack.push(JSON.stringify(config));if(undoStack.length>50)undoStack.shift();redoStack.length=0;config={...defaults,...next};json();render();try{localStorage.setItem("kadran-ai-autosave",JSON.stringify(config));}catch{}}
function undoConfig(){if(!undoStack.length)return;redoStack.push(JSON.stringify(config));config={...defaults,...JSON.parse(undoStack.pop())};json();render();}
function redoConfig(){if(!redoStack.length)return;undoStack.push(JSON.stringify(config));config={...defaults,...JSON.parse(redoStack.pop())};json();render();}
$("undo").onclick=undoConfig;$("redo").onclick=redoConfig;
$("secondary").oninput=()=>{$("secondaryValue").textContent=$("secondary").value.toUpperCase();};
$("saveDesign").onclick=()=>{try{localStorage.setItem("kadran-ai-saved",JSON.stringify(config));alert("Tasarım bu tarayıcıya kaydedildi.");}catch{alert("Tarayıcı kaydı kullanılamıyor.");}};
$("loadDesign").onclick=()=>{try{const v=localStorage.getItem("kadran-ai-saved");if(!v){alert("Kayıtlı tasarım bulunamadı.");return;}commitConfig(JSON.parse(v));}catch{alert("Kayıt okunamadı.");}};
const paletteSet=[["#20c9ff","#8b5cf6"],["#ff3158","#ff9b42"],["#b7f34a","#20d6a1"],["#83e8ff","#477bff"],["#f5c451","#f08a45"],["#bd82ff","#ff63bd"],["#ff812e","#ffe05b"]];
$("randomize").onclick=()=>{const p=paletteSet[Math.floor(Math.random()*paletteSet.length)],ls=["dual-dial","single-dial","horizontal","minimal"],gs=["neon","solid","minimal"];commitConfig({...config,name:"CUSTOM "+Math.floor(100+Math.random()*900),accent:p[0],secondary:p[1],layout:ls[Math.floor(Math.random()*ls.length)],gaugeStyle:gs[Math.floor(Math.random()*gs.length)]});};
$("validate").onclick=()=>{const errors=[];if(!/^#[0-9a-f]{6}$/i.test(config.accent||""))errors.push("Ana renk geçersiz");if(!/^#[0-9a-f]{6}$/i.test(config.secondary||""))errors.push("İkincil renk geçersiz");if(Number(config.maxSpeed)<80||Number(config.maxSpeed)>400)errors.push("Maksimum hız 80-400 olmalı");if(Number(config.maxRpm)<3000||Number(config.maxRpm)>12000)errors.push("Maksimum RPM 3000-12000 olmalı");if(!["dual-dial","single-dial","horizontal","minimal"].includes(config.layout))errors.push("Yerleşim geçersiz");if(!["neon","solid","minimal"].includes(config.gaugeStyle))errors.push("Gösterge stili geçersiz");alert(errors.length?"TASARIM HATALARI\\n\\n"+errors.join("\\n"):"TASARIM KONTROLÜ BAŞARILI");};
function blobDownload(blob,name){const u=URL.createObjectURL(blob),a=document.createElement("a");a.href=u;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(u),1200);}
function svgExport(){const node=$("dial").cloneNode(true);node.setAttribute("xmlns","http://www.w3.org/2000/svg");node.setAttribute("width","1520");node.setAttribute("height","780");node.style.setProperty("--accent",config.accent);node.style.setProperty("--secondary",config.secondary);const st=document.createElementNS("http://www.w3.org/2000/svg","style");st.textContent=".dial-value{font:54px monospace;fill:#effaff;text-anchor:middle}.dial-unit{font:11px monospace;fill:#8ba7bd;text-anchor:middle}.gear{font:36px monospace;fill:var(--accent)}.gear-label{font:9px monospace;fill:#8ba7bd}.info-box{fill:#0d1b29;stroke:#2b536d}.info-text{font:10px monospace;fill:#b8d9e9}.bottom-info{font:12px monospace;fill:#6d8296}.active-gear{fill:var(--accent)}";node.insertBefore(st,node.firstChild);blobDownload(new Blob([new XMLSerializer().serializeToString(node)],{type:"image/svg+xml"}),(config.name||"kadran")+".svg");}
function pngExport(){const node=$("dial").cloneNode(true);node.setAttribute("xmlns","http://www.w3.org/2000/svg");node.setAttribute("width","1520");node.setAttribute("height","780");node.style.setProperty("--accent",config.accent);node.style.setProperty("--secondary",config.secondary);const st=document.createElementNS("http://www.w3.org/2000/svg","style");st.textContent=".dial-value{font:54px monospace;fill:#effaff;text-anchor:middle}.dial-unit{font:11px monospace;fill:#8ba7bd;text-anchor:middle}.gear{font:36px monospace;fill:var(--accent)}.gear-label{font:9px monospace;fill:#8ba7bd}.info-box{fill:#0d1b29;stroke:#2b536d}.info-text{font:10px monospace;fill:#b8d9e9}.bottom-info{font:12px monospace;fill:#6d8296}.active-gear{fill:var(--accent)}";node.insertBefore(st,node.firstChild);const u=URL.createObjectURL(new Blob([new XMLSerializer().serializeToString(node)],{type:"image/svg+xml"})),img=new Image();img.onload=()=>{const c=document.createElement("canvas");c.width=1520;c.height=780;const x=c.getContext("2d");x.fillStyle=config.theme==="light"?"#eef3f7":"#080e18";x.fillRect(0,0,c.width,c.height);x.drawImage(img,0,0,c.width,c.height);c.toBlob(b=>{if(b)blobDownload(b,(config.name||"kadran")+".png");URL.revokeObjectURL(u);},"image/png");};img.onerror=()=>{URL.revokeObjectURL(u);alert("PNG oluşturulamadı.");};img.src=u;}
$("exportSvg").onclick=svgExport;$("exportPng").onclick=pngExport;
try{const old=localStorage.getItem("kadran-ai-autosave");if(old)config={...defaults,...JSON.parse(old)};}catch{}
function makeYoldasCode(c){
 const accent=safeColor(c.accent,"#20C9FF"),secondary=safeColor(c.secondary,"#8B5CF6");
 const title=String(c.name||"DIGITAL COCKPIT").replace(/[\\r\\n]+/g," ").slice(0,40);
 const textColor={night:"#F4F7FA",day:"#17212B"};
 const dimColor={night:"#AAB6C2",day:"#526170"};
 const track={night:"#FFFFFF24",day:"#10151C20"};
 const speedMax=clamp(c.maxSpeed||240,80,400);
 const parts=[
  {type:"circle",center:[960,350],radius:315,fill:{radial:{center:[960,350],radius:315,stops:[[0,accent+"18"],[1,"#05070B00"]]}},stroke:{paint:accent+"55",width:3}},
  {type:"arc",center:[960,350],radius:275,start:-135,sweep:270,stroke:{paint:track,width:14,cap:"round"}},
  {type:"arc",center:[960,350],radius:275,start:-135,sweep:270,stroke:{paint:accent,width:5,cap:"round"},glow:{color:accent,size:12,strength:0.35}},
  {type:"text",text:title,x:960,y:92,align:"center",size:24,weight:700,spacing:0.16,fill:dimColor},
  {type:"signal",side:"left",x:650,y:248,size:56},
  {type:"signal",side:"right",x:1214,y:248,size:56},
  {type:"text",value:"speed",x:960,y:330,align:"center",size:190,weight:500,font:"tech",fill:textColor},
  {type:"text",unit_of:"speed",uppercase:true,x:960,y:452,align:"center",size:22,weight:700,spacing:0.2,fill:accent},
  {type:"gears",x:860,y:520,width:200,size:26,active_size:36,active_weight:700,color:dimColor,active_color:accent},
  {type:"ring",center:[390,350],radius:105,width:12,start:-135,sweep:270,value:"battery",from:[0,100],color:accent,track:track},
  {type:"text",value:"battery",x:390,y:350,align:"center",size:46,weight:400,font:"tech",fill:textColor},
  {type:"text",word:"battery",x:390,y:475,align:"center",size:17,weight:600,spacing:0.16,fill:dimColor},
  {type:"ring",center:[1530,350],radius:105,width:12,start:-135,sweep:270,value:"range",from:[0,600],color:secondary,track:track},
  {type:"text",value:"range",unit:{size:18},x:1530,y:350,align:"center",size:48,weight:400,font:"tech",fill:textColor},
  {type:"text",word:"range",x:1530,y:475,align:"center",size:17,weight:600,spacing:0.16,fill:dimColor},
  {type:"line",from:[610,585],to:[1310,585],stroke:{paint:track,width:2}},
  {type:"text",word:"mode",x:960,y:635,align:"center",size:18,weight:600,spacing:0.16,fill:dimColor}
 ];
 if(c.layout==="horizontal"){
  parts.splice(1,2,
   {type:"rect",x:510,y:250,width:900,height:8,radius:4,fill:track},
   {type:"rect",x:510,y:250,width:900,height:8,radius:4,fill:accent,glow:{color:accent,size:8,strength:0.25},reveal:{value:"speed",from:[0,speedMax],direction:"right",smooth:250}}
  );
 }
 return {yoldas_dial:1,name:title,description:"Kadran AI tarafindan olusturulan, Yoldas Kadran Tasarim Kiti v2 alanlarina gore hazirlanmis tasarim.",background:{night:"#05070B",day:"#EEF1F4"},parts};
}

const YOLDAS_PART_TYPES=new Set(["circle","arc","path","rect","line","text","scale","group","repeat","gears","signal","bar","ring","clock","nav","media","speed_limit","ready","asset","window"]);
function validateYoldasDial(doc){
 const errors=[];
 if(!doc||typeof doc!=="object"||Array.isArray(doc))return ["Dosya JSON nesnesi değil."];
 if(doc.yoldas_dial!==1)errors.push("yoldas_dial sürümü 1 olmalı.");
 if(typeof doc.name!=="string"||!doc.name.trim())errors.push("name alanı eksik.");
 if(!doc.background||typeof doc.background!=="object"||!doc.background.night||!doc.background.day)errors.push("background içinde night ve day renkleri olmalı.");
 if(!Array.isArray(doc.parts))errors.push("parts dizisi eksik.");
 else{
  if(doc.parts.length>400)errors.push("400 parça sınırı aşıldı.");
  const types=doc.parts.map(p=>p&&p.type);
  if(!types.includes("gears"))errors.push("Vites göstergesi (gears) eksik.");
  if(types.filter(t=>t==="signal").length<2)errors.push("Sol ve sağ sinyal göstergeleri eksik.");
  if(!doc.parts.some(p=>p&&p.type==="text"&&p.value==="speed"))errors.push("Hız metni (value: speed) eksik.");
  doc.parts.forEach((p,i)=>{
   if(!p||typeof p!=="object"||!YOLDAS_PART_TYPES.has(p.type))errors.push("parts["+i+"]: desteklenmeyen parça türü.");
   if(p&&p.type==="text"&&p.value==="speed"&&!(Number(p.size)>=120))errors.push("Hız yazısı en az 120 boyutunda olmalı.");
   if(p&&p.type==="gears"&&!(Number(p.size)>=22))errors.push("Vites yazısı en az 22 boyutunda olmalı.");
   if(p&&p.type==="ring"&&p.color&&typeof p.color==="object")errors.push("parts["+i+"].color nesne olamaz; düz renk değeri olmalı.");
  });
 }
 try{if(new Blob([JSON.stringify(doc)]).size>256*1024)errors.push("JSON dosyası 256 KB sınırını aşıyor.");}catch{errors.push("JSON serileştirilemiyor.");}
 return [...new Set(errors)];
}
function repairYoldasDial(doc){
 const fixed=JSON.parse(JSON.stringify(doc||{}));
 fixed.yoldas_dial=1;
 fixed.name=String(fixed.name||"AI DIGITAL COCKPIT").slice(0,60);
 fixed.description=String(fixed.description||"Yoldas Kadran Atolyesi icin olusturuldu.");
 fixed.background={night:fixed.background?.night||"#05070B",day:fixed.background?.day||"#EEF1F4"};
 if(!Array.isArray(fixed.parts))fixed.parts=[];
 fixed.parts=fixed.parts.filter(p=>p&&typeof p==="object"&&YOLDAS_PART_TYPES.has(p.type)).slice(0,400);
 fixed.parts.forEach(p=>{if(p.type==="ring"&&p.color&&typeof p.color==="object")p.color="#20C9FF";});
 let speed=fixed.parts.find(p=>p.type==="text"&&p.value==="speed");
 if(!speed){speed={type:"text",value:"speed",x:960,y:350,align:"center",size:190,weight:500,font:"tech",fill:"#F4F7FA"};fixed.parts.push(speed);}
 speed.size=Math.max(120,Number(speed.size)||190);
 let gears=fixed.parts.find(p=>p.type==="gears");
 if(!gears){gears={type:"gears",x:860,y:520,width:200,size:26,active_size:36,active_weight:700,color:"#AAB6C2",active_color:"#20C9FF"};fixed.parts.push(gears);}
 gears.size=Math.max(22,Number(gears.size)||26);
 const signals=fixed.parts.filter(p=>p.type==="signal");
 if(!signals.some(p=>p.side==="left"))fixed.parts.push({type:"signal",side:"left",x:650,y:248,size:56});
 if(!signals.some(p=>p.side==="right"))fixed.parts.push({type:"signal",side:"right",x:1214,y:248,size:56});
 return fixed;
}
function validateAndRepairYoldas(input){
 let doc=input,history=[];
 for(let pass=1;pass<=5;pass++){
  let errors=validateYoldasDial(doc);
  if(!errors.length)return {doc,passes:pass-1,history};
  history.push({pass,errors});
  doc=repairYoldasDial(doc);
 }
 const remaining=validateYoldasDial(doc);
 if(remaining.length)throw new Error("Yoldaş uyumluluk kontrolü tamamlanamadı: "+remaining.join(" "));
 return {doc,passes:5,history};
}

function downloadYoldas(){
 const checked=validateAndRepairYoldas(makeYoldasCode(config));
 const data=JSON.stringify(checked.doc,null,2);
 const blob=new Blob([data],{type:"application/json"});
 const a=document.createElement("a");a.href=URL.createObjectURL(blob);
 a.download=(config.name||"yoldas-kadran").toLowerCase().replace(/[^a-z0-9]+/g,"-")+".json";
 a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1200);
}
function download(){try{applyEditor();const blob=new Blob([JSON.stringify(config,null,2)],{type:"application/json"}),a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download=(config.name||"kadran").toLowerCase().replace(/[^a-z0-9]+/g,"-")+".json";a.click();URL.revokeObjectURL(a.href);}catch{}}
$("downloadTop").onclick=downloadYoldas;
$("copyJson").onclick=async()=>{try{await navigator.clipboard.writeText($("jsonEditor").value);$("copyJson").textContent="KOPYALANDI";setTimeout(()=>$("copyJson").textContent="KOPYALA",1400);}catch{$("jsonEditor").select();document.execCommand("copy");}};
$("formatJson").onclick=()=>{try{$("jsonEditor").value=JSON.stringify(JSON.parse($("jsonEditor").value),null,2);applyEditor();}catch{$("jsonStatus").textContent="JSON HATASI";}};
$("reset").onclick=()=>commitConfig({...defaults});
$("sample").onclick=()=>{config={...defaults,name:"MIDNIGHT GT",accent:"#ff3b62",secondary:"#a78bfa",maxSpeed:320,maxRpm:9000,speed:126,rpm:4.8,layout:"single-dial",gaugeStyle:"solid"};json();render();};

$("fixYoldasErrors").onclick=async()=>{
 const button=$("fixYoldasErrors");
 button.disabled=true;
 button.textContent="↻ HATALAR AI TARAFINDAN DÜZELTİLİYOR...";
 try{
  const copied=await navigator.clipboard.readText();
  if(!copied.trim())throw new Error("Önce Yoldaş Atölyesi'nde 'Hataları yapay zekâya kopyala' düğmesine bas.");
  if(!selectedImage)throw new Error("AI'nın tasarımı yeniden düzenleyebilmesi için aynı kadran görselini bu sayfaya tekrar yükle.");
  const currentDial=window.__lastYoldasDial||makeYoldasCode(config);
  const form=new FormData();
  form.append("image",selectedImage);
  form.append("prompt",
   "BU BİR HATA DÜZELTME GÖREVİDİR. Yeni tasarım uydurma. Önceki tasarım JSON'unu ve Yoldaş Atölyesi'nin GERÇEK hata mesajlarını incele. Hataların her birini gider. Yalnızca desteklenen config alanlarını döndür: name,maxSpeed,maxRpm,theme,accent,secondary,speed,rpm,units,layout,gaugeStyle,centerText,subtitle. Renkler #RRGGBB olsun.\n"+
   "YOLDAŞ HATA MESAJLARI:\n"+copied+"\n\nMEVCUT TASARIM JSON:\n"+JSON.stringify(currentDial)+"\n\nKullanıcının ilk isteği: "+$("prompt").value.trim()
  );
  $("jsonStatus").textContent="YOLDAŞ HATALARI AI'YA GÖNDERİLİYOR...";
  $("jsonStatus").style.color="#20c9ff";
  const controller=new AbortController();
  const timeoutId=setTimeout(()=>controller.abort(),90000);
  let response;
  try{
   response=await fetch("https://kadran-ai.memirgurbuz44.workers.dev",{method:"POST",body:form,signal:controller.signal});
  }catch(err){
   if(err.name==="AbortError")throw new Error("AI 90 saniye içinde yanıt vermedi.");
   throw new Error("AI sunucusuna bağlanılamadı: "+err.message);
  }finally{clearTimeout(timeoutId);}
  const raw=await response.text();
  let data;
  try{data=parseJsonWithControlRepair(raw);}catch(err){throw new Error("AI yanıtı okunamadı: "+err.message);}
  if(!response.ok||!data.success)throw new Error(data.detail||data.error||("AI isteği başarısız (HTTP "+response.status+")."));
  if(!data.config||typeof data.config!=="object")throw new Error("AI düzeltilmiş tasarım döndürmedi.");
  config={...defaults,...data.config};
  render();json();
  const checked=validateAndRepairYoldas(makeYoldasCode(config));
  const finalJson=JSON.stringify(checked.doc,null,2);
  await navigator.clipboard.writeText(finalJson);
  window.__lastYoldasDial=checked.doc;
  $("jsonStatus").textContent="✓ AI HATALARI DÜZELTTİ · "+checked.passes+" ŞEMA KONTROL TURU · JSON KOPYALANDI";
  $("jsonStatus").style.color="#39d99b";
  $("prompt").value=$("prompt").value.trim()+"\n\nSon Yoldaş hata raporu:\n"+copied;
 }catch(e){
  $("jsonStatus").textContent="DÜZELTME BAŞARISIZ: "+e.message;
  $("jsonStatus").style.color="#ff7474";
  alert(e.message);
 }finally{
  button.disabled=false;
  button.textContent="↻ YOLDAŞ HATALARINI AL VE DÜZELT";
 }
};

$("generate").onclick=async()=>{
 const button=$("generate");
 if(!selectedImage){alert("Önce sol taraftan bir kadran fotoğrafı yükle.");return;}
 button.disabled=true;button.textContent="✳ AI TASARIMI HAZIRLIYOR...";
 $("jsonStatus").textContent="GÖRSEL AI'YA GÖNDERİLİYOR...";
 $("jsonStatus").style.color="#20c9ff";
 let yoldasTab=window.open("about:blank","_blank");
 try{
  const form=new FormData();
  form.append("image",selectedImage);
  const visionBrief="GÖREV: Yüklenen referans görselini dikkatle incele ve görselin kompozisyonuna sadık, uygulanabilir bir dijital araç gösterge paneli tasarımı için config üret. Önce görselin genel siluetini (oval/dairesel/yatay), ekran bölgelerinin konumlarını, ana/ikincil göstergeleri, yazı tiplerinin karakterini, renk paletini, kontrastı, ışık efektlerini ve boşluk oranlarını analiz et. Sonuçta yalnızca desteklenen config alanlarını kullan: name, maxSpeed, maxRpm, theme, accent, secondary, speed, rpm, units, layout, gaugeStyle, centerText, subtitle. layout yalnızca dual-dial, single-dial, horizontal veya minimal; gaugeStyle yalnızca neon, solid veya minimal olabilir. accent ve secondary #RRGGBB biçiminde olsun. maxSpeed 80-400, maxRpm 3000-12000 aralığında; speed ve rpm bu sınırları aşmasın. Fotoğrafta olmayan iki yuvarlak göstergeyi, ekstra ikonları veya dekoratif parçaları kendiliğinden ekleme. Görselde oval bir panel varsa renkleri ve bilgi hiyerarşisini koruyarak en yakın yatay/dual-dial yerleşimini seç. Metinleri kısa tut. Kullanıcı isteği: ";
  form.append("prompt",visionBrief+$("prompt").value.trim());
  $("jsonStatus").textContent="AI GÖRSELİ İNCELİYOR...";
  const controller=new AbortController();
  const timeoutId=setTimeout(()=>controller.abort(),90000);
  let response;
  try{response=await fetch("https://kadran-ai.memirgurbuz44.workers.dev",{method:"POST",body:form,signal:controller.signal});}
  catch(fetchError){if(fetchError.name==="AbortError")throw new Error("AI sunucusu 90 saniye içinde yanıt vermedi. Worker kontrol edilmeli.");throw new Error("AI sunucusuna bağlanılamadı: "+fetchError.message);}
  finally{clearTimeout(timeoutId);}
  const rawResponse=await response.text();
  let data;
  try{data=parseJsonWithControlRepair(rawResponse);}catch(parseError){
   throw new Error("AI sunucusunun yanıtı okunamadı (HTTP "+response.status+"). "+parseError.message);
  }
  if(!response.ok||!data.success)throw new Error(data.detail||data.error||("AI isteği başarısız oldu (HTTP "+response.status+")."));
  if(!data.config||typeof data.config!=="object")throw new Error("AI geçerli tasarım döndürmedi.");
  config={...defaults,...data.config};
  json();render();
  $("jsonStatus").textContent="YOLDAŞ UYUMLULUĞU DENETLENİYOR...";
  let checked=validateAndRepairYoldas(makeYoldasCode(config));
  // Use the repaired, validated Yoldaş document as the final export.
  const yoldasCode=JSON.stringify(checked.doc,null,2);
  localStorage.setItem("kadran_atolye_json",yoldasCode);
  $("jsonEditor").value=JSON.stringify(config,null,2);
  try{
   await navigator.clipboard.writeText(yoldasCode);
   $("jsonStatus").textContent="✓ YOLDAŞ KONTROLÜ TAMAM · "+checked.passes+" DÜZELTME TURU · CTRL+V";
  }catch{
   $("jsonStatus").textContent="✓ YOLDAŞ KONTROLÜ TAMAM · JSON İNDİR DÜĞMESİNİ KULLAN";
  }
  $("jsonStatus").style.color="#39d99b";
  if(yoldasTab && !yoldasTab.closed){yoldasTab.location.href="atolye.html";yoldasTab.focus();}
  window.__lastYoldasDial=checked.doc;
 }catch(error){
  $("jsonStatus").textContent="AI HATASI: "+error.message;
  $("jsonStatus").style.color="#ff7474";
  alert("AI tasarımı oluşturulamadı:\n"+error.message);
 }finally{
  button.disabled=false;
  button.textContent="✳ TASARIMI AI İLE OLUŞTUR";
 }
};
$("imageInput").onchange=e=>showImage(e.target.files[0]);
function showImage(file){if(!file)return;if(!/^image\/(png|jpeg|webp)$/.test(file.type)){alert("Lütfen PNG, JPG veya WEBP görsel seç.");return;}if(file.size>5*1024*1024){alert("Görsel en fazla 5 MB olabilir.");return;}selectedImage=file;const url=URL.createObjectURL(file);$("referencePreview").innerHTML='<img src="'+url+'" alt="Yüklenen kadran referansı">';}
const dz=$("dropzone");
["dragenter","dragover"].forEach(ev=>dz.addEventListener(ev,e=>{e.preventDefault();dz.style.borderColor="var(--cyan)";}));
["dragleave","drop"].forEach(ev=>dz.addEventListener(ev,e=>{e.preventDefault();dz.style.borderColor="";}));
dz.addEventListener("drop",e=>showImage(e.dataTransfer.files[0]));
$("jsonInput").onchange=async e=>{const f=e.target.files[0];if(!f)return;try{config={...defaults,...JSON.parse(await f.text())};json();render();}catch{alert("Dosyada geçerli JSON bulunamadı.");}e.target.value="";};
json();render();