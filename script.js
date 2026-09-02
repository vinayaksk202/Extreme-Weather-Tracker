const cities=[
 ["Mumbai","Maharashtra",19.076,72.878],["Pune","Maharashtra",18.520,73.857],["Ahmedabad","Gujarat",23.022,72.571],["Surat","Gujarat",21.170,72.831],
 ["Jaipur","Rajasthan",26.912,75.787],["Delhi","Delhi",28.614,77.209],["Kolkata","West Bengal",22.573,88.364],["Bhubaneswar","Odisha",20.296,85.824],
 ["Guwahati","Assam",26.144,91.736],["Kochi","Kerala",9.931,76.267],["Chennai","Tamil Nadu",13.083,80.271],["Bengaluru","Karnataka",12.971,77.594],
 ["Lucknow","Uttar Pradesh",26.847,80.947],["Patna","Bihar",25.594,85.137],["Hyderabad","Telangana",17.385,78.487]
];
const types=["Flood","Cyclone","Heatwave","Landslide","Thunderstorm","Drought"];
const severities=["Critical","High","Moderate","Low"];
const descriptions={
 Flood:"Heavy rainfall caused significant flooding across multiple areas.",
 Cyclone:"Severe cyclonic conditions produced damaging winds and rainfall.",
 Heatwave:"Persistent extreme temperatures created hazardous heat conditions.",
 Landslide:"Intense rainfall triggered slope instability and localized landslides.",
 Thunderstorm:"Severe thunderstorms brought intense rainfall, wind and lightning.",
 Drought:"Extended below-average rainfall created significant water stress."
};
const weatherEvents=[];
let id=1;
for(let year=2020;year<=2026;year++){
 for(let j=0;j<7+(year%3);j++){
  const c=cities[(j*2+year)%cities.length], type=types[(j+year)%types.length], sev=severities[(j*3+year)%4];
  const month=((j*2+year)%12)+1, day=((j*7+year*3)%26)+1;
  weatherEvents.push({id:id++,eventType:type,location:c[0],region:c[1],latitude:c[2]+((j%3)-1)*.07,longitude:c[3]+((j%4)-2)*.08,date:`${year}-${String(month).padStart(2,"0")}-${String(day).padStart(2,"0")}`,year,severity:sev,description:descriptions[type],affectedArea:+(4+((j*7+year)%30)*.7).toFixed(1),duration:1+((j+year)%6)});
 }
}
let filtered=[...weatherEvents], map, markers=new Map(), yearChart,typeChart;

