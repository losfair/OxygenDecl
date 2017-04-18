const parser = require("./parser.js");
const fs = require("fs");

const input = fs.readFileSync(process.argv[2], "utf-8");
console.log(JSON.stringify(parser.parse(input), null, 4));
