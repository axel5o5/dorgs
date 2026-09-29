import { assert } from 'chai';
import Genome from '../src/neat/Genome.js';
import { tanh } from '../src/neat/activations.js';
import Dorg from '../src/Dorg.js';
import Grid from '../src/Grid.js';
import Melon from '../src/Melon.js';
import Profile from '../src/Profile.js';
import { directions, moves } from '../src/constants.js';

function world(idx = 1, col = 7, row = 9) {
  const env = { grid: new Grid(20, 20, 1), renderer: { addToRender() {} } };
  const dorg = new Dorg(idx, col, row, env);
  dorg.updateGrid();
  return { env, dorg, sensor: dorg.sensors[0] };
}

function food(env, col, row) {
  const melon = new Melon(col, row, env);
  melon.updateGrid();
  return melon;
}

describe('Brain forward', () => {
  it('calculates weighted sums, biases and activation, ignoring disabled edges', () => {
    const brain = new Genome(2, 2, tanh);
    brain.generate();
    brain.getEdge(0, 2).weight = 0.5;
    brain.getEdge(1, 2).weight = -0.25;
    brain.getNode(2).bias = 0.1;
    brain.getEdge(0, 3).weight = 100;
    brain.disable(0, 3);
    brain.getEdge(1, 3).weight = 0.75;
    brain.getNode(3).bias = -0.2;
    const expected = [tanh(0.5 + 0.5 + 0.1), tanh(-1.5 - 0.2)];
    assert.deepEqual(brain.forward([1, -2]), expected);
    brain.fitness = 42;
    for (const node of Object.values(brain.nodes)) node.output = NaN;
    assert.deepEqual(brain.forward([0, 0]), [tanh(0.1), tanh(-0.2)]);
    assert.deepEqual(brain.forward([1, -2]), expected);
    assert.equal(brain.fitness, 42);
    assert.throws(() => brain.forward([1]), 'Incorrect number of inputs');
    brain.disable(1, 3);
    assert.equal(brain.forward([1, -2])[1], tanh(-0.2));
  });
});

describe('Nearest melon sensor', () => {
  it('finds the nearest melon and computes row distance independently of column', () => {
    const { env, sensor } = world();
    food(env, 10, 9);
    const nearest = food(env, 8, 8);
    assert.strictEqual(sensor.nearestCell.owner, nearest);
    assert.deepEqual(sensor.sense(), [0.8, 0.8]);
  });

  it('returns finite zero input with no food, including at a grid corner', () => {
    const { sensor } = world(1, 0, 0);
    assert.isNull(sensor.nearestCell);
    assert.deepEqual(sensor.sense(), [0, 0]);
    assert(sensor.sense().every(Number.isFinite));
  });

  it('honors the Manhattan radius on both axes and diagonals', () => {
    const { env, sensor } = world();
    food(env, 7, 15);
    food(env, 13, 9);
    food(env, 10, 12);
    assert.deepEqual(sensor.sense(), [0, 0]);
    const boundary = food(env, 9, 12);
    assert.strictEqual(sensor.nearestCell.owner, boundary);
    assert.deepEqual(sensor.sense(), [0.6, -0.4]);
  });

  it('rotates both axes into the body frame for every facing', () => {
    const { env, dorg, sensor } = world();
    food(env, 8, 7);
    const expected = [[0.8, 0.6], [-0.6, 0.8], [-0.8, -0.6], [0.6, -0.8]];
    for (const facing of Object.values(directions)) {
      dorg.facing = facing;
      assert.deepEqual(sensor.sense(), expected[facing]);
    }
  });
});

