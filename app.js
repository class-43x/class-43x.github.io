const categories=['All','Adventure','Arcade','Car','Classic','Clicker','IO','Multiplayer','Puzzle','Shooting','Sport'];
const games=[];
const grid=document.querySelector('#game-grid');
const search=document.querySelector('#search');
const sort=document.querySelector('#sort');
const count=document.querySelector('#count');
const empty=document.querySelector('#empty');
const categoryBar=document.querySelector('#categories');
let activeCategory='All';

const escapeHTML=value=>String(value??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
function popularityValue(value){
  const match=String(value||'').match(/([\d,.]+)\s*([KMB])?/i);
  if(!match)return 0;
  const number=parseFloat(match[1].replace(/,/g,''));
  return number*({K:1e3,M:1e6,B:1e9}[(match[2]||'').toUpperCase()]||1);
}
function gameCategory(game){
  const name=String(game.name||'').toLowerCase();
  const genre=String(game.genre||'').toLowerCase();
  const rawCategory=String(game.category||'').toLowerCase();
  if(/sport|soccer|football|basketball|bowling|golf|billiard|pool|tennis/.test(genre))return 'Sport';
  if(/1v1|among us|multiplayer|2 player|two player|battle royale/.test(genre+' '+name))return 'Multiplayer';
  if(/clicker|incremental|idle game/.test(genre))return 'Clicker';
  if(/puzzle|brain|logic|match.?3|tetris|word game|number games?|card games?/.test(genre))return 'Puzzle';
  if(/\.io\b|\bio games?\b/.test(name+' '+genre))return 'IO';
  if(/shooter|shooting|gun game|first.?person shooter|fps/.test(genre))return 'Shooting';
  if(/classic|retro|arcade classic/.test(genre))return 'Classic';
  if(/adventure|platformer|role.?playing|rpg|exploration/.test(genre))return 'Adventure';
  if(rawCategory==='strategy'&&/tower defense|strategy/.test(genre))return 'Puzzle';
  if(rawCategory==='driving'||/\bcar\b|driv|racing|motocross/.test(genre))return 'Car';
  return 'Arcade';
}
function thumbnailUrl(game){
  try{
    const base=new URL(game.link);
    if(base.protocol!=='https:'||base.hostname!=='icons-6.us'||!game.thumb)return '';
    return new URL(game.thumb,base).href;
  }catch{return '';}
}
function renderCategories(){
  categoryBar.innerHTML=categories.map(category=>`<button type="button" class="cat-btn ${category===activeCategory?'active':''}" aria-pressed="${category===activeCategory}" data-category="${category}">${category}</button>`).join('');
}
function render(){
  let list=games.filter(game=>(activeCategory==='All'||game.displayCategory===activeCategory)&&`${game.name} ${game.genre} ${game.dev}`.toLowerCase().includes(search.value.trim().toLowerCase()));
  if(sort.value==='az')list.sort((a,b)=>a.name.localeCompare(b.name));
  if(sort.value==='za')list.sort((a,b)=>b.name.localeCompare(a.name));
  if(sort.value==='popular')list.sort((a,b)=>b.popularityValue-a.popularityValue);
  if(sort.value==='random')list=list.slice().sort(()=>Math.random()-.5);
  count.textContent=`${list.length} games`;
  empty.hidden=list.length!==0;
  grid.hidden=list.length===0;
  grid.innerHTML = list.map(game => {
    const name = escapeHTML(game.name);
    const cover = game.thumbnail
      ? `<img class="game-cover" src="${escapeHTML(game.thumbnail)}" alt="" loading="lazy" decoding="async">`
      : '';
    return `<article class="game-card">
      <div class="game-thumb">
        ${cover}
        <span class="game-tag">${escapeHTML(game.displayCategory)}</span>
        <span class="game-symbol" aria-hidden="true" ${cover ? 'hidden' : ''}>${escapeHTML(game.symbol)}</span>
      </div>
      <div class="card-body">
        <h3 class="card-title">${name}</h3>
        <a class="card-open" href="./articles/${encodeURIComponent(game.id)}.html#player" aria-label="Play ${name}"><span aria-hidden="true">▶</span></a>
      </div>
    </article>`;
  }).join('');
  grid.querySelectorAll('.game-cover').forEach(image=>image.addEventListener('error',()=>{
    image.hidden=true;
    const fallback=image.parentElement.querySelector('.game-symbol');
    if(fallback)fallback.hidden=false;
  },{once:true}));
}
categoryBar.addEventListener('click',event=>{
  const button=event.target.closest('[data-category]');
  if(!button)return;
  activeCategory=button.dataset.category;
  renderCategories();
  categoryBar.querySelector('.active').focus();
  render();
});
search.addEventListener('input',render);
sort.addEventListener('change',render);
document.querySelector('#reset').addEventListener('click',()=>{
  search.value='';sort.value='az';activeCategory='All';renderCategories();render();search.focus();
});
async function loadGames(){
  try{
    const response=await fetch('./games.json');
    if(!response.ok)throw new Error(`Could not load games.json (${response.status})`);
    const data=await response.json();
    for(const source of data.games||[]){
      games.push({...source,displayCategory:gameCategory(source),popularityValue:popularityValue(source.popularity),thumbnail:thumbnailUrl(source),symbol:String(source.name||'?').slice(0,2).toUpperCase(),art:'linear-gradient(145deg,#1b5d91,#3b96cf 52%,#172956)'});
    }
    renderCategories();render();
  }catch(error){
    console.error(error);
    count.textContent='Games could not load';
    empty.hidden=false;grid.hidden=true;
  }
}
renderCategories();
loadGames();
