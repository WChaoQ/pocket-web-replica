const icon = (name, filled) => '<span class="material-symbols-outlined'+(filled?' filled':'')+'">'+name+'</span>';
const heart = (filled) => icon('favorite', filled);
const moreIcon = icon('more_horiz');

let page="home",filter="all",newest=true,sortMode="newest",viewedFilter="any",readLengthFilter="any",dateFilter="any",favoritesOnly=false,activeArticle=null,dark=true,systemTheme=false,openBrowser=true,readerArrows=true,fontSize=18,toastTimer,editMode=false;
const selectedIds=new Set();
const readMinutes=a=>{const m=String(a.date||"").match(/(\d+)\s*min read/i);return m?Number(m[1]):0};
const $=s=>document.querySelector(s), esc=s=>String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));

function toast(s){const t=$("#toast");t.textContent=s;t.classList.add("show");clearTimeout(toastTimer);toastTimer=setTimeout(()=>t.classList.remove("show"),2000)}

function favoriteButton(a){
  return '<button class="mini '+(a.favorite?'saved':'')+'" data-action="favorite" data-id="'+a.id+'" aria-label="收藏" title="收藏">'+heart(!!a.favorite)+'</button>';
}
function moreButton(a){
  return '<button class="mini" data-action="more" data-id="'+a.id+'" aria-label="更多选项" title="更多选项">'+moreIcon+'</button>';
}

function render(){
  const q=(window.currentSearchQuery||"").trim().toLowerCase();
  let list=articles.slice();
  if(filter==="favorites")list=list.filter(a=>a.favorite);
  else if(filter==="highlights")list=list.filter(a=>!!a.highlighted);
  else if(filter==="notes")list=list.filter(a=>a.source==="YOUR NOTES");
  if(q)list=list.filter(a=>(a.title+" "+a.source).toLowerCase().includes(q));
  if(favoritesOnly)list=list.filter(a=>a.favorite);
  if(viewedFilter==="viewed")list=list.filter(a=>a.read);
  else if(viewedFilter==="notViewed")list=list.filter(a=>!a.read);
  if(dateFilter!=="any")list=list.filter(a=>{
    const d=String(a.date||"").toLowerCase();
    if(dateFilter==="today")return /\b([0-9]+h ago|today|just now)\b/.test(d);
    if(dateFilter==="week")return /\b([0-9]+h ago|yesterday|[1-6]d ago|today|just now)\b/.test(d);
    return /ago|yesterday|today|just now|day/.test(d);
  });
  if(sortMode==="oldest")list=list.slice().reverse();
  else if(sortMode==="shortest")list=list.slice().sort((a,b)=>readMinutes(a)-readMinutes(b));
  else if(sortMode==="longest")list=list.slice().sort((a,b)=>readMinutes(b)-readMinutes(a));

  $("#listLabel").textContent=filter==="all"?"全部内容":filter==="favorites"?"收藏":filter==="highlights"?"编辑精选":filter==="notes"?"笔记":"全部内容";
  $("#savesSubtitle").textContent=articles.length+" stories saved for later";
  $("#homeSavesCount").textContent=articles.length;
  $("#homeArchiveCount").textContent=0;
  $("#settingsSavesCount").textContent=articles.length;
  $("#settingsArchiveCount").textContent=0;
  $("#homeSavesExample").textContent=articles[0]?.title||"暂无保存内容";
  $("#homeArchiveExample").textContent="";

  $("#recentSavesList").innerHTML=articles.slice(0,5).map(a=>
    '<article class="recent-save-card" data-open="'+a.id+'">'+ 
      '<img src="'+a.image+'" alt="" loading="lazy">'+ 
      '<div class="recent-save-title">'+esc(a.title)+'</div>'+ 
      '<div class="recent-save-bottom">'+ 
        '<div class="recent-save-source">'+esc(a.source)+'</div>'+ 
        '<div class="tools">'+favoriteButton(a)+moreButton(a)+'</div>'+ 
      '</div>'+ 
    '</article>'
  ).join("")||'<div class="empty">暂无保存内容</div>';

  const card=a=>
    '<article class="article" data-open="'+a.id+'">'+ 
      '<div class="article-body">'+ 
        '<h2 class="article-title">'+esc(a.title)+'</h2>'+ 
        '<div class="article-bottom">'+ 
          '<div class="source">'+esc(a.source)+'</div>'+ 
          '<div class="tools">'+favoriteButton(a)+moreButton(a)+'</div>'+ 
        '</div>'+ 
      '</div>'+ 
      '<img class="thumb" src="'+a.image+'" alt="" loading="lazy">'+ 
    '</article>';

  $("#articleList").innerHTML=list.map(card).join("")||'<div class="empty"><strong>没有找到内容</strong><span>尝试更换筛选条件或添加网页。</span></div>';

  $("#discoverList").innerHTML=articles.slice(1,11).map(a=>
    '<article class="article article-discover" data-open="'+a.id+'">'+ 
      '<div class="article-body">'+ 
        '<h2 class="article-title">'+esc(a.title)+'</h2>'+ 
        '<div class="article-bottom">'+ 
          '<div class="source">'+esc(a.source)+'</div>'+ 
        '</div>'+ 
      '</div>'+ 
      '<img class="thumb" src="'+a.image+'" alt="" loading="lazy">'+ 
    '</article>'
  ).join("");

  $("#topbarTitle").textContent=page==="settings"?"设置":page==="saves"?"保存内容":"主页";
}

