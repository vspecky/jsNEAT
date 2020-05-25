class ConnectionGene {
    constructor(innovationNumber, fromNode, toNode, weight, enabled=true) {
        this.innovationNumber = innovationNumber;
        this.fromNode = fromNode;
        this.toNode = toNode;
        this.weight = weight;
        this.enabled = enabled;

        // Add the connection gene to the from node's array. No hassle
        this.fromNode.connections.push(this);
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
     * @param {Object} settings
     * @memberof ConnectionGene
     */
    mutateWeight(settings) {
        if (Math.random() < settings.weightShiftRate) {
            const mag = settings.weightShiftMagnitude;
            this.weight += Math.random() < 5 ? mag : -mag;

        } else {
            this.weight = Math.random();
        }
    }
}