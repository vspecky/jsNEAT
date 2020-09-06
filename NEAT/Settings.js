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