function setPage(p){
  page=p;
  $("#app").dataset.page=p;
  document.querySelectorAll(".page").forEach(el=>el.classList.toggle("active",el.id==="page-"+p));
  document.querySelectorAll(".nav-item").forEach(el=>el.classList.toggle("active",el.dataset.page===p));
  $("#topbarTitle").textContent=p==="settings"?"设置":p==="saves"?"保存内容":"主页";
  const showControls = p==="saves";
  $("#searchBtn").style.display=showControls?"grid":"none";
  $("#filterBtn").style.display=showControls?"grid":"none";
  $("#addTopBtn").style.display=showControls?"grid":"none";
  const topbar=$(".topbar");
  if(topbar) topbar.style.display = (p==="saves") ? "flex" : "none";
  render();
}

function sheet(title,html){$("#sheetTitle").textContent=title;$("#sheetBody").innerHTML=html;$("#overlay").classList.add("open")}
function closeSheet(){$("#overlay").classList.remove("open")}

function filterSheet(){
  sheet("筛选内容",
    '<div class="sheet-subhead">内容类型</div>'+
    '<label class="sheet-row"><input type="radio" name="contentFilter" value="all" '+(filter==="all"?"checked":"")+'>全部内容</label>'+
    '<label class="sheet-row"><input type="radio" name="contentFilter" value="favorites" '+(filter==="favorites"?"checked":"")+'>已收藏</label>'+
    '<label class="sheet-row"><input type="radio" name="contentFilter" value="highlights" '+(filter==="highlights"?"checked":"")+'>编辑精选</label>'+
    '<label class="sheet-row"><input type="radio" name="contentFilter" value="notes" '+(filter==="notes"?"checked":"")+'>笔记</label>'+
    '<div class="sheet-subhead">保存时间</div>'+
    '<label class="sheet-row"><input type="radio" name="dateFilter" value="any" '+(dateFilter==="any"?"checked":"")+'>不限时间</label>'+
    '<label class="sheet-row"><input type="radio" name="dateFilter" value="today" '+(dateFilter==="today"?"checked":"")+'>最近 24 小时</label>'+
    '<label class="sheet-row"><input type="radio" name="dateFilter" value="week" '+(dateFilter==="week"?"checked":"")+'>最近 7 天</label>'+
    '<label class="sheet-row"><input type="radio" name="dateFilter" value="month" '+(dateFilter==="month"?"checked":"")+'>最近 30 天</label>'+
    '<div class="sheet-subhead">阅读状态</div>'+
    '<label class="sheet-row"><input id="filterViewed" type="checkbox" '+(viewedFilter==="viewed"?"checked":"")+'>已读</label>'+
    '<label class="sheet-row"><input id="filterNotViewed" type="checkbox" '+(viewedFilter==="notViewed"?"checked":"")+'>未读</label>'+
    '<button class="primary" id="applyFilter">应用筛选</button>'+
    '<button class="secondary" id="resetFilter">重置筛选</button>');
  $("#applyFilter").onclick=()=>{
    filter=$('input[name="contentFilter"]:checked').value;
    dateFilter=$('input[name="dateFilter"]:checked').value;
    viewedFilter=$("#filterViewed").checked?"viewed":$("#filterNotViewed").checked?"notViewed":"any";
    favoritesOnly=false;closeSheet();render();
  };
  $("#resetFilter").onclick=()=>{filter="all";dateFilter="any";favoritesOnly=false;viewedFilter="any";window.currentSearchQuery="";closeSheet();render()};
}

