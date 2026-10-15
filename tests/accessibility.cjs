const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const {makeGame}=require('./gameplay.cjs');
const tests=[];function test(name,fn){fn();tests.push(name);}
test('Preferences reject duplicate, reserved and malformed bindings',()=>{
  const g=makeGame();for(const keys of [{left:'KeyA',right:'KeyA',regen:'KeyR'},{left:'Escape',right:'KeyD',regen:'KeyR'},{left:'KeyM',right:'KeyD',regen:'KeyR'},{left:'KeyAA',right:'KeyD',regen:'KeyR'}]){
    assert.equal(g.run('AccessibilityPreferences.validate('+JSON.stringify({keys})+').keys.left'),'KeyA');
    assert.equal(g.run('AccessibilityPreferences.validate('+JSON.stringify({keys})+').keys.right'),'KeyD');
  }
  assert.equal(g.run('AccessibilityPreferences.validate({effects:"bad",reading:"yes"}).effects'),'system');
  assert.equal(g.run('AccessibilityPreferences.validate({reading:"yes"}).reading'),false);
});
test('Remapped movement and regeneration preserve arrows and original times',()=>{
  const g=makeGame();g.run('accessPreferences.keys={left:"KeyJ",right:"KeyL",regen:"KeyK"}');
  g.press('KeyA');assert.equal(g.run('currentLane'),4);g.press('KeyJ');assert.equal(g.run('currentLane'),3);g.release('KeyJ');
  g.run('shipPilot.reset(4);currentLane=4');g.press('ArrowRight');assert.equal(g.run('currentLane'),5);g.release('ArrowRight');
  g.press('KeyR');assert.equal(g.run('isRegen'),false);g.press('KeyK');assert.equal(g.run('isRegen'),true);assert.equal(g.run('regenEnd-gameTime'),2000);assert.equal(g.run('keyReadyAt-gameTime'),10000);
  g.run('accessPreferences.keys.left="KeyR";isRegen=false;isCompromised=true;compEnd=4000;renderChannelWarning()');
  assert.match(g.elements.get('warning').innerHTML,/←\/R = direita/);
  assert.match(g.elements.get('warning').innerHTML,/K 10.0s/);
});
test('Settings and native inputs cannot send gameplay commands',()=>{
  const g=makeGame();g.run('settingsOpen=true');g.press('ArrowLeft');g.press('KeyR');g.press('Escape');assert.equal(g.run('currentLane'),4);assert.equal(g.run('isRegen'),false);assert.equal(g.run('isPaused'),false);
  g.run('settingsOpen=false');g.press('KeyR',{closest:()=>true});assert.equal(g.run('isRegen'),false);
  g.dispatch('keydown',{code:'KeyR',ctrlKey:true});assert.equal(g.run('isRegen'),false);
});
test('Reduced effects follow OS by default and accept explicit override',()=>{
  const g=makeGame();g.sandbox.matchMedia=()=>({matches:true});assert.equal(g.run('reducedEffects()'),true);
  g.run('accessPreferences.effects="full"');assert.equal(g.run('reducedEffects()'),false);
  g.run('accessPreferences.effects="reduced"');g.sandbox.matchMedia=()=>({matches:false});assert.equal(g.run('reducedEffects()'),true);
});
test('Preferences survive reload separately from campaign and blocked storage falls back',()=>{
  const data=JSON.stringify({reading:true,effects:'reduced',keys:{left:'KeyJ',right:'KeyL',regen:'KeyK'}});
  const g=makeGame(1100,800,{storage:{getItem:key=>key==='qubit-accessibility-v1'?data:null,setItem(){}}});
  assert.equal(g.run('keyLabel("regen")'),'K');assert.equal(g.run('accessPreferences.reading'),true);
  const blocked=makeGame(1100,800,{storage:{getItem(){throw Error('blocked');},setItem(){throw Error('blocked');}}});assert.equal(blocked.run('keyLabel("regen")'),'R');
});
test('Reduced effects do not change channel, movement or hazard random state',()=>{
  const a=makeGame(),b=makeGame();for(const g of[a,b])g.run('campaignRandom=new CampaignRandom(519);qber=8');b.run('accessPreferences.effects="reduced";accessPreferences.reading=true');
  for(const g of[a,b]){g.press('ArrowLeft');g.release('ArrowLeft');g.run('update(20);update(40);tryRegen();update(60)');}
  const state=g=>g.run('JSON.stringify({qber,gameTime,currentLane,regenEnd,keyReadyAt,r:campaignRandom.snapshot()})');assert.equal(state(a),state(b));
});
console.log(JSON.stringify({passed:tests.length,tests},null,2));
