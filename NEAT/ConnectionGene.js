class ConnectionGene {
    constructor(innovationNumber, fromNode, toNode, weight, enabled=true) {
        this.innovationNumber = innovationNumber;
        this.fromNode = fromNode;
        this.toNode = toNode;
        this.weight = weight;
        this.enabled = enabled;

        // Add the connection gene to the from node's array. No hassle
        this.fromNode.connections.push(this);
    }

    enable() {
        this.enabled = true;
    }

    disable() {
        this.enabled = false;
    }

    toggle() {
        this.enabled = !this.enabled;
    }
}