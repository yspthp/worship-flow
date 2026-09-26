const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const elements = new Map();
let songButtons = [];
const document = {
  querySelector(selector) {
    if (!elements.has(selector)) elements.set(selector, {});
    return elements.get(selector);
  },
  querySelectorAll(selector) {
    if (selector !== '.set-item') return [];
    songButtons = [...elements.get('#setlist').innerHTML.matchAll(/data-song="([^"]+)"/g)]
      .map((match) => ({ dataset: { song: match[1] } }));
    return songButtons;
  }
};
const root = path.resolve(__dirname, '..');
const fetch = async (url) => ({ok: true, json: async () => JSON.parse(fs.readFileSync(path.join(root, url), 'utf8'))});
const context = vm.createContext({ document, window: {}, console, setInterval, clearInterval, performance, fetch });
vm.runInContext(fs.readFileSync(path.join(root, 'score-data.js'), 'utf8'), context);
vm.runInContext(fs.readFileSync(path.join(root, 'app.js'), 'utf8'), context);

(async () => {
  await Promise.resolve();
  // Isolate title updates from audio timing and third-party score rendering.
  vm.runInContext('syncUi = () => {}; renderScore = async () => {};', context);
  const songs = vm.runInContext('songs.map(({id, title}) => ({id, title}))', context);
  assert.equal(songs.length, 3);
  const assertTitles = (title) => {
    for (const selector of ['#song-title', '#player-title', '#paper-song-title']) {
      assert.equal(document.querySelector(selector).textContent, title, selector);
    }
  };
  assertTitles(songs[0].title);
  for (const song of [...songs.slice(1), songs[0], songs[2], songs[1]]) {
    await songButtons.find((button) => button.dataset.song === song.id).onclick();
    assertTitles(song.title);
    if (song.id !== 'building-call') {
      assert.equal(document.querySelector('#leader-cue').hidden, true);
      assert.equal(document.querySelector('#playback-notes').hidden, true);
    }
  }
  // Titles must use textContent, so markup in a song name stays literal text.
  vm.runInContext("song = {...song, title: '<b>測試 & 樂譜</b>'};", context);
  await vm.runInContext('renderAll()', context);
  assertTitles('<b>測試 & 樂譜</b>');
  console.log('PASS: startup and repeated switching keep all three titles synchronized.');
})().catch((error) => { console.error(error); process.exitCode = 1; });
