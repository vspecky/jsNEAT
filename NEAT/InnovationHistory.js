class InnovationHistory {
    constructor(inputs, outputs) {
        this.nextNodeInnovNumber = inputs + outputs + 2;
        this.nextConnInnovNumber = 1;

        this.history = [];
    }

    addConnection(fromNode, toNode) {
        const existingConnection = this.history.find(conn => conn.equals(connection));

        if (!existingConnection) {
            const newHistory = new ConnectionHistory(
                this.nextConnInnovNumber,
                fromNode.innovationNumber,
                toNode.innovationNumber
            );
            this.history.push(newHistory);
            const innovationNumber = this.nextConnInnovNumber;
            this.nextConnInnovNumber++;
            return innovationNumber;

        } else {
            return existingConnection.innovationNumber;
        }
    }

    addNodeOn(connection) {
        const fromNode = connection.fromNode;
        const toNode = connection.toNode;

        const fromConnections = this.history.filter(conn => conn.from === fromNode.innovationNumber);
        const toConnections = this.history.filter(conn => conn.to === toNode.innovationNumber);

        let existingConn1;
        let existingConn2;

        connLoop: for (const fromConn of fromConnections) {
            for (const toConn of toConnections) {
                if (fromConn.to === toConn.from) {
                    existingConn1 = fromConn;
                    existingConn2 = toConn;
                    break connLoop;
                }
            }
        }

        if (existingConn1) {
            return {
                conn1: existingConn1.innovationNumber,
                conn2: existingConn2.innovationNumber,
                node: existingConn1.to
            };
        }

        const node = this.nextNodeInnovNumber++;
        const conn1 = this.nextConnInnovNumber++;
        const conn2 = this.nextConnInnovNumber++;

        this.history.push(new ConnectionHistory(conn1, fromNode.innovationNumber, node));
        this.history.push(new ConnectionHistory(conn2, node, toNode.innovationNumber));

        return { conn1, conn2, node };
    }
}