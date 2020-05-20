class Genome {
    constructor(inputs, outputs, crossover=false) {
        this.inputs = inputs;
        this.outputs = outputs;
        this.nodes = [];
        this.connections = [];
        this.biasNode = new NodeGene(inputs + outputs + 1, 1);
        this.biasNode.value = 1;
        this.totalLayers = 2;

        for (let i = 1; i <= inputs; i++) {
            this.nodes.push(new NodeGene(i, 1));
        }

        this.nodes.push(this.biasNode);
    }
}