function addSheet(){
  sheet("添加保存",
    '<label class="field-label" for="urlField">链接或网址</label>'+
    '<input class="field" id="urlField" placeholder="粘贴链接" type="url">'+
    '<label class="field-label" for="titleField">标题（可选）</label>'+
    '<input class="field" id="titleField" placeholder="给这条保存起个名字">'+
    '<button class="primary" id="saveUrl">添加到保存内容</button>'+
    '<button class="secondary" id="addNote">改为创建笔记</button>');
  $("#saveUrl").onclick=()=>{
    let raw=$("#urlField").value.trim();
    if(!raw){toast("请先粘贴链接");return}
    try{
      let u=new URL(raw.startsWith("http")?raw:"https://"+raw),title=$("#titleField").value.trim()||u.hostname.replace(/^www\./,"");
      articles.unshift({id:Date.now(),title,source:u.hostname.toUpperCase(),desc:"A saved link ready to read later.",date:"Just now · Link",tag:"Unsorted",image:"https://images.unsplash.com/photo-1455390582262-044c029bcca8?auto=format&fit=crop&w=500&q=80",read:false,favorite:false,archived:false,author:""});
      closeSheet();filter="all";setPage("saves");toast("已添加到演示列表");
    }catch(e){toast("请输入有效的网址")}
  };
  $("#addNote").onclick=()=>{
    closeSheet();
    sheet("新建笔记",
      '<label class="field-label">标题</label><input class="field" id="noteTitle" placeholder="笔记标题">'+
      '<label class="field-label">内容</label><textarea class="field" id="noteText" rows="4" placeholder="写点值得记住的内容" style="height:100px;padding-top:10px"></textarea>'+
      '<button class="primary" id="saveNote">保存笔记</button>');
    $("#saveNote").onclick=()=>{
      let title=$("#noteTitle").value.trim(),desc=$("#noteText").value.trim();
      if(!title&&!desc){toast("请先写点内容");return}
      articles.unshift({id:Date.now(),title:title||"无标题笔记",source:"YOUR NOTES",desc:desc||"A personal note.",date:"Just now · Note",tag:"Notes",image:"https://images.unsplash.com/photo-1455390582262-044c029bcca8?auto=format&fit=crop&w=500&q=80",read:false,favorite:false,archived:false,author:""});
      closeSheet();setPage("saves");toast("笔记已保存（演示）");
    };
  };
}

function openReader(id){
  activeArticle=articles.find(a=>a.id===Number(id));
  if(!activeArticle)return;
  activeArticle.read=true;
  $("#readerContent").innerHTML=
    '<div class="reader-source">'+esc(activeArticle.source)+'</div>'+
    '<h1>'+esc(activeArticle.title)+'</h1>'+
    '<div class="reader-byline">By '+esc(activeArticle.author||"Pocket reader")+' · '+esc(activeArticle.date)+'</div>'+
    '<img class="reader-hero" src="'+activeArticle.image+'" alt="">'+
    '<p class="lead">'+esc(activeArticle.desc)+'</p>'+
    '<p>There is a particular pleasure in giving an interesting idea a little more room. Away from the rush of notifications and open tabs, a good story can unfold at its own pace.</p>'+
    '<p>Curiosity is often less about finding the quickest answer and more about learning which questions are worth carrying with us.</p>'+
    '<p style="font:11px Arial,sans-serif;color:var(--muted)">Sample reader text for interface testing.</p>';
  $("#reader").classList.add("open");
  $("#reader").scrollTop=0;
  $("#readerPrev").style.display=readerArrows?"grid":"none";
  $("#readerNext").style.display=readerArrows?"grid":"none";
  const ico=$("#readerSaveIcon");
  if(ico){ico.classList.toggle("filled",!!activeArticle.favorite)}
  render();
}

