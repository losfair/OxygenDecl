const lib = require("./main.js");
const fs = require("fs");

const input = fs.readFileSync(process.argv[2], "utf-8");
console.log(lib.parser.parse(input));
