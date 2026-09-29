import { assert } from 'chai';
// import random from '../src/Random.js';
import { allEqual } from './utils.js';
import Genome from '../src/neat/Genome.js';
import { tanh } from '../src/neat/activations.js';
import Random from '../src/Random.js';

describe('NEAT', () => {
  describe('Genome', () => {
    const a = new Genome(3, 2, tanh);
    it('Construction', () => {
      assert.equal(a.inputs, 3);
      assert.equal(a.outputs, 2);
      assert.equal(a.defaultActivation, tanh);
      assert.equal(a.unhidden, 5);
      assert.equal(a.maxNode, 5);
    });

    it('Generation', () => {
      assert(a.generate());
      assert.equal(Object.keys(a.nodes).length, 5);
      assert.equal(Object.keys(a.edges).length, 3 * 2);
    });

    it('isDisabled', () => {
      assert(!a.isDisabled());
      const b = new Genome(3, 2, tanh);
      assert(b.isDisabled());
      b.generate();
      assert(!b.isDisabled());
      b.disable(0, 3);
      assert(!b.isDisabled());
      b.disable(0, 4);
      b.disable(1, 3);
      b.disable(1, 4);
      b.disable(2, 3);
      assert(!b.isDisabled());
      b.disable(2, 4);
      assert(b.isDisabled());
    });

    it('Indices', () => {
      assert.deepEqual([...a.getInputIndices()], [0, 1, 2]);
      assert.deepEqual([...a.getHiddenIndices()], []);
      assert.deepEqual([...a.getOutputIndices()], [3, 4]);
    });
  });
});

describe('Random', () => {
  const precision = 1000;
  const random = new Random();

  it('random', () => {
    const seed = 123;
    assert.equal(new Random(seed).random(), new Random(seed).random());
    let rands = [],
      rand;
    for (let i = 0; i < precision; i++) {
      rand = random.random();
      assert(0 <= rand);
      assert(rand < 1);
      rands.push(rand);
    }
    assert.approximately(
      rands.reduce((sum, value) => sum + value, 0),
      precision / 2,
      precision / 20,
    );
  });

  it('coin', () => {
    let heads = 0,
      tails = 0;
    for (let i = 0; i < precision; i++) {
      if (random.coin()) heads++;
      else tails++;
    }
    assert.approximately(heads, tails, precision / 15);
  });

  it('uniform', () => {
    let runningSum = 0;
    for (let i = 0; i < precision; i++) {
      const uniform = random.uniform(-5, 5);
      runningSum += uniform;
      assert(uniform >= -5);
      assert(uniform < 5);
    }
    assert.approximately(runningSum / precision, 0, 1);
  });

  it('integer', () => {
    let ints = [];
    for (let i = 0; i < precision; i++) {
      ints.push(random.integer(0, 10));
    }
    assert.includeMembers(ints, [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]);
    assert.notInclude(ints, 10);
  });

  it('choice', () => {
    let counts = [0, 0, 0],
      choices = [0, 1, 2];
    for (let i = 0; i < precision; i++) {
      const choice = random.choice(choices);
      counts[choice]++;
    }
    assert.equal(
      counts.reduce((sum, count) => sum + count, 0),
      precision,
    );
    assert.approximately(counts[0], counts[1], precision / 20);
    assert.approximately(counts[1], counts[2], precision / 20);
    assert.approximately(counts[0], counts[2], precision / 20);
  });

  it('sample', () => {
    // Add test
  });

  it('shuffle', () => {
    // Add test
  });

  it('weighted', () => {
    // Add test
  });

  it('normal', () => {
    // Add test
  });
});
