// Reveal on scroll
const revEls = document.querySelectorAll('.reveal');
const revObs = new IntersectionObserver(e => e.forEach(x => { if(x.isIntersecting){ x.target.classList.add('visible'); revObs.unobserve(x.target); } }), {threshold:.08});
revEls.forEach(el => revObs.observe(el));

// Back to top functionality
const backTopBtn = document.getElementById('backTop');
if (backTopBtn) {
  window.addEventListener('scroll', () => backTopBtn.classList.toggle('show', scrollY > 300));
}

// Active category pill functionality
const sections = document.querySelectorAll('.cat-section');
const pills = document.querySelectorAll('.cat-pill');
if (sections.length && pills.length) {
  new IntersectionObserver(entries => {
    entries.forEach(e => {
      if(e.isIntersecting) {
        pills.forEach(p => p.classList.toggle('active', p.getAttribute('href')==='#'+e.target.id));
      }
    });
  }, {threshold:.4, rootMargin:'-64px 0px 0px 0px'}).observe.call(
    {observe: s => sections.forEach(s => {})});
  sections.forEach(s => new IntersectionObserver(entries => {
    entries.forEach(e => {
      if(e.isIntersecting) pills.forEach(p => p.classList.toggle('active', p.getAttribute('href')==='#'+e.target.id));
    });
  }, {threshold:.3, rootMargin:'-64px 0px 0px 0px'}).observe(s));
}

// Stagger cards animation
document.querySelectorAll('.menu-card').forEach((c,i) => c.style.transitionDelay = (i%6*55)+'ms');

// Menu management functions
async function loadMenu(){
  try{
    const r = await fetch('/menuItems');
    const items = await r.json();
    const list = document.getElementById('menuList');
    if(!items.length){
      list.innerHTML='<p style="color:var(--brown-light);text-align:center;padding:20px">No items yet.</p>';
      return;
    }
    list.innerHTML = items.map(i => `<div class="item-row"><img class="item-row-img" src="images/${i.name.toLowerCase().replace(/ /g, '_')}.jpg" alt="${i.name}"><div><div class="item-row-name">${i.name}</div><div class="item-row-cat">${i.category}</div></div><div class="item-row-price">Ksh ${Number(i.price).toFixed(2)}</div><button class="btn btn-danger btn-sm" onclick="deleteItem(${i.id})">Delete</button></div>`).join('');
  }catch(e){
    document.getElementById('menuList').innerHTML = '<p style="color:red;text-align:center;padding:20px">Error loading menu.</p>';
  }
}
async function deleteItem(id){
  if(!confirm('Delete this item?')) return;
  try{
    const r = await fetch('/menuItems/' + id, {method:'DELETE'});
    if(r.ok){
      loadMenu();
    }else{
      alert('Error deleting item.');
    }
  }catch(e){
    alert('Error deleting item.');
  }
}
if (document.getElementById('menuList')) {
  loadMenu();
}