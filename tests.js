const neat = require("./neat");
const Genome = neat.gen;

const sets = new neat.sets(2, 1, 150);
const hist = new neat.innov(3, 2);
const pop = new neat.pop(sets);
const gen = new Genome(3, 2, false);

gen.conns.forEach(conn => {
    conn.weight = 1;
});

for (const g of pop.genomes) {
    const o1 = g.feedForward([0, 0])[0];
    g.addFitness(1 - o1);

    const o2 = g.feedForward([0, 1])[0];
    g.addFitness(o2)

    const o3 = g.feedForward([1, 0])[0];
    g.addFitness(o3);

    const o4 = g.feedForward([1, 1])[0];
    g.addFitness(1 - o4);
}

pop.nextGeneration();