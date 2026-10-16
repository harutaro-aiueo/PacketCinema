import type { ProtocolDefinition, Scenario } from "../../domain/lesson";

const getSource = "https://www.rfc-editor.org/rfc/rfc3416.html#section-4.2.1";
const responseSource = "https://www.rfc-editor.org/rfc/rfc3416.html#section-4.2.4";
const objectSource = "https://www.rfc-editor.org/rfc/rfc3418.html#section-2";

const scenario: Scenario = {
  id: "uptime-read",
  title: "SNMP：稼働時間",
  badge: "SNMP GET",
  sceneLabel: "管理端末 ↔ 管理対象機器",
  nodes: [
    { id: "manager", label: "管理端末", caption: "値を問い合わせる", image: "./pixels/client.svg" },
    { id: "agent", label: "管理対象", caption: "MIBの値を返す", image: "./pixels/server.svg" },
  ],
  prerequisites: [],
  notes: [
    "RFC 3416のGetRequestとResponseによる、読み取りが成功する1回の例です。管理端末が参照できるMIBビューにsysUpTime.0があることを前提とします。返す値は教材用の架空の値です。",
    "sysUpTimeは機器全体の起動時間ではなく、ネットワーク管理部分が最後に再初期化されてからの時間を100分の1秒単位で表します（RFC 3418）。",
    "SNMPのメッセージ版、認証・アクセス制御、符号化、UDP転送、再送、例外応答やエラー処理は省略します。アニメーションの時間は実際の応答時間を示しません。",
  ],
  steps: [
    {
      kind: "message", from: "manager", to: "agent", id: "get", phase: "問い合わせ",
      title: "稼働時間の識別子を指定する",
      wire: "GetRequest-PDU · request-id=41 · sysUpTime.0 = NULL",
      displayWire: "SNMP GET要求",
      description: "管理端末はsysUpTimeのインスタンスを識別するOIDを指定してGetRequestを送ります。要求の変数値には取得したい値を入れません。",
      fields: ["request-id：41（教材用）", "OID：1.3.6.1.2.1.1.3.0（sysUpTime.0）", "要求の変数値：NULL"],
      protection: "認証とアクセス制御はこの教材の対象外です。", source: getSource,
    },
    {
      kind: "local", node: "agent", id: "lookup", phase: "参照",
      title: "MIBの値を参照する",
      wire: "sysUpTime.0 → TimeTicks 123456",
      description: "管理対象のSNMPエージェントは、要求された識別子に対応するアクセス可能な変数を参照し、Responseの変数リストへ値を設定します。ここではTimeTicks 123456を例にします。",
      fields: ["OID：1.3.6.1.2.1.1.3.0", "型：TimeTicks", "値：123456（100分の1秒単位）"],
      protection: "管理対象内の処理", source: objectSource,
      effect: { kind: "stages", label: "MIBを参照", stages: [{ text: "sysUpTime.0 = 123456", status: "値を取得" }] },
    },
    {
      kind: "message", from: "agent", to: "manager", id: "response", phase: "応答",
      title: "同じ要求IDで値を返す",
      wire: "Response-PDU · request-id=41 · noError · sysUpTime.0=123456",
      displayWire: "SNMP応答",
      description: "エージェントは同じrequest-idを持つResponseを返します。正常応答ではerror-statusがnoError、error-indexが0で、変数リストに取得値が入ります。管理端末は要求IDを使って応答を対応付けます。",
      fields: ["request-id：41", "error-status：noError", "error-index：0", "sysUpTime.0：TimeTicks 123456（約20分34.56秒）"],
      protection: "認証とアクセス制御はこの教材の対象外です。", source: responseSource,
    },
  ],
};

export const snmpGet: ProtocolDefinition = {
  id: "snmp-get", title: "SNMP GET",
  description: "管理対象のMIBから稼働時間の値を取得する",
  keywords: ["SNMP", "監視", "MIB", "OID", "管理"],
  defaultScenarioId: scenario.id, scenarios: [scenario],
};
