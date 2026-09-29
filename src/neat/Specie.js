import { hyperparams } from './constants.js';
import { random } from '../constants.js';
import { genomicDistance } from './crossover.js';

export default class Specie {
  constructor(maxFitnessHistory, ...members) {
    this.members = new Array(members);
    this.fitnessHistory = [];
    this.fitnessSum = 0;
    this.maxFitnessHistory = maxFitnessHistory;
  }

  reproduce() {
    let child;
    if (hyperparams.reproduceSexually()) {
      child = random.choice(this.members).clone();
      child.mutate();
      return child;
    }
    const [mom, dad] = random.sample(this.members, 2);
    child = crossover(mom, dad);
    return child;
  }

  updateFitness() {
    // update adjusted fitness for every genome in the specie
    for (g of this.members) g.adjustedFitness = g.fitness / this.members.length;
    // recalculate current fitness sum
    this.fitnessSum = this.members.reduce((sum, g) => sum + g.adjustedFitness, 0);
    // update fitness history
    this.fitnessHistory.push(this.fitnessSum);
    if (this.fitnessHistory.length > this.maxFitnessHistory) this.fitnessHistory.shift();
  }

  cullGenomes(fittestOnly) {
    this.members = [...this.members].sort((a, b) => a.fitness - b.fitness).reverse();
    // Only keep the winning genome
    if (fittestOnly) this.members = this.members.slice(0, 1);
    // Keep top 25%
    else this.members = this.members.slice(0, Math.ceil(0.25 * this.members.length));
  }

  getBest() {
    return this.members.reduce(
      (best, genome) => (best === undefined || genome.fitness >= best.fitness ? genome : best),
      undefined,
    );
  }

  canProgress() {
    const n = this.fitnessHistory.length;
    const avg = this.fitnessHistory.reduce((sum, fitness) => sum + fitness, 0) / n;
    return avg > this.fitnessHistory[0] || n < this.maxFitnessHistory;
  }
}
