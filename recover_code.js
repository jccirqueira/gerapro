const fs = require('fs');
const data = JSON.parse(fs.readFileSync('step_279.json', 'utf8'));
const code = data.tool_calls[0].args.CodeContent;
// Code is a string that represents a JSON string (escaped)
// Wait, CodeContent is already a string in the JSON.
// If I parse it, I should get the actual code.
// But it might be doubly escaped if it was stringified into the JSON.
try {
    // If it's something like "\"import ...\"", we need to parse it as JSON to unescape.
    const unescaped = JSON.parse(code);
    fs.writeFileSync('recovered_propostaTecnica.js', unescaped);
} catch (e) {
    // If it fails, maybe it wasn't doubly escaped.
    fs.writeFileSync('recovered_propostaTecnica.js', code);
}
