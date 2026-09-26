# HANDOFF — 建殿者的呼聲更新

日期：2026-09-26（UTC+8）
Repo：yspthp/worship-flow
工作分支：codex/refine-worship-atmosphere
遠端預設分支：main（已由 ls-remote --symref 確認）
本次開始時遠端 main：4e67ebf4d96abfa4048dcc1f03906d9b776aeba9，2026-09-26 09:54:10 +08:00

## 目前進度
- 原 M1–M4 已完成並合併 main：9c6efdd97b3458e4fcb45c792b315b0aa01e91c7；GitHub Pages 線上文字驗收已通過。
- 本次氣氛文字與混音微調已完成，全部文字測試通過；在 codex/refine-worship-atmosphere 提交推送，尚未合併 main／部署。

## 已完成項目
- 承接搶救 commit db1cba0ab48027ad310b4b345e455f5915498899，保留既有改動與兩個未核實用途的 MIDI 檔，未刪改他人成果。
- M1：8e65654ad2eb1b73b832385148b39fb34fd79377。核對 repo 與遠端最新紀錄，建立新分支與 HANDOFF。
- M2：3421c12d55af1c89cab88e0ad7c39beaa7da69c7。從附件重新複製 XML 並編譯，確認既有 XML 與附件本來相同；新增跨平台換行保護、--check、獨立逐音來源測試。
- M3：dd0d5a6ac035733501a483aa869f0bc93f52ce94。141 小節司樂建議、下一段入點、收音提示；清楚區分建議與原譜力度；顯示播放來源／力度／鼓件映射說明，切歌時隱藏本曲提示。
- M4：新版 JSON 直接供三聲部播放，未用舊 AR／Basic Pitch MIDI；補全 3834 組 note-on/off、三聲部靜音、變速、跳轉、暫停／停止測試。修正暫停計時漏乘播放倍率；跳轉恢復仍在延音的鋼琴／弦樂但不重觸已過的鼓擊，note-off 仍對齊原譜結束時點。
- 已更新前端 cache-busting 標記与 README 重建／測試步驟；無 package.json，此靜態網站以 Python 編譯為資料 build。

## 來源與生成資料
附件：C:/Users/cleme/Documents/Codex/2026-09-26/musicxml-musicxml-partwise-opensheetmusicdisplay-osmd-1-3/outputs/建殿者的呼聲_66bpm_鋼琴弦樂爵士鼓.musicxml
SHA-256：3e70ed5925ae23d623334d946634b9d3640be16cc279d50d4938cb9c3561af70
- 141 小節、66 BPM、G 調、4/4、14 段落、512.727272727 秒。
- 鋼琴／弦樂／鼓音符數：1656／546／1632；GM program 0／50／0，MIDI 聲道 1／2／10。
- XML 位元組保持原樣供 OSMD。JSON 固定 UTF-8/LF。
- 原譜無力度記號，固定力度 88／72／78；司樂文字不自動改變播放。
- 已唯讀核對附件旁 work/build_musicxml.py 与 work/musicxml_to_midi.py。鼓譜 F4=Hi-hat、G5=Ride、C5=大鼓、D5=邊擊、E5/F5=小鼓。舊轉換器將未知 D5/F5 回退為 Hi-hat，本編譯器不沿用此錯誤。

## 變更檔案清單（相對 main，含承接成果）
- .gitattributes
- HANDOFF.md
- README.md
- app.js
- index.html
- score-data.js
- style.css
- tools/compile_building_call.py
- tests/building-call-source-regression.py
- tests/building-call-regression.cjs
- tests/song-title-regression.cjs
- public/scores/building-call-66bpm-20260926.musicxml
- public/scores/building-call-66bpm-20260926.json
- ar-piano.mid（僅承接保存）
- basic_pitch_transcription.mid（僅承接保存）

## 驗證
- python tools/compile_building_call.py --check
- python tests/building-call-source-regression.py
- node tests/building-call-regression.cjs
- node tests/song-title-regression.cjs
- node --check app.js
- node --check score-data.js
- git diff --check
- 來源測試涵蓋 3834 個音符與 423 個聲部小節，包括空的鼓組休息小節。
- 本次只有文字 DOM stub、JSON 與合成器訊息測試；沒有圖片、截圖或視覺驗證。

## 下一步
- M4 全套驗證通過後立即提交與推送 codex/update-building-call，最後核對工作區乾淨且 HEAD 與 upstream 一致。
- 分支推送不等同 main 部署。後續若需要合併／部署，需使用者另行指示；本次不合併 main 或建立 PR。

## 已知問題／驗證邊界
- 未實際下載並載入外部 OSMD／SF3 或聆聽瀏覽器合成音訊；純文字測試不代表視覺排版或真實音訊驗收。
- 鼓組休息小節在附件內是空 measure，仍按 4 拍處理。
- 兩個既有 MIDI 檔用途未核實，保留但不供本曲播放。
- Windows Node 在沙箱內曾 EPERM，測試須取得沙箱外執行授權。
- OpenSSL 憑證庫曾阻擋 push；git -c http.sslBackend=schannel 已成功 fetch 與多次 push，保留憑證驗證，未修改全域設定。
- 若再遇任何連線錯誤，立即停止，不在同一對話重試；只回覆使用者指定交接句。
- 禁用截圖／圖片；禁止 force push、reset --hard、刪遠端分支、覆蓋他人 commit。每次 commit 前更新本檔，測試全通過才 push。

## M4 最終提交前結果
上述全部生成一致性、來源逐音、播放排程／提示／切歌回歸、JS 語法及 diff 檢查均通過。M4 已完成，接著提交並推送本分支；HEAD／upstream 是推送結果的核對依據。

## 2026-09-26 — 氣氛文案與弦樂音量微調
- 參考《祢是君王》《不可能的愛》的司樂備註風格，重寫《建殿者的呼聲》主禮氣氛要求：安靜聆聽、逐步凝聚、堅定回應、回落再開展、合一收束；不再列出版本、BPM 或小節數。其餘兩首原本已是氣氛文字，未改文案。
- 完全移除「當前編排」下方灰色播放版本說明與綠色司樂建議的 HTML、JS 更新及 CSS；保留三張樂器編排卡片。
- 共用電子琴／弦樂聲道 MIDI CC7 由 92 調至 101（控制值約增加 9.8%），適用三首歌曲；鋼琴 127、鼓 90、expression、音符 velocity 均不變。實際聽感不是線性百分比，仍需人工試聽。
- 原始 XML 與生成 JSON 未改；其內部來源說明仍保留供追溯，但不再渲染給司樂。
- 已更新 script cache-busting 標記；新增文案排除版本資訊、移除 DOM 元素／引用、三聲道音量值回歸斷言。
- 所有生成一致性、獨立逐音、播放排程、切歌、JS 語法與 git diff --check 均通過；沒有使用圖片／截圖。
- 本次變更：app.js、index.html、score-data.js、style.css、tests/building-call-regression.cjs、tests/song-title-regression.cjs、HANDOFF.md。
- 下一步：使用者確認後合併 main 觸發既有 Pages 自動部署，並進行純文字線上檢查及人工弦樂平衡試聽；目前正式網站仍為前次 main。