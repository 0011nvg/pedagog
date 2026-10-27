'use strict';
(() => {
 const toggle=document.querySelector('#menuToggle'),nav=document.querySelector('#navigation');
 if(toggle)toggle.addEventListener('click',()=>{const expanded=toggle.getAttribute('aria-expanded')!=='true';toggle.setAttribute('aria-expanded',String(expanded));nav.classList.toggle('open',expanded);});
 const legacy={session:'game.html',deck:'library.html',guide:'rules.html',print:'print.html',about:'about.html'};
 if(document.body.dataset.page==='index'&&legacy[location.hash.slice(1)])location.replace(legacy[location.hash.slice(1)]);
})();
