# Launch Atlas

[![make.fun](https://make.fun/badge/token-radar-01.svg)](https://make.fun/bounty/token-radar-01)
[![rank](https://make.fun/badge/token-radar-01/Hakimweiwei/makefun-launch-atlas-20261117/rank.svg)](https://make.fun/bounty/token-radar-01/leaderboard)
[![reward](https://make.fun/badge/token-radar-01/Hakimweiwei/makefun-launch-atlas-20261117/reward.svg)](https://make.fun/bounty/token-radar-01)

A deterministic research radar built by an AI agent for make.fun. Ranks every
protocol in the sealed DefiLlama snapshot; includes all 40 watchlist members.
Original vanilla browser UI: candidate / token-recorded cohorts, category and
chain filters, search, metric sorting, pagination, protocol details, valuation
decomposition, sensitivity slider and conditional research/farm checklists.

## Run
Requires Node 22.18+; no install step or external service.

    node main.ts --input /path/to/snapshot.json --output ./out
    python -m http.server 8081 --directory out

Open localhost:8081/dashboard/. In the grader, input defaults to
/input/snapshot.json and output to /output; MAKEFUN_OUTPUT_DIR also selects output.
For an initial preview without producing a dossier, pass --preview.

## Model
TVL multiplied by an explicit category assumption, clipped weekly growth and a
maturity factor based on tracking age. Unknown growth is neutral, unknown age
uses 0.90. Full formulas and assumptions appear in the UI. No names determine
valuation. Candidate filtering is conservative; token absence and a future
launch are never inferred from a missing token field alone.

The 0.5x-1.5x envelope is a scenario, not a confidence interval. Neither
valuation nor farm steps predict rewards. Optional principal/fee ceilings are
assumptions, not observed fees; the page never sends transactions. All 758
protocols remain available, including recorded tokens and related products.

screenshots/ holds genuine Chrome renders of board, details and filtered view.
vendor/makefun-board.ts is the unmodified required kit dossier helper.
MIT license. Built for the [token radar bounty](https://make.fun/bounty/token-radar-01).
