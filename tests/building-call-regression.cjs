const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const vm = require('node:vm');
const root = path.resolve(__dirname, '..');
const scorePath = 'public/scores/building-call-66bpm-20260926.musicxml';
const xml = fs.readFileSync(path.join(root, scorePath), 'utf8');
const data = JSON.parse(fs.readFileSync(path.join(root, scorePath.replace('.musicxml', '.json')), 'utf8'));
const elements = new Map();
let buttons = [];
const errors = [];
const document = {
  querySelector(selector) {
    if (!elements.has(selector)) elements.set(selector, {});
    return elements.get(selector);
  },
  querySelectorAll(selector) {
    if (selector !== '.section-btn') return [];
    buttons = [...document.querySelector('#section-buttons').innerHTML.matchAll(/data-i="(\d+)"/g)]
      .map(match => ({dataset: {i: match[1]}}));
    return buttons;
  }
};
let fetchCount = 0;
let clockMs = 1000;
const context = vm.createContext({document, window: {}, console: {...console, error: e => errors.push(e)},
  performance: {now: () => clockMs}, setInterval, clearInterval, fetch: async url => {
    fetchCount++;
    return {ok: true, text: async () => fs.readFileSync(path.join(root, url), 'utf8'),
      json: async () => JSON.parse(fs.readFileSync(path.join(root, url), 'utf8'))};
  }});
vm.runInContext(fs.readFileSync(path.join(root, 'score-data.js'), 'utf8'), context);
vm.runInContext(fs.readFileSync(path.join(root, 'app.js'), 'utf8').replace(/renderAll\(\);\s*$/, ''), context);
const run = source => vm.runInContext(source, context);

