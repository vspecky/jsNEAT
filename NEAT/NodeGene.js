class NodeGene {
    constructor(innov, x, y) {
        this.innov = innov;
        this.x = x;
        this.y = y;
        this.conns = [];
    }

    activate(val) {
        if (this.x === 0) {
            return val;
        }

        return 1 / (1 + Math.exp(-4.9 * val));
    }

    clone() {
        return new NodeGene(this.innov, this.x, this.y);
    }
}