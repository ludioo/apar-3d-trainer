const fs=require('node:fs');const path=require('node:path');
const {chromium}=require('C:/Users/Aryaguna3/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
(async()=>{const b=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});try{
for(const [name,viewport]of [['desktop',{width:1365,height:900}],['mobile',{width:390,height:844}],['landscape',{width:844,height:390}]]){
const context=await b.newContext({viewport,locale:'id-ID'});const p=await context.newPage();await p.goto('http://localhost:4182/#train');await p.waitForFunction(()=>getComputedStyle(document.querySelector('#splash')).opacity==='0');
await p.locator('[data-training="start"]').click();
for(let i=0;i<2;i++){await p.locator('[data-training="skip"]').click();await p.locator('[data-training="next"]').click();}await p.waitForTimeout(850);
const target=p.locator('.training-target__button');await target.focus();await p.keyboard.down('Space');await p.waitForTimeout(200);await p.screenshot({path:path.join(__dirname,`t2.2-preview-${name}.png`)});await p.keyboard.up('Space');
await p.locator('[data-training="skip"]').click();await p.locator('[data-training="next"]').click();await p.waitForTimeout(850);
await p.screenshot({path:path.join(__dirname,`t2.2-preview-${name}-sweep.png`)});
if(name==='desktop'){
const contrast=await p.evaluate(()=>{const s=getComputedStyle(document.documentElement);const rgb=v=>{let h=s.getPropertyValue(v).trim().slice(1);if(h.length===3)h=[...h].map(x=>x+x).join('');return[0,2,4].map(i=>parseInt(h.slice(i,i+2),16)/255);};const l=c=>c.map(x=>x<=.04045?x/12.92:((x+.055)/1.055)**2.4).reduce((s,x,i)=>s+x*[.2126,.7152,.0722][i],0);const ratio=(a,b)=>{const x=l(rgb(a)),y=l(rgb(b));return Number(((Math.max(x,y)+.05)/(Math.min(x,y)+.05)).toFixed(2));};return{text:ratio('--text','--surface-solid'),muted:ratio('--text-muted','--surface-solid'),inkAccent:ratio('--accent-ink','--accent'),focus:ratio('--accent','--surface-solid')};});fs.writeFileSync(path.join(__dirname,'t2.2-contrast.json'),JSON.stringify(contrast,null,2));console.log(contrast);
}
await context.close();console.log('PASS preview',name);
}}finally{await b.close();}})();
