import { random } from '../constants.js';
import { modifiedSigmoidalTransfer } from './activations.js';

export default class Hyperparameters {
  constructor() {
    this.distanceWeights = {
      edge: 1,
      weight: 1,
      bias: 1,
    };

    this.defaultActivation = modifiedSigmoidalTransfer;

    this.sexual = 0.75;

    // Custom weights
    this.mutation = {
      node: 0.1 * 0.2,
      edge: 0.1 * 0.8,
      weightSet: 0.6 * 0.1,
      weightPerturb: 0.6 * 0.9,
      biasSet: 0.3 * 0.3,
      biasPerturb: 0.3 * 0.7,
    };

    // weights from NEAT-Python
    // this.mutation = {
    //   node: 0.01,
    //   edge: 0.09,
    //   weight: 0.5,
    //   weightReset: 0.2,
    //   bias: 0.4,
    //   biasReset: 0.25,
    // };
  }

  getReproductionType() {
    return random.weighted(['sexual', 'asexual'], [this.sexual, 1 - this.sexual]);
  }

  reproduceSexually() {
    return this.getReproductionType() === 'sexual';
  }

  getMutationType() {
    return random.weighted(Object.keys(this.mutation), Object.values(this.mutation));
  }
}
