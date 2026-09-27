import type {
  RoutingTableConfig,
  RoutingTableSnapshot,
} from "../domain/lesson";

export function RoutingTable({
  config,
  snapshot,
  action,
}: {
  config: RoutingTableConfig;
  snapshot?: RoutingTableSnapshot;
  action?: "advertise" | "withdraw";
}) {
  const entries = snapshot?.entries ?? config.initialEntries;
  const status = snapshot?.status ?? config.initialStatus;

  return (
    <div
      className="routing-table"
      data-node={config.node}
      data-filled={entries.length > 0}
      data-action={action ?? "none"}
    >
      <table>
        <colgroup>
          <col className="routing-destination-col" />
          <col className="routing-method-col" />
          <col />
        </colgroup>
        <caption>
          <strong>{config.title}</strong>
          <span>{status}</span>
        </caption>
        <thead>
          <tr>
            <th scope="col">宛先</th>
            <th scope="col">経路の種類</th>
            <th scope="col">次ホップ</th>
          </tr>
        </thead>
        <tbody>
          {entries.length ? (
            entries.map((entry) => (
              <tr key={entry.destination}>
                <td>{entry.destination}</td>
                <td>{entry.learnedVia}</td>
                <td>{entry.nextHop}</td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={3}>{config.emptyText}</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
