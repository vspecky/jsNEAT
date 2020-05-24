class OffspringHistory {
    constructor(innovationNumber, from, to, weight, enabled, fromLayer, toLayer) {
        this.innovationNumber = innovationNumber;
        this.from = from;
        this.to = to;
        this.weight = weight;
        this.enabled = enabled;
        this.fromLayer = fromLayer;
        this.toLayer = toLayer;
    }

    enable() {
        this.enabled = true;
    }

    disable() {
        this.enabled = false;
    }
}