const $=s=>document.querySelector(s);
const severityScore={Critical:95,High:82,Moderate:58,Low:32};
const cls=s=>s.toLowerCase();
function populateFilters(){
 [...new Set(weatherEvents.map(e=>e.eventType))].forEach(x=>$("#typeFilter").insertAdjacentHTML("beforeend",`<option>${x}</option>`));
 [...new Set(weatherEvents.map(e=>e.year))].forEach(x=>$("#yearFilter").insertAdjacentHTML("beforeend",`<option>${x}</option>`));
}
function initMap(){
 if(typeof L==="undefined"){ $("#map").style.display="none"; $("#mapFallback").style.display="grid"; return; }
 map=L.map("map",{zoomControl:false}).setView([22.5,79],5);
 L.control.zoom({position:"bottomright"}).addTo(map);
 L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",{attribution:"© OpenStreetMap contributors",maxZoom:19,crossOrigin:true}).addTo(map);
 updateMap();
}
function iconFor(sev){return L.divIcon({className:"",html:`<div class="event-pin pin-${cls(sev)}"></div>`,iconSize:[15,15],iconAnchor:[7,7]})}
function updateMap(){
 if(!map)return;
 markers.forEach(m=>map.removeLayer(m));markers.clear();
 filtered.forEach(e=>{
  const m=L.marker([e.latitude,e.longitude],{icon:iconFor(e.severity)}).addTo(map);
  m.bindTooltip(`<b>${e.eventType.toUpperCase()}</b><br>${e.location}<br>${formatDate(e.date)} · ${e.severity}`,{className:"weather-tooltip",direction:"top",offset:[0,-8]});
  m.on("click",()=>showDetails(e));
  markers.set(e.id,m);
 });
 $("#mapCount").textContent=filtered.length;
}
function formatDate(d){return new Date(d+"T00:00:00").toLocaleDateString("en-IN",{day:"2-digit",month:"short",year:"numeric"})}
function applyFilters(){
 const q=$("#search").value.trim().toLowerCase(), t=$("#typeFilter").value, s=$("#severityFilter").value, y=$("#yearFilter").value;
 filtered=weatherEvents.filter(e=>
  (!q || `${e.location} ${e.region} ${e.eventType}`.toLowerCase().includes(q)) &&
  (t==="All Events"||e.eventType===t)&&(s==="All"||e.severity===s)&&(y==="All Years"||String(e.year)===y)
 );
 updateAll();
}
function updateAll(){updateMap();updateKPIs();updateTimeline();updateCharts();updateRecent()}
function updateKPIs(){
 const total=filtered.length, high=filtered.filter(e=>e.severity==="High"||e.severity==="Critical").length;
 const regions=new Set(filtered.map(e=>e.region)).size;
 const counts={};filtered.forEach(e=>counts[e.eventType]=(counts[e.eventType]||0)+1);
 const common=Object.entries(counts).sort((a,b)=>b[1]-a[1])[0]?.[0]||"—";
 const vals=[total,high,regions,common];
 $("#kpis").innerHTML=[
  ["TOTAL EVENTS",vals[0],"+ live filtered","◉"],
  ["HIGH SEVERITY",vals[1],"Critical + High","!"],
  ["ACTIVE REGIONS",vals[2],"Regions represented","⌖"],
  ["MOST COMMON",vals[3],counts[common]?`${counts[common]} occurrences`:"No events","≋"]
 ].map((x,i)=>`<div class="card kpi"><div class="kpi-label">${x[0]}</div><div class="kpi-value" ${i===3?'style="font-size:25px"':''}>${x[1]}</div><div class="kpi-meta">${x[3]} &nbsp; ${x[2]}</div></div>`).join("");
}
function updateTimeline(){
 const years=[2020,2021,2022,2023,2024,2025,2026];
 const selected=$("#yearFilter").value;
 $("#timelineTotal").textContent=`${weatherEvents.length} EVENTS INDEXED`;
 $("#timelineYears").innerHTML=years.map(y=>{
  const count=weatherEvents.filter(e=>e.year===y).length;
  return `<div class="year ${String(y)===selected?"selected":""}" onclick="selectYear(${y})"><div class="year-num">${y}</div><div class="node"></div><div class="year-count">${count} EVENTS</div></div>`;
 }).join("");
}
function selectYear(y){
 $("#yearFilter").value=String(y);applyFilters();$("#events").scrollIntoView({behavior:"smooth",block:"start"});
}
function updateCharts(){
 if(typeof Chart==="undefined"){drawFallback();return}
 const years=[2020,2021,2022,2023,2024,2025,2026], yc=years.map(y=>filtered.filter(e=>e.year===y).length);
 const tc=types.map(t=>filtered.filter(e=>e.eventType===t).length);
 if(yearChart)yearChart.destroy();if(typeChart)typeChart.destroy();
 yearChart=new Chart($("#yearChart"),{type:"line",data:{labels:years,datasets:[{data:yc,borderColor:"#78aaff",backgroundColor:"rgba(120,170,255,.12)",fill:true,tension:.4,pointRadius:3,pointBackgroundColor:"#78aaff"}]},options:chartOpts()});
 typeChart=new Chart($("#typeChart"),{type:"doughnut",data:{labels:types,datasets:[{data:tc,backgroundColor:["#4c91ff","#9b7cff","#ffb15a","#f26b7e","#52c7a3","#6e7d90"],borderWidth:0}]},options:{...chartOpts(),plugins:{legend:{position:"bottom",labels:{color:"#8e9aaa",font:{size:9},boxWidth:8,padding:12}}},cutout:"70%"}});
}
function chartOpts(){return {responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false},tooltip:{backgroundColor:"#111923",borderColor:"rgba(255,255,255,.1)",borderWidth:1,titleColor:"#fff",bodyColor:"#aab4c0"}},scales:{x:{grid:{color:"rgba(255,255,255,.045)"},ticks:{color:"#687688",font:{size:9}}},y:{grid:{color:"rgba(255,255,255,.045)"},ticks:{color:"#687688",font:{size:9},precision:0},beginAtZero:true}}}}
function drawFallback(){
 $("#yearChart").style.display="none";const years=[2020,2021,2022,2023,2024,2025,2026], vals=years.map(y=>filtered.filter(e=>e.year===y).length), max=Math.max(...vals,1);
 $("#yearFallback").style.display="block";$("#yearFallback").innerHTML=`<div class="fallback-bars">${years.map((y,i)=>`<div class="fbar"><span style="height:${vals[i]/max*190}px"></span>${y}<br>${vals[i]}</div>`).join("")}</div>`;
}
function updateRecent(){
 const data=[...filtered].sort((a,b)=>b.date.localeCompare(a.date)).slice(0,10);
 $("#recent").innerHTML=data.length?`<table class="table"><thead><tr><th>EVENT</th><th>LOCATION</th><th>DATE</th><th>SEVERITY</th><th>STATUS</th></tr></thead><tbody>${data.map(e=>`<tr onclick="focusEvent(${e.id})"><td>◉ &nbsp; ${e.eventType}</td><td>${e.location}, ${e.region}</td><td>${formatDate(e.date)}</td><td><span class="badge b-${cls(e.severity)}">${e.severity.toUpperCase()}</span></td><td style="color:#6f7d8e">Historical</td></tr>`).join("")}</tbody></table>`:`<div class="empty">NO EVENTS FOUND<br><button class="btn" onclick="resetFilters()" style="margin-top:12px">RESET FILTERS</button></div>`;
}
function showDetails(e){
 const score=severityScore[e.severity]||50;
 $("#details").innerHTML=`<button class="close" onclick="closeDetails()">×</button><div class="event-type">${e.eventType.toUpperCase()}</div><h3>${e.location}</h3><div class="location">${e.region} · ${formatDate(e.date)}</div><div class="severity"><div><div class="sev-label">SEVERITY</div><div class="sev-value">${e.severity}</div></div><strong>${score}%</strong></div><div class="bar"><span style="width:${score}%"></span></div><div class="desc">${e.description}</div><div class="facts"><div class="fact"><small>AFFECTED AREA</small><strong>${e.affectedArea} km²</strong></div><div class="fact"><small>DURATION</small><strong>${e.duration} day${e.duration>1?"s":""}</strong></div></div><button class="btn primary" style="width:100%;margin-top:18px" onclick="focusEvent(${e.id});closeDetails()">VIEW ON MAP</button>`;
 $("#details").classList.add("open");
 if(map){map.flyTo([e.latitude,e.longitude],7,{duration:1.1});}
}
function closeDetails(){$("#details").classList.remove("open")}
function focusEvent(id){const e=weatherEvents.find(x=>x.id===id);if(!e)return;if(map){map.flyTo([e.latitude,e.longitude],8,{duration:1});setTimeout(()=>showDetails(e),400)}else showDetails(e)}
function resetFilters(){$("#search").value="";$("#typeFilter").value="All Events";$("#severityFilter").value="All";$("#yearFilter").value="All Years";applyFilters();toast("Filters reset")}
function toast(msg){const t=$("#toast");t.textContent=msg;t.classList.add("show");setTimeout(()=>t.classList.remove("show"),1800)}
["search","typeFilter","severityFilter","yearFilter"].forEach(id=>$( "#"+id).addEventListener(id==="search"?"input":"change",()=>{clearTimeout(window._filterTimer);window._filterTimer=setTimeout(applyFilters,id==="search"?160:0)}));
$("#reset").onclick=resetFilters;
new IntersectionObserver(entries=>entries.forEach(e=>{if(e.isIntersecting)e.target.classList.add("visible")}),{threshold:.08}).observe(document.querySelector(".hero"));
document.querySelectorAll(".reveal").forEach(el=>{new IntersectionObserver(entries=>entries.forEach(e=>{if(e.isIntersecting)e.target.classList.add("visible")}),{threshold:.08}).observe(el)});
populateFilters();updateKPIs();updateTimeline();updateRecent();initMap();updateCharts();
setTimeout(()=>$("#loading").classList.add("hide"),2700);


