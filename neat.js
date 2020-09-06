class ConnectionGene {
    constructor(innov, from, to, weight, enabled=true) {
        this.innov = innov;
        this.from = from;
        this.to = to;
        this.weight = weight;
        this.enabled = enabled;
    }

    /**
     * Clone this ConnectionGene
     *
     * @return {ConnectionGene} 
     * @memberof ConnectionGene
     */
    clone() {
        return new ConnectionGene(this.innov, this.from, this.to, this.weight, this.enabled);
    }

    /**
     * Enable this connection.
     *
     * @memberof ConnectionGene
     */
    enable() {
        this.enabled = true;
    }

    /**
     * Disable this connection.
     *
     * @memberof ConnectionGene
     */
    disable() {
        this.enabled = false;
    }

    /**
     * Toggle this connection.
     *
     * @memberof ConnectionGene
     */
    toggle() {
        this.enabled = !this.enabled;
    }

    /**
     * Mutate the Weight of this connection.
     *
     * @param {NEATSettings} settings
     * @memberof ConnectionGene
     */
    mutateWeight(settings) {
        if (Math.random() < settings.weightShiftRate) {
            const u1 = 1 - Math.random();
            const u2 = 1 - Math.random();
            const mag = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2) / 20;
            this.weight = Math.max(-1, Math.min(this.weight + mag, 1));
        } else {
            this.weight = Math.random() * 2 - 1;
        }
    }
}

class ConnectionHistory {
    constructor(innov, from, to) {
        this.innov = innov;
        this.from = from;
        this.to = to;
    }
}

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


class InnovationHistory {
    constructor(inputs, outputs) {
        this.nextNodeInnov = inputs + outputs + 2;
        this.nextConnInnov = (inputs + 1) * outputs + 1;

        this.history = [];

        let innov = 1;
        for (let i = 1; i < inputs + 2; i++) {
            for (let j = inputs + 2; j < inputs + outputs + 2; j++) {
                this.history.push(new ConnectionHistory(innov, i, j));
                innov++;
            }
        }
    }

    addConnection(from, to) {
        const existingConnection = this.history.find(conn => conn.from === from && conn.to === to);

        if (!existingConnection) {
            const newHistory = new ConnectionHistory(
                this.nextConnInnov,
                from,
                to,
            );
            this.history.push(newHistory);
            const innov = this.nextConnInnov;
            this.nextConnInnov++;
            return innov;

        } else {
            return existingConnection.innov;
        }
    }

    addNode(connection) {
        const from = connection.from;
        const to = connection.to;

        const fromConnections = this.history.filter(conn => conn.from === from);
        const toConnections = this.history.filter(conn => conn.to === to);

        for (const conn1 of fromConnections) {
            for (const conn2 of toConnections) {
                if (conn1.to === conn2.from) {
                    return {
                        left: conn1.innov,
                        right: conn2.innov,
                        node: conn1.to
                    };
                }
            }
        }

        const left = this.nextConnInnov++;
        const right = this.nextConnInnov++;
        const node = this.nextNodeInnov++;

        this.history.push(new ConnectionHistory(left, connection.from, node));
        this.history.push(new ConnectionHistory(right, node, connection.to));

        return { left, right, node };
    }
}

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

/*
Population Settings:
    General:
        populationSize: Integer (0, ...)
        inputSize: Integer (0, ...)
        outputSize: Integer (0, ...)
        gensToExtinction: (0, ...)

    Mutation:
        connectionMutationRate: Float [0, 1]
        nodeMutationRate: Float [0, 1]
        weightMutationRate: Float [0, 1]
        weightShiftRate: Float [0, 1]
        weightShiftMagnitude: Float (0, ...)
        weightRandomizationRate: Float [0, 1]

    Crossover:
        disabledGeneEnableProb: [0, 1]
        disabledInBothEnableProb: [0, 1]
        onlyMutationRate: [0, 1]

    Speciation:
        disjointCoefficient: Float (0, ...)
        excessCoefficient: Float (0, ...)
        weightCoefficient: Float (0, ...)
        speciationThreshold: Float (0, ...)
        allowedStagnantGens: Integer (0, ...)
    
*/

