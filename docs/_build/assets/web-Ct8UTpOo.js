const g={context:void 0,registry:void 0};function M(e){g.context=e}const Le=(e,t)=>e===t,le=Symbol("solid-proxy"),je=Symbol("solid-track"),J={equals:Le};let H=null,Ae=$e;const V=1,G=2,Ee={owned:null,cleanups:null,context:null,owner:null},ie={};var h=null;let c=null,Ve=null,w=null,C=null,A=null,te=0;function X(e,t){const n=w,s=h,i=e.length===0,r=t===void 0?s:t,o=i?Ee:{owned:null,cleanups:null,context:r?r.context:null,owner:r},l=i?e:()=>e(()=>$(()=>B(o)));h=o,w=null;try{return j(l,!0)}finally{w=n,h=s}}function v(e,t){t=t?Object.assign({},J,t):J;const n={value:e,observers:null,observerSlots:null,comparator:t.equals||void 0},s=i=>(typeof i=="function"&&(c&&c.running&&c.sources.has(n)?i=i(n.tValue):i=i(n.value)),ke(n,i));return[Oe.bind(n),s]}function he(e,t,n){const s=Y(e,t,!0,V);K(s)}function U(e,t,n){const s=Y(e,t,!1,V);K(s)}function mt(e,t,n){Ae=_e;const s=Y(e,t,!1,V),i=D&&ae(D);i&&(s.suspense=i),s.user=!0,A?A.push(s):K(s)}function L(e,t,n){n=n?Object.assign({},J,n):J;const s=Y(e,t,!0,0);return s.observers=null,s.observerSlots=null,s.comparator=n.equals||void 0,K(s),Oe.bind(s)}function ve(e){return e&&typeof e=="object"&&"then"in e}function Ie(e,t,n){let s,i,r;arguments.length===2&&typeof t=="object"||arguments.length===1?(s=!0,i=e,r={}):(s=e,i=t,r={});let o=null,l=ie,u=null,a=!1,f=!1,d="initialValue"in r,y=typeof s=="function"&&L(s);const p=new Set,[x,O]=(r.storage||v)(r.initialValue),[T,N]=v(void 0),[E,k]=v(void 0,{equals:!1}),[P,I]=v(d?"ready":"unresolved");if(g.context){u=`${g.context.id}${g.context.count++}`;let m;r.ssrLoadFrom==="initial"?l=r.initialValue:g.load&&(m=g.load(u))&&(l=m)}function F(m,b,S,R){return o===m&&(o=null,R!==void 0&&(d=!0),(m===l||b===l)&&r.onHydrated&&queueMicrotask(()=>r.onHydrated(R,{value:b})),l=ie,c&&m&&a?(c.promises.delete(m),a=!1,j(()=>{c.running=!0,de(b,S)},!1)):de(b,S)),b}function de(m,b){j(()=>{b===void 0&&O(()=>m),I(b!==void 0?"errored":d?"ready":"unresolved"),N(b);for(const S of p.keys())S.decrement();p.clear()},!1)}function ne(){const m=D&&ae(D),b=x(),S=T();if(S!==void 0&&!o)throw S;return w&&!w.user&&m&&he(()=>{E(),o&&(m.resolved&&c&&a?c.promises.add(o):p.has(m)||(m.increment(),p.add(m)))}),b}function se(m=!0){if(m!==!1&&f)return;f=!1;const b=y?y():s;if(a=c&&c.running,b==null||b===!1){F(o,$(x));return}c&&o&&c.promises.delete(o);const S=l!==ie?l:$(()=>i(b,{value:x(),refetching:m}));return ve(S)?(o=S,"value"in S?(S.status==="success"?F(o,S.value,void 0,b):F(o,void 0,void 0,b),S):(f=!0,queueMicrotask(()=>f=!1),j(()=>{I(d?"refreshing":"pending"),k()},!1),S.then(R=>F(S,R,void 0,b),R=>F(S,void 0,Pe(R),b)))):(F(o,S,void 0,b),S)}return Object.defineProperties(ne,{state:{get:()=>P()},error:{get:()=>T()},loading:{get(){const m=P();return m==="pending"||m==="refreshing"}},latest:{get(){if(!d)return ne();const m=T();if(m&&!o)throw m;return x()}}}),y?he(()=>se(!1)):se(!1),[ne,{refetch:se,mutate:O}]}function $(e){if(w===null)return e();const t=w;w=null;try{return e()}finally{w=t}}function bt(e,t,n){const s=Array.isArray(e);let i,r=n&&n.defer;return o=>{let l;if(s){l=Array(e.length);for(let a=0;a<e.length;a++)l[a]=e[a]()}else l=e();if(r)return r=!1,o;const u=$(()=>t(l,i,o));return i=l,u}}function ce(e){return h===null||(h.cleanups===null?h.cleanups=[e]:h.cleanups.push(e)),e}function Me(e,t){H||(H=Symbol("error")),h=Y(void 0,void 0,!0),h.context={...h.context,[H]:[t]},c&&c.running&&c.sources.add(h);try{return e()}catch(n){Q(n)}finally{h=h.owner}}function Fe(){return h}function St(e,t){const n=h,s=w;h=e,w=null;try{return j(t,!0)}catch(i){Q(i)}finally{h=n,w=s}}function xt(e){if(c&&c.running)return e(),c.done;const t=w,n=h;return Promise.resolve().then(()=>{w=t,h=n;let s;return D&&(s=c||(c={sources:new Set,effects:[],promises:new Set,disposed:new Set,queue:new Set,running:!0}),s.done||(s.done=new Promise(i=>s.resolve=i)),s.running=!0),j(e,!1),w=h=null,s?s.done:void 0})}const[At,ge]=v(!1);function Be(e){A.push.apply(A,e),e.length=0}function Ce(e,t){const n=Symbol("context");return{id:n,Provider:qe(n),defaultValue:e}}function ae(e){return h&&h.context&&h.context[e.id]!==void 0?h.context[e.id]:e.defaultValue}function Ue(e){const t=L(e),n=L(()=>oe(t()));return n.toArray=()=>{const s=n();return Array.isArray(s)?s:s!=null?[s]:[]},n}let D;function De(){return D||(D=Ce())}function Oe(){const e=c&&c.running;if(this.sources&&(e?this.tState:this.state))if((e?this.tState:this.state)===V)K(this);else{const t=C;C=null,j(()=>ee(this),!1),C=t}if(w){const t=this.observers?this.observers.length:0;w.sources?(w.sources.push(this),w.sourceSlots.push(t)):(w.sources=[this],w.sourceSlots=[t]),this.observers?(this.observers.push(w),this.observerSlots.push(w.sources.length-1)):(this.observers=[w],this.observerSlots=[w.sources.length-1])}return e&&c.sources.has(this)?this.tValue:this.value}function ke(e,t,n){let s=c&&c.running&&c.sources.has(e)?e.tValue:e.value;if(!e.comparator||!e.comparator(s,t)){if(c){const i=c.running;(i||!n&&c.sources.has(e))&&(c.sources.add(e),e.tValue=t),i||(e.value=t)}else e.value=t;e.observers&&e.observers.length&&j(()=>{for(let i=0;i<e.observers.length;i+=1){const r=e.observers[i],o=c&&c.running;o&&c.disposed.has(r)||((o?!r.tState:!r.state)&&(r.pure?C.push(r):A.push(r),r.observers&&Te(r)),o?r.tState=V:r.state=V)}if(C.length>1e6)throw C=[],new Error},!1)}return t}function K(e){if(!e.fn)return;B(e);const t=te;ye(e,c&&c.running&&c.sources.has(e)?e.tValue:e.value,t),c&&!c.running&&c.sources.has(e)&&queueMicrotask(()=>{j(()=>{c&&(c.running=!0),w=h=e,ye(e,e.tValue,t),w=h=null},!1)})}function ye(e,t,n){let s;const i=h,r=w;w=h=e;try{s=e.fn(t)}catch(o){return e.pure&&(c&&c.running?(e.tState=V,e.tOwned&&e.tOwned.forEach(B),e.tOwned=void 0):(e.state=V,e.owned&&e.owned.forEach(B),e.owned=null)),e.updatedAt=n+1,Q(o)}finally{w=r,h=i}(!e.updatedAt||e.updatedAt<=n)&&(e.updatedAt!=null&&"observers"in e?ke(e,s,!0):c&&c.running&&e.pure?(c.sources.add(e),e.tValue=s):e.value=s,e.updatedAt=n)}function Y(e,t,n,s=V,i){const r={fn:e,state:s,updatedAt:null,owned:null,sources:null,sourceSlots:null,cleanups:null,value:t,owner:h,context:h?h.context:null,pure:n};return c&&c.running&&(r.state=0,r.tState=s),h===null||h!==Ee&&(c&&c.running&&h.pure?h.tOwned?h.tOwned.push(r):h.tOwned=[r]:h.owned?h.owned.push(r):h.owned=[r]),r}function Z(e){const t=c&&c.running;if((t?e.tState:e.state)===0)return;if((t?e.tState:e.state)===G)return ee(e);if(e.suspense&&$(e.suspense.inFallback))return e.suspense.effects.push(e);const n=[e];for(;(e=e.owner)&&(!e.updatedAt||e.updatedAt<te);){if(t&&c.disposed.has(e))return;(t?e.tState:e.state)&&n.push(e)}for(let s=n.length-1;s>=0;s--){if(e=n[s],t){let i=e,r=n[s+1];for(;(i=i.owner)&&i!==r;)if(c.disposed.has(i))return}if((t?e.tState:e.state)===V)K(e);else if((t?e.tState:e.state)===G){const i=C;C=null,j(()=>ee(e,n[0]),!1),C=i}}}function j(e,t){if(C)return e();let n=!1;t||(C=[]),A?n=!0:A=[],te++;try{const s=e();return Re(n),s}catch(s){n||(A=null),C=null,Q(s)}}function Re(e){if(C&&($e(C),C=null),e)return;let t;if(c){if(!c.promises.size&&!c.queue.size){const s=c.sources,i=c.disposed;A.push.apply(A,c.effects),t=c.resolve;for(const r of A)"tState"in r&&(r.state=r.tState),delete r.tState;c=null,j(()=>{for(const r of i)B(r);for(const r of s){if(r.value=r.tValue,r.owned)for(let o=0,l=r.owned.length;o<l;o++)B(r.owned[o]);r.tOwned&&(r.owned=r.tOwned),delete r.tValue,delete r.tOwned,r.tState=0}ge(!1)},!1)}else if(c.running){c.running=!1,c.effects.push.apply(c.effects,A),A=null,ge(!0);return}}const n=A;A=null,n.length&&j(()=>Ae(n),!1),t&&t()}function $e(e){for(let t=0;t<e.length;t++)Z(e[t])}function _e(e){let t,n=0;for(t=0;t<e.length;t++){const s=e[t];s.user?e[n++]=s:Z(s)}if(g.context){if(g.count){g.effects||(g.effects=[]),g.effects.push(...e.slice(0,n));return}else g.effects&&(e=[...g.effects,...e],n+=g.effects.length,delete g.effects);M()}for(t=0;t<n;t++)Z(e[t])}function ee(e,t){const n=c&&c.running;n?e.tState=0:e.state=0;for(let s=0;s<e.sources.length;s+=1){const i=e.sources[s];if(i.sources){const r=n?i.tState:i.state;r===V?i!==t&&(!i.updatedAt||i.updatedAt<te)&&Z(i):r===G&&ee(i,t)}}}function Te(e){const t=c&&c.running;for(let n=0;n<e.observers.length;n+=1){const s=e.observers[n];(t?!s.tState:!s.state)&&(t?s.tState=G:s.state=G,s.pure?C.push(s):A.push(s),s.observers&&Te(s))}}function B(e){let t;if(e.sources)for(;e.sources.length;){const n=e.sources.pop(),s=e.sourceSlots.pop(),i=n.observers;if(i&&i.length){const r=i.pop(),o=n.observerSlots.pop();s<i.length&&(r.sourceSlots[o]=s,i[s]=r,n.observerSlots[s]=o)}}if(c&&c.running&&e.pure){if(e.tOwned){for(t=e.tOwned.length-1;t>=0;t--)B(e.tOwned[t]);delete e.tOwned}Ne(e,!0)}else if(e.owned){for(t=e.owned.length-1;t>=0;t--)B(e.owned[t]);e.owned=null}if(e.cleanups){for(t=e.cleanups.length-1;t>=0;t--)e.cleanups[t]();e.cleanups=null}c&&c.running?e.tState=0:e.state=0}function Ne(e,t){if(t||(e.tState=0,c.disposed.add(e)),e.owned)for(let n=0;n<e.owned.length;n++)Ne(e.owned[n])}function Pe(e){return e instanceof Error?e:new Error(typeof e=="string"?e:"Unknown error",{cause:e})}function we(e,t,n){try{for(const s of t)s(e)}catch(s){Q(s,n&&n.owner||null)}}function Q(e,t=h){const n=H&&t&&t.context&&t.context[H],s=Pe(e);if(!n)throw s;A?A.push({fn(){we(s,n,t)},state:V}):we(s,n,t)}function oe(e){if(typeof e=="function"&&!e.length)return oe(e());if(Array.isArray(e)){const t=[];for(let n=0;n<e.length;n++){const s=oe(e[n]);Array.isArray(s)?t.push.apply(t,s):t.push(s)}return t}return e}function qe(e,t){return function(s){let i;return U(()=>i=$(()=>(h.context={...h.context,[e]:s.value},Ue(()=>s.children))),void 0),i}}const Ke=Symbol("fallback");function pe(e){for(let t=0;t<e.length;t++)e[t]()}function He(e,t,n={}){let s=[],i=[],r=[],o=0,l=t.length>1?[]:null;return ce(()=>pe(r)),()=>{let u=e()||[],a,f;return u[je],$(()=>{let y=u.length,p,x,O,T,N,E,k,P,I;if(y===0)o!==0&&(pe(r),r=[],s=[],i=[],o=0,l&&(l=[])),n.fallback&&(s=[Ke],i[0]=X(F=>(r[0]=F,n.fallback())),o=1);else if(o===0){for(i=new Array(y),f=0;f<y;f++)s[f]=u[f],i[f]=X(d);o=y}else{for(O=new Array(y),T=new Array(y),l&&(N=new Array(y)),E=0,k=Math.min(o,y);E<k&&s[E]===u[E];E++);for(k=o-1,P=y-1;k>=E&&P>=E&&s[k]===u[P];k--,P--)O[P]=i[k],T[P]=r[k],l&&(N[P]=l[k]);for(p=new Map,x=new Array(P+1),f=P;f>=E;f--)I=u[f],a=p.get(I),x[f]=a===void 0?-1:a,p.set(I,f);for(a=E;a<=k;a++)I=s[a],f=p.get(I),f!==void 0&&f!==-1?(O[f]=i[a],T[f]=r[a],l&&(N[f]=l[a]),f=x[f],p.set(I,f)):r[a]();for(f=E;f<y;f++)f in O?(i[f]=O[f],r[f]=T[f],l&&(l[f]=N[f],l[f](f))):i[f]=X(d);i=i.slice(0,o=y),s=u.slice(0)}return i});function d(y){if(r[f]=y,l){const[p,x]=v(f);return l[f]=x,t(u[f],p)}return t(u[f])}}}function Xe(e,t){return $(()=>e(t||{}))}function z(){return!0}const Ge={get(e,t,n){return t===le?n:e.get(t)},has(e,t){return t===le?!0:e.has(t)},set:z,deleteProperty:z,getOwnPropertyDescriptor(e,t){return{configurable:!0,enumerable:!0,get(){return e.get(t)},set:z,deleteProperty:z}},ownKeys(e){return e.keys()}};function re(e){return(e=typeof e=="function"?e():e)?e:{}}function We(){for(let e=0,t=this.length;e<t;++e){const n=this[e]();if(n!==void 0)return n}}function Et(...e){let t=!1;for(let o=0;o<e.length;o++){const l=e[o];t=t||!!l&&le in l,e[o]=typeof l=="function"?(t=!0,L(l)):l}if(t)return new Proxy({get(o){for(let l=e.length-1;l>=0;l--){const u=re(e[l])[o];if(u!==void 0)return u}},has(o){for(let l=e.length-1;l>=0;l--)if(o in re(e[l]))return!0;return!1},keys(){const o=[];for(let l=0;l<e.length;l++)o.push(...Object.keys(re(e[l])));return[...new Set(o)]}},Ge);const n={},s=Object.create(null);for(let o=e.length-1;o>=0;o--){const l=e[o];if(!l)continue;const u=Object.getOwnPropertyNames(l);for(let a=u.length-1;a>=0;a--){const f=u[a];if(f==="__proto__"||f==="constructor")continue;const d=Object.getOwnPropertyDescriptor(l,f);if(!s[f])s[f]=d.get?{enumerable:!0,configurable:!0,get:We.bind(n[f]=[d.get.bind(l)])}:d.value!==void 0?d:void 0;else{const y=n[f];y&&(d.get?y.push(d.get.bind(l)):d.value!==void 0&&y.push(()=>d.value))}}}const i={},r=Object.keys(s);for(let o=r.length-1;o>=0;o--){const l=r[o],u=s[l];u&&u.get?Object.defineProperty(i,l,u):i[l]=u?u.value:void 0}return i}function Ct(e){let t,n;const s=i=>{const r=g.context;if(r){const[l,u]=v();g.count||(g.count=0),g.count++,(n||(n=e())).then(a=>{M(r),g.count--,u(()=>a.default),M()}),t=l}else if(!t){const[l]=Ie(()=>(n||(n=e())).then(u=>u.default));t=l}let o;return L(()=>(o=t())&&$(()=>{if(!r)return o(i);const l=g.context;M(r);const u=o(i);return M(l),u}))};return s.preload=()=>n||((n=e()).then(i=>t=()=>i.default),n),s}let Ye=0;function Ot(){const e=g.context;return e?`${e.id}${e.count++}`:`cl-${Ye++}`}const Qe=e=>`Stale read from <${e}>.`;function kt(e){const t="fallback"in e&&{fallback:()=>e.fallback};return L(He(()=>e.each,e.children,t||void 0))}function $t(e){const t=e.keyed,n=L(()=>e.when,void 0,{equals:(s,i)=>t?s===i:!s==!i});return L(()=>{const s=n();if(s){const i=e.children;return typeof i=="function"&&i.length>0?$(()=>i(t?s:()=>{if(!$(n))throw Qe("Show");return e.when})):i}return e.fallback},void 0,void 0)}let q;function Tt(){q&&[...q].forEach(e=>e())}function Nt(e){let t;g.context&&g.load&&(t=g.load(g.context.id+g.context.count));const[n,s]=v(t,void 0);return q||(q=new Set),q.add(s),ce(()=>q.delete(s)),L(()=>{let i;if(i=n()){const r=e.fallback;return typeof r=="function"&&r.length?$(()=>r(i,()=>s())):r}return Me(()=>e.children,s)},void 0,void 0)}const ze=Ce();function Pt(e){let t=0,n,s,i,r,o;const[l,u]=v(!1),a=De(),f={increment:()=>{++t===1&&u(!0)},decrement:()=>{--t===0&&u(!1)},inFallback:l,effects:[],resolved:!1},d=Fe();if(g.context&&g.load){const x=g.context.id+g.context.count;let O=g.load(x);if(O&&(typeof O!="object"||O.status!=="success"?i=O:g.gather(x)),i&&i!=="$$f"){const[T,N]=v(void 0,{equals:!1});r=T,i.then(()=>{if(g.done)return N();g.gather(x),M(s),N(),M()},E=>{o=E,N()})}}const y=ae(ze);y&&(n=y.register(f.inFallback));let p;return ce(()=>p&&p()),Xe(a.Provider,{value:f,get children(){return L(()=>{if(o)throw o;if(s=g.context,r)return r(),r=void 0;s&&i==="$$f"&&M();const x=L(()=>e.children);return L(O=>{const T=f.inFallback(),{showContent:N=!0,showFallback:E=!0}=n?n():{};if((!T||i&&i!=="$$f")&&N)return f.resolved=!0,p&&p(),p=s=i=void 0,Be(f.effects),x();if(E)return p?O:X(k=>(p=k,s&&(M({id:s.id+"f",count:0}),s=void 0),e.fallback),d)})})}})}const Je=["allowfullscreen","async","autofocus","autoplay","checked","controls","default","disabled","formnovalidate","hidden","indeterminate","inert","ismap","loop","multiple","muted","nomodule","novalidate","open","playsinline","readonly","required","reversed","seamless","selected"],Ze=new Set(["className","value","readOnly","formNoValidate","isMap","noModule","playsInline",...Je]),et=new Set(["innerHTML","textContent","innerText","children"]),tt=Object.assign(Object.create(null),{className:"class",htmlFor:"for"}),nt=Object.assign(Object.create(null),{class:"className",formnovalidate:{$:"formNoValidate",BUTTON:1,INPUT:1},ismap:{$:"isMap",IMG:1},nomodule:{$:"noModule",SCRIPT:1},playsinline:{$:"playsInline",VIDEO:1},readonly:{$:"readOnly",INPUT:1,TEXTAREA:1}});function st(e,t){const n=nt[e];return typeof n=="object"?n[t]?n.$:void 0:n}const it=new Set(["beforeinput","click","dblclick","contextmenu","focusin","focusout","input","keydown","keyup","mousedown","mousemove","mouseout","mouseover","mouseup","pointerdown","pointermove","pointerout","pointerover","pointerup","touchend","touchmove","touchstart"]),rt={xlink:"http://www.w3.org/1999/xlink",xml:"http://www.w3.org/XML/1998/namespace"};function lt(e,t,n){let s=n.length,i=t.length,r=s,o=0,l=0,u=t[i-1].nextSibling,a=null;for(;o<i||l<r;){if(t[o]===n[l]){o++,l++;continue}for(;t[i-1]===n[r-1];)i--,r--;if(i===o){const f=r<s?l?n[l-1].nextSibling:n[r-l]:u;for(;l<r;)e.insertBefore(n[l++],f)}else if(r===l)for(;o<i;)(!a||!a.has(t[o]))&&t[o].remove(),o++;else if(t[o]===n[r-1]&&n[l]===t[i-1]){const f=t[--i].nextSibling;e.insertBefore(n[l++],t[o++].nextSibling),e.insertBefore(n[--r],f),t[i]=n[r]}else{if(!a){a=new Map;let d=l;for(;d<r;)a.set(n[d],d++)}const f=a.get(t[o]);if(f!=null)if(l<f&&f<r){let d=o,y=1,p;for(;++d<i&&d<r&&!((p=a.get(t[d]))==null||p!==f+y);)y++;if(y>f-l){const x=t[o];for(;l<f;)e.insertBefore(n[l++],x)}else e.replaceChild(n[l++],t[o++])}else o++;else t[o++].remove()}}}const me="_$DX_DELEGATE";function Lt(e,t,n,s={}){let i;return X(r=>{i=r,t===document?e():gt(t,e(),t.firstChild?null:void 0,n)},s.owner),()=>{i(),t.textContent=""}}function jt(e,t,n){let s;const i=()=>{const o=document.createElement("template");return o.innerHTML=e,o.content.firstChild},r=()=>(s||(s=i())).cloneNode(!0);return r.cloneNode=r,r}function ot(e,t=window.document){const n=t[me]||(t[me]=new Set);for(let s=0,i=e.length;s<i;s++){const r=e[s];n.has(r)||(n.add(r),t.addEventListener(r,pt))}}function fe(e,t,n){g.context&&e.isConnected||(n==null?e.removeAttribute(t):e.setAttribute(t,n))}function ft(e,t,n,s){g.context&&e.isConnected||(s==null?e.removeAttributeNS(t,n):e.setAttributeNS(t,n,s))}function ut(e,t){g.context&&e.isConnected||(t==null?e.removeAttribute("class"):e.className=t)}function ct(e,t,n,s){if(s)Array.isArray(n)?(e[`$$${t}`]=n[0],e[`$$${t}Data`]=n[1]):e[`$$${t}`]=n;else if(Array.isArray(n)){const i=n[0];e.addEventListener(t,n[0]=r=>i.call(e,n[1],r))}else e.addEventListener(t,n)}function at(e,t,n={}){const s=Object.keys(t||{}),i=Object.keys(n);let r,o;for(r=0,o=i.length;r<o;r++){const l=i[r];!l||l==="undefined"||t[l]||(be(e,l,!1),delete n[l])}for(r=0,o=s.length;r<o;r++){const l=s[r],u=!!t[l];!l||l==="undefined"||n[l]===u||!u||(be(e,l,!0),n[l]=u)}return n}function dt(e,t,n){if(!t)return n?fe(e,"style"):t;const s=e.style;if(typeof t=="string")return s.cssText=t;typeof n=="string"&&(s.cssText=n=void 0),n||(n={}),t||(t={});let i,r;for(r in n)t[r]==null&&s.removeProperty(r),delete n[r];for(r in t)i=t[r],i!==n[r]&&(s.setProperty(r,i),n[r]=i);return n}function Vt(e,t={},n,s){const i={};return s||U(()=>i.children=W(e,t.children,i.children)),U(()=>typeof t.ref=="function"?ht(t.ref,e):t.ref=e),U(()=>yt(e,t,n,!0,i,!0)),i}function ht(e,t,n){return $(()=>e(t,n))}function gt(e,t,n,s){if(n!==void 0&&!s&&(s=[]),typeof t!="function")return W(e,t,s,n);U(i=>W(e,t(),i,n),s)}function yt(e,t,n,s,i={},r=!1){t||(t={});for(const o in i)if(!(o in t)){if(o==="children")continue;i[o]=Se(e,o,null,i[o],n,r)}for(const o in t){if(o==="children")continue;const l=t[o];i[o]=Se(e,o,l,i[o],n,r)}}function wt(e){return e.toLowerCase().replace(/-([a-z])/g,(t,n)=>n.toUpperCase())}function be(e,t,n){const s=t.trim().split(/\s+/);for(let i=0,r=s.length;i<r;i++)e.classList.toggle(s[i],n)}function Se(e,t,n,s,i,r){let o,l,u,a,f;if(t==="style")return dt(e,n,s);if(t==="classList")return at(e,n,s);if(n===s)return s;if(t==="ref")r||n(e);else if(t.slice(0,3)==="on:"){const d=t.slice(3);s&&e.removeEventListener(d,s),n&&e.addEventListener(d,n)}else if(t.slice(0,10)==="oncapture:"){const d=t.slice(10);s&&e.removeEventListener(d,s,!0),n&&e.addEventListener(d,n,!0)}else if(t.slice(0,2)==="on"){const d=t.slice(2).toLowerCase(),y=it.has(d);if(!y&&s){const p=Array.isArray(s)?s[0]:s;e.removeEventListener(d,p)}(y||n)&&(ct(e,d,n,y),y&&ot([d]))}else if(t.slice(0,5)==="attr:")fe(e,t.slice(5),n);else if((f=t.slice(0,5)==="prop:")||(u=et.has(t))||!i&&((a=st(t,e.tagName))||(l=Ze.has(t)))||(o=e.nodeName.includes("-"))){if(f)t=t.slice(5),l=!0;else if(g.context&&e.isConnected)return n;t==="class"||t==="className"?ut(e,n):o&&!l&&!u?e[wt(t)]=n:e[a||t]=n}else{const d=i&&t.indexOf(":")>-1&&rt[t.split(":")[0]];d?ft(e,d,t,n):fe(e,tt[t]||t,n)}return n}function pt(e){const t=`$$${e.type}`;let n=e.composedPath&&e.composedPath()[0]||e.target;for(e.target!==n&&Object.defineProperty(e,"target",{configurable:!0,value:n}),Object.defineProperty(e,"currentTarget",{configurable:!0,get(){return n||document}}),g.registry&&!g.done&&(g.done=_$HY.done=!0);n;){const s=n[t];if(s&&!n.disabled){const i=n[`${t}Data`];if(i!==void 0?s.call(n,i,e):s.call(n,e),e.cancelBubble)return}n=n._$host||n.parentNode||n.host}}function W(e,t,n,s,i){const r=!!g.context&&e.isConnected;if(r){!n&&(n=[...e.childNodes]);let u=[];for(let a=0;a<n.length;a++){const f=n[a];f.nodeType===8&&f.data.slice(0,2)==="!$"?f.remove():u.push(f)}n=u}for(;typeof n=="function";)n=n();if(t===n)return n;const o=typeof t,l=s!==void 0;if(e=l&&n[0]&&n[0].parentNode||e,o==="string"||o==="number"){if(r)return n;if(o==="number"&&(t=t.toString()),l){let u=n[0];u&&u.nodeType===3?u.data!==t&&(u.data=t):u=document.createTextNode(t),n=_(e,n,s,u)}else n!==""&&typeof n=="string"?n=e.firstChild.data=t:n=e.textContent=t}else if(t==null||o==="boolean"){if(r)return n;n=_(e,n,s)}else{if(o==="function")return U(()=>{let u=t();for(;typeof u=="function";)u=u();n=W(e,u,n,s)}),()=>n;if(Array.isArray(t)){const u=[],a=n&&Array.isArray(n);if(ue(u,t,n,i))return U(()=>n=W(e,u,n,s,!0)),()=>n;if(r){if(!u.length)return n;if(s===void 0)return[...e.childNodes];let f=u[0],d=[f];for(;(f=f.nextSibling)!==s;)d.push(f);return n=d}if(u.length===0){if(n=_(e,n,s),l)return n}else a?n.length===0?xe(e,u,s):lt(e,n,u):(n&&_(e),xe(e,u));n=u}else if(t.nodeType){if(r&&t.parentNode)return n=l?[t]:t;if(Array.isArray(n)){if(l)return n=_(e,n,s,t);_(e,n,null,t)}else n==null||n===""||!e.firstChild?e.appendChild(t):e.replaceChild(t,e.firstChild);n=t}}return n}function ue(e,t,n,s){let i=!1;for(let r=0,o=t.length;r<o;r++){let l=t[r],u=n&&n[e.length],a;if(!(l==null||l===!0||l===!1))if((a=typeof l)=="object"&&l.nodeType)e.push(l);else if(Array.isArray(l))i=ue(e,l,u)||i;else if(a==="function")if(s){for(;typeof l=="function";)l=l();i=ue(e,Array.isArray(l)?l:[l],Array.isArray(u)?u:[u])||i}else e.push(l),i=!0;else{const f=String(l);u&&u.nodeType===3&&u.data===f?e.push(u):e.push(document.createTextNode(f))}}return i}function xe(e,t,n=null){for(let s=0,i=t.length;s<i;s++)e.insertBefore(t[s],n)}function _(e,t,n,s){if(n===void 0)return e.textContent="";const i=s||document.createTextNode("");if(t.length){let r=!1;for(let o=t.length-1;o>=0;o--){const l=t[o];if(i!==l){const u=l.parentNode===e;!r&&!o?u?e.replaceChild(i,l):e.insertBefore(i,n):u&&l.remove()}else r=!0}}else e.insertBefore(i,n);return[i]}const vt=()=>{},It=!1;export{Ct as A,Pt as B,Ot as C,g as D,Nt as E,kt as F,$t as S,v as a,mt as b,Xe as c,ot as d,L as e,ut as f,U as g,St as h,gt as i,Fe as j,Ce as k,$ as l,Tt as m,ae as n,bt as o,It as p,Ue as q,Lt as r,xt as s,jt as t,ht as u,vt as v,X as w,ce as x,Vt as y,Et as z};