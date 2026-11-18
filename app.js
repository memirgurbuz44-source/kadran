const $=id=>document.getElementById(id);
const defaults={name:"NEON PERFORMANCE",maxSpeed:240,maxRpm:8000,theme:"dark",accent:"#20c9ff",secondary:"#8b5cf6",speed:84,rpm:3.2,units:{speed:"KM/H",rpm:"x1000 RPM"},layout:"dual-dial",gaugeStyle:"neon",centerText:"D",subtitle:"DRIVE"};
let config={...defaults};
let selectedImage=null;
function json(){$("jsonEditor").value=JSON.stringify(config,null,2);$("jsonStatus").textContent="JSON HAZIR";}
function parseJsonWithControlRepair(raw){
 const clean=String(raw??"").replace(/^\uFEFF/,"").trim();
 try{return JSON.parse(clean);}catch(firstError){
  let out="",inString=false,escaped=false;
  for(let i=0;i<clean.length;i++){
   const ch=clean[i],code=clean.charCodeAt(i);
   if(inString){
    if(escaped){out+=ch;escaped=false;continue;}
    if(ch==="\\"){out+=ch;escaped=true;continue;}
    if(ch==='"'){out+=ch;inString=false;continue;}
    if(code<0x20){
     if(ch==="\n")out+="\\n";
     else if(ch==="\r")out+="\\r";
     else if(ch==="\t")out+="\\t";
     else out+="\\u"+code.toString(16).padStart(4,"0");
     continue;
    }
    out+=ch;
   }else{
    if(ch==='"')inString=true;
    out+=ch;
   }
  }
  try{return JSON.parse(out);}catch(secondError){
   const pos=Number(firstError.message.match(/position (\d+)/)?.[1]||0);
   const excerpt=clean.slice(Math.max(0,pos-100),Math.min(clean.length,pos+180));
   throw new Error("AI yanıtı bozuk JSON içeriyor. "+firstError.message+" Yanıt parçası: "+excerpt);
  }
 }
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
 $("accent").value=safeColor(config.accent,defaults.accent);$("colorValue").textContent=safeColor(config.accent,defaults.accent).toUpperCase();$("theme").value=config.theme||"dark";
}
function applyEditor(){try{const next=JSON.parse($("jsonEditor").value);if(!next||typeof next!=="object"||Array.isArray(next))throw Error("JSON bir nesne olmalı");config={...defaults,...next};render();$("jsonStatus").textContent="GEÇERLİ JSON";$("jsonStatus").style.color="#39d99b";}catch(e){$("jsonStatus").textContent="JSON HATASI";$("jsonStatus").style.color="#ff7474";}}
let timer;$("jsonEditor").addEventListener("input",()=>{clearTimeout(timer);timer=setTimeout(applyEditor,250);});
$("applySettings").onclick=()=>{config={...config,name:$("nameInput").value,maxSpeed:+$("maxSpeed").value,maxRpm:+$("maxRpm").value,accent:$("accent").value,theme:$("theme").value};json();render();};
$("accent").oninput=()=>{$("colorValue").textContent=$("accent").value.toUpperCase();};
$("speedSlider").oninput=e=>{config.speed=+e.target.value;json();render();};
$("rpmSlider").oninput=e=>{config.rpm=+e.target.value;json();render();};
function makeYoldasCode(c){
 const accent=safeColor(c.accent,"#20C9FF"),secondary=safeColor(c.secondary,"#8B5CF6");
 const title=String(c.name||"DIGITAL COCKPIT").replace(/[\\r\\n]+/g," ").slice(0,24);
 const ink={night:"#F4F7FA",day:"#17212B"},dim={night:"#AAB6C2",day:"#526170"};
 const track={night:"#FFFFFF20",day:"#10151C20"};
 const parts=[
  {type:"ellipse",center:[960,360],rx:900,ry:300,fill:{radial:{center:[960,330],radius:980,stops:[[0,"#17232E"],[0.78,"#0A1118"],[1,"#030609"]]}},stroke:{paint:"#354553",width:8}},
  {type:"ellipse",center:[960,360],rx:865,ry:267,fill:"#080E14",stroke:{paint:secondary,width:3},glow:{color:secondary,size:12,strength:0.35}},
  {type:"arc",center:[960,360],radius:820,start:-115,sweep:230,stroke:{paint:accent,width:3,cap:"round"}},
  {type:"text",text:title,x:960,y:88,align:"center",size:24,weight:700,spacing:0.18,fill:dim},
  {type:"ready",x:900,y:112,width:120,height:34},
  {type:"signal",side:"left",x:360,y:292,size:56,color:"$signal"},
  {type:"signal",side:"right",x:1504,y:292,size:56,color:"$signal"},
  {type:"circle",center:[420,360],radius:150,fill:"#0B141C",stroke:{paint:"#30404D",width:4}},
  {type:"ring",center:[420,360],radius:118,width:12,start:-135,sweep:270,value:"battery",from:[0,100],color:{value:"battery",steps:[[20,"$warning"]],color:accent},track:track},
  {type:"text",value:"battery",x:420,y:360,align:"center",size:48,weight:500,font:"tech",fill:ink},
  {type:"text",word:"battery",x:420,y:438,align:"center",size:18,weight:600,spacing:0.16,fill:dim},
  {type:"circle",center:[1500,360],radius:150,fill:"#0B141C",stroke:{paint:"#30404D",width:4}},
  {type:"ring",center:[1500,360],radius:118,width:12,start:-135,sweep:270,value:"range",from:[0,600],color:secondary,track:track},
  {type:"text",value:"range",unit:{size:20},x:1500,y:360,align:"center",size:54,weight:500,font:"tech",fill:ink},
  {type:"text",word:"range",x:1500,y:438,align:"center",size:18,weight:600,spacing:0.16,fill:dim},
  {type:"circle",center:[960,350],radius:248,fill:"#0A121A",stroke:{paint:"#354653",width:5}},
  {type:"arc",center:[960,350],radius:225,start:-140,sweep:280,stroke:{paint:track,width:10,cap:"round"}},
  {type:"arc",center:[960,350],radius:225,start:-140,sweep:280,stroke:{paint:accent,width:5,cap:"round"},glow:{color:accent,size:14,strength:0.5}},
  {type:"text",value:"speed",x:960,y:335,align:"center",valign:"middle",size:190,weight:650,font:"tech",fill:ink},
  {type:"text",unit_of:"speed",uppercase:true,x:960,y:455,align:"center",size:24,weight:700,spacing:0.2,fill:accent},
  {type:"text",value:"gear",x:960,y:535,align:"center",size:42,weight:700,font:"tech",fill:ink},
  {type:"line",from:[650,610],to:[1270,610],stroke:{paint:track,width:2}},
  {type:"text",word:"mode",x:960,y:650,align:"center",size:18,weight:600,spacing:0.18,fill:dim}
 ];
 return {yoldas_dial:1,name:title,description:"Gorsel referansina gore olusturulmus oval dijital gosterge tasarimi.",background:{night:"#05080C",day:"#EEF2F5"},parts};
}
function download(){try{applyEditor();const blob=new Blob([JSON.stringify(config,null,2)],{type:"application/json"}),a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download=(config.name||"kadran").toLowerCase().replace(/[^a-z0-9]+/g,"-")+".json";a.click();URL.revokeObjectURL(a.href);}catch{}}
$("downloadTop").onclick=download;
$("copyJson").onclick=async()=>{try{await navigator.clipboard.writeText($("jsonEditor").value);$("copyJson").textContent="KOPYALANDI";setTimeout(()=>$("copyJson").textContent="KOPYALA",1400);}catch{$("jsonEditor").select();document.execCommand("copy");}};
$("formatJson").onclick=()=>{try{$("jsonEditor").value=JSON.stringify(JSON.parse($("jsonEditor").value),null,2);applyEditor();}catch{$("jsonStatus").textContent="JSON HATASI";}};
$("reset").onclick=()=>{config={...defaults};json();render();};
$("sample").onclick=()=>{config={...defaults,name:"MIDNIGHT GT",accent:"#ff3b62",secondary:"#a78bfa",maxSpeed:320,maxRpm:9000,speed:126,rpm:4.8,layout:"single-dial",gaugeStyle:"solid"};json();render();};
$("generate").onclick=async()=>{
 const button=$("generate");
 if(!selectedImage){alert("Önce sol taraftan bir kadran fotoğrafı yükle.");return;}
 button.disabled=true;button.textContent="✳ AI TASARIMI HAZIRLIYOR...";
 $("jsonStatus").textContent="GÖRSEL AI'YA GÖNDERİLİYOR...";
 $("jsonStatus").style.color="#20c9ff";
 let yoldasTab=window.open("https://yoldas.io/kadran-atolyesi","_blank");
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
  const yoldasCode=JSON.stringify(makeYoldasCode(config),null,2);
  try{
   await navigator.clipboard.writeText(yoldasCode);
   $("jsonStatus").textContent="TASARIM HAZIR · YOLDAŞ KODU KOPYALANDI";
  }catch{
   $("jsonStatus").textContent="TASARIM HAZIR · JSON ALANI GÜNCELLENDİ";
  }
  $("jsonStatus").style.color="#39d99b";
  if(yoldasTab && !yoldasTab.closed){yoldasTab.focus();}
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