class NEAT {
    constructor(sets) {
        if (!(sets instanceof NEATSettings)) {
            const err = "Expected instance of NEATSettings in NEAT";
            throw new Error(err);
        }

        this.sets = sets;

        this.generations = 0;

        this.reset();
    }

    reset() {
        this.hist = new InnovationHistory(
            this.sets.inputs,
            this.sets.outputs
        );

        this.genomes = [];

        for (let i = 0; i < this.sets.popSize; i++) {
            const newGenome = new Genome(
                this.sets.inputs,
                this.sets.outputs
            );
            this.genomes.push(newGenome);
        }

        this.species = [];
        this.bestFitness = 0;
        this.bestGenome = null;
    }

    nextGeneration() {
        this.genomes = this.genomes.sort((a, b) => b.fitness - a.fitness);

        const thisChamp = this.genomes[0];
        if (thisChamp.fitness > this.bestFitness) {
            this.bestFitness = thisChamp.fitness;
            this.bestGenome = thisChamp.clone();
        }

        this.speciatePopulation();

        this.species.forEach((species) => {
            species.updateStagnancy();
            species.calculateAvgFitness();
            species.cullLowerHalf();
        });

        this.species = this.species.filter(
            (s) =>
                s.genomes.length > 0 &&
                s.stagnancy < this.sets.allowedStagnancy
        );

        const totalAvgFitness = this.species.map(s => s.avgFitness).reduce(
            (acc, val) => acc + val
        );

        this.species.forEach((species) => {
            species.assignedOffspring = Math.floor(
                (species.avgFitness / totalAvgFitness) * this.sets.popSize
            );
        });

        this.species = this.species.filter(species => species.assignedOffspring > 0);

        const progeny = [];

        for (const species of this.species) {
            let newOffspring = species.assignedOffspring;

            if (species.genomes.length > 3) {
                const champ = species.genomes[0].clone();
                champ.mutate(this.hist, this.sets);
                progeny.push(champ);
                newOffspring--;
            }

            const children = species.reproduce(this.hist, this.sets, newOffspring);

            progeny.push(...children);
        }

        while (progeny.length < this.sets.popSize) {
            const champ = this.genomes[0].clone();
            champ.mutate(this.hist, this.sets);
            progeny.push(champ);
        }

        this.genomes = progeny;
        this.generations++;
    }

    speciatePopulation() {
        this.species.forEach((species) => {
            species.genomes = [];
        });

        outer: for (const genome of this.genomes) {
            for (const species of this.species) {
                if (species.maybeAccomodate(genome, this.sets)) {
                    species.addGenome(genome);
                    continue outer;
                }
            }

            const newSpecies = new Species(genome);
            this.species.push(newSpecies);
        }
    }
}


class NEATSettings {
    constructor(inputs, outputs, popSize) {
        for (const [field, val] of Object.entries({ Inputs: inputs, Outputs: outputs, PopSize: popSize })) {
            if (typeof val !== "number") {
                const err = `'${field}' field should be a number, Received ${typeof val}`;
                throw new Error(err);
            }

            if (val < 1) {
                const err = `${field} cannot be non-positive, got ${val}`;
                throw new Error(err);
            }
        }

        this.inputs = inputs;
        this.outputs = outputs;
        this.popSize = popSize;
        this.connMutRate = 0.05;
        this.nodeMutRate = 0.03;
        this.weightMutRate = 0.8;
        this.weightShiftRate = 0.9;
        this.crossGeneActiveRate = 0.25;
        this.progenyMutRatio = 0.25;
        this.disjointCoeff = 1;
        this.excessCoeff = 1;
        this.weightCoeff = 0.4;
        this.speciationThreshold = 3;
        this.allowedStagnancy = 15;
    }

    /**
     * Private Method.
     *
     * @param {string} field
     * @param {number} val
     * @memberof NEATSettings
     */
    _enforceNumber(field, val) {
        if (typeof val !== "number") {
            const err = `'${field}' should be a number. Got ${typeof val}.`;
            throw new Error(err);
        }
    }