describe('Sensor -> brain -> movement', () => {
  const deltas = [[0, -1], [1, 0], [0, 1], [-1, 0]];
  const turns = [0, 2, 3, 1];
  const choices = [moves.FORWARD, moves.BACKWARD, moves.LEFT, moves.RIGHT];

  for (const facing of Object.values(directions)) {
    for (let action = 0; action < choices.length; action++) {
      it(`maps output ${action} to ${choices[action]} from facing ${facing} and eats`, () => {
        const { env, dorg, sensor } = world();
        dorg.facing = facing;
        const nextFacing = (facing + turns[action]) % 4;
        const [dc, dr] = deltas[nextFacing];
        const melon = food(env, dorg.c + dc, dorg.r + dr);
        // Fixed test weights: score forward/backward from the forward input,
        // and left/right from the right input. Production weights stay random.
        for (const edge of Object.values(dorg.brain.edges)) edge.weight = 0;
        dorg.brain.getEdge(1, 2).weight = 1;
        dorg.brain.getEdge(1, 3).weight = -1;
        dorg.brain.getEdge(0, 4).weight = -1;
        dorg.brain.getEdge(0, 5).weight = 1;
        const inputs = sensor.sense();
        assert.approximately(inputs[action < 2 ? 1 : 0], [0.8, -0.8, -0.8, 0.8][action], 1e-12);
        assert.equal(inputs[action < 2 ? 0 : 1], 0);
        assert.equal(dorg.actBrain(), choices[action]);
        assert(dorg.brain.forward(inputs).every(Number.isFinite));
        dorg.update();
        assert.deepEqual([dorg.c, dorg.r], [7 + dc, 9 + dr]);
        assert.equal(dorg.facing, nextFacing);
        assert.equal(dorg.food, 100);
        assert.equal(melon.amount, 0);
        assert.strictEqual(dorg.cell.owner, dorg);
        assert.isNull(env.grid.cellAt(7, 9).owner);
        assert.deepEqual(sensor.sense(), [0, 0]);
      });
    }
  }

  it('uses finite zero outputs without food, breaks ties forward and stays within bounds', () => {
    for (const facing of Object.values(directions)) {
      const { dorg } = world(1, facing === directions.EAST ? 19 : 0, facing === directions.SOUTH ? 19 : 0);
      dorg.facing = facing;
      const position = [dorg.c, dorg.r];
      assert.deepEqual(dorg.brain.forward([0, 0]), [0, 0, 0, 0]);
      assert.equal(dorg.actBrain(), moves.FORWARD);
      dorg.update();
      assert.deepEqual([dorg.c, dorg.r], position);
    }
  });

  it('falls back to random if brain output is non-finite', () => {
    const { dorg } = world();
    dorg.brain.getNode(2).bias = NaN;
    dorg.actRandom = () => moves.LEFT;
    assert.equal(dorg.actBrain(), moves.LEFT);
  });

  it('keeps other Dorgs on the random baseline', () => {
    const { dorg } = world(0);
    assert.isNull(dorg.brain);
    assert.isEmpty(dorg.sensors);
    assert.include(choices, dorg.actRandom());
    dorg.actRandom = () => moves.RIGHT;
    dorg.update();
    assert.deepEqual([dorg.c, dorg.r], [8, 9]);
  });

  it('keyboard override takes precedence for one tick, then automatic control resumes', () => {
    const oldDocument = globalThis.document;
    const oldJQuery = globalThis.$;
    globalThis.document = { getElementById() {}, addEventListener() {}, removeEventListener() {} };
    globalThis.$ = () => ({ html() {}, css() {} });
    try {
      for (const idx of [0, 1]) {
        const { dorg } = world(idx);
        dorg.beingWatched = true;
        const profile = new Profile(dorg);
        const keys = ['ArrowUp', 'w', 'ArrowDown', 's', 'ArrowLeft', 'a', 'ArrowRight', 'd'];
        keys.forEach((key, i) => {
          profile.handleKeyInput({ key });
          assert.equal(dorg.override, choices[Math.floor(i / 2)]);
        });
        let automaticCalls = 0;
        dorg[idx === 1 ? 'actBrain' : 'actRandom'] = () => {
          automaticCalls++;
          return moves.FORWARD;
        };
        dorg.update();
        assert.equal(automaticCalls, 0);
        assert.isNull(dorg.override);
        assert.deepEqual([dorg.c, dorg.r], [8, 9]);
        dorg.update();
        assert.equal(automaticCalls, 1);
        assert.deepEqual([dorg.c, dorg.r], [9, 9]);
      }
    } finally {
      globalThis.document = oldDocument;
      globalThis.$ = oldJQuery;
    }
  });
});
