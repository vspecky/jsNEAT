/*
Population Settings:
    General:
        populationSize: Integer (0, ...)
        inputSize: Integer (0, ...)
        outputSize: Integer (0, ...)

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

    Speciation:
        disjointCoefficient: Float (0, ...)
        excessCoefficient: Float (0, ...)
        weightCoefficient: Float (0, ...)
        speciationThreshold: Float (0, ...)
    
*/

const defaultSettings = {
    populationSize: 100,
    connectionMutationRate: 0.2,
    nodeMutationRate: 0.02,
    weightMutationRate: 0.8,
    weightShiftRate: 0.9,
    weightShiftMagnitude: 0.1,
    disabledGeneEnableProb: 0.25,
    disjointCoefficient: 1,
    excessCoefficient: 1,
    weightCoefficient: 1,
    speciationThreshold: 5
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

        this.genomes = [];

        for (let i = 0; i < this.settings.populationSize; i++) {
            this.genomes.push(new Genome(this.settings.inputSize, this.settings.outputSize));
        }

        this.innovationHistory = new InnovationHistory(sets.inputSize, sets.outputSize);

        this.species = [];
    }
}