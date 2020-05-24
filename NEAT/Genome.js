class Genome {
    constructor(inputs, outputs) {
        this.inputs = inputs;
        this.outputs = outputs;
        this.nodes = [];
        this.connections = [];
        this.biasNode = new NodeGene(inputs + 1, 1);
        this.totalLayers = 2;
        this.fitness = 0;
        this.speciesID = -1;

        // Create input nodes
        for (let i = 1; i <= inputs; i++) {
            this.nodes.push(new NodeGene(i, 1));
        }

        // Add bias node
        this.nodes.push(this.biasNode);

        // Create output nodes
        for (let i = inputs + 2; i < inputs + outputs + 2; i++) {
            const outputNode = new NodeGene(i, 2);
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
        const offspring = new Genome(inputs, outputs);

        offspring.nodes.filter(node => node.layer > 1).forEach(node => {
            node.layer = history.totalLayers;
        });

        offspring.totalLayers = history.totalLayers;

        for (const conn of history.offspringGenes) {
            const fromNode = offspring.find(node => node.innovationNumber === conn.from);
            let toNode = offspring.find(node => node.innovationNumber === conn.to);

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
                as we build it as long as we keep creating the 'to' nodes when we don't find em.
                With this, we can rebuild any genome just with the offspring history while keeping layer information
                intact as long as we follow the rules detailed above.
            */
            if (!toNode) {
                toNode = new NodeGene(conn.to, conn.toLayer);
                offspring.nodes.push(toNode);
            }

            const connection = new ConnectionGene(
                conn.innovationNumber, fromNode, toNode,
                conn.weight, conn.enabled
            );

            offspring.connections.push(connection);
        }

        return offspring;
    }

    /**
     * Genome crossover method. Takes two Parent Genomes and returns the Genetic
     * Information of the Offspring Genome.
     * NOTE: Only the Genetic Information is returned. To build the offspring Genome,
     * use the Genome.build() static method.
     *
     * @static
     * @param {Genome} parent1 The first parent.
     * @param {Genome} parent2 The second parent.
     * @param {number} disabledGeneEnableProb The probability of a matching gene being enabled if it's disabled in both Parent Genomes.
     * @memberof Genome
     */
    static crossover(parent1, parent2, disabledGeneEnableProb) {
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

        const maleGenes = male.connections;
        const femaleGenes = female.connections;

        let pt1 = 0;
        let pt2 = 0;

        while (pt1 < maleGenes.length && pt2 < femaleGenes.length) {
            const gene1 = maleGenes[pt1];   // Male gene
            const gene2 = femaleGenes[pt2]; // Female gene

            /*
                If both Innovation Numbers match, select the gene passed randomly from
                both parents.
                If the gene is disabled in both parents, there is a small chance of it being
                enabled in the offspring, denoted by the 'disabledGeneEnableProb' argument.
            */
            if (gene1.innovationNumber == gene2.innovationNumber) {
                const passedGene = Math.random() <= 0.5 ? gene1 : gene2;

                const childGene = new OffspringHistory(
                    passedGene.innovationNumber,
                    passedGene.fromNode.innovationNumber,
                    passedGene.toNode.innovationNumber,
                    passedGene.weight,
                    passedGene.enabled,
                    passedGene.fromNode.layer,
                    passedGene.toNode.layer
                );

                if (!gene1.enabled && !gene2.enabled && Math.random() <= disabledGeneEnableProb) {
                    childGene.enable();
                }

                offspringGenes.push(childGene);

                const maleGenesEnd = pt1 === maleGenes.length - 1;
                const femaleGenesEnd = pt2 === femaleGenes.length - 1;

                if (maleGenesEnd && femaleGenesEnd) break;
                if (!maleGenesEnd) pt1++;
                if (!femaleGenesEnd) pt2++;

            }    
            /*
                If the Innovation Number of the Male gene is higher than that of the Female gene
                then we have two possibilities :-
                1) If we have reached the end of the Female genes, the Male gene in question is
                   an excess gene. Since the Male Genome has higher fitness, include this gene.
                   Also increment pt1 to account for additional Male excess genes.
                2) If we have not reached the end of the Female Genes then the Female gene is a
                   disjoint gene. We don't know whether the Male gene at this point is matching,
                   disjoint or excess, so just increment pt2 for now.
            */
            else if (gene1.innovationNumber > gene2.innovationNumber) {
                if (p2 === femaleGenes.length - 1) {
                    const passedGene = gene1;

                    const childGene = new OffspringHistory(
                        passedGene.innovationNumber,
                        passedGene.fromNode.innovationNumber,
                        passedGene.toNode.innovationNumber,
                        passedGene.weight,
                        passedGene.enabled,
                        passedGene.fromNode.layer,
                        passedGene.toNode.layer
                    );

                    offspringGenes.push(childGene);
                    pt1++;

                } else {
                    pt2++;
                }
            }
            /*
                If the Innovation Number of the Female gene is higher than the Male gene then we
                again have two possibilities :-
                1) If we have reached the end of the Male genes, then all the remaining Female genes
                   are excess genes, hence break the loop here.
                2) If we have not reached the end of the Male Genes then we have a disjoint Male Gene.
                   Include it in the offspring and increment pt1.
            */
            else {
                if (p1 === maleGenes.length - 1) break;

                const passedGene = gene1;

                const childGene = new OffspringHistory(
                    passedGene.innovationNumber,
                    passedGene.fromNode.innovationNumber,
                    passedGene.toNode.innovationNumber,
                    passedGene.weight,
                    passedGene.enabled,
                    passedGene.fromNode.layer,
                    passedGene.toNode.layer
                );

                offspringGenes.push(childGene);
                pt1++;
            }
        }

        return {
            offspringGenes: offspringGenes,
            totalLayers: male.totalLayers
        };
    }

    /**
     * Sets the Species of the Genome.
     *
     * @param {number} speciesID The ID of the Species.
     * @memberof Genome
     */
    setSpecies(speciesID) {
        this.speciesID = speciesID;
    }

    /**
     * Mutates a new connection within the Genome.
     *
     * @param {InnovationHistory} innovationHistory The history of Innovation.
     * @param {number} [times=1] The number of times the function has been called. Do not supply this argument to the function.
     * @memberof Genome
     */
    mutateConnection(innovationHistory, times=1) {
        // If we have tried 5 times then fuck it.
        if (times === 6) return;

        // Select a From Node randomly
        let fromNode = this.nodes[Math.floor(Math.random() * this.nodes.length)];

        // And keep selecting it until we get a node that's not in the last layer (Output layer)
        while (fromNode.layer === this.totalLayers) {
            fromNode = this.nodes[Math.floor(Math.random() * this.nodes.length)];
        }

        /*
            Once the From node is selected, we need to select a To node. Here we create an
            array of valid To nodes. We want nodes that are in a layer greater than that of
            the From node and also aren't already connected to the From node.
        */
        const toNodeOptions = this.nodes.filter(node => node.layer > fromNode.layer)
                                .filter(node => !this.allConnections.find(conn => conn.fromNode === fromNode && conn.toNode === node));

        // If no valid To nodes are found, rerun the function with the times value incremented.
        if (toNodeOptions.length === 0) {
            return this.addConnection(innovationHistory, times + 1);
        }

        // Randomly choose a To node from the options.
        let toNode = toNodeOptions[Math.floor(Math.random() * toNodeOptions.length)];

        // Get the Connection Innovation Number.
        const innovationNumber = innovationHistory.addConnection(fromNode, toNode);

        const connection = new ConnectionGene(innovationNumber, fromNode, toNode, Math.random(), true);

        // Add the Connection Gene to the genome.
        this.connections.push(connection);
    }

    /**
     * Mutates a new node onto an existing connection, splitting it into two connections.
     *
     * @param {InnovationHistory} innovationHistory The history of Innovation.
     * @memberof Genome
     */
    mutateNode(innovationHistory) {
        // If there are no connections then we cannot mutate a node so return.
        if (this.connections.length === 0) return;

        // Get a random connection to mutate and disable it.
        const connToMutate = this.connections[Math.floor(Math.random() * this.connections.length)];
        connToMutate.disable();

        // Get the innovation number data of the two new connections and the new node.
        const mutationInnovs = innovationHistory.addNodeOn(connToMutate);

        const fromNode = connToMutate.fromNode;
        const toNode = connToMutate.toNode;

        // Increment layers if the from and to nodes were adjacent.
        if (toNode.layer - fromNode.layer === 1) {
            this.nodes.filter(node => node.layer > fromNode.layer).forEach(node => {
                node.layer++;
            });
            this.totalLayers++;
        }

        // Add in everything.
        const newNode = new NodeGene(mutationInnovs.node, fromNode.layer + 1);
        const conn1 = new ConnectionGene(mutationInnovs.conn1, fromNode, newNode, 1, true);
        const conn2 = new ConnectionGene(mutationInnovs.conn2, newNode, toNode, connToMutate.weight, true);

        this.nodes.push(newNode);
        this.connections.push(conn1, conn2);
    }

    mutate(innovationHistory, settings) {
        const rand = Math.random;

        if (rand() < settings.weightMutationRate) {
            this.connections.forEach(conn => conn.mutateWeight(settings));
        }

        if (rand() < settings.connectionMutationRate) {
            this.mutateConnection(innovationHistory);
        }

        if (rand() < settings.nodeMutationRate) {
            this.mutateNode(innovationHistory);
        }
    }
}