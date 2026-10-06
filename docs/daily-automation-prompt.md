# PacketCinema 日次実行プロンプト

以下をCodexのプロジェクト指定の定期タスクに保存する。プロジェクトは`PacketCinema`、実行時刻は日本時間の毎日06:00・12:00・18:00、各回は独立した実行とする。

```text
PacketCinema（harutaro-aiueo/PacketCinema）の新しい教材・機能ページを増やす日次作業を1回実行してください。AGENTS.md、docs/daily-automation.md、docs/git-workflow.mdを先に読み、docs/daily-automation.mdに「Daily automation contract: page-first-v2」がない間は設定PRのマージ待ちとして変更せず報告してください。プロトコル教材には .agents/skills/packetcinema-add-protocol/SKILL.md と docs/adding-protocol.md も適用してください。

GitHubの最新main、open PR・Issue・CIとローカル作業状態を確認してください。既存の未コミット変更に触れず、最新mainから隔離したworktreeで作業してください。ページ追加にはcodex/auto-page-<日付>-<内容>、保守にはcodex/auto-maint-<日付>-<内容>ブランチを使ってください。GitHub、main、worktree、今週のPR件数を確認できなければ実装しないでください。進行中の別ブランチや未コミット作業と同じ教材・機能を重複して作らないでください。

第一候補はユーザー要望・Issue・リポジトリの計画にある新しい教材または独立した機能ページです。指定がなければ未収録のDNS、DHCP、ARPをこの順で検討してください。一次資料で技術内容を照合し、必要なテストと画面確認を含めて完成できる候補を1件だけ選んでください。今週のページPRを作成済み、または実行可能なページ候補がない場合だけ、局所的なUI改善かバグ修正を1件検討してください。

日本時間の週上限はcodex/auto-page-のPRが1件、codex/auto-maint-のPRが1件、両者の合計が2件です。候補の区分の上限、または総計の上限に達していれば実装しないでください。閉じたPRも数え、今日の自動PRが既にある場合や未完了の自動PRがある場合も新たな実装をしないでください。ページは最大12ファイル・変更合計およそ1000行、保守は最大5ファイル・およそ300行です。テストや出典を省いて上限に合わせないでください。

新教材はRFC・標準・ベンダー公式資料を読み、通信順序、方向、状態、前提・省略、各説明と出典の対応を確認してください。関連テストを追加し、npm test、npm run build、npm run test:e2eと新ページの実画面を確認してください。検証不能、技術資料不足、共有基盤の広範な変更、機密情報の疑い、別作業との重複があればPRを作らず理由を報告してください。検証失敗の同じ原因への修正は1回までです。

成功時だけ送信範囲を確認して作業ブランチにコミット・pushし、main向けPRを1件作ってください。タイトルに[daily][page]または[daily][maintenance]を付け、目的、前提と出典・省略、検証、未確認事項を記してください。mainへの直接push、force push、マージ、Pages公開、リリース、保護設定変更は行わないでください。最後にPRのURLまたは見送り理由、検証結果、残る人の判断を簡潔に報告してください。
```
