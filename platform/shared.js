'use strict';
(() => {
 const toggle=document.querySelector('#menuToggle'),nav=document.querySelector('#navigation');
 function menu(expanded){toggle.setAttribute('aria-expanded',String(expanded));toggle.setAttribute('aria-label',expanded?'Закрыть навигацию':'Открыть навигацию');nav.classList.toggle('open',expanded);}
 if(toggle&&nav){toggle.addEventListener('click',()=>menu(toggle.getAttribute('aria-expanded')!=='true'));document.addEventListener('keydown',event=>{if(event.key==='Escape'&&toggle.getAttribute('aria-expanded')==='true'){menu(false);toggle.focus();}});document.addEventListener('click',event=>{if(!event.target.closest('.site-header'))menu(false);});nav.addEventListener('click',event=>{if(event.target.closest('a'))menu(false);});}
 const skip=document.querySelector('.skip');if(skip)skip.addEventListener('click',()=>{const app=document.getElementById('app');app.tabIndex=-1;app.focus({preventScroll:true});});
 function revealAnchor(){let el;try{el=document.getElementById(decodeURIComponent(location.hash.slice(1)));}catch{return;}if(!el)return;for(let node=el;node;node=node.parentElement)if(node.tagName==='DETAILS')node.open=true;}
 revealAnchor();addEventListener('hashchange',revealAnchor);
 const legacy={session:'game.html',deck:'library.html',guide:'rules.html',print:'print.html',about:'about.html'};
 if(document.body.dataset.page==='index'&&legacy[location.hash.slice(1)])location.replace(legacy[location.hash.slice(1)]);
})();
