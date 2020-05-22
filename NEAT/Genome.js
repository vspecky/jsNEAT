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

    /**
     * Takes an array of input values and runs them through the Genome's Neural Network.
     * Throws an error if the number of input values given dont match the number of input
     * values of the neural network.
     *
     * @param {number[]} inputValues
     * @returns Output values
     * @memberof Genome
     */
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

    /**
     * Function that builds a genome from scratch given only the connection information.
     * Used for building the Offspring resulting from a crossover between two parent genomes.
     *
     * @static
     * @param {number} inputs
     * @param {number} outputs
     * @param {ConnectionHistory[]} history
     * @returns Genome
     * @memberof Genome
     */
    static build(inputs, outputs, history) {
        // Create the offspring with input/output nodes and no connections.
        const offspring = new Genome(inputs, outputs, true);

        for (const conn of history) {
            const node1 = offspring.find(node => node.innovationNumber === conn.from);
            let node2 = offspring.find(node => node.innovationNumber === conn.to);

            /*
                Well here's the thing, lets say a Genome is mutating.
                In case of a connection mutation, the connection is made between two nodes A and B that already exist within the Genome. 
                So even if it's a new, never before seen connection, the innovation number for the connection is still gonna be higher 
                than all other connections, including at least one for each those that have connections to A and B.

                In case of a node mutation, there are three things to remember :-
                1) The node mutation always happens on an existing connection (A -> B), therefore no matter what innovation numbers
                   we give to the two new connections, they are going to be higher than the original connection that's mutating.

                2) Lets say the new node is C so now the connection is A -> C -> B. We're also making it so that A -> C will have
                   a lower innovation number than C -> B.

                3) A layer increment is done when there is a node mutation between the last and (last - 1) layers. If that's
                   not the case, the new node's layer is one more than the original from_node. For example lets say we mutate
                   a connection A -> C -> B where layer(A) = 1 and layer(B) = 6. In this case layer(C) = layer(A) + 1 = 2.
                   This means that a fair bit of connections are going to exist between nodes in adjacent layers. Even if this
                   is not the case for some connections, for example, in the previous example, the A -> C connection is adjacent
                   since both nodes have a layer difference of 1, but the C -> B connection has a layer difference of 4, the node B
                   didn't come to exist in layer 6 cuz it felt like it. There is innovation history that details exactly how B came to
                   reside in layer 6. Node B wouldn't exist without this information.

                Keeping this in mind, we can see that the increment in structural complexity is directly proportional to the
                increment in the Innovation Numbers of connections and nodes. As we go from left to right in the innovation
                history (ascending order of innovation numbers), the 'from' nodes are always going to exist within the genome
                as we build it as long as we keep creating the 'to' nodes when we don't find em and increment the layers when
                necessary. With this, we can rebuild any genome just with the connection history while keeping layer information
                intact as long as we follow the rules detailed above.
            */
            if (offspring.totalLayers - node1.layer === 1 && !node2) {
                offspring.nodes.filter(node => node.layer > node1.layer)
                            .forEach(node => {
                                node.layer++;
                            });

                offspring.totalLayers++;
                node2 = new NodeGene(conn.to, node1.layer + 1);
                offspring.nodes.push(node2);
            }

            const connection = new ConnectionGene(
                conn.innovationNumber, node1, node2,
                conn.weight, conn.enabled
            );

            if (conn.innovationNumber <= outputs) {
                offspring.biasConnections.push(connection);

            } else {
                offspring.connections.push(connection);

            }

            offspring.allConnections.push(connection);
        }

        return offspring;
    }

    static crossover(parent1, parent2, geneEnableProb) {
        let male;
        let female;

        // I mean if we're mimicing biology...
        // Plus this also simplifies things a bit down the road.
        if (parent1.fitness >= parent2.fitness) {
            male = parent1;
            female = parent2;

        } else {
            male = parent2;
            female = parent1;
        }

        const offspringGenes = [];
    }
}