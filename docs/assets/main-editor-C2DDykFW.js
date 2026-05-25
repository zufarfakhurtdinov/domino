import{n as e,t}from"./jszip.min-BbYo6akH.js";var n=()=>({kind:`empty`,text:``}),r=()=>[{items:[n(),n()]},{items:[n(),n()]}],i=(e,t)=>e.kind===`image`||e.kind===`audio`?e:t.trim()?{kind:`text`,text:t}:n(),a=(e,t)=>e.kind===`image`||e.kind===`audio`?e:{kind:`image`,file:t},o=(e,t)=>e.kind===`image`||e.kind===`audio`?e:{kind:`audio`,file:t},s=e=>e.kind===`image`||e.kind===`audio`?n():e,c=e=>e.kind===`text`?!!e.text.trim():e.kind===`image`||e.kind===`audio`,l=e=>e.items.every(c),u=e=>e.length>=2&&e.every(l),d=()=>{let e=new Set,t=[];return{allocate(n){let r=m(n.name,e);return e.add(r.toLocaleLowerCase()),t.push({name:r,file:n}),r},files(){return[...t].sort((e,t)=>e.name.localeCompare(t.name))}}},f=e=>{if(e.length<2)throw Error(`Cannot export activity with fewer than at least 2 rows.`);if(!e.every(l))throw Error(`Cannot export activity with invalid rows.`);let t=d();return{activity:{title:`activity`,pairs:e.map((e,n)=>({id:n+1,items:[p(e.items[0],t),p(e.items[1],t)]}))},files:t.files()}},p=(e,t)=>{if(e.kind===`text`)return{type:`text`,value:e.text.trim()};if(e.kind===`image`)return{type:`image`,src:t.allocate(e.file)};if(e.kind===`audio`)return{type:`audio`,src:t.allocate(e.file)};throw Error(`Cannot export empty content.`)},m=(e,t)=>{if(!t.has(e.toLocaleLowerCase()))return e;let{base:n,extension:r}=h(e),i=2,a=`${n}-${i}${r}`;for(;t.has(a.toLocaleLowerCase());)i+=1,a=`${n}-${i}${r}`;return a},h=e=>{let t=e.lastIndexOf(`.`);return t<=0?{base:e,extension:``}:{base:e.slice(0,t),extension:e.slice(t)}},g=e(t(),1),_=async e=>{let t=new g.default,n=t.folder(`activity`);if(!n)throw Error(`Could not create activity zip directory.`);n.file(`activity.json`,JSON.stringify(e.activity,null,2));for(let{name:t,file:r}of e.files)n.file(t,await r.arrayBuffer());return t.generateAsync({type:`arraybuffer`})},v=e=>`
  <section class="activity-editor" aria-labelledby="activity-editor-title">
    <header class="activity-editor-header">
      <h1 id="activity-editor-title">Activity editor</h1>
    </header>
    <div class="activity-editor-table" role="table" aria-label="Activity pairs">
      ${e.map(y).join(``)}
    </div>
    <div class="activity-editor-bottom-actions">
      <div></div>
      <div class="activity-editor-bottom-action-group">
        <button type="button" class="editor-button" data-action="add-row">Add row</button>
        <button type="button" class="editor-button editor-button-primary" data-action="export"${u(e)?``:` disabled`}>Export</button>
      </div>
      <div></div>
      <div></div>
    </div>
  </section>
`,y=(e,t)=>`
  <div class="activity-editor-row" role="row" data-row-index="${t}" data-invalid="${!l(e)}">
    <div class="activity-editor-row-number" role="cell">${t+1}</div>
    ${b(e.items[0],t,0)}
    ${b(e.items[1],t,1)}
    <div class="activity-editor-row-actions" role="cell">
      <button type="button" class="editor-icon-button" data-action="delete-row" data-row-index="${t}" title="Delete row">x</button>
    </div>
  </div>
`,b=(e,t,n)=>{let r=!c(e),i=e.kind===`image`||e.kind===`audio`?e.kind:null,a=e.kind===`text`?e.text:e.kind===`image`||e.kind===`audio`?e.file.name:``,o=i?` disabled`:``;return`
    <div class="activity-editor-cell" role="cell" data-row-index="${t}" data-item-index="${n}" data-invalid="${r}"${i?` data-active="${i}"`:``}>
      <div class="activity-editor-cell-main">
        <input class="activity-editor-input" data-action="text" data-row-index="${t}" data-item-index="${n}" value="${C(a)}"${o} placeholder="Text" />
        ${i?`<button type="button" class="editor-icon-button" data-action="discard-media" data-row-index="${t}" data-item-index="${n}" title="Discard media">x</button>`:``}
        ${x(`image`,i,t,n)}
        ${x(`audio`,i,t,n)}
      </div>
      ${S(e)}
    </div>
  `},x=(e,t,n,r)=>{let i=t===e,a=t&&!i?` disabled`:``;return`<button type="button" class="editor-icon-button" data-action="upload-${e}" data-row-index="${n}" data-item-index="${r}"${i?` data-active="${e}"`:``}${a} title="Upload ${e}">${e===`image`?`image`:`audio`}</button>`},S=e=>e.kind===`image`?`<img class="activity-editor-preview" alt="" src="${C(URL.createObjectURL(e.file))}" />`:e.kind===`audio`?`<audio class="activity-editor-preview" controls src="${C(URL.createObjectURL(e.file))}"></audio>`:``,C=e=>e.replaceAll(`&`,`&amp;`).replaceAll(`"`,`&quot;`).replaceAll(`<`,`&lt;`).replaceAll(`>`,`&gt;`),w=e=>{new T(e).mount()},T=class{root;pairs=r();constructor(e){this.root=e}mount(){this.root.addEventListener(`click`,e=>{this.handleClick(e)}),this.root.addEventListener(`input`,e=>{this.handleInput(e)}),this.render()}render(){this.root.innerHTML=v(this.pairs)}handleInput(e){let t=e.target;if(!(t instanceof HTMLInputElement)||t.dataset.action!==`text`)return;let n=E(t);n&&(this.updateContent(n,e=>i(e,t.value)),this.refreshValidity())}async handleClick(e){let t=e.target?.closest(`button`);if(!(t instanceof HTMLButtonElement)||t.disabled)return;let r=t.dataset.action;if(r===`add-row`){this.pairs=[...this.pairs,{items:[n(),n()]}],this.render();return}if(r===`delete-row`){let e=Number(t.dataset.rowIndex);this.pairs=this.pairs.length>1?this.pairs.filter((t,n)=>n!==e):this.pairs,this.render();return}if(r===`discard-media`){let e=E(t);e&&(this.updateContent(e,s),this.render());return}if(r===`upload-image`||r===`upload-audio`){let e=E(t);if(e){let t=await D(r===`upload-image`?`image/*`:`audio/*`);t&&(this.updateContent(e,e=>r===`upload-image`?a(e,t):o(e,t)),this.render())}return}r===`export`&&u(this.pairs)&&await O(this.pairs)}updateContent(e,t){this.pairs=this.pairs.map((n,r)=>{if(r!==e.rowIndex)return n;let i=[...n.items];return i[e.itemIndex]=t(i[e.itemIndex]),{items:i}})}refreshValidity(){let e=this.root.querySelector(`[data-action="export"]`);e&&(e.disabled=!u(this.pairs));for(let[e,t]of this.pairs.entries())this.root.querySelector(`[data-row-index="${e}"].activity-editor-row`)?.setAttribute(`data-invalid`,String(!l(t))),t.items.forEach((t,n)=>{this.root.querySelector(`.activity-editor-cell[data-row-index="${e}"][data-item-index="${n}"]`)?.setAttribute(`data-invalid`,String(!c(t)))})}},E=e=>{let t=Number(e.dataset.rowIndex),n=Number(e.dataset.itemIndex);return!Number.isInteger(t)||n!==0&&n!==1?null:{rowIndex:t,itemIndex:n}},D=e=>new Promise(t=>{let n=document.createElement(`input`);n.type=`file`,n.accept=e,n.addEventListener(`change`,()=>{t(n.files?.[0]??null)},{once:!0}),n.click()}),O=async e=>{let t=await _(f(e)),n=new Blob([t],{type:`application/zip`}),r=URL.createObjectURL(n),i=document.createElement(`a`);i.href=r,i.download=`activity.zip`,document.body.append(i),i.click(),i.remove(),URL.revokeObjectURL(r)},k=document.getElementById(`app`);if(!k)throw Error(`Missing #app root.`);k.setAttribute(`aria-label`,`Activity editor`),w(k);