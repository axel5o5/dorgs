import Area from "./Area.js";

class Manhattan extends Area {
    manhattanDistance = (source, target) => 
        Math.abs(target.col - source.col) + Math.abs(target.row - source.row)

    includes(cell) {
        if (!cell) return false;
        return this.manhattanDistance(this.root, cell) <= this.radius;
    }
}

export default Manhattan;
