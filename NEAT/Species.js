class Species {
    constructor(genome, speciesID) {
        this.genomes = [genome];
        this.maxFitness = genome.fitness;
        this.avgFitness = genome.fitness;
        this.speciesID = speciesID;
        genome.setSpecies(speciesID);
        this.setRepresentative();
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

    setRepresentative() {
        this.representative = this.genomes[Math.floor(Math.random() * this.genomes.length)];
    }

    maybeAccomodate(genome, speciationThreshold, disjointFactor, excessFactor, weightFactor) {
        const genome1 = this.representative.allConnections;
        const genome2 = genome.allConnections;

        let p1 = 0;
        let p2 = 0;
        let disjointGenes = 0;
        let excessGenes = 0;
        let weightDifference = 0;

        while (p1 < genome1.length && p2 < genome2.length) {
            const gene1 = genome1[p1];
            const gene2 = genome2[p2];

            if (gene1.innovationNumber === gene2.innovationNumber) {
                weightDifference += Math.abs(gene1.weight - gene2.weight);
                
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

        const maxGenes = Math.max(genome1.length, genome2.length);
        const N = maxGenes > 20 ? maxGenes : 1;
        const delta = (disjointFactor * disjointGenes / N) +
            (excessFactor * excessGenes / N) +
            (weightFactor * weightDifference);

        if (delta < speciationThreshold) {
            this.addGenome(genome);
            return true;
        }

        return false;
    }

    sortGenomes() {
        this.genomes = this.genomes.sort((a, b) => b.fitness - a.fitness);
    }
}