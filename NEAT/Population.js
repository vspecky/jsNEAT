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

const defaultSettings = {
    populationSize: 100,
    gensToExtinction: Infinity,
    connectionMutationRate: 0.2,
    nodeMutationRate: 0.02,
    weightMutationRate: 0.8,
    weightShiftRate: 0.9,
    weightShiftMagnitude: 0.1,
    disabledGeneEnableProb: 0.25,
    onlyMutationRate: 0.25,
    disjointCoefficient: 1,
    excessCoefficient: 1,
    weightCoefficient: 0.4,
    speciationThreshold: 3,
    allowedStagnantGens: 15
};

class Population {
    constructor(sets) {
        this.settings = sets;
        if (!('inputSize' in this.settings) || !('outputSize' in this.settings)) {
            const err = "Please provide the 'inputSize' and 'outputSize' parameters in the settings.";
            throw new Error(err);
        }

        Object.keys(defaultSettings).forEach(setting => {
            if (!(setting in this.settings)) {
                this.settings[setting] = defaultSettings[setting];
            }
        });

        this.generations = 0;

        this.renaissance();
    }

    renaissance() {
        this.innovationHistory = new InnovationHistory(sets.inputSize, sets.outputSize);

        this.genomes = [];

        for (let i = 0; i < this.settings.populationSize; i++) {
            const newGenome = new Genome(this.settings.inputSize, this.settings.outputSize);
            newGenome.mutate(this.innovationHistory, this.settings);
            this.genomes.push(newGenome);
        }

        this.species = [];
        this.bestFitness = 0;
        this.bestGenome = null;

        this.renaissanceAllowed = this.settings.gensToExtinction > 0 && this.settings.gensToExtinction !== Infinity;
        this.stagnancy = 0;

        this.nextSpeciesID = 1;

        this.speciatePopulation();
    }

    nextGeneration() {
        this.generations++;
        this.genomes = this.genomes.sort((a, b) => b.fitness - a.fitness);
        this.sortSpecies();
        this.eliminateBadSpecies();
        this.eliminateStagnantSpecies();
        this.updateStagnancy();

        if (this.renaissanceAllowed && this.stagnancy === this.gensToExtinction) {
            this.renaissance();
            return this.genomes;
        }

        const nextPop = [];

        for (const species of this.species) {
            let offspringAllotted = Math.floor(species.avgFitness / totalAvgFitness * this.settings.populationSize);

            if (species.genomes.length > 5) {
                species.genomes[0].fitness = 0;
                nextPop.push(species.genomes[0]);
                offspringAllotted--;
            }

            for (let i = 0; i < offspringAllotted; i++) {
                nextPop.push(species.reproduce(this.innovationHistory, this.settings));
            }
        }

        while (nextPop.length < this.settings.populationSize) {
            nextPop.push(this.species[0].reproduce(this.innovationHistory, this.settings));
        }

        this.genomes = nextPop;
        this.speciatePopulation();

        return this.genomes;
    }

    updateStagnancy() {
        if (this.genomes[0].fitness > this.bestFitness) {
            this.bestFitness = this.genomes[0].fitness;
            this.bestGenome = this.genomes[0];
            this.stagnancy = 0;
            return;
        }

        this.stagnancy++;
    }

    sortSpecies() {
        this.species.forEach(species => {
            species.sortGenomes();
            species.calculateAvgFitness();
            species.updateStagnancy();
            species.setRepresentative();
        });
        this.species = this.species.sort((a, b) => b.avgFitness - a.avgFitness);
    }

    eliminateStagnantSpecies() {
        for (const species in this.species) {
            if (this.isStagnant(species)) {
                this.species = this.species.filter(s => s !== species);
            }
        }
    }

    eliminateBadSpecies() {
        const totalAvgFitness = this.getTotalAvgFitness();

        for (const species of this.species) {
            const offspringAllotted = Math.floor(species.avgFitness / totalAvgFitness * this.settings.populationSize);

            if (offspringAllotted < 1) {
                this.species = this.species.filter(s => s !== species);
            }
        }
    }

    getTotalAvgFitness() {
        let totalAvgFitness = 0;

        this.species.forEach(species => totalAvgFitness += species.avgFitness);

        return totalAvgFitness;
    }

    isStagnant(species) {
        return species.stagnancy < this.settings.allowedStagnantGens;
    }

    speciatePopulation() {
        this.species.forEach(species => {
            species.genomes = [];
        });

        for (const genome of this.genomes) {
            let speciesFound = false;

            for (const species of this.species) {
                if (species.maybeAccomodate(genome, this.settings)) {
                    species.addGenome(genome);
                    speciesFound = true;
                    break;
                }
            }

            if (!speciesFound) {
                const newSpecies = new Species(genome, this.nextSpeciesID++);
                this.species.push(newSpecies);
            }
        }
    }
}