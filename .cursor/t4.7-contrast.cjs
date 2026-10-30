const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const css = fs.readFileSync(path.join(__dirname, '../src/styles/tokens.css'), 'utf8');
const hex = name => css.match(new RegExp(`--${name}:\\s*(#[0-9a-f]+)`, 'i'))[1];
const rgb = value => value.slice(1).match(/../g).map(n => parseInt(n,16));
const luminance = color => color.map(n => n/255).map(n => n <= 0.04045 ? n/12.92 : ((n+0.055)/1.055)**2.4)
  .reduce((sum,n,i) => sum+n*[0.2126,0.7152,0.0722][i],0);
const ratio = (a,b) => { const x=luminance(a),y=luminance(b); return (Math.max(x,y)+0.05)/(Math.min(x,y)+0.05); };
const surface = rgb(hex('surface-solid'));
const composite = surface.map(n => n*0.92+255*0.08);
const results = [];
for (const name of ['text','panel-text-muted','accent','danger','success']) {
  for (const [background,color] of [['solid',surface],['panel over white',composite]]) {
    const value=ratio(rgb(hex(name)),color); assert(value>=4.5);
    results.push({foreground:name,background,ratio:value});
  }
}
results.push({foreground:'accent-ink',background:'accent',ratio:ratio(rgb(hex('accent-ink')),rgb(hex('accent')))});
assert(results.at(-1).ratio>=4.5);
fs.writeFileSync(path.join(__dirname,'t4.7-contrast.json'),JSON.stringify({date:'2026-10-30',results},null,2));
console.log('AA PASS:', results.length, 'pairs; minimum', Math.min(...results.map(r=>r.ratio)).toFixed(2)+':1');
