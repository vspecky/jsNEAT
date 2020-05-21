class ConnectionHistory {
    constructor(innovationNumber, from, to, weight=undefined, enabled=undefined) {
        this.innovationNumber = innovationNumber;
        this.from = from;
        this.to = to;
        this.weight = weight;
        this.enabled = enabled;
    }
}