function action(type,id){
  const a=articles.find(x=>x.id===Number(id));
  if(!a)return;
  if(type==="favorite"){a.favorite=!a.favorite;toast(a.favorite?"已加入收藏":"已取消收藏");render()}
  else if(type==="more"){
    sheet("选项",
      '<div class="sheet-row" data-story="open">打开文章</div>'+
      '<div class="sheet-row" data-story="favorite">'+(a.favorite?"取消收藏":"加入收藏")+'</div>'+
      '<button class="secondary" id="cancelMore">取消</button>');
    $("#cancelMore").onclick=closeSheet;
    document.querySelectorAll("[data-story]").forEach(el=>el.onclick=()=>{closeSheet();el.dataset.story==="open"?openReader(id):action(el.dataset.story,id)});
  }
}

document.querySelectorAll(".nav-item").forEach(b=>b.onclick=()=>setPage(b.dataset.page));
["articleList","discoverList","recentSavesList"].forEach(id=>$("#"+id).addEventListener("click",e=>{
  const btn=e.target.closest("[data-action]");
  if(btn){e.stopPropagation();action(btn.dataset.action,btn.dataset.id);return}
  const row=e.target.closest("[data-open]");
  if(row) openReader(row.dataset.open);
}));

$("#searchBtn").onclick=()=>{
  sheet("搜索保存内容",
    '<label class="field-label" for="searchQuery">搜索标题或来源</label>'+
    '<input class="field" id="searchQuery" placeholder="输入关键词" autocomplete="off" value="'+esc(window.currentSearchQuery||"")+'">'+
    '<button class="primary" id="applySearch">搜索</button>'+
    '<button class="secondary" id="clearSearchQuery">清除搜索</button>');
  $("#searchQuery").oninput=()=>{window.currentSearchQuery=$("#searchQuery").value;render()};
  $("#applySearch").onclick=()=>{window.currentSearchQuery=$("#searchQuery").value.trim();closeSheet();if(page==="home")setPage("saves");render()};
  $("#clearSearchQuery").onclick=()=>{window.currentSearchQuery="";closeSheet();render()};
};
$("#filterBtn").onclick=()=>{if(page==="home")setPage("saves");filterSheet()};
$("#addTopBtn").onclick=addSheet;
$("#sheetClose").onclick=closeSheet;
$("#overlay").onclick=e=>{if(e.target===$("#overlay"))closeSheet()};

$("#featureCard").onclick=()=>openReader(1);
const showAllSaves=()=>{filter="all";setPage("saves");render()};
$("#seeAll").onclick=showAllSaves;
$("#recentSeeAll").onclick=showAllSaves;
$("#readerBack").onclick=()=>$("#reader").classList.remove("open");
function navigateReader(delta){
  const i=articles.findIndex(a=>a.id===activeArticle?.id);
  if(i>=0)openReader(articles[(i+delta+articles.length)%articles.length].id);
}
$("#readerPrev").onclick=()=>navigateReader(-1);
$("#readerNext").onclick=()=>navigateReader(1);
$("#readerSave").onclick=()=>{
  if(activeArticle){
    activeArticle.favorite=!activeArticle.favorite;
    toast(activeArticle.favorite?"已加入收藏":"已取消收藏");
    const ico=$("#readerSaveIcon");
    if(ico) ico.classList.toggle("filled",!!activeArticle.favorite);
    render();
  }
};
$("#readerMore").onclick=()=>sheet("阅读设置",
  '<div class="sheet-row"><span style="flex:1">字号</span><button class="chip" id="fontDown">A−</button><button class="chip" id="fontUp">A+</button></div>'+
  '<div class="sheet-row"><span style="flex:1">主题</span><button class="chip" id="readerTheme">切换深色</button></div>'+
  '<button class="primary" id="readerDone">完成</button>');
