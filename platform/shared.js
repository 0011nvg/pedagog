'use strict';
(() => {
 const toggle=document.querySelector('#menuToggle'),nav=document.querySelector('#navigation');
 if(toggle)toggle.addEventListener('click',()=>{const expanded=toggle.getAttribute('aria-expanded')!=='true';toggle.setAttribute('aria-expanded',String(expanded));nav.classList.toggle('open',expanded);});
 function revealAnchor(){let el;try{el=document.getElementById(decodeURIComponent(location.hash.slice(1)));}catch{return;}if(!el)return;for(let node=el;node;node=node.parentElement)if(node.tagName==='DETAILS')node.open=true;}
 revealAnchor();addEventListener('hashchange',revealAnchor);
 const legacy={session:'game.html',deck:'library.html',guide:'rules.html',print:'print.html',about:'about.html'};
 if(document.body.dataset.page==='index'&&legacy[location.hash.slice(1)])location.replace(legacy[location.hash.slice(1)]);
})();