    /**
     * Private Method.
     *
     * @param {string} field
     * @param {number} val
     * @memberof NEATSettings
     */
    _enforceProbabilistic(field, val) {
        this._enforceNumber(field, val);

        if (val < 0 || val > 1) {
            const err = `'${field}' should be between 0 and 1. Got ${val}.`;
            throw new Error(err);
        }
    }

    /**
     * Private Method.
     *
     * @param {string} field
     * @param {number} val
     * @memberof NEATSettings
     */
    _enforcePositive(field, val) {
        this._enforceNumber(field, val);

        if (val < 0) {
            const err = `'${field}' should have a positive value. Got ${val}`;
            throw new Error(err);
        }
    }

    /**
     * Sets the Connection Mutation Rate. Value should be between 0 and 1.
     *
     * @param {number} rate
     * @return {NEATSettings} 
     * @memberof NEATSettings
     */
    connMutRate(rate) {
        this._enforceProbabilistic("Connection Mutation Rate", val);

        this.connMutRate = val;

        return this;
    }

    /**
     * Sets the Node Mutation Rate. Value should be a number between 0 and 1.
     *
     * @param {number} val
     * @return {NEATSettings} 
     * @memberof NEATSettings
     */
    nodeMutRate(val) {
        this._enforceProbabilistic("Node Mutation Rate", val);

        this.nodeMutRate = val;

        return this;
    }

    /**
     * Sets the Weight Mutation Rate. Value should be between 0 and 1.
     *
     * @param {number} val
     * @return {NEATSettings} 
     * @memberof NEATSettings
     */
    weightMutRate(val) {
        this._enforceProbabilistic("Weight Mutation Rate", val);

        this.weightMutRate = val;

        return this;
    }

    /**
     * Sets the Weight Shift Rate. Value should be between 0 and 1.
     *
     * @param {number} val
     * @return {NEATSettings} 
     * @memberof NEATSettings
     */
    weightShiftRate(val) {
        this._enforceProbabilistic("Weight Shift Rate", val);

        this.weightShiftRate = val;

        return this;
    }

    /**
     * Sets the Partially ACtivated Crossover Gene Enabling Rate. Value must be between 0 and 1.
     *
     * @param {number} val
     * @return {NEATSettings} 
     * @memberof NEATSettings
     */
    crossGeneActiveRate(val) {
        this._enforceProbabilistic("Partially Activated Crossover Gene Enabling Rate", val);

        this.crossGeneActiveRate = val;

        return this;
    }

    /**
     * Percentage of members in natural selection offspring that are evolved simply
     * through mutation with no crossover. Value should be between 0 and 1;
     *
     * @param {number} val
     * @return {NEATSettings} 
     * @memberof NEATSettings
     */
    progenyMutRatio(val) {
        this._enforceProbabilistic("Mutated Progeny Ratio", val);

        this.progenyMutRatio = val;
        
        return this;
    }

    /**
     * The Disjoint Coefficient for Speciation.
     *
     * @param {number} val
     * @return {NEATSettings} 
     * @memberof NEATSettings
     */
    disjointCoeff(val) {
        this._enforcePositive("Disjoint Coefficient", val);

        this.disjointCoeff = val;

        return this;
    }

    /**
     * The Excess Coefficient for Speciation.
     *
     * @param {number} val
     * @return {NEATSettings} 
     * @memberof NEATSettings
     */
    excessCoeff(val) {
        this._enforcePositive("Excess Coefficient", val);

        this.excessCoeff = val;

        return this;
    }

    /**
     * The Weight Coefficient for Speciation.
     *
     * @param {number} val
     * @return {NEATSettings} 
     * @memberof NEATSettings
     */
    weightCoeff(val) {
        this._enforcePositive("Weight Coefficient", val);

        this.weightCoeff = val;

        return this;
    }

    /**
     * The Speciation Threshold for Speciation.
     *
     * @param {number} val
     * @memberof NEATSettings
     */
    speciationThreshold(val) {
        this._enforcePositive("Speciation Threshold", val);
    }

    /**
     * Maximum allowed stagnancy for a species before it's forcefully extinctified.
     *
     * @param {number} val
     * @return {NEATSettings} 
     * @memberof NEATSettings
     */
    allowedStagnancy(val) {
        this._enforcePositive("Allowed Stagnancy", val);

        this.allowedStagnancy = Math.floor(val);

        return this;
    }
}

