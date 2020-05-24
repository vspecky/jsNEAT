class InnovationHistory {
    constructor(inputs, outputs) {
        this.nextNodeInnovNumber = inputs + outputs + 2;
        this.nextConnInnovNumber = outputs + 1;

        this.history = [];

        for (let i = 0; i < this.settings.outputSize; i++) {
            this.history.push(new ConnectionHistory(i + 1, inputs + 1, inputs + 2 + i));
        }
    }

    addConnection(fromNode, toNode) {
        const connection = new ConnectionGene(-1, fromNode, toNode, Math.random(), true);

        const existingConnection = this.history.find(conn => conn.equals(connection));

        if (!existingConnection) {
            connection.innovationNumber = this.nextConnInnovNumber;
            const newHistory = new ConnectionHistory(
                this.nextConnInnovNumber,
                fromNode.innovationNumber,
                toNode.innovationNumber
            );
            this.history.push(newHistory);
            this.nextConnInnovNumber++;
            return connection;

        } else {
            connection.innovationNumber = existingConnection.innovationNumber;
            return connection;
        }
    }
}