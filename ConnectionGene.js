class ConnectionGene {
    constructor(innovationNumber, fromNode, toNode, weight) {
        this.innovationNumber = innovationNumber;
        this.fromNode = fromNode;
        this.toNode = toNode;
        this.weight = weight;
        this.fromNode.connections.push(this);
    }
}