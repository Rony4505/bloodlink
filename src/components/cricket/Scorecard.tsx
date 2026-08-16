"use client";

import type { Match } from "@/lib/cricket/types";

export function Scorecard({ match }: { match: Match }) {
  return (
    <div className="pl-scorecard">
      {match.innings.map((inn, idx) => {
        const team = inn.battingTeam === "a" ? match.teamA : match.teamB;
        return (
          <div key={idx} className="pl-card-block">
            <h3>
              {team.name} — ইনিংস {idx + 1} ({inn.runs}/{inn.wickets})
            </h3>
            <table>
              <thead>
                <tr>
                  <th>ব্যাটসম্যান</th>
                  <th>R</th>
                  <th>B</th>
                  <th>4s</th>
                  <th>6s</th>
                </tr>
              </thead>
              <tbody>
                {inn.batters.length === 0 ? (
                  <tr>
                    <td colSpan={5}>এখনো নেই</td>
                  </tr>
                ) : (
                  inn.batters.map((b) => (
                    <tr key={b.playerId}>
                      <td>
                        {b.name}
                        {b.out ? "" : " *"}
                        {b.howOut ? <small> ({b.howOut})</small> : null}
                      </td>
                      <td>{b.runs}</td>
                      <td>{b.balls}</td>
                      <td>{b.fours}</td>
                      <td>{b.sixes}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
            <p className="pl-extras">
              Extras: wd {inn.extras.wd}, nb {inn.extras.nb}, b {inn.extras.b}, lb {inn.extras.lb}
            </p>
            <table>
              <thead>
                <tr>
                  <th>বোলার</th>
                  <th>O</th>
                  <th>R</th>
                  <th>W</th>
                  <th>M</th>
                </tr>
              </thead>
              <tbody>
                {inn.bowlers.map((b) => (
                  <tr key={b.playerId}>
                    <td>{b.name}</td>
                    <td>
                      {Math.floor(b.balls / 6)}.{b.balls % 6}
                    </td>
                    <td>{b.runs}</td>
                    <td>{b.wickets}</td>
                    <td>{b.maidens}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      })}
    </div>
  );
}
