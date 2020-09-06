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
