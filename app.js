const $=id=>document.getElementById(id);
const defaults={name:"NEON PERFORMANCE",maxSpeed:240,maxRpm:8000,theme:"dark",accent:"#20c9ff",speed:84,rpm:3.2,units:{speed:"KM/H",rpm:"x1000 RPM"},layout:"dual-dial"};
let config={...defaults};
let selectedImage=null;
function json(){ $("jsonEditor").value=JSON.stringify(config,null,2); $("jsonStatus").textContent="JSON HAZIR"; }
function arcPath(cx,cy,r,start,end){const a=start*Math.PI/180,b=end*Math.PI/180,x1=cx+r*Math.cos(a),y1=cy+r*Math.sin(a),x2=cx+r*Math.cos(b),y2=cy+r*Math.sin(b);return `M ${x1} ${y1} A ${r} ${r} 0 ${end-start>180?1:0} 1 ${x2} ${y2}`;}
function ticks(group,cx,cy,r,count){let out="";for(let i=0;i<=count;i++){let a=(-215+i/count*250)*Math.PI/180,major=i%5===0,ri=r-(major?15:8),x1=cx+ri*Math.cos(a),y1=cy+ri*Math.sin(a),x2=cx+r*Math.cos(a),y2=cy+r*Math.sin(a);out+=`<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" class="tick ${major?"major":""}"/>`;}$(group).innerHTML=out;}
function render(){
 const accent=config.accent||defaults.accent, max=Number(config.maxSpeed)||240, rpmMax=Number(config.maxRpm)||8000;
 $("cluster").style.setProperty("--accent",accent);$("cluster").classList.toggle("light",config.theme==="light");
 $("clusterName").textContent=config.name||"CUSTOM DASHBOARD";
 $("speedText").textContent=String(Math.round(config.speed||0)).padStart(3,"0");
 $("rpmText").textContent=(Number(config.rpm)||0).toFixed(1);
 $("speedArc").setAttribute("d",arcPath(190,190,112,-215,-215+250*Math.min(1,(config.speed||0)/max)));
 $("rpmArc").setAttribute("d",arcPath(570,190,112,-215,-215+250*Math.min(1,(config.rpm||0)/(rpmMax/1000))));
 ticks("leftTicks",190,190,127,20);ticks("rightTicks",570,190,127,20);
 $("speedSlider").max=max;$("speedSlider").value=config.speed||0;$("speedLabel").textContent=`${config.speed||0} km/h`;
 $("rpmSlider").max=rpmMax/1000;$("rpmSlider").value=config.rpm||0;$("rpmLabel").textContent=`${Number(config.rpm||0).toFixed(1)} x1000`;
 $("nameInput").value=config.name||"";$("maxSpeed").value=String(max);$("maxRpm").value=String(rpmMax);$("accent").value=accent;$("colorValue").textContent=accent.toUpperCase();$("theme").value=config.theme||"dark";
}
function applyEditor(){try{const next=JSON.parse($("jsonEditor").value);if(!next||typeof next!=="object"||Array.isArray(next))throw Error("JSON bir nesne olmalı");config={...defaults,...next};render();$("jsonStatus").textContent="GEÇERLİ JSON";$("jsonStatus").style.color="#39d99b";}catch(e){$("jsonStatus").textContent="JSON HATASI";$("jsonStatus").style.color="#ff7474";}}
let timer; $("jsonEditor").addEventListener("input",()=>{clearTimeout(timer);timer=setTimeout(applyEditor,250)});
$("applySettings").onclick=()=>{config={...config,name:$("nameInput").value,maxSpeed:+$("maxSpeed").value,maxRpm:+$("maxRpm").value,accent:$("accent").value,theme:$("theme").value};json();render();};
$("accent").oninput=()=>{$("colorValue").textContent=$("accent").value.toUpperCase();};
$("speedSlider").oninput=e=>{config.speed=+e.target.value;json();render();};
$("rpmSlider").oninput=e=>{config.rpm=+e.target.value;json();render();};
function download(){try{applyEditor();const blob=new Blob([JSON.stringify(config,null,2)],{type:"application/json"}),a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download=(config.name||"kadran").toLowerCase().replace(/[^a-z0-9]+/g,"-")+".json";a.click();URL.revokeObjectURL(a.href);}catch{}}
$("downloadTop").onclick=download;
$("copyJson").onclick=async()=>{try{await navigator.clipboard.writeText($("jsonEditor").value);$("copyJson").textContent="KOPYALANDI";setTimeout(()=>$("copyJson").textContent="KOPYALA",1400);}catch{$("jsonEditor").select();document.execCommand("copy");}};
$("formatJson").onclick=()=>{try{$("jsonEditor").value=JSON.stringify(JSON.parse($("jsonEditor").value),null,2);applyEditor();}catch{$("jsonStatus").textContent="JSON HATASI";}};
$("reset").onclick=()=>{config={...defaults};json();render();};
$("sample").onclick=()=>{config={...defaults,name:"MIDNIGHT GT",accent:"#ff3b62",maxSpeed:320,maxRpm:9000,speed:126,rpm:4.8};json();render();};
$("generate").onclick=async()=>{
 const button=$("generate");
 if(!selectedImage){alert("Önce sol taraftan bir kadran fotoğrafı yükle.");return;}
 button.disabled=true;button.textContent="✳ FOTOĞRAF ANALİZ EDİLİYOR...";
 $("jsonStatus").textContent="AI ANALİZ EDİYOR...";
 try{
  const form=new FormData();
  form.append("image",selectedImage);
  form.append("prompt",$("prompt").value.trim());
  const response=await fetch("https://kadran-ai.memirgurbuz44.workers.dev",{method:"POST",body:form});
  const data=await response.json();
  if(!response.ok||!data.success) throw new Error(data.error||"AI isteği başarısız oldu.");
  if(!data.config||typeof data.config!=="object") throw new Error("AI geçerli tasarım döndürmedi.");
  config={...defaults,...config,...data.config};
  json();render();
  $("jsonStatus").textContent="GERÇEK AI TASARIMI OLUŞTU";
  $("jsonStatus").style.color="#39d99b";
 }catch(error){
  $("jsonStatus").textContent="AI HATASI";
  $("jsonStatus").style.color="#ff7474";
  alert("AI hatası: "+error.message);
 }finally{
  button.disabled=false;button.textContent="✳ TASARIMI AI İLE OLUŞTUR";
 }
};
$("imageInput").onchange=e=>showImage(e.target.files[0]);
function showImage(file){if(!file)return;if(!/^image\/(png|jpeg|webp)$/.test(file.type)){alert("Lütfen PNG, JPG veya WEBP görsel seç.");return;}if(file.size>5*1024*1024){alert("Görsel en fazla 5 MB olabilir.");return;}selectedImage=file;const url=URL.createObjectURL(file);$("referencePreview").innerHTML=`<img src="${url}" alt="Yüklenen kadran referansı">`;}
const dz=$("dropzone");["dragenter","dragover"].forEach(ev=>dz.addEventListener(ev,e=>{e.preventDefault();dz.style.borderColor="var(--cyan)"}));["dragleave","drop"].forEach(ev=>dz.addEventListener(ev,e=>{e.preventDefault();dz.style.borderColor=""}));dz.addEventListener("drop",e=>showImage(e.dataTransfer.files[0]));
$("jsonInput").onchange=async e=>{const f=e.target.files[0];if(!f)return;try{config={...defaults,...JSON.parse(await f.text())};json();render();}catch{alert("Dosyada geçerli JSON bulunamadı.");}e.target.value="";};
json();render();