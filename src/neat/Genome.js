import Edge from './Edge.js';
import { random } from '../constants.js';
import { range, nodeIdsToEdgeKey, edgeKeyToNodeIds } from './utils.js';
import Node from './Node.js';
import { hyperparams } from './constants.js';

export default class Genome {
  /**
   * Ayo
   * @param {int} inputs  Number of inputs
   * @param {int} outputs Number of outputs
   */
  constructor(inputs, outputs, defaultActivation) {
    this.inputs = inputs;
    this.outputs = outputs;

    this.defaultActivation = defaultActivation;

    this.unhidden = inputs + outputs;
    this.maxNode = inputs + outputs;

    this.nodes = {}; // NodeId : Node
    this.edges = {}; // (i, j) : Edge

    this.fitness = 0;
    this.adjustedFitness = 0;
  }

  generate() {
    for (let n = 0; n < this.maxNode; n++) {
      this.nodes[n] = new Node(this.defaultActivation);
    }

    for (let i = 0; i < this.inputs; i++) {
      for (let j = this.inputs; j < this.unhidden; j++) {
        this.addEdge(i, j, random.uniform(-1, 1));
      }
    }
    return true;
  }

  forward(inputs) {
    if (inputs.length != this.inputs) throw new Error('Incorrect number of inputs.');

    // Set input values
    for (let i = 0; i < this.inputs; i++) this.nodes[i].output = inputs[i];

    // Generate backward-adjacency list
    const from = this.getBackwardAdjacency();

    // Calculate output values for each node
    const ordered_nodes = this.getOrderedNodes();
    for (const j of ordered_nodes) {
      let ax = 0;
      for (const i of from[j]) {
        const key = nodeIdsToEdgeKey(i, j);
        ax += this.edges[key].weight * this.nodes[i].output;
      }
      const node = this.nodes[j];
      node.output = node.activation(ax + node.bias);
    }

    // Return output
    return [...this.getOutputIndices()].map((n) => this.nodes[n].output);
  }

  // FORWARD HELPERS
  getBackwardAdjacency() {
    let from = {};
    for (let n = this.inputs; n < this.maxNode; n++) from[n] = [];
    for (const [key, edge] of Object.entries(this.edges)) {
      if (edge.enabled) {
        const [i, j] = edgeKeyToNodeIds(key);
        from[j].push(i);
      }
    }
    return from;
  }

  mutate() {
    // If all edges disabled, enable one
    if (this.isDisabled()) this.addEnabled();

    switch (hyperparams.getMutationType()) {
      case 'node':
        this.addNode();
        break;
      case 'edge':
        const [i, j] = this.randomPair();
        this.addEdge(i, j, random.uniform(-1, 1));
        break;
      case 'weightSet':
        this.randomEdge().weight = random.uniform(-1, 1);
        break;
      case 'weightPerturb':
        this.randomEdge().weight += random.uniform(-1, 1);
        break;
      case 'biasSet':
        this.randomNode().bias = random.uniform(-1, 1);
        break;
      case 'biasPerturb':
        this.randomNode().bias += random.uniform(-1, 1);
        break;
    }
  }

  // MUTATE HELPERS
  addEnabled() {
    const enabled = getDisabled();
    const randomEdgeKey = random.choice(enabled);
    const edge = this.edges[randomEdgeKey];
    edge.enabled = true;
  }

  addNode() {
    const enabled = getEnabled();
    const randomEdgeKey = random.choice(enabled);
    const [i, j] = edgeKeyToNodeIds(randomEdgeKey);
    const edge = this.edges[randomEdgeKey];
    edge.enabled = false;

    const newNodeIdx = this.maxNode;
    this.maxNode++;
    this.nodes[newNodeIdx] = Node(this.defaultActivation);

    this.addEdge(i, newNodeIdx, 1);
    this.addEdge(newNodeIdx, j, edge.weight);
  }

  addEdge(i, j, weight) {
    const key = nodeIdsToEdgeKey(i, j);
    if (key in this.edges) this.edges[key].enabled = True;
    else this.edges[key] = new Edge(weight);
  }

  randomPair() {
    const i = random.choice(this.getNonOutputIndices());
    const jArr = this.getNonInputIndices;
    let j;
    if (jArr.length == 1 && i in jArr) {
      j = this.maxNode;
      this.addNode();
    } else {
      j = random.choice(jArr);
    }
    return [i, j];
  }

  randomEdge() {
    return random.choice(Object.values(this.edges));
  }

  randomNode() {
    return random.choice(Object.values(this.nodes));
  }

  // HELPERS

  getEnabled() {
    return Object.keys(this.edges).filter((k) => this.edges[k].enabled);
  }

  getDisabled() {
    return Object.keys(this.edges).filter((k) => !this.edges[k].enabled);
  }

  getOrderedNodes() {
    return [...this.getHiddenIndices(), ...this.getOutputIndices()];
  }

  isDisabled() {
    return Object.values(this.edges).every((edge) => !edge.enabled);
  }

  // GETTERS & SETTERS

  getEdge(i, j) {
    return this.edges[nodeIdsToEdgeKey(i, j)];
  }

  getNode(id) {
    return this.nodes[id];
  }

  isEnabled(i, j) {
    return this.getEdge(i, j).enabled;
  }

  enable(i, j) {
    if (this.isEnabled(i, j)) return false;
    this.getEdge(i, j).enabled = true;
    return true;
  }

  disable(i, j) {
    if (!this.isEnabled(i, j)) return false;
    this.getEdge(i, j).enabled = false;
    return true;
  }

  getInputIndices() {
    return range(this.inputs);
  }

  getHiddenIndices() {
    return range(this.unhidden, this.maxNode);
  }

  getOutputIndices() {
    return range(this.inputs, this.unhidden);
  }

  getNonInputIndices() {
    return [...this.getOutputIndices(), ...this.getHiddenIndices()];
  }

  getNonOutputIndices() {
    return [...this.getInputIndices(), ...this.getHiddenIndices()];
  }

  isInput(n) {
    return 0 <= n < this.inputs;
  }

  isHidden(n) {
    return this.unhidden <= n < this.maxNode;
  }

  isOutput(n) {
    return this.inputs <= n < this.unhidden;
  }

  getFitness() {
    return this.fitness;
  }

  setFitness(score) {
    this.fitness = score;
  }

  /**
   * Reset the genome's internal state.
   */
  reset() {
    for (n of range(this.maxNode)) this.nodes[n].output = 0;
    this.fitness = 0;
  }

  /**
   * Returns a clone of the genome
   */
  clone() {
    const clone = new Genome(this.inputs, this.outputs, this.defaultActivation);
    clone.unhidden = this.unhidden;
    clone.maxNode = this.maxNode;

    for ([n, node] of Object.entries(this.nodes)) {
      clone.nodes[n] = node.clone();
    }

    for ([key, edge] of Object.entries(this.edges)) {
      clone.edges[key] = edge.clone();
    }

    clone.fitness = this.fitness;
    clone.adjustedFitness = this.adjustedFitness;

    return clone;
  }
}
