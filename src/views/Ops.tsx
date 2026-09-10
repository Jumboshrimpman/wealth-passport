import { Badge, Disclaimer, SectionHead, Stat } from "../components/ui";
import { useClient } from "../context/ClientContext";

export function Ops() {
  const { passport } = useClient();
  const opsPacket = passport.opsPacket;
  const reused = opsPacket.fields.filter((field) => field.reused);
  const needed = opsPacket.fields.filter((field) => !field.reused);

  return (
    <div className="stack">
      <SectionHead
        kicker="Operations · reusable packet"
        title={opsPacket.title}
        lede={`${opsPacket.from} → ${opsPacket.to}. The passport fills repeated enrollment and rollover fields so the household and advisor are not re-typed at every firm.`}
      />

      <div className="grid grid-3">
        <Stat
          label="Fields reused"
          value={`${opsPacket.reused} / ${opsPacket.total}`}
          note={`From the ${passport.household.name} passport`}
        />
        <Stat label="Still required" value={`${needed.length}`} note="Signatures and receiving-plan acceptance" />
        <Stat label="Illustrated time saved" value="~40 min" note="Ops anecdote for the walkthrough, not measured" />
      </div>

      <Disclaimer>
        This packet is a document demo stored on the client record. No transfer agent, ACATS, or
        plan recordkeeper is connected. Morningstar-style holdings and Informa-style product mapping
        appear as reused extracts — fixtures, not vendor sessions.
      </Disclaimer>

      <div className="split">
        <section className="panel">
          <div className="row">
            <p className="kicker" style={{ margin: 0 }}>
              Reused from passport
            </p>
            <Badge tone="verified">{reused.length} fields</Badge>
          </div>
          <div className="field-grid" style={{ marginTop: "0.85rem" }}>
            {reused.map((field) => (
              <div className="field reused" key={field.label}>
                <div>
                  <div className="meta-label">{field.label}</div>
                  <strong>{field.value}</strong>
                </div>
                <Badge>{field.source}</Badge>
              </div>
            ))}
          </div>
        </section>
        <section className="panel">
          <div className="row">
            <p className="kicker" style={{ margin: 0 }}>
              Still collected
            </p>
            <Badge tone="warn">{needed.length} fields</Badge>
          </div>
          <div className="field-grid" style={{ marginTop: "0.85rem" }}>
            {needed.map((field) => (
              <div className="field needed" key={field.label}>
                <div>
                  <div className="meta-label">{field.label}</div>
                  <strong>{field.value}</strong>
                </div>
                <Badge tone="warn">{field.source}</Badge>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
