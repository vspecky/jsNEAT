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
