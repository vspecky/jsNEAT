class NodeGene {
    constructor(innovationNumber, layer) {
        this.innovationNumber = innovationNumber;
        this.layer = layer;
        this.connections = connections;
        this.value = 0;
        this.activation = 'relu';
    }

    equals(other) {
        if (other instanceof NodeGene) {
            return this.innovationNumber === other.innovationNumber;
        }

        return false;
    }

    setValue(val) {
        this.value = val;
    }

    activate() {
        if (this.layer === 1) return;

        switch (this.activation) {
            case 'relu':
                this.value = Math.max(this.value, 0);
                break;

            case 'tanh':
                this.value = Math.tanh(this.value)
                break;

            case 'sigmoid':
                this.value = 1 / (1 + Math.exp(-this.value));
        }
    }

    feedForward() {
        this.activate();

        this.connections.forEach(connection => {
            if (connection.enabled) {
                connection.toNode.value += this.value * connection.weight;
            }
        });
    }
}