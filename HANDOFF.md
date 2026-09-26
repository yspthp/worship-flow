# HANDOFF — 建殿者的呼聲更新

日期：2026-09-26（UTC+8）
Repo：yspthp/worship-flow
目前工作分支：codex/update-building-call
遠端預設分支：main（已用 ls-remote --symref 驗證）
遠端 main：4e67ebf4d96abfa4048dcc1f03906d9b776aeba9，2026-09-26 09:54:10 +08:00
承接本機搶救 commit：db1cba0ab48027ad310b4b345e455f5915498899

## 目前進度
- M1：已核對遠端與本機成果，建立獨立分支並更新交接檔；本次提交前執行全部現有回歸測試，通過後立即推送新分支。
- M2：尚未開始；待 M1 推送成功後立即核對附件與生成資料。

## 已完成項目
- 已檢查 git status、git log、遠端分支與差異清單，原工作區乾淨。
- 前次編譯器、score-data.js、MusicXML/JSON、building-call 回歸測試等成果已包含在 db1cba0，不需從零重建。
- 已找到使用者提供的新版 MusicXML；M2 必須以此檔為準，而非僅依檔名或已知 141 小節／66 BPM 推定。
- 已使用單次 git -c http.sslBackend=schannel 成功驗證與 fetch 遠端；保留 SSL 驗證，未修改全域設定。

## 已改檔案清單
M1 本次：HANDOFF.md。
承接搶救內容：app.js、index.html、tests/song-title-regression.cjs、ar-piano.mid、basic_pitch_transcription.mid、public/scores/building-call-66bpm-20260926.json、public/scores/building-call-66bpm-20260926.musicxml、score-data.js、tests/building-call-regression.cjs、tools/compile_building_call.py、HANDOFF.md。

## 下一步
1. M1：全部回歸測試通過後 commit 並 push -u origin codex/update-building-call；用 git log 與 upstream 核實結果。
2. M2：比對使用者附件雜湊與 repo MusicXML，讀取編譯器並依附件重新生成，核對音符、小節、速度、三聲部。
3. 補齊司樂提示與播放資料，執行文字／DOM 回歸與必要 build；每個里程碑更新本檔後立即 commit，所有測試通過才 push。

## 附件位置
C:/Users/cleme/Documents/Codex/2026-09-26/musicxml-musicxml-partwise-opensheetmusicdisplay-osmd-1-3/outputs/建殿者的呼聲_66bpm_鋼琴弦樂爵士鼓.musicxml

## 已知問題與限制
- 前次 rescue/session2 push 因 OpenSSL 找不到憑證發行者失敗；搶救成果只在本機，但本次新分支承接該 commit。後續 git 網路操作使用 Windows schannel，禁止停用憑證驗證。
- Node 在沙箱內曾遇 EPERM；測試需經授權在沙箱外執行。
- 尚未確認兩個既有 MIDI 檔與本歌曲的關係，不擅自刪改。
- M1 不代表樂曲更新、完整驗收或 main 部署完成。
- 禁用截圖、圖片或視覺驗證；僅測試、文字、JSON。
- 不 force push、不 reset --hard、不刪遠端分支、不覆蓋他人 commit。
- 若再發生連線錯誤，立即停止，不在同一對話重試。

## M1 提交前驗證
- 兩項現有回歸測試均通過：building-call-regression.cjs、song-title-regression.cjs。
- 本次 commit 後立即推送獨立分支；推送是否成功以命令結果與 upstream 為準。

## M2 — 附件來源與可重現編譯（完成）
- M1 已成功推送：8e65654ad2eb1b73b832385148b39fb34fd79377，origin/codex/update-building-call；main 未改動。
- 已從使用者附件重新複製 MusicXML 並執行編譯；來源本來已相同，重建 JSON 語意亦相同，沒有偽造音符差異。
- 附件 SHA-256：3e70ed5925ae23d623334d946634b9d3640be16cc279d50d4938cb9c3561af70。
- 確認 141 小節、66 BPM、G 調、4/4、14 段落、512.727272727 秒、聲部音符數 1656／546／1632。
- 新增 .gitattributes：原 XML 禁止換行轉換；生成 JSON 固定 LF。
- 編譯器新增 --check 唯讀重現檢查，輸出固定 UTF-8/LF。
- 新增 Python 獨立來源回歸測試：固定附件雜湊、逐音音高／起點／時值／譜表比對，共 3834 音符與 423 個聲部小節。
- 首輪新增測試發現鼓組休息小節是空 measure，已依附件正確處理（未改 XML）。
- 提交前通過：編譯 --check、Python 來源測試、兩項 Node 回歸測試、兩個 JS 語法檢查、git diff --check。
- 本次變更：.gitattributes、tools/compile_building_call.py、tests/building-call-source-regression.py、HANDOFF.md；XML/JSON 已重建但與既有追蹤內容一致。
- 下一步 M3：補齊司樂提示的段落銜接與來源／建議區分，驗證播放資料與實際排程；靜態網站沒有 package.json，不需套件 build，編譯器即資料 build。
