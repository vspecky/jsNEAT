class Genome {
    constructor(inputs, outputs, crossover = false) {
        this.inputs = inputs;
        this.outputs = outputs;
        this.nodes = [];
        this.conns = [];
        this.fitness = 0;

        if (crossover) return;

        let dy = 1 / (inputs + 2);
        let dy_curr = dy;

        // Create input nodes
        for (let i = 1; i <= inputs + 1; i++) {
            this.nodes.push(new NodeGene(i, 0, dy_curr));
            dy_curr += dy;
        }

        dy = 1 / (outputs + 1);
        dy_curr = dy;
        // Create output nodes
        for (let i = inputs + 2; i < inputs + outputs + 2; i++) {
            const outputNode = new NodeGene(i, 1, dy_curr);
            this.nodes.push(outputNode);
            dy_curr += dy;
        }

        let connInnov = 1;
        for (let i = 0; i < inputs + 1; i++) {
            const from = this.nodes[i];

            for (let j = inputs + 1; j < inputs + outputs + 1; j++) {
                const to = this.nodes[j];
                const conn = new ConnectionGene(
                    connInnov,
                    from.innov,
                    to.innov,
                    Math.random() * 2 - 1,
                    true
                );
                from.conns.push(conn);
                this.conns.push(conn);
                connInnov++;
            }
        }
    }

    clone() {
        const genome = new Genome(this.inputs, this.outputs, true);

        genome.nodes = this.nodes.map((node) => node.clone());
        genome.conns = this.conns.map((conn) => conn.clone());

        genome.nodes.forEach((node) =>
            node.conns.push(
                ...genome.conns.filter((conn) => conn.from === node.innov)
            )
        );

        return genome;
    }

    addFitness(fit) {
        if (this.fitness + fit < 0) this.fitness = 0;
        else this.fitness += fit;
    }

    /**
     * Takes an array of input values and runs them through the Genome's Neural Network.
     * Throws an error if the number of input values given dont match the number of input
     * values of the neural network.
     *
     * @param {number[]} inputValues Array of input values.
     * @param {string} [option='raw'] Whether to return rw input values, argmax or argmin.
     * @returns Output values
     * @memberof Genome
     */
    feedForward(inputValues) {
        if (inputValues.length !== this.inputs) {
            throw new Error("The number of input values provided doesn't match the required input values.")
        }

        if (!inputValues.every(elem => typeof elem === "number")) {
            throw new Error("Input values should be numbers");
        }

        let table = {};

        for (let i = 0; i < this.inputs; i++) {
            table[i + 1] = inputValues[i];
        }

        table[this.inputs + 1] = 1;

        for (const node of this.nodes) {
            const fromVal = table[node.innov];

            const feedFwdVal = node.activate(fromVal);

            for (const conn of node.conns) {
                if (!table[conn.to]) table[conn.to] = 0;
                if (conn.enabled) {
                    table[conn.to] += feedFwdVal * conn.weight;
                }
            }
        }

        const output = []

        for (let i = this.inputs + 2; i < this.inputs + this.outputs + 2; i++) {
            output.push(this.nodes[i - 1].activate(table[i]));
        }

        return output;
    }

    /**
     * Genome crossover method. Takes two Parent Genomes and returns the
     * offspring genome.
     *
     * @static
     * @param {Genome} parent1 The first parent.
     * @param {Genome} parent2 The second parent.
     * @param {NEATSettings} settings Neat Settings.
     * @returns {Genome} Offspring Genome.
     * @memberof Genome
     */
    static crossover(parent1, parent2, settings) {
        const [male, female] =
            parent1.fitness > parent2.fitness
                ? [parent1, parent2]
                : [parent2, parent1];

        const offspringGenes = [];

        const maleGenes = male.conns;
        const femaleGenes = female.conns;

        const fgTable = {};
        

        femaleGenes.forEach(conn => {
            fgTable[conn.innov] = conn;
        });

        for (const gene of maleGenes) {
            if (fgTable[gene.innov]) {
                const fGene = fgTable[gene.innov];

                const offspringGene =
                    Math.random() < 0.5 ? gene.clone() : fGene.clone();

                if (gene.enabled !== fGene.enabled) {
                    if (Math.random() < settings.crossGeneActiveRate) {
                        offspringGene.enable();
                    } else {
                        offspringGene.disable();
                    }
                }

                offspringGenes.push(offspringGene);
                continue;
            }

            offspringGenes.push(gene.clone());
        }

        const offspring = new Genome(male.inputs, male.outputs, true);

        offspring.nodes = male.nodes.map((node) => node.clone());
        offspring.conns = offspringGenes;

        for (const node of offspring.nodes) {
            if (node.x === 1) continue;

            offspring.conns
                .filter((conn) => conn.from === node.innov)
                .forEach((conn) => node.conns.push(conn));
        }

        return offspring;
    }

    /**
     * Mutates a new connection within the Genome.
     *
     * @param {InnovationHistory} hist The history of Innovation.
     * @memberof Genome
     */
    mutateConnection(hist) {
        const fromNodePool = this.nodes.filter((node) => {
            if (node.x === 1) return false;

            return (
                this.nodes
                    .filter((n) => n.x > node.x)
                    .filter(
                        (n) =>
                            !Boolean(
                                this.conns.find(
                                    (conn) =>
                                        conn.from === node.innov &&
                                        conn.to === n.innov
                                )
                            )
                    ).length > 0
            );
        });

        if (fromNodePool.length === 0) return;

        const fromNode =
            fromNodePool[Math.floor(Math.random() * fromNodePool.length)];

        const toNodePool = this.nodes
            .filter((n) => n.x > fromNode.x)
            .filter(
                (n) =>
                    !Boolean(
                        this.conns.find(
                            (c) => c.from === fromNode.innov && c.to === n.innov
                        )
                    )
            );

        const toNode =
            toNodePool[Math.floor(Math.random() * toNodePool.length)];

        let connInnov = hist.addConnection(fromNode.innov, toNode.innov);

        let conn = new ConnectionGene(
            connInnov,
            fromNode.innov,
            toNode.innov,
            Math.random() * 2 - 1,
            true
        );

        this.conns.push(conn);
        fromNode.conns.push(conn);

        this.conns = this.conns.sort((a, b) => a.innov - b.innov);
    }

    /**
     * Mutates a new node onto an existing connection, splitting it into two connections.
     *
     * @param {InnovationHistory} hist The history of Innovation.
     * @memberof Genome
     */
    mutateNode(hist) {
        const conn = this.conns[Math.floor(Math.random() * this.conns.length)];

        const mutInfo = hist.addNode(conn);

        const leftNode = this.nodes.find((n) => n.innov === conn.from);
        const rightNode = this.nodes.find((n) => n.innov === conn.to);

        const newNode = new NodeGene(
            mutInfo.node,
            (leftNode.x + rightNode.x) / 2,
            (leftNode.y + rightNode.y) / 2
        );

        const leftConn = new ConnectionGene(
            mutInfo.left,
            leftNode.innov,
            mutInfo.node,
            1,
            true
        );

        const rightConn = new ConnectionGene(
            mutInfo.right,
            mutInfo.node,
            rightNode.innov,
            conn.weight,
            true
        );

        conn.disable();

        leftNode.conns.push(leftConn);
        newNode.conns.push(rightConn);
        this.nodes.push(newNode);
        this.conns.push(leftConn);
        this.conns.push(rightConn);

        this.nodes = this.nodes.sort((a, b) => a.x - b.x);
        this.conns = this.conns.sort((a, b) => a.innov - b.innov);
    }

    /**
     * Mutates the Genome. Includes weight mutation, Node mutation and Connection
     * mutation.
     *
     * @param {InnovationHistory} hist The history of Innovation.
     * @param {NEATSettings} settings Neat Settings.
     * @memberof Genome
     */
    mutate(hist, settings) {
        const rand = Math.random;

        for (const conn of this.conns) {
            if (rand() < settings.weightMutRate) {
                conn.mutateWeight(settings);
            }
        }

        if (rand() < settings.connMutRate) {
            this.mutateConnection(hist);
        }

        if (rand() < settings.nodeMutRate) {
            this.mutateNode(hist);
        }
    }
}
