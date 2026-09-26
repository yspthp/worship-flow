// Compiled from the same MusicXML that OSMD displays, including its exact
// measure boundaries, three instrumental parts and rehearsal markers.
const scoreDataRequests = new Map();
async function loadScoreData(selectedSong) {
  if (!selectedSong.scoreDataPath) return null;
  if (!scoreDataRequests.has(selectedSong.scoreDataPath)) {
    const request = fetch(selectedSong.scoreDataPath).then(response => {
      if (!response.ok) throw new Error('播放資料載入失敗：' + response.status);
      return response.json();
    }).then(data => {
      if (!data.measures?.length || !data.events?.length || data.eventCounts?.length !== 3) {
        throw new Error('樂譜播放資料不完整');
      }
      return data;
    }).catch(error => {
      scoreDataRequests.delete(selectedSong.scoreDataPath);
      throw error;
    });
    scoreDataRequests.set(selectedSong.scoreDataPath, request);
  }
  const data = await scoreDataRequests.get(selectedSong.scoreDataPath);
  Object.assign(selectedSong, {scoreData: data, sections: data.sections,
    measureCount: data.measureCount, bpm: data.bpm, key: data.key, programs: data.programs});
  return data;
}
function applyScoreData(data) {
  // Playback may edit events, so never share its mutable arrays with the cache.
  events = data.events.map(event => ({...event}));
  lyrics = data.lyrics.map(line => ({...line}));
  songSeconds = data.songSeconds;
  eventCounts = [...data.eventCounts];
  measureInfo = data.measureInfo;
  const total = document.querySelector('.timeline > span:last-child');
  if (total) total.textContent = `${Math.floor(songSeconds/60)}:${String(Math.floor(songSeconds%60)).padStart(2,'0')}`;
}
function currentMeasureNumber() {
  const measures = song.scoreData?.measures;
  if (measures) {
    // Compare actual measure starts rather than dividing equally among sections.
    for (let i = measures.length - 1; i >= 0; i--) {
      if (positionSec + 1e-8 >= measures[i].sec) return measures[i].number;
    }
    return measures[0].number;
  }
  const count = song.measureCount || song.sections[song.sections.length-1][2];
  return Math.min(count, Math.max(1, Math.floor((songSeconds > 0 ? positionSec/songSeconds : 0)*count)+1));
}
function renderScoreDataArrangement(measure) {
  const info = measureInfo[measure] || {};
  const section = song.sections[currentSection] || song.sections[0];
  const cards = [['♬','鋼琴',info.piano], ['◉','弦樂 Pad',info.organ], ['♩','爵士鼓',info.drums]];
  $('#live-position').textContent = section[0];
  $('#live-measure').textContent = `小節 ${measure}`;
  $('#leader-cue').hidden = false;
  $('#leader-cue').textContent = info.leader || '司樂建議：按譜面提示入點與收音。';
  $('#playback-notes').hidden = false;
  $('#playback-notes').textContent = song.scoreData.playbackNotes;
  $('#arrangement-cards').innerHTML = cards.map((c,i) => `<article class="arrangement-card ${trackEnabled[i]?'active':''}"><h3>${c[0]} ${c[1]}</h3><p>${esc(c[2] || '按新版譜面演奏。')}</p></article>`).join('');
}
