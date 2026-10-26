const icon = (name, filled) => '<span class="material-symbols-outlined'+(filled?' filled':'')+'">'+name+'</span>';
const heart = (filled) => icon('favorite', filled);
const moreIcon = icon('more_horiz');

let page="home",filter="all",newest=true,sortMode="newest",viewedFilter="any",readLengthFilter="any",dateFilter="any",favoritesOnly=false,activeArticle=null,dark=true,systemTheme=false,openBrowser=true,fontSize=18,toastTimer,editMode=false;
const selectedIds=new Set();
const readMinutes=a=>{const m=String(a.date||"").match(/(\d+)\s*min read/i);return m?Number(m[1]):0};
const $=s=>document.querySelector(s);
const esc=s=>String(s).replace(/&/g,"&").replace(/</g,"<").replace(/>/g,">").replace(/"/g,""").replace(/'/g,"&#39;");

function toast(s){const t=$("#toast");if(!t)return;t.textContent=s;t.classList.add("show");clearTimeout(toastTimer);toastTimer=setTimeout(()=>t.classList.remove("show"),2000)}

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

  const listLabel=$("#listLabel"); if(listLabel) listLabel.textContent=filter==="all"?"全部内容":filter==="favorites"?"收藏":filter==="highlights"?"AI精选":filter==="notes"?"笔记":"全部内容";
  const ss=$("#savesSubtitle"); if(ss) ss.textContent=articles.length+" stories saved for later";
  const hsc=$("#homeSavesCount"); if(hsc) hsc.textContent=articles.length;
  const hac=$("#homeArchiveCount"); if(hac) hac.textContent=0;
  const ssc=$("#settingsSavesCount"); if(ssc) ssc.textContent=articles.length;
  const sac=$("#settingsArchiveCount"); if(sac) sac.textContent=0;
  const hse=$("#homeSavesExample"); if(hse) hse.textContent=articles[0]?.title||"暂无保存内容";
  const hae=$("#homeArchiveExample"); if(hae) hae.textContent="";

  const recentEl=$("#recentSavesList");
  if(recentEl) recentEl.innerHTML=articles.slice(0,5).map(a=>
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
      '<img class="thumb" src="'+a.image+'" alt="" loading="lazy">'+ 
      '<h2 class="article-title">'+esc(a.title)+'</h2>'+ 
      '<div class="article-bottom">'+ 
        '<div class="source">'+esc(a.source)+'</div>'+ 
        '<div class="tools">'+favoriteButton(a)+moreButton(a)+'</div>'+ 
      '</div>'+ 
    '</article>';

  const listEl=$("#articleList");
  if(listEl) listEl.innerHTML=list.map(card).join("")||'<div class="empty"><strong>没有找到内容</strong><span>尝试更换筛选条件或添加网页。</span></div>';

  const discEl=$("#discoverList");
  if(discEl) discEl.innerHTML=articles.slice(1,11).map(a=>
    '<article class="article article-discover" data-open="'+a.id+'">'+ 
      '<img class="thumb" src="'+a.image+'" alt="" loading="lazy">'+ 
      '<h2 class="article-title">'+esc(a.title)+'</h2>'+ 
      '<div class="article-bottom">'+ 
        '<div class="source">'+esc(a.source)+'</div>'+ 
        '<button class="link-icon" data-action="addlink" data-id="'+a.id+'" aria-label="添加链接" title="添加链接">'+icon('add_link')+'</button>'+ 
      '</div>'+ 
    '</article>'
  ).join("");

  const tt=$("#topbarTitle"); if(tt) tt.textContent=page==="settings"?"设置":page==="saves"?"保存内容":"主页";
}

function setPage(p){
  page=p;
  const app=$("#app"); if(app) app.dataset.page=p;
  document.querySelectorAll(".page").forEach(el=>el.classList.toggle("active",el.id==="page-"+p));
  document.querySelectorAll(".nav-item").forEach(el=>el.classList.toggle("active",el.dataset.page===p));
  const title=$("#topbarTitle"); if(title) title.textContent=p==="settings"?"设置":p==="saves"?"保存内容":"主页";
  const showControls = p==="saves";
  ["searchBtn","filterBtn","addTopBtn"].forEach(id=>{ const el=$("#"+id); if(el) el.style.display=showControls?"grid":"none"; });
  const topbar=$(".topbar");
  if(topbar) topbar.style.display = (p==="saves") ? "flex" : "none";
  render();
}

function sheet(title,html){const st=$("#sheetTitle"),sb=$("#sheetBody"),ov=$("#overlay"); if(st) st.textContent=title; if(sb) sb.innerHTML=html; if(ov) ov.classList.add("open")}
function closeSheet(){const ov=$("#overlay"); if(ov) ov.classList.remove("open")}

function filterSheet(){
  sheet("筛选内容",
    '<div class="sheet-subhead">内容类型</div>'+
    '<label class="sheet-row"><input type="radio" name="contentFilter" value="all" '+(filter==="all"?"checked":"")+'>全部内容</label>'+
    '<label class="sheet-row"><input type="radio" name="contentFilter" value="favorites" '+(filter==="favorites"?"checked":"")+'>已收藏</label>'+
    '<label class="sheet-row"><input type="radio" name="contentFilter" value="highlights" '+(filter==="highlights"?"checked":"")+'>AI精选</label>'+
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
  const af=$("#applyFilter"); if(af) af.onclick=()=>{
    filter=$('input[name="contentFilter"]:checked').value;
    dateFilter=$('input[name="dateFilter"]:checked').value;
    viewedFilter=$("#filterViewed").checked?"viewed":$("#filterNotViewed").checked?"notViewed":"any";
    favoritesOnly=false;closeSheet();render();
  };
  const rf=$("#resetFilter"); if(rf) rf.onclick=()=>{filter="all";dateFilter="any";favoritesOnly=false;viewedFilter="any";window.currentSearchQuery="";closeSheet();render()};
}

function addSheet(){
  sheet("添加保存",
    '<label class="field-label" for="urlField">链接或网址</label>'+
    '<input class="field" id="urlField" placeholder="粘贴链接" type="url">'+
    '<label class="field-label" for="titleField">标题（可选）</label>'+
    '<input class="field" id="titleField" placeholder="给这条保存起个名字">'+
    '<button class="primary" id="saveUrl">添加到保存内容</button>'+
    '<button class="secondary" id="addNote">改为创建笔记</button>');
  const su=$("#saveUrl"); if(su) su.onclick=()=>{
    let raw=$("#urlField").value.trim();
    if(!raw){toast("请先粘贴链接");return}
    try{
      let u=new URL(raw.startsWith("http")?raw:"https://"+raw),title=$("#titleField").value.trim()||u.hostname.replace(/^www\./,"");
      articles.unshift({id:Date.now(),title,source:u.hostname.toUpperCase(),desc:"A saved link ready to read later.",date:"Just now · Link",tag:"Unsorted",image:"https://images.unsplash.com/photo-1455390582262-044c029bcca8?auto=format&fit=crop&w=500&q=80",read:false,favorite:false,archived:false,author:""});
      closeSheet();filter="all";setPage("saves");toast("已添加到演示列表");
    }catch(e){toast("请输入有效的网址")}
  };
  const an=$("#addNote"); if(an) an.onclick=()=>{
    closeSheet();
    sheet("新建笔记",
      '<label class="field-label">标题</label><input class="field" id="noteTitle" placeholder="笔记标题">'+
      '<label class="field-label">内容</label><textarea class="field" id="noteText" rows="4" placeholder="写点值得记住的内容" style="height:100px;padding-top:10px"></textarea>'+
      '<button class="primary" id="saveNote">保存笔记</button>');
    const sn=$("#saveNote"); if(sn) sn.onclick=()=>{
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
  const rc=$("#readerContent");
  if(rc) rc.innerHTML=
    '<div class="reader-source">'+esc(activeArticle.source)+'</div>'+
    '<h1>'+esc(activeArticle.title)+'</h1>'+
    '<div class="reader-byline">By '+esc(activeArticle.author||"Pocket reader")+' · '+esc(activeArticle.date)+'</div>'+
    '<img class="reader-hero" src="'+activeArticle.image+'" alt="">'+ 
    '<p class="lead">'+esc(activeArticle.desc)+'</p>'+
    '<p>There is a particular pleasure in giving an interesting idea a little more room. Away from the rush of notifications and open tabs, a good story can unfold at its own pace.</p>'+
    '<p>Curiosity is often less about finding the quickest answer and more about learning which questions are worth carrying with us.</p>'+
    '<p style="font:11px Arial,sans-serif;color:var(--muted)">Sample reader text for interface testing.</p>';
  const reader=$("#reader"); if(reader){ reader.classList.add("open"); reader.scrollTop=0; }
  const ico=$("#readerSaveIcon");
  if(ico){ico.classList.toggle("filled",!!activeArticle.favorite)}
  render();
}

function action(type,id){
  const a=articles.find(x=>x.id===Number(id));
  if(!a)return;
  if(type==="favorite"){a.favorite=!a.favorite;toast(a.favorite?"已加入收藏":"已取消收藏");render()}
  else if(type==="addlink"){toast("已添加链接到保存内容（演示）")}
  else if(type==="more"){
    sheet("选项",
      '<div class="sheet-row" data-story="open">打开文章</div>'+
      '<div class="sheet-row" data-story="favorite">'+(a.favorite?"取消收藏":"加入收藏")+'</div>'+
      '<button class="secondary" id="cancelMore">取消</button>');
    const cm=$("#cancelMore"); if(cm) cm.onclick=closeSheet;
    document.querySelectorAll("[data-story]").forEach(el=>el.onclick=()=>{closeSheet();el.dataset.story==="open"?openReader(id):action(el.dataset.story,id)});
  }
}

document.querySelectorAll(".nav-item").forEach(b=>b.onclick=()=>setPage(b.dataset.page));
["articleList","discoverList","recentSavesList"].forEach(id=>{
  const el=$("#"+id);
  if(!el) return;
  el.addEventListener("click",e=>{
    const btn=e.target.closest("[data-action]");
    if(btn){e.stopPropagation();action(btn.dataset.action,btn.dataset.id);return}
    const row=e.target.closest("[data-open]");
    if(row) openReader(row.dataset.open);
  });
});

const searchBtn=$("#searchBtn");
if(searchBtn) searchBtn.onclick=()=>{
  sheet("搜索保存内容",
    '<label class="field-label" for="searchQuery">搜索标题或来源</label>'+
    '<input class="field" id="searchQuery" placeholder="输入关键词" autocomplete="off" value="'+esc(window.currentSearchQuery||"")+'">'+
    '<button class="primary" id="applySearch">搜索</button>'+
    '<button class="secondary" id="clearSearchQuery">清除搜索</button>');
  const sq=$("#searchQuery"); if(sq) sq.oninput=()=>{window.currentSearchQuery=$("#searchQuery").value;render()};
  const as=$("#applySearch"); if(as) as.onclick=()=>{window.currentSearchQuery=$("#searchQuery").value.trim();closeSheet();if(page==="home")setPage("saves");render()};
  const cs=$("#clearSearchQuery"); if(cs) cs.onclick=()=>{window.currentSearchQuery="";closeSheet();render()};
};
const filterBtn=$("#filterBtn"); if(filterBtn) filterBtn.onclick=()=>{if(page==="home")setPage("saves");filterSheet()};
const addTopBtn=$("#addTopBtn"); if(addTopBtn) addTopBtn.onclick=addSheet;
const sheetClose=$("#sheetClose"); if(sheetClose) sheetClose.onclick=closeSheet;
const overlay=$("#overlay"); if(overlay) overlay.onclick=e=>{if(e.target===overlay)closeSheet()};

const featureCard=$("#featureCard"); if(featureCard) featureCard.onclick=()=>openReader(1);
const showAllSaves=()=>{filter="all";setPage("saves");render()};
const recentSeeAll=$("#recentSeeAll"); if(recentSeeAll) recentSeeAll.onclick=showAllSaves;
const readerBack=$("#readerBack"); if(readerBack) readerBack.onclick=()=>{const r=$("#reader"); if(r) r.classList.remove("open")};
function navigateReader(delta){
  const i=articles.findIndex(a=>a.id===activeArticle?.id);
  if(i>=0)openReader(articles[(i+delta+articles.length)%articles.length].id);
}
const readerPrev=$("#readerPrev"); if(readerPrev) readerPrev.onclick=()=>navigateReader(-1);
const readerNext=$("#readerNext"); if(readerNext) readerNext.onclick=()=>navigateReader(1);
const readerSave=$("#readerSave"); if(readerSave) readerSave.onclick=()=>{
  if(activeArticle){
    activeArticle.favorite=!activeArticle.favorite;
    toast(activeArticle.favorite?"已加入收藏":"已取消收藏");
    const ico=$("#readerSaveIcon");
    if(ico) ico.classList.toggle("filled",!!activeArticle.favorite);
    render();
  }
};
const sheetBody=$("#sheetBody");
if(sheetBody) sheetBody.addEventListener("click",e=>{
  if(e.target.id==="readerDone")closeSheet();
  if(e.target.id==="fontDown"){fontSize=Math.max(14,fontSize-1);const rc=$("#readerContent"); if(rc) rc.querySelectorAll("p").forEach(p=>p.style.fontSize=fontSize+"px")}
  if(e.target.id==="fontUp"){fontSize=Math.min(26,fontSize+1);const rc=$("#readerContent"); if(rc) rc.querySelectorAll("p").forEach(p=>p.style.fontSize=fontSize+"px")}
  if(e.target.id==="readerTheme"){dark=!dark;applyTheme();e.target.textContent=dark?"切换浅色":"切换深色"}
});
const readerListen=$("#readerListen"); if(readerListen) readerListen.onclick=()=>toast("音频播放不在本原型范围内");
const readerMore=$("#readerMore"); if(readerMore) readerMore.onclick=()=>sheet("阅读设置",
  '<div class="sheet-row"><span style="flex:1">字号</span><button class="chip" id="fontDown">A−</button><button class="chip" id="fontUp">A+</button></div>'+
  '<div class="sheet-row"><span style="flex:1">主题</span><button class="chip" id="readerTheme">切换深色</button></div>'+
  '<button class="primary" id="readerDone">完成</button>');
const readerShare=$("#readerShare"); if(readerShare) readerShare.onclick=()=>{
  if(navigator.share&&activeArticle)navigator.share({title:activeArticle.title,url:"https://example.com"}).catch(()=>{});
  else toast("分享预览");
};
const readerOriginal=$("#readerOriginal"); if(readerOriginal) readerOriginal.onclick=()=>{
  if(!activeArticle)return;
  toast(openBrowser?"已在浏览器中打开原链接":"已在应用内打开原链接");
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
  const meta=document.querySelector('meta[name="theme-color"]');
  if(meta) meta.content=dark?"#101918":"#f7fbf9";
  const tl=$("#themeLabel"); if(tl) tl.textContent=systemTheme?"跟随系统":dark?"深色":"浅色";
}

function syncSwitches(){
  [["systemThemeToggle",systemTheme],["openBrowserToggle",openBrowser]].forEach(([id,on])=>{
    const b=$("#"+id);
    if(!b)return;
    b.classList.toggle("on",on);
    b.setAttribute("aria-pressed",String(on));
  });
  const tl=$("#themeLabel"); if(tl) tl.textContent=systemTheme?"跟随系统":dark?"深色":"浅色";
}

document.querySelectorAll(".setting").forEach(el=>el.onclick=e=>{
  const x=el.dataset.setting;
  if(!x||e.target.closest(".switch"))return;
  if(x==="theme"){systemTheme=false;dark=!dark;syncSwitches();applyTheme();toast("主题已切换")}
  else if(x==="notifications"){
    sheet("设备通知设置",'<p style="line-height:1.7;color:var(--muted)">网页预览无法直接打开系统设置。</p><button class="primary" id="aboutOkay">知道了</button>');
    const ao=$("#aboutOkay"); if(ao) ao.onclick=closeSheet;
  }else if(x==="version"){
    sheet("版本信息",'<div class="sheet-row"><span>应用</span><strong style="margin-left:auto">Pocket UI</strong></div><div class="sheet-row"><span>版本</span><strong style="margin-left:auto">1.0.0</strong></div><button class="primary" id="aboutOkay">关闭</button>');
    const ao=$("#aboutOkay"); if(ao) ao.onclick=closeSheet;
  }
});

const openBrowserToggle=$("#openBrowserToggle");
if(openBrowserToggle) openBrowserToggle.onclick=e=>{e.stopPropagation();openBrowser=!openBrowser;syncSwitches();toast(openBrowser?"原链接将在浏览器中打开":"原链接将在应用内打开")};
const systemThemeToggle=$("#systemThemeToggle");
if(systemThemeToggle) systemThemeToggle.onclick=e=>{
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

document.addEventListener("keydown",e=>{
  if(e.key==="Escape"){closeSheet();const r=$("#reader"); if(r) r.classList.remove("open")}
  if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==="k"){e.preventDefault();setPage("saves");const sb=$("#searchBtn"); if(sb) sb.click()}
});
const clockEl=$("#clock"); if(clockEl) clockEl.textContent=new Date().toLocaleTimeString([],{hour:"2-digit",minute:"2-digit",hour12:false});
try{ syncSwitches(); applyTheme(); setPage("home"); }catch(err){ console.error(err); }
