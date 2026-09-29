import { edgeKeyToNodeIds, range } from './utils.js';
import Genome from './Genome.js';

export default function crossover(a, b) {
  if (b.fitness > a.fitness) [a, b] = [b, a];
  const child = Genome(a.inputs, a.outputs, a.defaultActivation);
  const aEdges = new Set(Object.keys(a.edges));
  const bEdges = new Set(Object.keys(b.edges));

  // Inherit homologous genes from random parent
  for (let key of aEdges.intersection(bEdges)) {
    const edge = random.coin() === 'heads' ? aEdges[key] : bEdges[key];
    child.edges[key] = edge.clone();
  }

  // Inherit disjoin/excess genes from fitter parent
  for (let key of aEdges.difference(bEdges)) {
    child.edges[key] = a.edges[key].clone();
  }

  // Calculate max node
  child.maxNode = 0;
  for (key of child.edges) {
    const currentMax = Math.max(...edgeKeyToNodeIds(key));
    child.maxNode = Math.max(currentMax, child.maxNode);
  }
  child.maxNode += 1;

  // Inherit Nodes
  for (n of range(child.maxNode)) {
    let inheritFrom = [];
    if (n in a.nodes) inheritFrom.push(a);
    if (n in b.nodes) inheritFrom.push(b);
    random.shuffle(inheritFrom);
    const parentIdx = Math.max(inheritFrom.map((p) => p.fitness));
    const parent = inheritFrom[parentIdx];
    child.nodes[n] = parent.nodes[n].clone();
  }

  child.reset();
  return child;
}

/**
 * Calculate the genomic distance between two genomes.
 * otherwise referred to as compatability distance.
 * src=https://github.com/SirBob01/NEAT-Python/blob/34e4766c0db06c2a7cc8cc690e3e991b5fa6f707/neat/neat.py
 * @param {*} a
 * @param {*} b
 * @param {*} distanceWeights
 */
export function genomicDistance(a, b, distanceWeights) {
  const aEdges = new Set(Object.keys(a.edges));
  const bEdges = new Set(Object.keys(b.edges));

  const matchingEdges = aEdges.intersection(bEdges);
  const disjointEdges = aEdges.difference(bEdges).union(bEdges.difference(aEdges));
  const nEdges = Math.max(aEdges.length, bEdges.length);
  const nNodes = Math.min(a.maxNode, b.maxNode);

  let weightDiff = 0;
  for (i of matchingEdges) weightDiff += Math.abs(a.edges[i].weight - b.edges[i].weight);

  let biasDiff = 0;
  for (i of range(nNodes)) biasDiff += Math.abs(a.nodes[i].bias, b.nodes[i] / bias);

  const t1 = (distanceWeights['edge'] * disjointEdges.size) / nEdges;
  const t2 = (distanceWeights['weight'] * weightDiff) / matchingEdges.size;
  const t3 = (distanceWeights['bias'] * biasDiff) / nNodes;
  return t1 + t2 + t3;
}