const { gen } = require("../neat");

class Species {
    constructor(genome) {
        this.genomes = [genome];
        this.maxFitness = genome.fitness;
        this.avgFitness = genome.fitness;
        this.stagnancy = 0;
        this.repr = genome;
        this.assignedOffspring = 0;
    }

    /**
     * Adds a Genome to the Species.
     *
     * @param {Genome} genome
     * @memberof Species
     */
    addGenome(genome) {
        this.genomes.push(genome);
    }

    maybeAccomodate(genome, settings) {
        const genMaxInnov =
            genome.conns[genome.conns.length - 1].innov;
        const reprMaxInnov = this.repr.conns[
            this.repr.conns.length - 1
        ].innov;

        const [genes1, genes2] =
            genMaxInnov > reprMaxInnov
                ? [genome.conns, this.repr.conns]
                : [this.repr.conns, genome.conns];

        let ptr1 = 0;
        let ptr2 = 0;

        let matching = 0;
        let disjoint = 0;
        let excess = 0;
        let weightDiff = 0;

        while (genes1[ptr1]) {
            const g1 = genes1[ptr1];
            const g2 = genes2[ptr2];

            if (g1 && g2) {
                if (g1.innov === g2.innov) {
                    matching++;
                    weightDiff += Math.abs(g1.weight - g2.weight);
                    ptr1++;
                    ptr2++;
                } else if (g1.innov > g2.innov) {
                    disjoint++;
                    ptr2++;
                } else {
                    disjoint++;
                    ptr1++;
                }

                continue;
            }

            if (g1 && !g2) {
                excess++;
                ptr1++;
            }
        }

        if (matching === 0) return false;

        const n =
            genes1.length < 20 && genes2.length < 20
                ? 1
                : genes1.length > genes2.length
                ? genes1.length
                : genes2.length;

        const delta =
            (settings.disjointCoeff * disjoint) / n +
            (settings.excessCoeff * excess) / n +
            (settings.weightCoeff * weightDiff / matching);

        return delta < settings.speciationThreshold;
    }

    updateStagnancy() {
        if (this.genomes.length === 0) {
            this.stagnancy = Infinity;
            return;
        }

        if (this.genomes[0].fitness >= this.maxFitness) {
            this.stagnancy = 0;
            this.maxFitness = this.genomes[0].fitness;
        } else {
            this.stagnancy++;
        }
    }

    calculateAvgFitness() {
        const len = this.genomes.length;

        let totalFitness = 0;
        this.genomes.forEach(genome => {
            genome.fitness /= len;
            totalFitness += genome.fitness;
        });

        this.avgFitness = totalFitness / len;
    }

    reproduce(hist, settings, offspring) {
        const offsprings = [];

        for (let i = 0; i < offspring; i++) {
            if (this.genomes.length === 1) {
                const off = this.genomes[0].clone();
                off.mutate(hist, settings);
                offsprings.push(off);
                continue;
            }

            if (Math.random() < settings.progenyMutRatio) {
                const off = this.selectParent(this.genomes).clone();
                off.mutate(hist, settings);
                offsprings.push(off);
            } else {
                const parent1 = this.selectParent(this.genomes);
                const parent2 = this.selectParent(
                    this.genomes.filter((g) => g !== parent1)
                );

                const off = Genome.crossover(parent1, parent2, settings);
                off.mutate(hist, settings);

                offsprings.push(off);
            }
        }

        return offsprings;
    }

    cullLowerHalf() {
        const len = this.genomes.length;
        if (len > 2) {
            this.genomes = this.genomes.slice(
                0,
                len % 2 === 0 ? len / 2 : Math.floor(len / 2) + 1
            );
        }
    }

    selectParent(genomes) {
        let sumFitness = 0;
        genomes.forEach((genome) => (sumFitness += genome.fitness));

        const threshold = Math.random() * sumFitness;

        let current = 0;

        for (const genome of genomes) {
            current += genome.fitness;
            if (current >= threshold) {
                return genome;
            }
        }
    }
}


module.exports = { pop: NEAT, sets: NEATSettings, gen: Genome, innov: InnovationHistory }