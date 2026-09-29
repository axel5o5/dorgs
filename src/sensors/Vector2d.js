import { directions } from "../constants.js";
import Sensor from './Sensor.js'

class Vector2d extends Sensor {
    constructor(dorg) {
        super(dorg);
    }

    gravity(target, r) {
        if (!target) return [0, 0];
        const source = this.source;
        let xGravity = r - Math.abs(target.col - source.col);
        let yGravity = r - Math.abs(target.row - source.row);
        return [xGravity, yGravity]
    }

    orient_(vector, target) {
        const source = this.source;
        const east = Math.sign(target.col - source.col) * vector[0];
        const north = Math.sign(source.row - target.row) * vector[1];
        // Body-relative axes: positive right, positive forward.
        switch(this.dorg.facing) {
            case directions.NORTH:
                vector[0] = east;
                vector[1] = north;
                break;
            case directions.EAST:
                vector[0] = -north;
                vector[1] = east;
                break;
            case directions.SOUTH:
                vector[0] = -east;
                vector[1] = -north;
                break;
            case directions.WEST:
                vector[0] = north;
                vector[1] = -east;
                break;
        }
    }

    normalize_(vector, norm) {
        vector[0] /= norm;
        vector[1] /= norm;
    }

    get source() {
        return this.dorg.cell;
    }
}

export default Vector2d;
