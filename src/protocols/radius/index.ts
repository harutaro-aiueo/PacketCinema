import type { ProtocolDefinition, Scenario } from "../../domain/lesson";

const operation = "https://www.rfc-editor.org/rfc/rfc2865.html#section-2";
const request = "https://www.rfc-editor.org/rfc/rfc2865.html#section-4.1";
const accept = "https://www.rfc-editor.org/rfc/rfc2865.html#section-4.2";

const scenario: Scenario = {
  id: "access-accept",
  title: "RADIUS認証",
  badge: "RADIUS",
  sceneLabel: "ネットワーク機器 ↔ 認証サーバー",
  nodes: [
    { id: "nas", label: "ネットワーク機器", caption: "利用者の接続を受ける", image: "./pixels/client.svg" },
    { id: "server", label: "認証サーバー", caption: "利用可否を判断", image: "./pixels/server.svg" },
  ],
  prerequisites: [],
  notes: [
    "RFC 2865のRADIUS/UDPで、ネットワークアクセスサーバー（NAS）が利用者を認証し、サービス提供を許可される成功例です。利用者からNASへの認証情報の受け渡しは開始前に済んでいる前提です。",
    "User-Passwordの実際の値と共有秘密は表示しません。RFC 2865のパスワード隠蔽はMD5を使う方式で、パケット全体を暗号化しません。秘密情報を保護する運用方法を示す教材ではありません。",
    "Access-Reject、Access-Challenge、プロキシ、再送、課金、属性の詳細とUDPの送受信処理は省略します。矢印は論理メッセージで、アニメーションの長さは実時間ではありません。",
  ],
  steps: [
    {
      kind: "message", from: "nas", to: "server", id: "request",
      phase: "認証要求", title: "利用者の認証を頼む",
      wire: "Access-Request · Code=1 · Identifier=7",
      displayWire: "認証要求",
      description: "NASは利用者名、隠蔽したUser-Password、自身を示すNAS-Identifierを含むAccess-Requestを認証サーバーへ送ります。送信先はUDP 1812番です。",
      fields: ["Code：1（Access-Request）", "Identifier：7（教材用）", "User-Name：例示の利用者名", "User-Password：隠蔽した値（非表示）", "NAS-Identifier：ネットワーク機器の識別子", "宛先：UDP 1812"],
      protection: "パケット全体の暗号化は示しません。", source: request,
      states: { nas: "応答待ち", server: "要求を受信" },
    },
    {
      kind: "local", node: "server", id: "verify",
      phase: "認証判断", title: "利用条件を確認する",
      wire: "NASと利用者の条件を確認",
      description: "認証サーバーは、共有秘密を持つNASからの要求か確認し、利用者のパスワードなどの条件を照合します。この例では条件を満たします。",
      fields: ["NAS：共有秘密を登録済み", "利用者：認証条件に合致", "結果：アクセス許可"],
      protection: "認証サーバー内の処理", source: operation,
      effect: { kind: "stages", label: "利用条件を確認", stages: [{ text: "NASと利用者の条件に合致", status: "許可" }] },
      states: { nas: "応答待ち", server: "許可を判断" },
    },
    {
      kind: "message", from: "server", to: "nas", id: "accept",
      phase: "認証応答", title: "利用を許可する",
      wire: "Access-Accept · Code=2 · Identifier=7",
      displayWire: "アクセス許可",
      description: "サーバーはAccess-Acceptを返します。NASは同じIdentifierの待機中要求と対応付け、Response Authenticatorを確認してから応答を使います。",
      fields: ["Code：2（Access-Accept）", "Identifier：7（要求と同じ）", "Response Authenticator：NASが検証"],
      protection: "パケット全体の暗号化は示しません。", source: accept,
      states: { nas: "許可を受信", server: "許可を送信" },
    },
    {
      kind: "local", node: "nas", id: "service",
      phase: "利用開始", title: "サービスを提供する",
      wire: "許可されたサービスを開始",
      description: "NASは有効なAccess-Acceptの内容に従い、利用者へのサービス提供を始めます。利用者との実際の通信はここでは描きません。",
      fields: ["NAS：応答を検証済み", "利用者：サービス利用を開始"],
      protection: "ネットワーク機器内の処理", source: operation,
      effect: { kind: "stages", label: "サービスを開始", stages: [{ text: "Access-Acceptを適用", status: "利用開始" }] },
      states: { nas: "サービス提供中", server: "許可済み" },
    },
  ],
};

export const radius: ProtocolDefinition = {
  id: "radius", title: "RADIUS",
  description: "ネットワーク機器が認証サーバーに利用許可を問い合わせる",
  keywords: ["認証", "アクセス制御", "NAS", "AAA", "UDP"],
  defaultScenarioId: scenario.id, scenarios: [scenario],
};