(async () => {
  assert.equal(data.sourceSha256, crypto.createHash('sha256').update(xml).digest('hex'));
  assert.deepEqual(data.eventCounts, [1656, 546, 1632]);
  assert.equal(data.events.length, (xml.match(/<note>/g) || []).length - (xml.match(/<rest\b/g) || []).length);
  assert.equal(data.measureCount, 141);
  assert.equal(data.bpm, 66);
  assert.deepEqual(data.programs, [0, 50, 0]);
  assert.deepEqual([...new Set(data.events.filter(e => e.part === 2).map(e => e.midi))].sort((a,b) => a-b), [36,37,38,42,51]);
  assert.ok(Math.abs(data.songSeconds - 141*4*60/66) < 1e-8);
  for (const e of data.events) {
    const m = data.measures[e.measure-1];
    assert.ok(e.sec >= m.sec - 1e-8 && e.sec + e.length <= m.endSec + 1e-8);
  }
  run("song=songs.find(s=>s.id==='building-call');");
  assert.equal(run('song.arrangement'), undefined);
  assert.equal(run('song.melodyReferenceB64'), undefined);
  await run('renderAll()');
  assert.equal(errors.length, 0);
  assert.equal(document.querySelector('#paper-song-title').textContent, '建殿者的呼聲');
  assert.equal(document.querySelector('#score-key').textContent, 'Key: G');
  assert.ok(document.querySelector('#paper-song-desc').textContent.includes('141 小節'));
  const vision=document.querySelector('#vision-text').innerHTML;
  assert.ok(vision.includes('安靜聆聽') && vision.includes('同心委身'));
  assert.ok(!/新版|MusicXML|BPM|141|66/.test(vision));
  for (const file of ['index.html','app.js','score-data.js']) {
    assert.ok(!/leader-cue|playback-notes/.test(fs.readFileSync(path.join(root,file),'utf8')),file);
  }
  assert.equal(document.querySelector('.timeline > span:last-child').textContent, '8:32');
  await run('parseMusic();');
  assert.equal(run('events.length'), data.events.length);
  assert.equal(fetchCount, 1, 'cache compiled data without repeatedly fetching');
  assert.equal(await run('activeXmlText()'), xml, 'OSMD receives the unmodified supplied score, including markers');
  for (const measure of data.measures) {
    run(`positionSec=${measure.sec};syncUi();`);
    assert.equal(run('currentMeasureNumber()'), measure.number);
    const section = data.sections.find(s => measure.number >= s[1] && measure.number <= s[2]);
    assert.equal(document.querySelector('#player-section').textContent, section[0]);
    assert.equal(document.querySelector('#live-measure').textContent, `小節 ${measure.number}`);
    assert.ok(document.querySelector('#arrangement-cards').innerHTML.includes(data.measureInfo[measure.number].drums));
    for (const part of ['piano', 'organ']) {
      assert.ok(document.querySelector('#arrangement-cards').innerHTML.includes(data.measureInfo[measure.number][part]));
    }
    assert.ok(Number.isFinite(document.querySelector('#progress').value));
  }
  for (let i=0; i<data.sections.length; i++) {
    buttons[i].onclick({shiftKey: false});
    assert.equal(run('positionSec'), data.measures[data.sections[i][1]-1].sec);
  }
  run('positionSec=songSeconds;syncUi();');
  assert.equal(run('currentMeasureNumber()'), 141);
  assert.equal(data.measureInfo['141'].drums, '本小節休息。');
  run('songSeconds=0;positionSec=0;syncUi();');
  assert.equal(document.querySelector('#progress').value, 0);
  await run('parseMusic()');
  context.messages = [];
  run(`audioCtx={resume:async()=>{}};loadSoundfont=async()=>{};
    resetSynth=async()=>{sfSynth={currentTime:0,processMessage:(message,port,options)=>messages.push({message,options})}};
    positionSec=0;`);
  await run('playAudio()');
  const noteOns = context.messages.filter(m => (m.message[0] & 0xf0) === 0x90);
  const noteOffs = context.messages.filter(m => (m.message[0] & 0xf0) === 0x80);
  assert.equal(noteOns.length, data.events.length);
  assert.equal(noteOffs.length, data.events.length);
  assert.deepEqual(context.messages.slice(0,3).map(m => [...m.message]), [[0xc0,0],[0xc1,50],[0xc9,0]]);
  assert.deepEqual(context.messages.filter(m=>m.message[1]===7).map(m=>[...m.message]).filter(m=>(m[0]&0xf0)===0xb0),
    [[0xb0,7,127],[0xb1,7,101],[0xb9,7,90]],'only strings channel volume increases');
  data.events.forEach((event,i) => {
    assert.equal(noteOns[i].message[0], 0x90 | (event.part===2?9:event.part));
    assert.equal(noteOns[i].message[1], event.midi);
    assert.equal(noteOns[i].message[2], event.velocity);
    assert.ok(Math.abs(noteOns[i].options.time - (.12+event.sec)) < 1e-8);
    assert.equal(noteOffs[i].message[0], 0x80 | (event.part===2?9:event.part));
    assert.equal(noteOffs[i].message[1], event.midi);
    assert.ok(Math.abs(noteOffs[i].options.time - (.12+event.sec+event.length)) < 1e-8);
  });
  context.messages.length=0;
  run('trackEnabled[1]=false;');
  await run('playAudio()');
  assert.ok(!context.messages.some(m => m.message[0] === 0x91), 'strings mute affects only its own channel');
  run('trackEnabled[1]=true;');
  context.messages.length=0;
  document.querySelector('#bpm').value=99;
  await run('playAudio()');
  const changedTempoNotes=context.messages.filter(m => (m.message[0] & 0xf0) === 0x90);
  const later=data.events.findIndex(e=>e.sec>0);
  assert.ok(Math.abs(changedTempoNotes[later].options.time-(.12+data.events[later].sec/1.5))<1e-8);
  // Seek inside sustained notes, including a section with active percussion.
  for (const offset of [1, data.measures[24].sec + .2, data.songSeconds]) {
    context.messages.length=0;
    run(`positionSec=${offset};`);
    await run('playAudio()');
    const expected=data.events.filter(e=>e.sec>=offset||(e.part!==2&&e.sec+e.length>offset));
    const ons=context.messages.filter(m=>(m.message[0]&0xf0)===0x90);
    const offs=context.messages.filter(m=>(m.message[0]&0xf0)===0x80);
    assert.equal(ons.length,expected.length);
    assert.equal(offs.length,expected.length);
    expected.forEach((e,i)=>{
      assert.equal(ons[i].message[1],e.midi);
      assert.equal(ons[i].message[0],0x90|(e.part===2?9:e.part));
      assert.ok(Math.abs(ons[i].options.time-(.12+Math.max(0,e.sec-offset)/1.5))<1e-8);
      assert.ok(Math.abs(offs[i].options.time-(.12+(e.sec+e.length-offset)/1.5))<1e-8);
      assert.ok(offs[i].options.time>ons[i].options.time);
    });
  }
  for (let muted=0; muted<3; muted++) {
    context.messages.length=0;
    run(`positionSec=0;trackEnabled.fill(true);trackEnabled[${muted}]=false;`);
    await run('playAudio()');
    const ons=context.messages.filter(m=>(m.message[0]&0xf0)===0x90);
    assert.equal(ons.length,data.events.length-data.eventCounts[muted]);
    assert.ok(!ons.some(m=>(m.message[0]&0xf)===(muted===2?9:muted)));
  }
  run('trackEnabled.fill(true);positionSec=10;playing=true;playStartedAt=performance.now();');
  clockMs+=200;
  await document.querySelector('#play').onclick();
  assert.ok(Math.abs(run('positionSec')-10.3)<1e-8,'pause must use the current 1.5x playback rate');
  assert.equal(run('playing'),false);
  document.querySelector('#stop').onclick();
  assert.equal(run('positionSec'),0);
  assert.equal(document.querySelector('#live-measure').textContent,'小節 1');
  assert.equal(errors.length,0);
  console.log('PASS: source hash; 3834 note-on/off pairs; 141 measures; 14 sections; guidance; channels; all track mutes; tempo; seek/sustain; pause/stop.');
})().catch(error => {console.error(error);process.exitCode=1;});
