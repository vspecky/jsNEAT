const { readFileSync, readdirSync, writeFileSync } = require("fs");
const { join } = require("path");

const files = readdirSync(join(__dirname, "NEAT"));

let outString = "";

for (const file of files) {
    outString += `${readFileSync(join(__dirname, "NEAT", file))}\n\n`;
}

outString += "module.exports = { pop: NEAT, sets: NEATSettings, gen: Genome, innov: InnovationHistory }";

writeFileSync(join(__dirname, "neat.js"), outString);