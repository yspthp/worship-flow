# Worship Flow

崇拜司樂編曲溝通與互動樂譜平台。

播放使用 `app.js` 設定的 FluidR3Mono GM SF3 音色，透過 Hugging Face 載入並快取。

## 《建殿者的呼聲》新版來源

- `public/scores/building-call-66bpm-20260926.musicxml`：使用者附件原始位元組，直接供 OSMD 顯示。
- 同名 `.json`：由該 XML 生成的播放事件、小節／段落導航及司樂提示。
- 141 小節、66 BPM、G 調、4/4；三聲部音符數為 1656／546／1632，全長約 8:32.727。
- 播放直接使用 JSON 音符事件，不使用旧版 AR／Basic Pitch MIDI；鋼琴與弦樂分別使用 GM program 0／50，鼓組使用第 10 聲道。
- 原譜未標力度；播放採固定力度 88／72／78。鼓件視覺位置的對應記錄於編譯器，避免將 D5／F5 錯播為 Hi-hat。
- 司樂提示是排練建議，明確區分於原譜記號，不自動加入漸強、漸慢或額外音符。

## 重建與文字驗證

需要 Python 3 與 Node.js，無額外套件。這是靜態網站；資料編譯即本曲所需的 build，沒有 npm build。

```sh
python tools/compile_building_call.py
python tools/compile_building_call.py --check
python tests/building-call-source-regression.py
node tests/building-call-regression.cjs
node tests/song-title-regression.cjs
node --check app.js
node --check score-data.js
git diff --check
```

來源測試獨立核對附件雜湊及逐音音高／起點／時值／譜表。Node 測試使用純文字 DOM stub 與合成器訊息紀錄，驗證全曲 note-on/off、三聲部靜音、變速、跳轉延音、暫停／停止、導航、提示與切歌。
這些測試不下載外部音色／OSMD、不截圖，也不等同於瀏覽器實際合成音訊或視覺排版驗收。

MusicXML 以 Git `-text` 保存，生成 JSON 固定 UTF-8/LF，以保持跨平台來源雜湊與編譯結果一致。後續換用其他附件時，須重新核對並更新來源回歸測試的固定雜湊與預期數值，不可僅略過測試。
