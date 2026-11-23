(function(){
"use strict";
var Q=window.DIG_Q;
var $=function(id){return document.getElementById(id);};
function ri(a,b){return a+Math.floor(Math.random()*(b-a+1));}
function esc(s){return String(s).replace(/[&<>"]/g,function(c){return{"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c];});}

/* ---------- fossil art: drawn in a horizontal box len*100 x 100 ---------- */
var B='fill="var(--bone)" stroke="var(--bone-ink)" stroke-width="3" stroke-linejoin="round"';
var L='fill="none" stroke="var(--bone-ink)" stroke-width="2.5" stroke-linecap="round"';
function spiral(cx,cy,r){
  var s='<circle cx="'+cx+'" cy="'+cy+'" r="'+r+'" '+B+'/>',p="M"+cx+" "+cy;
  for(var a=0;a<=4*Math.PI;a+=0.25){var rr=r*a/(4*Math.PI)*0.92;p+=" L"+(cx+rr*Math.cos(a)).toFixed(1)+" "+(cy+rr*Math.sin(a)).toFixed(1);}
  s+='<path d="'+p+'" '+L+'/>';
  for(var k=0;k<14;k++){var t=k/14*2*Math.PI;s+='<path d="M'+(cx+r*.62*Math.cos(t)).toFixed(1)+' '+(cy+r*.62*Math.sin(t)).toFixed(1)+' L'+(cx+r*.95*Math.cos(t)).toFixed(1)+' '+(cy+r*.95*Math.sin(t)).toFixed(1)+'" '+L+' stroke-width="1.6"/>';}
  return s;
}
var ART={
 tooth:function(){var s='<path d="M28 78 Q100 92 172 78 L100 10Z" '+B+'/>';for(var i=0;i<6;i++){var t=i/6;s+='<path d="M'+(32+t*64).toFixed(0)+' '+(74-t*58).toFixed(0)+' l-5 -2" '+L+'/><path d="M'+(168-t*64).toFixed(0)+' '+(74-t*58).toFixed(0)+' l5 -2" '+L+'/>';}
  return s+'<path d="M34 80 Q100 98 166 80 L160 92 Q100 108 40 92Z" fill="var(--bone2)" stroke="var(--bone-ink)" stroke-width="3"/><path d="M100 22 L100 70" '+L+' opacity=".5"/>';},
 ecph:function(){return '<path d="M18 52 Q30 14 110 16 Q178 20 186 52 Q178 84 110 88 Q30 90 18 52Z" fill="var(--ecph)" stroke="var(--ecph2)" stroke-width="3"/>'+
  '<path d="M150 52 m-20 0 a20 20 0 1 1 40 0 a12 12 0 1 1 -24 0 a5 5 0 1 1 10 0" fill="none" stroke="var(--ecph2)" stroke-width="3"/>'+
  '<path d="M40 30 Q60 52 40 76 M70 22 Q92 52 70 84 M100 18 Q122 52 100 88" fill="none" stroke="var(--bone)" stroke-width="5" stroke-linecap="round"/>';},
 coral:function(){var s='<path d="M14 54 Q40 30 186 20 L188 82 Q40 80 14 54Z" '+B+'/>';for(var x=46;x<186;x+=22){var h=(x-14)/172;s+='<path d="M'+x+' '+(52-28*h).toFixed(0)+' Q'+(x+8)+' 52 '+x+' '+(56+26*h).toFixed(0)+'" '+L+'/>';}
  return s+'<ellipse cx="186" cy="51" rx="8" ry="31" fill="var(--bone2)" stroke="var(--bone-ink)" stroke-width="3"/>';},
 trilo:function(){var s='<path d="M40 50 Q40 14 96 14 L250 22 Q290 34 288 50 Q290 66 250 78 L96 86 Q40 86 40 50Z" '+B+'/>';
  s+='<path d="M96 14 Q70 50 96 86" '+L+'/><path d="M100 36 L278 42 M100 64 L278 58" '+L+'/>';
  for(var x=116;x<272;x+=16)s+='<path d="M'+x+' 18 Q'+(x+6)+' 50 '+x+' 82" '+L+' stroke-width="1.8"/>';
  return s+'<ellipse cx="70" cy="34" rx="8" ry="6" fill="var(--bone2)" stroke="var(--bone-ink)" stroke-width="2"/><ellipse cx="70" cy="66" rx="8" ry="6" fill="var(--bone2)" stroke="var(--bone-ink)" stroke-width="2"/>';},
 ammo:function(){return spiral(58,54,38)+spiral(156,46,42)+spiral(250,56,36);},
 fern:function(){var s='<path d="M14 54 Q200 40 388 52" '+L+' stroke-width="4"/>';
  for(var i=0;i<16;i++){var x=30+i*22,sz=1-i/20,y=50-i*0.4;
   s+='<ellipse cx="'+(x+4)+'" cy="'+(y-18*sz)+'" rx="'+(8*sz).toFixed(1)+'" ry="'+(18*sz).toFixed(1)+'" transform="rotate(30 '+(x+4)+' '+(y-18*sz)+')" '+B+' stroke-width="2"/>';
   s+='<ellipse cx="'+(x+14)+'" cy="'+(y+20*sz)+'" rx="'+(8*sz).toFixed(1)+'" ry="'+(18*sz).toFixed(1)+'" transform="rotate(-30 '+(x+14)+' '+(y+20*sz)+')" '+B+' stroke-width="2"/>';}
  return s;},
 crin:function(){var s='';for(var x=14;x<290;x+=19)s+='<rect x="'+x+'" y="'+(38+((x/19)%2))+'" width="17" height="24" rx="5" '+B+' stroke-width="2.4"/>';
  s+='<path d="M300 50 Q340 30 380 38 Q392 50 380 62 Q340 70 300 50Z" '+B+'/>';
  for(var k=-3;k<=3;k++)s+='<path d="M312 50 Q350 '+(50+k*9)+' 392 '+(50+k*13)+'" '+L+' stroke-width="2"/>';
  return s;},
 bone:function(){return '<path d="M60 36 L340 38 L340 62 L60 64Z" '+B+'/>'+
  '<path d="M64 40 Q30 6 18 30 Q4 50 18 70 Q30 94 64 60" '+B+'/><path d="M336 42 Q370 6 384 30 Q396 50 384 70 Q370 94 336 58" '+B+'/>'+
  '<path d="M110 46 Q200 42 300 47" '+L+' opacity=".5"/><path d="M150 54 l8 3 M240 52 l6 3" '+L+'/>';},
 fish:function(){var s='<path d="M30 50 Q110 6 300 26 Q380 34 404 50 Q380 66 300 74 Q110 94 30 50Z" '+B+'/>';
  s+='<path d="M404 50 L470 16 Q452 50 470 84Z" '+B+'/><path d="M60 50 L404 50" '+L+' stroke-width="3"/>';
  for(var x=110;x<390;x+=20){var h=24-(x-110)/18;s+='<path d="M'+x+' 50 Q'+(x-6)+' '+(50-h)+' '+(x-14)+' '+(50-h-6)+' M'+x+' 50 Q'+(x-6)+' '+(50+h)+' '+(x-14)+' '+(50+h+6)+'" '+L+' stroke-width="1.8"/>';}
  return s+'<path d="M96 22 Q82 50 96 78" '+L+'/><circle cx="64" cy="42" r="7" fill="var(--bone2)" stroke="var(--bone-ink)" stroke-width="2.5"/><path d="M230 22 l18 -12 l14 16" '+B+' stroke-width="2"/>';}
};
function artSVG(type,len,vertical){
  var inner=ART[type]();
  if(vertical)return '<svg viewBox="0 0 100 '+(len*100)+'" preserveAspectRatio="none"><g transform="translate(100 0) rotate(90)">'+inner+'</g></svg>';
  return '<svg viewBox="0 0 '+(len*100)+' 100" preserveAspectRatio="none">'+inner+'</svg>';
}
var NEAR='<svg class="near" viewBox="0 0 100 100" aria-hidden="true"><path d="M22 30 l8 -4 l4 7z M64 24 l9 3 l-5 6z M40 66 l10 -2 l-2 8z M72 62 l6 4 l-7 4z M30 46 l5 2 l-4 3z" fill="var(--bone2)" stroke="var(--bone-ink)" stroke-width="1.5"/></svg>';

/* ---------- bent (L-shaped) fossils: drawn along the path through their squares ---------- */
function samplePath(pts,step){
  var out=[];
  for(var i=0;i<pts.length-1;i++){var a=pts[i],b=pts[i+1],dx=b[0]-a[0],dy=b[1]-a[1],len=Math.hypot(dx,dy),ang=Math.atan2(dy,dx);
    for(var t=(i===0?0:step/2);t<len;t+=step)out.push([a[0]+dx*t/len,a[1]+dy*t/len,ang]);}
  var e=pts[pts.length-1],p=pts[pts.length-2];out.push([e[0],e[1],Math.atan2(e[1]-p[1],e[0]-p[0])]);
  return out;
}
function extend(pts){ /* push both ends 38 units toward the square edges */
  var q=pts.map(function(p){return p.slice();}),n=q.length;
  function push(i,j){var dx=q[i][0]-q[j][0],dy=q[i][1]-q[j][1],l=Math.hypot(dx,dy)||1;q[i][0]+=dx/l*38;q[i][1]+=dy/l*38;}
  push(0,1);push(n-1,n-2);return q;
}
function pathD(pts){return "M"+pts.map(function(p){return p[0].toFixed(1)+" "+p[1].toFixed(1);}).join(" L");}
function deg(a){return (a*180/Math.PI).toFixed(1);}
var PATHART={
 tail:function(pts){var q=extend(pts),s=samplePath(q,21),out='',n=s.length;
  s.forEach(function(p,i){var k=1-i/(n*1.25),w=(16*k+5).toFixed(1),h=(36*k+8).toFixed(1);
   out+='<g transform="translate('+p[0].toFixed(1)+' '+p[1].toFixed(1)+') rotate('+deg(p[2])+')"><path d="M0 '+(-h/2-6*k)+' L0 '+(-h/2-14*k)+'" stroke="var(--bone-ink)" stroke-width="3" stroke-linecap="round"/><rect x="'+(-w/2)+'" y="'+(-h/2)+'" width="'+w+'" height="'+h+'" rx="6" fill="var(--bone)" stroke="var(--bone-ink)" stroke-width="2.5"/></g>';});
  return out;},
 burrow:function(pts){var q=extend(pts),d=pathD(q),out='<path d="'+d+'" fill="none" stroke="var(--bone-ink)" stroke-width="38" stroke-linecap="round" stroke-linejoin="round"/><path d="'+d+'" fill="none" stroke="var(--bone2)" stroke-width="31" stroke-linecap="round" stroke-linejoin="round"/>';
  samplePath(q,16).forEach(function(p){out+='<path transform="translate('+p[0].toFixed(1)+' '+p[1].toFixed(1)+') rotate('+deg(p[2])+')" d="M0 -13 Q4 0 0 13" fill="none" stroke="var(--bone-ink)" stroke-width="2"/>';});
  return out;},
 crinb:function(pts){var q=extend(pts),s=samplePath(q,19),out='',last=s[s.length-1];
  s.slice(0,-2).forEach(function(p){out+='<rect transform="translate('+p[0].toFixed(1)+' '+p[1].toFixed(1)+') rotate('+deg(p[2])+')" x="-8" y="-13" width="17" height="26" rx="5" fill="var(--bone)" stroke="var(--bone-ink)" stroke-width="2.4"/>';});
  out+='<g transform="translate('+last[0].toFixed(1)+' '+last[1].toFixed(1)+') rotate('+deg(last[2])+')"><path d="M-36 0 Q-6 -22 22 -14 Q32 0 22 14 Q-6 22 -36 0Z" fill="var(--bone)" stroke="var(--bone-ink)" stroke-width="3"/>';
  for(var k=-3;k<=3;k++)out+='<path d="M-28 0 Q0 '+(k*7)+' 30 '+(k*11)+'" fill="none" stroke="var(--bone-ink)" stroke-width="2"/>';
  return out+'</g>';},
 stig:function(pts){var q=extend(pts),d=pathD(q),out='<path d="'+d+'" fill="none" stroke="var(--bone-ink)" stroke-width="50" stroke-linecap="round" stroke-linejoin="round"/><path d="'+d+'" fill="none" stroke="var(--bone)" stroke-width="43" stroke-linecap="round" stroke-linejoin="round"/>';
  samplePath(q,15).forEach(function(p,i){[-1,1].forEach(function(sd){var off=sd*(i%2?10:4);
    out+='<circle cx="'+(p[0]-Math.sin(p[2])*off).toFixed(1)+'" cy="'+(p[1]+Math.cos(p[2])*off).toFixed(1)+'" r="3.4" fill="var(--bone2)" stroke="var(--bone-ink)" stroke-width="1.5"/>';});});
  return out;}
};

var TYPES={
 tooth:{name:"Shark tooth",len:2,fact:"Sharks shed thousands of teeth in a lifetime, and hard tooth enamel survives well, so teeth are among the most common fossils. Calvert Cliffs in Maryland is famous for them."},
 ecph:{name:"Ecphora shell",len:2,fact:"Ecphora is Maryland's state fossil shell. This sea snail lived millions of years ago when a warm, shallow sea covered southern Maryland, and its shells often keep a reddish-brown color."},
 coral:{name:"Horn coral",len:2,fact:"Horn corals lived alone on the sea floor, shaped like a small horn. They died out about 252 million years ago, and they are found in old limestone in western Maryland."},
 trilo:{name:"Trilobite",len:3,fact:"Trilobites were sea animals with hard, segmented shells. They lived for about 270 million years and died out about 252 million years ago."},
 ammo:{name:"Ammonites",len:3,fact:"Ammonites were sea animals related to squid and octopus, with coiled shells. They died out about 66 million years ago, at the same time as the non-bird dinosaurs."},
 fern:{name:"Fern frond",len:4,fact:"Fossil fern leaves are often found in shale near coal beds. Many formed more than 300 million years ago in swampy forests that later became coal."},
 bone:{name:"Dinosaur leg bone",len:4,fact:"Astrodon johnstoni is Maryland's state dinosaur, a huge long-necked plant eater that lived about 110 million years ago. Its fossils were found in Prince George's County."},
 fish:{name:"Fossil fish",len:5,fact:"Fish skeletons can be preserved in fine mud on lake and sea floors. Wyoming's Green River rocks hold thousands of fossil fish about 50 million years old."},
 burrow:{name:"Worm burrow",legs:[2,2],fact:"Burrows are trace fossils. They show where worms and other animals tunneled through mud on the sea floor, even though the animals' soft bodies were not preserved."},
 crinb:{name:"Crinoid",legs:[2,3],fact:"Crinoids, or sea lilies, are relatives of sea stars. Their bendable stems were stacks of small discs, and those discs are common in old limestone. Some crinoids still live in the ocean today."},
 stig:{name:"Scale tree root",legs:[3,2],fact:"Stigmaria are fossil roots of giant scale trees that grew in coal-age swamps more than 300 million years ago. They are covered with small round scars where rootlets were attached."},
 tail:{name:"Dinosaur tail",legs:[3,3],fact:"A dinosaur's tail was a chain of bones called vertebrae, smaller toward the tip. Fossil skeletons are often found bent because the body shifted before it was buried."}
};
Object.keys(TYPES).forEach(function(k){var T=TYPES[k];if(T.legs){T.bent=true;T.len=T.legs[0]+T.legs[1]-1;}});
/* about a third of the squares hide fossil pieces; bent fossils marked by TYPES[].bent */
var SETS={
 6:["trilo","ammo","burrow","tooth","ecph"],
 7:["fern","trilo","burrow","tooth","ecph","coral"],
 8:["tail","bone","crinb","trilo","ammo","tooth","ecph","coral"],
 9:["tail","fish","bone","crinb","trilo","ammo","burrow","tooth","ecph"],
 10:["tail","fish","bone","crinb","stig","trilo","ammo","burrow","tooth","ecph"],
 11:["tail","fish","bone","fern","crinb","stig","trilo","trilo","ammo","burrow","tooth","ecph","coral"],
 12:["tail","fish","bone","fern","crinb","stig","stig","trilo","trilo","ammo","ammo","burrow","tooth","tooth","ecph","coral"]
};
function shapeCells(type){ /* returns list of [r,c] in path order, normalized to start at 0 */
  var T=TYPES[type],cells=[];
  if(!T.bent){for(var i=0;i<T.len;i++)cells.push([0,i]);return {cells:cells,straight:true};}
  var a=T.legs[0],b=T.legs[1];
  for(var x=0;x<a;x++)cells.push([0,x]);
  for(var y=1;y<b;y++)cells.push([y,a-1]);
  return {cells:cells,straight:false};
}
function transformShape(cells,rot,flip){
  var out=cells.map(function(p){var r=p[0],c=flip?-p[1]:p[1];for(var k=0;k<rot;k++){var t=r;r=c;c=-t;}return [r,c];});
  var mr=Math.min.apply(null,out.map(function(p){return p[0];})),mc=Math.min.apply(null,out.map(function(p){return p[1];}));
  return out.map(function(p){return [p[0]-mr,p[1]-mc];});
}

/* ---------- game ---------- */
var G;
function place(size,list){
  for(var attempt=0;attempt<3000;attempt++){
    var grid=new Array(size*size).fill(-1),out=[],ok=true,spacing=attempt<2000;
    for(var f=0;f<list.length&&ok;f++){
      var base=shapeCells(list[f]),placed=false;
      for(var t=0;t<400&&!placed;t++){
        var rot=ri(0,3),flip=Math.random()<.5,shp=transformShape(base.cells,rot,flip);
        var hR=Math.max.apply(null,shp.map(function(p){return p[0];})),hC=Math.max.apply(null,shp.map(function(p){return p[1];}));
        var r0=ri(0,size-1-hR),c0=ri(0,size-1-hC),cells=shp.map(function(p){return (p[0]+r0)*size+(p[1]+c0);}),clear=true;
        cells.forEach(function(ix){var rr=Math.floor(ix/size),cc=ix%size;
          if(grid[ix]>=0)clear=false;
          if(spacing)[[0,1],[1,0],[0,-1],[-1,0]].forEach(function(d){var r2=rr+d[0],c2=cc+d[1];if(r2>=0&&c2>=0&&r2<size&&c2<size&&grid[r2*size+c2]>=0)clear=false;});});
        if(clear){cells.forEach(function(ix){grid[ix]=f;});out.push({type:list[f],cells:cells});placed=true;}
      }
      if(!placed)ok=false;
    }
    if(ok)return {grid:grid,items:out};
  }
  throw new Error("Could not place fossils");
}
function newGame(){
  var list=SETS[CFG.size].slice(),P=place(CFG.size,list),count={};
  P.items.forEach(function(it){count[it.type]=(count[it.type]||0)+1;it.n=count[it.type];});
  G={size:CFG.size,grid:P.grid,items:P.items,dug:{},digs:0,used:0,found:{},pieces:0,
     src:new Q.Source(CFG.subject,CFG.grade,CFG.topic),level:0,q:null,tries:0,answered:false,over:false,last:-1,justFound:-1,
     st:{1:{t:0,r:0,s:0},2:{t:0,r:0,s:0},3:{t:0,r:0,s:0}}};
  var cat=Q.catalog(CFG.grade).filter(function(c){return c.id===CFG.subject;})[0];
  var tp=cat.topics.filter(function(p){return p[0]===CFG.topic;})[0];
  $("ctx").innerHTML="<b>Grade "+CFG.grade+"</b> · "+esc(cat.name)+" · "+esc(tp?tp[1]:"All topics")+" · "+CFG.size+" x "+CFG.size;
  renderBoard();renderFinds();renderQ();stats();
  setHint("Pick a tool to answer your first question.");
}
function setHint(h){$("hint").innerHTML=h;}
function stats(){
  var nf=Object.keys(G.found).length;
  $("sDigs").textContent=G.used;$("sFound").textContent=nf;$("sTotal").textContent=G.items.length;$("sPieces").textContent=G.pieces;
  var p=$("digPill");p.textContent=G.digs+(G.digs===1?" dig ready":" digs ready");p.classList.toggle("zero",G.digs===0);
  $("board").classList.toggle("live",G.digs>0&&!G.over);
}
function coord(ix){return LETTERS[ix%G.size]+(Math.floor(ix/G.size)+1);}
function nearFossil(ix){var n=G.size,r=Math.floor(ix/n),c=ix%n,hit=false;
  [[0,1],[1,0],[0,-1],[-1,0]].forEach(function(d){var r2=r+d[0],c2=c+d[1];if(r2>=0&&c2>=0&&r2<n&&c2<n){var k=G.grid[r2*n+c2];if(k>=0&&!G.found[k])hit=true;}});return hit;}
var TONES=["--soil1","--soil2","--soil3","--clay","--silt","--loam"];
function soilVary(btn,r,c,seed){
  /* smooth patches across the pit plus a little per-square noise */
  var v=Math.sin(r*.7+seed[0])*Math.cos(c*.6+seed[1])+0.6*Math.sin((r+c)*.45+seed[2])+(Math.random()-.5)*.7;
  var w=Math.sin(r*.35-c*.5+seed[3])+(Math.random()-.5)*.6;
  var a=TONES[v>.9?2:v>.2?0:v>-.5?1:5],b=TONES[w>.5?3:w<-.6?4:2];
  btn.style.setProperty("--tone","color-mix(in srgb,var("+a+") "+ri(55,90)+"%,var("+b+"))");
  btn.style.setProperty("--tone2","var("+TONES[ri(0,5)]+")");
  btn.style.setProperty("--ang",ri(100,260)+"deg");
  btn.style.setProperty("--p5",ri(10,90)+"% "+ri(10,90)+"%");
  btn.style.setProperty("--p4",ri(25,75)+"% "+ri(25,75)+"%");
  btn.style.setProperty("--rs",Math.random()<.12?ri(14,24)+"%":"0%");
}
function renderBoard(){
  var seed=[Math.random()*6,Math.random()*6,Math.random()*6,Math.random()*6];
  var b=$("board"),n=G.size,cols=$("cols"),rows=$("rows");b.innerHTML="";cols.innerHTML="";rows.innerHTML="";
  b.style.gridTemplateColumns="repeat("+n+",minmax(0,1fr))";
  cols.style.gridTemplateColumns="repeat("+n+",minmax(0,1fr))";cols.style.paddingLeft=cols.style.paddingRight="calc(12px + var(--gap))";
  rows.style.gridTemplateRows="repeat("+n+",minmax(0,1fr))";rows.style.paddingTop=rows.style.paddingBottom="calc(12px + var(--gap))";
  for(var i=0;i<n;i++){cols.insertAdjacentHTML("beforeend",'<span class="tagl"><span>'+LETTERS[i]+'</span></span>');rows.insertAdjacentHTML("beforeend",'<span class="tagl"><span>'+(i+1)+'</span></span>');}
  for(var ix=0;ix<n*n;ix++){
    var btn=document.createElement("button");btn.type="button";btn.id="cell-"+ix;
    soilVary(btn,Math.floor(ix/n),ix%n,seed);btn.style.setProperty("--p1",ri(15,85)+"% "+ri(15,85)+"%");btn.style.setProperty("--p2",ri(15,85)+"% "+ri(15,85)+"%");btn.style.setProperty("--p3",ri(20,80)+"% "+ri(20,80)+"%");
    btn.addEventListener("click",dig.bind(null,ix));paintCell(btn,ix);b.appendChild(btn);
  }
  var ov=document.createElementNS("http://www.w3.org/2000/svg","svg");ov.id="overlay";ov.setAttribute("class","overlay");
  ov.setAttribute("viewBox","0 0 "+(n*100)+" "+(n*100));ov.setAttribute("preserveAspectRatio","none");ov.setAttribute("aria-hidden","true");
  b.appendChild(ov);drawOverlay();
}
function paintCell(btn,ix){
  btn.className="cell";btn.querySelectorAll(":scope > svg").forEach(function(s){s.remove();});btn.setAttribute("aria-label",coord(ix)+", not dug");
  if(!G.dug[ix])return;
  btn.classList.add("dug");var k=G.grid[ix];
  if(k>=0){btn.classList.add("hit");if(G.found[k])btn.classList.add("done");
    btn.setAttribute("aria-label",coord(ix)+", part of "+(G.found[k]?"a "+TYPES[G.items[k].type].name.toLowerCase():"a buried fossil"));}
  else if(nearFossil(ix)){btn.insertAdjacentHTML("beforeend",NEAR);btn.setAttribute("aria-label",coord(ix)+", fossil chips, a fossil is next to it");}
  else btn.setAttribute("aria-label",coord(ix)+", empty");
  if(ix===G.last)btn.classList.add("last");
}
/* the art for one fossil, in board units (each square is 100 x 100) */
function itemArt(it){
  var T=TYPES[it.type],n=G.size,rc=it.cells.map(function(ix){return [Math.floor(ix/n),ix%n];});
  if(T.bent){var pts=rc.map(function(p){return [p[1]*100+50,p[0]*100+50];});return PATHART[it.type](pts);}
  var r0=Math.min.apply(null,rc.map(function(p){return p[0];})),c0=Math.min.apply(null,rc.map(function(p){return p[1];}));
  var horiz=rc[0][0]===rc[rc.length-1][0],inner=ART[it.type]();
  return horiz?'<g transform="translate('+(c0*100)+' '+(r0*100)+')">'+inner+'</g>'
             :'<g transform="translate('+(c0*100+100)+' '+(r0*100)+') rotate(90)">'+inner+'</g>';
}
function drawOverlay(){
  var ov=$("overlay"),h='<defs>';
  G.items.forEach(function(it,k){if(G.found[k])return;var dug=it.cells.filter(function(c){return G.dug[c];});if(!dug.length)return;
    h+='<clipPath id="cp'+k+'">'+dug.map(function(c){return '<rect x="'+(c%G.size*100)+'" y="'+(Math.floor(c/G.size)*100)+'" width="100" height="100"/>';}).join("")+'</clipPath>';});
  h+='</defs>';
  G.items.forEach(function(it,k){
    var dug=it.cells.some(function(c){return G.dug[c];});if(!dug)return;
    h+='<g class="fos'+(G.found[k]?" done":" part")+(k===G.justFound?" new":"")+'"'+(G.found[k]?'':' clip-path="url(#cp'+k+')"')+'>'+itemArt(it)+'</g>';
  });
  ov.innerHTML=h;
}
function thumbSVG(type){
  var T=TYPES[type];
  if(!T.bent)return artSVG(type,T.len,false).replace('preserveAspectRatio="none"','preserveAspectRatio="xMidYMid meet"');
  var sh=shapeCells(type).cells,pts=sh.map(function(p){return [p[1]*100+50,p[0]*100+50];});
  var w=(Math.max.apply(null,sh.map(function(p){return p[1];}))+1)*100,h=(Math.max.apply(null,sh.map(function(p){return p[0];}))+1)*100;
  return '<svg viewBox="0 0 '+w+' '+h+'" preserveAspectRatio="xMidYMid meet">'+PATHART[type](pts)+'</svg>';
}
function renderFinds(){
  var box=$("finds");box.innerHTML="";
  G.items.forEach(function(it,k){
    var T=TYPES[it.type],got=!!G.found[k],d=document.createElement("div");d.className="find"+(got?" got":"");
    var dugN=it.cells.filter(function(c){return G.dug[c];}).length;
    var label=T.name+(it.n>1?" #"+it.n:"");
    d.innerHTML=(got?'<div class="thumb">'+thumbSVG(it.type)+'</div>':'<div class="thumb unk">?</div>')+
      '<div><h3>'+(got?esc(label):dugN?"Partly uncovered":"Still buried")+' <span>· '+T.len+' squares'+(T.bent?", bent":"")+'</span></h3><p>'+(got?esc(T.fact):dugN?dugN+" of "+T.len+" pieces dug. Keep digging beside them.":"Keep digging to find this one.")+'</p></div>';
    box.appendChild(d);
  });
}
var LETTERS="ABCDEFGHIJKL";
var TOOLS={
 1:{name:"Brush",tip:"easier · 1 dig",svg:'<svg viewBox="0 0 48 48" aria-hidden="true"><rect x="21" y="4" width="6" height="22" rx="3" fill="var(--wood1)"/><rect x="18" y="24" width="12" height="6" rx="1" fill="#8c949a"/><path d="M17 30 h14 l3 14 h-20z" fill="var(--canvas2)"/><path d="M20 32 l-1 11 M24 32 v11 M28 32 l1 11" stroke="var(--wood3)" stroke-width="1.4"/></svg>'},
 2:{name:"Trowel",tip:"on level · 2 digs",svg:'<svg viewBox="0 0 48 48" aria-hidden="true"><rect x="21" y="2" width="6" height="14" rx="3" fill="var(--wood1)"/><rect x="23" y="15" width="2" height="7" fill="#6b7378"/><path d="M24 20 L38 34 L24 46 L10 34Z" fill="#9aa3a8" stroke="#5f676c" stroke-width="1.5"/></svg>'},
 3:{name:"Shovel",tip:"challenge · 3 digs",svg:'<svg viewBox="0 0 48 48" aria-hidden="true"><path d="M17 3 h14 v5 h-14z" fill="var(--wood3)"/><rect x="22" y="7" width="4" height="22" fill="var(--wood1)"/><path d="M14 28 h20 v8 q-10 12 -20 0z" fill="#9aa3a8" stroke="#5f676c" stroke-width="1.5"/></svg>'}
};

/* ---------- setup ---------- */
var CFG={grade:4,subject:"math",topic:"all",size:8,skip:true,retry:true};
function fillSubjects(){
  var g=+$("grade").value,cat=Q.catalog(g),s=$("subject"),prev=s.value||CFG.subject;s.innerHTML="";
  cat.forEach(function(c){var o=document.createElement("option");o.value=c.id;o.textContent=c.name;if(c.disabled)o.disabled=true;s.appendChild(o);});
  s.value=cat.some(function(c){return c.id===prev&&!c.disabled;})?prev:"math";fillTopics();
}
function fillTopics(){
  var g=+$("grade").value,c=Q.catalog(g).filter(function(x){return x.id===$("subject").value;})[0],t=$("topic"),prev=t.value;t.innerHTML="";
  c.topics.forEach(function(p){var o=document.createElement("option");o.value=p[0];o.textContent=p[1];t.appendChild(o);});
  t.value=c.topics.some(function(p){return p[0]===prev;})?prev:"all";
  $("subjNote").textContent=c.id==="math"?"Math questions are generated fresh each time. Brush questions review the grade below, trowel questions are on grade, and shovel questions preview the next grade."
    :"This prototype has a small set of sample questions for this subject. Brush, trowel and shovel questions get harder within the grade. Science will be added once Maryland's science standards are in our reference set.";
}
function buildSizes(){
  var box=$("sizes");box.innerHTML="";
  for(var n=6;n<=12;n++){var l=document.createElement("label");l.innerHTML='<input type="radio" name="size" id="size'+n+'" value="'+n+'"'+(n===CFG.size?" checked":"")+'><span>'+n+' x '+n+'</span>';box.appendChild(l);}
  box.addEventListener("change",sizeNote);sizeNote();
}
function sizeNote(){var n=+document.querySelector('input[name="size"]:checked').value;$("sizeNote").textContent=n+" x "+n+" hides "+SETS[n].length+" fossils.";}
$("grade").addEventListener("change",fillSubjects);
$("subject").addEventListener("change",fillTopics);
$("startBtn").addEventListener("click",function(){
  CFG={grade:+$("grade").value,subject:$("subject").value,topic:$("topic").value,size:+document.querySelector('input[name="size"]:checked').value,skip:$("optSkip").checked,retry:$("optRetry").checked};
  $("setupView").hidden=true;$("playView").hidden=false;newGame();window.scrollTo(0,0);
});
$("toSetup").addEventListener("click",function(){$("playView").hidden=true;$("setupView").hidden=false;});

/* ---------- game ---------- */
var G;
/* ---------- question card ---------- */
function toolCards(){
  var locked=G.digs>0||(G.q&&G.answered);
  var h='<p class="eyebrow">Pick a tool for your next question</p><div class="choose" role="group" aria-label="Question difficulty">';
  [1,2,3].forEach(function(l){var T=TOOLS[l];
    h+='<button type="button" class="lvl'+(G.level===l&&G.q?" sel":"")+'" id="lvl'+l+'" data-l="'+l+'"'+(locked?" disabled":"")+'>'+T.svg+'<b>'+T.name+'</b><small>'+T.tip+'</small></button>';});
  return h+'</div>';
}
function renderQ(fb){
  var p=$("qPanel");if(G.over){renderEnd();return;}
  var h='',tb=$("toolBar");tb.innerHTML=toolCards();
  tb.querySelectorAll(".lvl").forEach(function(b){b.addEventListener("click",function(){chooseLevel(+b.getAttribute("data-l"));});});
  if(!G.q){
    h+='<div class="waiting">'+(G.digs>0?"Use your digs in the quarry, then pick your next tool below the dig site.":"Pick a tool below the dig site: brush, trowel or shovel. A right answer earns 1, 2 or 3 digs.")+'</div>';
  } else {
    var q=G.q;
    h+='<p class="eyebrow">'+TOOLS[G.level].name+' question · worth '+(G.level===1?"1 dig":G.level+" digs")+'</p><p class="q">'+esc(q.q)+'</p><div class="opts">';
    q.opts.forEach(function(o,i){h+='<button type="button" class="opt" id="opt-'+i+'" data-v="'+esc(o)+'">'+esc(o)+'</button>';});
    h+='</div><div class="qfoot"><span class="src">'+esc(q.src||"")+'</span>'+(CFG.skip&&!G.answered?'<button type="button" class="linkbtn" id="skipBtn">Skip this question</button>':"")+'</div>';
  }
  if(fb)h+=fb;p.innerHTML=h;
  p.querySelectorAll(".opt").forEach(function(b){b.addEventListener("click",function(){answer(b);});});
  if($("skipBtn"))$("skipBtn").addEventListener("click",skip);
}
function chooseLevel(l){
  if(G.digs>0||G.over)return;
  G.level=l;G.q=G.src.next(l);G.tries=0;G.answered=false;
  if(!G.q){$("qPanel").insertAdjacentHTML("beforeend",'<div class="fb bad"><p>No sample questions for this tool yet. Try another.</p></div>');return;}
  renderQ();setHint("Answer the question to earn "+(l===1?"1 dig.":l+" digs."));
  bringIntoView($("qPanel"));
}
/* on phones the question card sits below the dig site, so move the page to whatever the student needs next */
function offScreen(el){var r=el.getBoundingClientRect();return r.top<0||r.top>window.innerHeight-80;}
function bringIntoView(el){if(el&&offScreen(el))el.scrollIntoView({behavior:matchMedia("(prefers-reduced-motion: reduce)").matches?"auto":"smooth",block:"start"});}
function skip(){
  if(!G.q||G.answered)return;G.st[G.level].s++;
  var l=G.level;G.q=G.src.next(l);G.tries=0;G.answered=false;renderQ();setHint("Skipped. Here is another "+TOOLS[l].name.toLowerCase()+" question.");
}
function answer(btn){
  if(G.answered)return;var v=btn.getAttribute("data-v"),q=G.q,l=G.level;
  if(v===q.a){
    G.answered=true;G.st[l].t++;G.st[l].r++;G.digs+=l;G.q=null;
    renderQ('<div class="fb good"><p><strong>Correct! You earned '+(l===1?"1 dig":l+" digs")+'.</strong> '+esc(q.why)+'</p></div>');
    setHint("<strong>Time to dig.</strong> Tap "+(l===1?"a square":l+" squares")+" in the quarry.");
    if(offScreen($("board"))){var fb=$("qPanel").querySelector(".fb.good");if(fb){fb.insertAdjacentHTML("beforeend",'<button type="button" class="godig" id="goDig">Go to the dig site</button>');$("goDig").addEventListener("click",function(){$("board").scrollIntoView({block:"center"});});}}
  } else if(CFG.retry&&G.tries===0){
    G.tries++;btn.classList.add("wrong");btn.disabled=true;
    var old=$("qPanel").querySelector(".fb");if(old)old.remove();
    $("qPanel").insertAdjacentHTML("beforeend",'<div class="fb bad"><p><strong>Not quite.</strong> Take another look and try once more.</p></div>');
  } else {
    G.answered=true;G.st[l].t++;
    document.querySelectorAll("#qPanel .opt").forEach(function(b){b.disabled=true;var x=b.getAttribute("data-v");if(x===q.a)b.classList.add("right");if(x===v)b.classList.add("wrong");});
    var sk=$("skipBtn");if(sk)sk.remove();
    $("toolBar").querySelectorAll(".lvl").forEach(function(b){b.disabled=true;});
    var old2=$("qPanel").querySelector(".fb");if(old2)old2.remove();
    $("qPanel").insertAdjacentHTML("beforeend",'<div class="fb bad"><p><strong>The answer is '+esc(q.a)+'.</strong> '+esc(q.why)+'</p><div class="act"><button class="btn" type="button" id="nextQ">Pick another tool</button></div></div>');
    $("nextQ").addEventListener("click",function(){G.q=null;renderQ();setHint("Pick a tool to earn more digs.");});
    setHint("No digs this time. The next question is another chance.");
  }
  stats();
}

function puff(cell){
  if(window.matchMedia&&matchMedia("(prefers-reduced-motion: reduce)").matches)return;
  for(var i=0;i<8;i++){var p=document.createElement("span");p.className="puff";var a=Math.random()*Math.PI*2,d=18+Math.random()*20;
    p.style.setProperty("--dx",(Math.cos(a)*d).toFixed(0)+"px");p.style.setProperty("--dy",(Math.sin(a)*d-8).toFixed(0)+"px");cell.appendChild(p);
    setTimeout(p.remove.bind(p),600);}
}
function dig(ix){
  if(G.over)return;
  if(G.dug[ix]){setHint("You already dug at <strong>"+coord(ix)+"</strong>. Pick a different square.");return;}
  if(G.digs<1){setHint("Answer a question first to earn digs.");return;}
  G.digs--;G.used++;G.dug[ix]=true;G.justFound=-1;var prev=G.last;G.last=ix;if(prev>=0&&prev!==ix)paintCell($("cell-"+prev),prev);
  var k=G.grid[ix],msg;
  if(k>=0){
    G.pieces++;
    var it=G.items[k],T=TYPES[it.type],dugN=it.cells.filter(function(c){return G.dug[c];}).length;
    if(dugN===it.cells.length){G.found[k]=true;G.justFound=k;
      msg="<strong>"+coord(ix)+": you uncovered "+(it.type==="ammo"?"":"a ")+T.name.toLowerCase()+"!</strong> That makes "+Object.keys(G.found).length+" of "+G.items.length+" fossils. Read about it in the field notebook.";
      it.cells.forEach(function(c){paintCell($("cell-"+c),c);});
      Object.keys(G.dug).forEach(function(c){c=+c;if(G.grid[c]<0)paintCell($("cell-"+c),c);});}
    else msg="<strong>"+coord(ix)+": a fossil piece!</strong> It's "+dugN+" of "+T.len+" pieces of a bigger fossil. Dig the squares beside it"+(T.bent?". This one bends, so try around corners too.":".");
    renderFinds();
  } else msg="<strong>"+coord(ix)+":</strong> "+(nearFossil(ix)?"fossil chips! A fossil is in a square right next to this one.":"just sand and pebbles.");
  paintCell($("cell-"+ix),ix);drawOverlay();puff($("cell-"+ix));
  if(Object.keys(G.found).length===G.items.length){G.over=true;stats();setHint("Every fossil is uncovered. Great digging!");renderEnd();return;}
  if(G.digs>0)msg+=" "+(G.digs===1?"1 dig left.":G.digs+" digs left.");
  else{msg+=" Pick your next tool.";renderQ();}
  setHint(msg);stats();
}
function renderEnd(){
  $("toolBar").innerHTML="";
  var rows="",T={t:0,r:0,s:0};
  [1,2,3].forEach(function(l){var s=G.st[l];T.t+=s.t;T.r+=s.r;T.s+=s.s;rows+='<tr><td>'+TOOLS[l].name+' ('+TOOLS[l].tip.split(" · ")[0]+')</td><td>'+s.t+'</td><td>'+s.r+'</td><td>'+s.s+'</td></tr>';});
  rows+='<tr><th>Total</th><th>'+T.t+'</th><th>'+T.r+'</th><th>'+T.s+'</th></tr>';
  $("qPanel").innerHTML='<div class="end"><p class="eyebrow">Dig complete</p><h2>All '+G.items.length+' fossils found!</h2><p>You used <strong>'+G.used+'</strong> digs in a '+G.size+' x '+G.size+' quarry.</p></div>'+
   '<div class="tw"><table><thead><tr><th>Tool</th><th>Answered</th><th>Correct</th><th>Skipped</th></tr></thead><tbody>'+rows+'</tbody></table></div>'+
   '<p class="note mt0">Parents: this summary is not saved anywhere in the prototype.</p>'+
   '<div class="start"><button class="btn" type="button" id="again">Dig again</button><button class="btn ghost" type="button" id="back">Back to setup</button></div>';
  $("again").addEventListener("click",newGame);
  $("back").addEventListener("click",function(){$("playView").hidden=true;$("setupView").hidden=false;});
}

fillSubjects();buildSizes();
})();
