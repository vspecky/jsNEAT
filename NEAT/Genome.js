class Genome {
    constructor(inputs, outputs, crossover=false) {
        this.inputs = inputs;
        this.outputs = outputs;
        this.nodes = [];
        this.connections = [];
        this.biasConnections = [];
        this.allConnections = [];
        this.biasNode = new NodeGene(inputs + 1, 1);
        this.totalLayers = 2;
        this.fitness = 0;

        // Create input nodes
        for (let i = 1; i <= inputs; i++) {
            this.nodes.push(new NodeGene(i, 1));
        }

        // Add bias node
        this.nodes.push(this.biasNode);

        // Create output nodes
        for (let i = inputs + 2; i < inputs + outputs + 2; i++) {
            const outputNode = new NodeGene(i, 2);

            /* If there is no crossover, create the connections between the bias node and the output nodes
               with random weights. In case of crossover, the parents provide the connections. */
            if (!crossover) {
                const biasConnection = new ConnectionGene(i - (inputs + 1), this.biasNode, outputNode, Math.random());
                this.biasConnections.push(biasConnection);
                this.allConnections.push(biasConnection);
            }

            this.nodes.push(outputNode);
        }
    }

    feedForward(inputValues) {
        if (inputValues.length !== this.inputs) {
            const err = `Expected ${this.inputs} input values. Got ${inputValues.length}.`;
            throw new Error(err);
        }

        // Set all values to zero
        this.nodes.forEach(node => {
            node.value = 0;
        });

        // The bias node is always 1
        this.biasNode.value = 1;

        // Set values of input nodes
        for (let i = 0; i < this.inputs; i++) {
            this.nodes[i].value = inputValues[i];
        }

        // Feed-forward all neurons/nodes layerwise
        for (let layer = 1; layer < this.totalLayers; layer++) {
            const layerNodes = this.nodes.filter(node => node.layer === layer);
            layerNodes.forEach(node => node.feedForward());
        }

        // Get the output Values
        const outputValues = [];

        for (let i = this.inputs + 1; i < this.inputs + this.outputs + 1; i++) {
            outputValues.push(this.nodes[i].value);
        }

        return outputValues;
    }

    static buildOffspring(inputs, outputs, history) {
        const offspring = new Genome(inputs, outputs, true);
    }
}