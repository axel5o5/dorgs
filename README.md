# dorgs
### Artificial Life Simulation in JS
dorg = Digital Organism

`dorg_1` uses a randomly initialized, untrained 2-input/4-output neural brain;
the other Dorgs remain random baselines. Brains are **not evolving** yet.
Each tick, its nearest melon within Manhattan radius 5 supplies normalized,
signed right/forward strengths relative to its facing. No food gives `[0, 0]`.
The largest output chooses forward, backward, left, or right (in that order;
ties choose the first). Each action turns as needed and moves one cell, unless
blocked by the grid edge. Select a Dorg and use arrows or WASD to override one
tick with those relative moves. Untrained brains are not expected to seek food.

# Installation
dorgs requires [git](https://github.com/git-guides/install-git), Node.js 26.0.0, and npm 11.12.1. If you use nvm, the included `.nvmrc` selects the expected Node version.
```
git clone https://github.com/axelbrowne/dorgs
cd dorgs
nvm use
npm ci
```

Start the local server and open the simulation in your browser:

```
npm start
```

Set `NO_OPEN=1` to start the server without opening a browser.

Run the tests directly under Node.js 26:

```
npm test
```
