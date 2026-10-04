import type { ProtocolDefinition } from "../domain/lesson";
import "./home.css";

export function Home({ catalog }: { catalog: readonly ProtocolDefinition[] }) {
  return (
    <main className="home">
      <h1>PacketCinema</h1>
      <nav className="home-lessons" aria-label="教材一覧">
        {[...catalog]
          .sort((a, b) => a.title.localeCompare(b.title))
          .map((protocol) => (
            <a className="home-card" href={"#/" + protocol.id} key={protocol.id}>
              <span className="home-card-title">{protocol.title}</span>
              <span className="home-card-description">
                {protocol.description ??
                  protocol.scenarios.find(
                    (scenario) => scenario.id === protocol.defaultScenarioId,
                  )?.title}
              </span>
            </a>
          ))}
      </nav>
    </main>
  );
}
