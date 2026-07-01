const fs = require('fs');
const path = require('path');

const inputPath = path.join(__dirname, 'instrumented_logs.txt');
const outputPath = path.join(__dirname, 'clean_logs.txt');

const content = fs.readFileSync(inputPath, 'utf8');
const lines = content.split('\n');

const cleanLines = lines.map((line, idx) => {
    if (line.length > 500) {
        return `[Line ${idx + 1} - Length ${line.length}]: ` + line.substring(0, 200) + ' ... [TRUNCATED] ... ' + line.substring(line.length - 200);
    }
    return line;
});

fs.writeFileSync(outputPath, cleanLines.join('\n'), 'utf8');
console.log('Clean truncated logs written to clean_logs.txt!');
