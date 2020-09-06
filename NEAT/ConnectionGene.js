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