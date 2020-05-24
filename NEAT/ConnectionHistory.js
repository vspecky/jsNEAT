class ConnectionHistory {
    constructor(innovationNumber, from, to) {
        this.innovationNumber = innovationNumber;
        this.from = from;
        this.to = to;
    }

    enable() {
        this.enabled = true;
    }

    disable() {
        this.enabled = false;
    }

    equals(conn) {
        if (conn instanceof ConnectionHistory) {
            return this.from === conn.from && this.to === conn.to;

        } else if (conn instanceof ConnectionGene) {
            return this.from === conn.fromNode.innovationNumber &&
                    this.to === conn.toNode.innovationNumber;

        } else return false;
    }
}