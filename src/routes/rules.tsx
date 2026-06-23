import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/rules")({
  component: Rules,
});

// Local rules transcribed from the club scorecard. Each entry is a titled
// paragraph; some carry a bulleted list of sub-points.
const RULES: { title: string; body: string; bullets?: string[] }[] = [
  {
    title: "Out of Bounds",
    body:
      "All ground beyond the club's boundary fence is out of bounds. A ball coming to rest within the boundary of the course, but on the opposite side of the road between the 10th and 11th holes to the hole being played, shall be deemed to be OUT OF BOUNDS.",
  },
  {
    title: "Stakes and Sprinkler Heads",
    body:
      "All stakes shall be deemed to be immovable obstructions. NOTE: No stake may be removed.",
    bullets: [
      "White Stakes — Ground Under Repair",
      "Red Stakes — Lateral Water Hazard",
      "White Stakes with Black Tops — Out of Bounds",
    ],
  },
  {
    title: "Trees and Shrubs",
    body:
      "If a tree or shrub under two club lengths in height interferes with the player's stance or the area of his intended swing, the ball MUST be lifted, without penalty, and dropped in accordance with the procedure described in Rule 24-2b(i) (immovable obstruction). The ball may be cleaned when lifted.",
  },
  {
    title: "Wheel Marks",
    body:
      "Through the green, wheel marks made by a mower, tractor or motor vehicle may be treated as Ground Under Repair and the player may take relief as provided in Rule 25-1b(i).",
  },
  {
    title: "Garden Beds",
    body:
      "All garden beds are to be treated as Ground Under Repair from which play is prohibited. If a player's ball lies in a garden bed, or if a garden bed interferes with the player's stance or the area of his intended swing, the player MUST take relief as provided in Rule 21-1.",
  },
  {
    title: "Stones in Bunkers",
    body:
      "Stones in bunkers are to be treated as movable obstructions and relief may be taken in accordance with Rule 24.",
  },
  {
    title: "Bunkers",
    body:
      "A bunker marked 'GUR' is ground under repair from which play is prohibited. If a player's ball lies in the area, or if it interferes with the player's stance or the area of his intended swing, the player must take relief under Rule 25-1.",
  },
  {
    title: "Ground Under Repair",
    body:
      "The following areas are deemed to be Ground Under Repair (GUR) and relief may be taken in accordance with Rule 25:",
    bullets: [
      "Washaways in bunkers",
      "Drains from bunkers",
      "Exposed cloth in bunkers",
      "Any new earthworks interfering with player's stance or area of his/her intended swing.",
    ],
  },
];

function Rules() {
  return (
    <div className="min-h-screen app-bg-green">
      <div className="max-w-2xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="text-6xl mb-3">📜</div>
          <h1 className="text-4xl font-bold text-white tracking-tight">Local Rules</h1>
          <p className="text-green-300 mt-2">
            To be read in conjunction with the Rules of Golf and the Local Rules Board.
          </p>
        </div>

        {/* Tabs */}
        <div className="flex rounded-2xl overflow-hidden border border-white/20 mb-8">
          <Link
            to="/"
            className="flex-1 text-center py-3 font-semibold bg-white/5 text-green-200 hover:bg-white/10 transition-colors"
          >
            Scorecard
          </Link>
          <Link
            to="/rules"
            className="flex-1 text-center py-3 font-semibold bg-green-500 text-white transition-colors"
          >
            Rules
          </Link>
        </div>

        {/* Rules list */}
        <div className="space-y-4">
          {RULES.map((rule) => (
            <div
              key={rule.title}
              className="bg-white/10 backdrop-blur border border-white/20 rounded-2xl p-5"
            >
              <h2 className="text-white font-bold text-lg mb-2">{rule.title}</h2>
              <p className="text-green-100 leading-relaxed">{rule.body}</p>
              {rule.bullets && (
                <ul className="mt-3 space-y-1.5">
                  {rule.bullets.map((b) => (
                    <li key={b} className="flex gap-2 text-green-100">
                      <span className="text-green-400 shrink-0">•</span>
                      <span>{b}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </div>

        {/* Penalty */}
        <div className="bg-green-500/15 border border-green-400/40 rounded-2xl p-5 mt-4">
          <h2 className="text-white font-bold text-lg mb-1">Penalty for Breach of Local Rules</h2>
          <p className="text-green-100">
            Match Play — Loss of Hole. &nbsp; Stroke Play — Two strokes.
          </p>
        </div>

        {/* Footer */}
        <div className="text-center text-white/20 text-xs mt-12">18 Holes</div>
      </div>
    </div>
  );
}
