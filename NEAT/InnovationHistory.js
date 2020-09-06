class InnovationHistory {
    constructor(inputs, outputs) {
        this.nextNodeInnov = inputs + outputs + 2;
        this.nextConnInnov = (inputs + 1) * outputs + 1;

        this.history = [];

        let innov = 1;
        for (let i = 1; i < inputs + 2; i++) {
            for (let j = inputs + 2; j < inputs + outputs + 2; j++) {
                this.history.push(new ConnectionHistory(innov, i, j));
                innov++;
            }
        }
    }

    addConnection(from, to) {
        const existingConnection = this.history.find(conn => conn.from === from && conn.to === to);

        if (!existingConnection) {
            const newHistory = new ConnectionHistory(
                this.nextConnInnov,
                from,
                to,
            );
            this.history.push(newHistory);
            const innov = this.nextConnInnov;
            this.nextConnInnov++;
            return innov;

        } else {
            return existingConnection.innov;
        }
    }

    addNode(connection) {
        const from = connection.from;
        const to = connection.to;

        const fromConnections = this.history.filter(conn => conn.from === from);
        const toConnections = this.history.filter(conn => conn.to === to);

        for (const conn1 of fromConnections) {
            for (const conn2 of toConnections) {
                if (conn1.to === conn2.from) {
                    return {
                        left: conn1.innov,
                        right: conn2.innov,
                        node: conn1.to
                    };
                }
            }
        }

        const left = this.nextConnInnov++;
        const right = this.nextConnInnov++;
        const node = this.nextNodeInnov++;

        this.history.push(new ConnectionHistory(left, connection.from, node));
        this.history.push(new ConnectionHistory(right, node, connection.to));

        return { left, right, node };
    }
}