$("#sheetBody").addEventListener("click",e=>{
  if(e.target.id==="readerDone")closeSheet();
  if(e.target.id==="fontDown"){fontSize=Math.max(14,fontSize-1);$("#readerContent").querySelectorAll("p").forEach(p=>p.style.fontSize=fontSize+"px")}
  if(e.target.id==="fontUp"){fontSize=Math.min(26,fontSize+1);$("#readerContent").querySelectorAll("p").forEach(p=>p.style.fontSize=fontSize+"px")}
  if(e.target.id==="readerTheme"){dark=!dark;applyTheme();e.target.textContent=dark?"切换浅色":"切换深色"}
});
$("#readerText").onclick=()=>$("#readerMore").click();
$("#readerListen").onclick=()=>toast("音频播放不在本原型范围内");
$("#readerShare").onclick=()=>{
  if(navigator.share&&activeArticle)navigator.share({title:activeArticle.title,url:"https://example.com"}).catch(()=>{});
  else toast("分享预览");
};

function applyTheme(){
  const root=document.documentElement;
  root.style.setProperty("--bg",dark?"#101918":"#f7fbf9");
  root.style.setProperty("--surface",dark?"#171f1e":"#ffffff");
  root.style.setProperty("--soft",dark?"#252e2d":"#edf3f1");
  root.style.setProperty("--ink",dark?"#e0e5e3":"#191d1c");
  root.style.setProperty("--muted",dark?"#aab5b2":"#5f6966");
  root.style.setProperty("--line",dark?"#3d4946":"#dce5e1");
  root.style.setProperty("--m3-primary",dark?"#a8dcd5":"#006a62");
  document.querySelector('meta[name="theme-color"]').content=dark?"#101918":"#f7fbf9";
  $("#themeLabel").textContent=systemTheme?"跟随系统":dark?"深色":"浅色";
}

function syncSwitches(){
  [["systemThemeToggle",systemTheme],["openBrowserToggle",openBrowser],["readerArrowsToggle",readerArrows]].forEach(([id,on])=>{
    const b=$("#"+id);
    if(!b)return;
    b.classList.toggle("on",on);
    b.setAttribute("aria-pressed",String(on));
  });
  $("#themeLabel").textContent=systemTheme?"跟随系统":dark?"深色":"浅色";
}

document.querySelectorAll(".setting").forEach(el=>el.onclick=e=>{
  const x=el.dataset.setting;
  if(!x||e.target.closest(".switch"))return;
  if(x==="theme"){systemTheme=false;dark=!dark;syncSwitches();applyTheme();toast("主题已切换")}
  else if(x==="notifications"){
    sheet("设备通知设置",'<p style="line-height:1.7;color:var(--muted)">网页预览无法直接打开系统设置。</p><button class="primary" id="aboutOkay">知道了</button>');
    $("#aboutOkay").onclick=closeSheet;
  }else if(x==="version"){
    sheet("版本信息",'<div class="sheet-row"><span>应用</span><strong style="margin-left:auto">Pocket UI</strong></div><div class="sheet-row"><span>版本</span><strong style="margin-left:auto">1.0.0</strong></div><button class="primary" id="aboutOkay">关闭</button>');
    $("#aboutOkay").onclick=closeSheet;
  }
});

$("#systemThemeToggle").onclick=e=>{
  e.stopPropagation();
  systemTheme=!systemTheme;
  if(systemTheme){
    dark=window.matchMedia&&window.matchMedia("(prefers-color-scheme: dark)").matches;
    if(window.matchMedia)window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change",ev=>{
      if(systemTheme){dark=ev.matches;applyTheme();syncSwitches()}
    });
  }
  syncSwitches();applyTheme();
};
$("#openBrowserToggle").onclick=e=>{e.stopPropagation();openBrowser=!openBrowser;syncSwitches()};
$("#readerArrowsToggle").onclick=e=>{
  e.stopPropagation();
  readerArrows=!readerArrows;
  syncSwitches();
  $("#readerPrev").style.display=readerArrows?"grid":"none";
  $("#readerNext").style.display=readerArrows?"grid":"none";
};

document.addEventListener("keydown",e=>{
  if(e.key==="Escape"){closeSheet();$("#reader").classList.remove("open")}
  if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==="k"){e.preventDefault();setPage("saves");$("#searchBtn").click()}
});
$("#clock").textContent=new Date().toLocaleTimeString([],{hour:"2-digit",minute:"2-digit",hour12:false});
syncSwitches();
applyTheme();
setPage("home");
