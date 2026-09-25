// Worship Flow - 3-Song Setlist Integrator (完整支援 01 祢是君王、02 不可能的愛、03 建殿者的呼聲 自由雙向切換)
(function() {
  const B158_CONFIG = {
    id: 'b158',
    title: '建殿者的呼聲 (B158)',
    subtitle: 'Worship Arrangement · Piano / Organ & Strings / Drum Kit',
    category: '宣告與委身 · 莊嚴漸進敬拜',
    key: 'D',
    time: '4/4',
    bpm: 66,
    scorePath: 'public/scores/B158_建殿者的呼聲_完整三軌編曲.musicxml',
    vision: '願恩惠恩惠歸與這殿，在祢安息之處大有榮耀。從安靜預備心出發，以鋼琴輕柔分解與弦樂鋪底帶入正歌。進入副歌時能量全開，強調 Bm -> F#m/A -> G -> D/F# 的優美階梯式下行轉位低音線，全團全開帶領會眾在榮耀中瞻仰神！',
    tracks: [
      { name: 'Piano Accompaniment', icon: '🎹', desc: '鋼琴分解與轉位低音' },
      { name: 'Organ · Strings', icon: '🎻', desc: '高八度長音鋪底' },
      { name: 'Drum Kit', icon: '🥁', desc: '真實鼓組 Groove / Crash 強調' }
    ],
    sections: [
      { id: 'A', name: 'A Intro', m: 1, bars: 4, mood: '安靜、預備心', piano: '高音區輕柔分解', strings: '長音鋪底', drums: '休息' },
      { id: 'B', name: 'B Verse 1', m: 5, bars: 8, mood: '訴說、敬拜', piano: '中音區和弦，左手根音', strings: '微弱鋪底', drums: '輕Hi-hat' },
      { id: 'C', name: 'C Verse 2', m: 13, bars: 8, mood: '情感漸強', piano: '加入八分音符律動', strings: '音量微增', drums: '加入輕Kick' },
      { id: 'D', name: 'D Pre-Chorus 1', m: 21, bars: 8, mood: '推進、渴望', piano: '力度增強', strings: '漸強', drums: 'Snare邊擊' },
      { id: 'E', name: 'E Chorus 1', m: 29, bars: 14, mood: '宣告、榮耀', piano: '飽滿柱式和弦，強調轉位低音', strings: '全音量鋪底', drums: '標準Worship Groove' },
      { id: 'F', name: 'F Interlude', m: 43, bars: 4, mood: '沉澱、回味', piano: '高音區單音旋律', strings: '溫暖Pad', drums: '休息' },
      { id: 'G', name: 'G Verse 3', m: 47, bars: 8, mood: '堅定、敘事', piano: '比V1厚實', strings: '中音量鋪底', drums: '穩定輕Groove' },
      { id: 'H', name: 'H Pre-Chorus 2', m: 55, bars: 8, mood: '更強烈推進', piano: '力度更大', strings: '強烈Crescendo', drums: 'Snare打拍面' },
      { id: 'I', name: 'I Chorus 2', m: 63, bars: 14, mood: '全力敬拜', piano: '飽滿有張力', strings: '全開', drums: '強力Beat，Crash強調' },
      { id: 'J', name: 'J Pre-Chorus 3', m: 77, bars: 8, mood: '突然收斂 (Breakdown)', piano: '僅彈長音或琶音', strings: '柔和Pad', drums: '休息或輕Tom' },
      { id: 'K', name: 'K Pre-Chorus 4', m: 85, bars: 8, mood: '重新堆疊、爆發前張力', piano: '從琶音漸入節奏', strings: '漸強到極強', drums: '大過門' },
      { id: 'L', name: 'L Chorus 3', m: 93, bars: 14, mood: '最高潮、榮耀綻放', piano: '最飽滿，加高音裝飾', strings: '最強音', drums: '最強Groove' },
      { id: 'M', name: 'M Chorus 4', m: 107, bars: 14, mood: '延續高潮', piano: '保持最高能量', strings: '保持最強音', drums: '全力驅動' },
      { id: 'N', name: 'N Coda 1', m: 121, bars: 4, mood: '平安、收斂', piano: '輕柔琶音', strings: '極弱Pad', drums: '休息' },
      { id: 'O', name: 'O Coda 2', m: 125, bars: 13, mood: '寧靜、結束在同在中', piano: '最後D和弦延音', strings: '漸滅', drums: '休息' }
    ]
  };

  let isB158 = false;
  let cachedB158Xml = null;
  let isMutating = false;

  // 確保側邊欄始終存在第 3 首歌按鈕，且與 app.js 產生的前兩首 (01 祢是君王, 02 不可能的愛) 共存
  function ensureB158Button() {
    const setlist = document.getElementById('setlist');
    if (!setlist) return;

    let b158Btn = document.getElementById('set-item-b158');
    if (!b158Btn) {
      b158Btn = document.createElement('button');
      b158Btn.className = 'set-item' + (isB158 ? ' active' : '');
      b158Btn.id = 'set-item-b158';
      b158Btn.innerHTML = `
        <span class="set-number">03</span>
        <div class="set-info">
          <strong>建殿者的呼聲 (B158)</strong>
          <small>Key: D · 66 BPM</small>
        </div>
      `;
      b158Btn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (isB158) return;
        switchToB158();
      });
      setlist.appendChild(b158Btn);
    } else {
      if (isB158) {
        b158Btn.classList.add('active');
        setlist.querySelectorAll('.set-item:not(#set-item-b158)').forEach(el => el.classList.remove('active'));
      } else {
        b158Btn.classList.remove('active');
      }
    }
  }

  // 監聽側邊欄變化，若 app.js 重新渲染 `#setlist`，自動補回第 3 首按鈕，杜絕按鈕消失
  function watchSetlist() {
    const setlist = document.getElementById('setlist');
    if (!setlist) return;

    // 監聽點擊前兩首歌曲的事件（使用 capture 確保在 app.js 前先重置 B158 狀態）
    setlist.addEventListener('click', (e) => {
      const targetItem = e.target.closest('.set-item');
      if (!targetItem) return;

      if (targetItem.id === 'set-item-b158') {
        return;
      }

      // 點擊第 1 首或第 2 首歌
      if (isB158) {
        isB158 = false;
        const b158Btn = document.getElementById('set-item-b158');
        if (b158Btn) b158Btn.classList.remove('active');

        // 停止 B158 播放
        const stopBtn = document.getElementById('stop');
        if (stopBtn) stopBtn.click();
      }
    }, true);

    const observer = new MutationObserver(() => {
      if (isMutating) return;
      isMutating = true;
      ensureB158Button();
      isMutating = false;
    });

    observer.observe(setlist, { childList: true });
    ensureB158Button();
  }

  // 切換至第 3 首曲目《建殿者的呼聲 (B158)》
  async function switchToB158() {
    isB158 = true;
    ensureB158Button();

    const stopBtn = document.getElementById('stop');
    if (stopBtn) stopBtn.click();

    // 1. 更新頁面文字與中繼資料
    const songTitleEl = document.getElementById('song-title');
    if (songTitleEl) songTitleEl.textContent = B158_CONFIG.category;

    const paperSongTitle = document.getElementById('paper-song-title');
    if (paperSongTitle) paperSongTitle.textContent = B158_CONFIG.title;

    const paperSongDesc = document.getElementById('paper-song-desc');
    if (paperSongDesc) paperSongDesc.textContent = B158_CONFIG.subtitle;

    const playerTitle = document.getElementById('player-title');
    if (playerTitle) playerTitle.textContent = B158_CONFIG.title;

    const visionText = document.getElementById('vision-text');
    if (visionText) visionText.textContent = B158_CONFIG.vision;

    const tempoMark = document.getElementById('tempo-mark');
    if (tempoMark) tempoMark.textContent = B158_CONFIG.bpm;

    const bpmVal = document.getElementById('bpm-value');
    if (bpmVal) bpmVal.textContent = B158_CONFIG.bpm;

    const suggestedBpm = document.getElementById('suggested-bpm');
    if (suggestedBpm) suggestedBpm.textContent = B158_CONFIG.bpm;

    const bpmInput = document.getElementById('bpm');
    if (bpmInput) bpmInput.value = B158_CONFIG.bpm;

    const scoreMeta = document.querySelector('.score-meta');
    if (scoreMeta) {
      scoreMeta.innerHTML = `
        <span class="live-dot"></span>
        <span id="score-status">載入樂譜中…</span>
        <span class="divider"></span>
        <span>Key: ${B158_CONFIG.key}</span>
        <span>${B158_CONFIG.time}</span>
      `;
    }

    // 2. 更新聲部管理 (Mixer)
    const tracksContainer = document.getElementById('tracks');
    if (tracksContainer) {
      tracksContainer.innerHTML = '';
      B158_CONFIG.tracks.forEach((track, i) => {
        const tr = document.createElement('div');
        tr.className = 'track';
        tr.innerHTML = `
          <div class="track-name">
            <span>${track.icon}</span><strong>Track ${i+1}: ${track.name}</strong>
            <small style="display:block;color:#879895;font-size:9px;margin-top:2px">${track.desc}</small>
          </div>
          <button class="on" data-track="${i+1}">啟用聲部</button>
        `;
        const b = tr.querySelector('button');
        b.onclick = () => {
          b.classList.toggle('on');
          b.textContent = b.classList.contains('on') ? '啟用聲部' : '靜音';
        };
        tracksContainer.appendChild(tr);
      });
    }

    // 3. 生成 15 個段落導航按鈕 (A Intro ~ O Coda 2)
    const sectionBtns = document.getElementById('section-buttons');
    if (sectionBtns) {
      sectionBtns.innerHTML = '';
      B158_CONFIG.sections.forEach((sec, i) => {
        const b = document.createElement('button');
        b.className = 'section-btn' + (i === 0 ? ' active current' : '');
        b.textContent = sec.name;
        b.onclick = () => {
          document.querySelectorAll('.section-btn').forEach(btn => btn.classList.remove('active', 'current'));
          b.classList.add('active', 'current');
          updateSectionDisplay(sec);
        };
        sectionBtns.appendChild(b);
      });
      updateSectionDisplay(B158_CONFIG.sections[0]);
    }

    // 4. 透過共用的 OSMD 實例渲染真實 MusicXML（共用同一實例避免容器衝突）
    await renderB158Score();
  }

  async function renderB158Score() {
    const scoreStatus = document.getElementById('score-status');
    const scoreGrid = document.getElementById('score-grid');
    if (!scoreGrid) return;

    try {
      if (!cachedB158Xml) {
        const res = await fetch(B158_CONFIG.scorePath);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        cachedB158Xml = await res.text();
      }

      let osmd = window.__shared_osmd;
      if (!osmd) {
        const Orig = window.__OrigOSMD || (window.opensheetmusicdisplay && window.opensheetmusicdisplay.OpenSheetMusicDisplay);
        if (Orig) {
          osmd = new Orig('score-grid', {
            autoResize: true,
            drawTitle: false,
            drawSubtitle: false,
            drawComposer: false,
            drawPartNames: true,
            drawMetronomeMarks: true,
            backend: 'svg'
          });
          window.__shared_osmd = osmd;
        }
      }

      if (osmd) {
        await osmd.load(cachedB158Xml);
        await osmd.render();
        if (scoreStatus) scoreStatus.textContent = '已載入互動樂譜 (Key: D · 66 BPM)';
      }
    } catch (err) {
      console.error('B158 OSMD load error:', err);
      if (scoreStatus) scoreStatus.textContent = '樂譜載入失敗';
    }
  }

  function updateSectionDisplay(sec) {
    const livePos = document.getElementById('live-position');
    if (livePos) livePos.textContent = sec.name;

    const liveMeas = document.getElementById('live-measure');
    if (liveMeas) liveMeas.textContent = `小節 ${sec.m} - ${sec.m + sec.bars - 1}`;

    const scorePos = document.getElementById('score-position');
    if (scorePos) scorePos.textContent = `目前位置：${sec.name} (小節 ${sec.m} · ${sec.mood})`;

    const playerSec = document.getElementById('player-section');
    if (playerSec) playerSec.textContent = sec.id;

    const playerLyric = document.getElementById('player-lyric');
    if (playerLyric) playerLyric.textContent = sec.mood;

    const cards = document.getElementById('arrangement-cards');
    if (cards) {
      cards.innerHTML = `
        <div class="arrangement-card active">
          <h3>🎹 鋼琴任務 (P1)</h3>
          <p class="chord">${sec.piano}</p>
          <p>長度：${sec.bars} 小節 | 氣氛：${sec.mood}</p>
        </div>
        <div class="arrangement-card active">
          <h3>🎻 弦樂任務 (P2)</h3>
          <p class="chord">${sec.strings}</p>
          <p>高八度鋪底動態調控</p>
        </div>
        <div class="arrangement-card active">
          <h3>🥁 鼓組任務 (P3)</h3>
          <p class="chord">${sec.drums}</p>
          <p>Groove / Breakdown / Build-up</p>
        </div>
      `;
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => setTimeout(watchSetlist, 200));
  } else {
    setTimeout(watchSetlist, 200);
  }
})();
