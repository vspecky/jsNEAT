class Species {
    constructor(genome, speciesID) {
        this.genomes = [genome];
        this.maxFitness = genome.fitness;
        this.avgFitness = genome.fitness;
        this.speciesID = speciesID;
        genome.setSpecies(speciesID);
        this.stagnancy = 0;
        this.representative = genome;
    }

    /**
     * Adds a Genome to the Species.
     *
     * @param {Genome} genome
     * @memberof Species
     */
    addGenome(genome) {
        genome.setSpecies(this.speciesID);
        this.genomes.push(genome);
    }

    maybeAccomodate(genome, settings) {
        const genome1 = this.representative.connections;
        const genome2 = genome.connections;

        let p1 = 0;
        let p2 = 0;
        let disjointGenes = 0;
        let excessGenes = 0;
        let weightDifference = 0;
        let matchingGenes = 0;

        while (p1 < genome1.length && p2 < genome2.length) {
            const gene1 = genome1[p1];
            const gene2 = genome2[p2];

            if (gene1.innovationNumber === gene2.innovationNumber) {
                weightDifference += Math.abs(gene1.weight - gene2.weight);
                matchingGenes++;
                
                const p1Last = p1 === genome1.length - 1;
                const p2Last = p2 === genome2.length - 1;

                if (p1Last && p2Last) break;
                if (!p1Last) p1++;
                if (!p2Last) p2++;

            } else if (gene1.innovationNumber > gene2.innovationNumber) {
                if (p2 === genome2.length - 1) {
                    excessGenes++;
                    p1++;
                }
                else {
                    disjointGenes++;
                    p2++;
                }

            } else {
                if (p1 === genome1.length - 1) {
                    excessGenes++;
                    p2++;
                }
                else {
                    disjointGenes++;
                    p1++;
                }
            }
        }

        if (matchingGenes === 0) return false;

        const a = settings.disjointFactor;
        const b = settings.excessFactor;
        const c = settings.weightFactor;

        const maxGenes = Math.max(genome1.length, genome2.length);
        const N = maxGenes > 20 ? maxGenes : 1;
        const delta = (a * disjointGenes / N) +
            (b * excessGenes / N) +
            (c * weightDifference / matchingGenes);

        return delta <= settings.speciationThreshold;
    }

    sortGenomes() {
        this.genomes = this.genomes.sort((a, b) => b.fitness - a.fitness);
    }

    updateStagnancy() {
        if (this.genomes[0].fitness >= this.maxFitness) {
            this.stagnancy = 0;
            this.maxFitness = this.genomes[0].fitness;
            this.representative = this.genomes[0];

        } else {
            this.stagnancy++;
        }
    }

    setRepresentative() {
        this.representative = this.genomes[0];
    }

    calculateAvgFitness() {
        let totalFitness = 0;

        this.genomes.forEach(genome => {
            genome.fitness /= this.genomes.length;
            totalFitness += genome.fitness;
        });

        this.avgFitness = totalFitness / this.genomes.length;
    }

    reproduce(innovationHistory, settings) {
        const parent1 = this.selectParent();
        const parent2 = Math.random() < settings.onlyMutationRate
                        ? parent1
                        : this.selectParent();

        const offspringGenes = Genome.crossover(parent1, parent2, settings);
        const offspring = Genome.build(parent1.inputs, parent1.outputs, offspringGenes);

        offspring.mutate(innovationHistory, settings);

        return offspring;
    }

    selectParent() {
        let sumFitness = 0;
        this.genomes.forEach(genome => sumFitness += genome.fitness);

        const threshold = Math.random() * sumFitness;

        let current = 0;

        for (const genome of this.genomes) {
            current += genome.fitness;
            if (current >= threshold) {
                return genome;
            }
        }
    }
}