// LIVE WEATHER BACKEND INTEGRATION
async function loadLiveData(){
  try{
    const response=await fetch("http://127.0.0.1:5000/api/live/events",{cache:"no-store"});
    if(!response.ok) throw new Error(`Backend HTTP ${response.status}`);
    const payload=await response.json();
    const live=(payload.events||[]).map((e,i)=>{
      const d=new Date(e.date||Date.now());
      return {...e,id:`live-${i}-${Date.now()}`,year:d.getFullYear(),live:true,source:e.source||"Open-Meteo",affectedArea:e.affectedArea??"—",duration:e.duration??"Live"};
    }).filter(e=>Number.isFinite(e.latitude)&&Number.isFinite(e.longitude));
    for(let i=weatherEvents.length-1;i>=0;i--) if(weatherEvents[i].live) weatherEvents.splice(i,1);
    live.forEach(e=>weatherEvents.push(e));
    populateFilters();
    filtered=[...weatherEvents];
    updateAll();
    const status=document.querySelector(".map-status");
    if(status) status.innerHTML=`<span class="dot" style="display:inline-block;margin-right:5px"></span><span id="mapCount">${filtered.length}</span> EVENTS · <strong style="color:#66d9a1">${live.length} LIVE</strong>`;
    toast(`LIVE DATA CONNECTED · ${live.length} events`);
  }catch(err){
    console.error("Live weather backend unavailable:",err);
    const status=document.querySelector(".map-status");
    if(status) status.innerHTML=`<span class="dot" style="display:inline-block;margin-right:5px"></span><span id="mapCount">${filtered.length}</span> EVENTS · <strong style="color:#ff7286">OFFLINE</strong>`;
    toast("Live data unavailable · showing demo data");
  }
}

setTimeout(loadLiveData,300);
