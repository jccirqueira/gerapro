const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// DVT260006-PTC_00.xlsm is essentially a zip file. Let's unzip it to a temp dir
const tempDir = path.join(__dirname, 'temp_excel_extract');
if (fs.existsSync(tempDir)) {
    fs.rmSync(tempDir, { recursive: true, force: true });
}
fs.mkdirSync(tempDir);

try {
    // Unzip the xlsm file
    execSync(`powershell -command "Expand-Archive -Path 'DVT260006-PTC_00.xlsm' -DestinationPath '${tempDir}'"`);

    // The sheets are in xl/worksheets/
    const sheetsDir = path.join(tempDir, 'xl', 'worksheets');
    const files = fs.readdirSync(sheetsDir);

    // We want the shared strings too
    const sharedStringsPath = path.join(tempDir, 'xl', 'sharedStrings.xml');
    let sharedStrings = [];
    if (fs.existsSync(sharedStringsPath)) {
        const ssContent = fs.readFileSync(sharedStringsPath, 'utf8');
        // Super basic regex to pull all <t> tags
        const tRegex = /<t[^>]*>(.*?)<\/t>/g;
        let match;
        while ((match = tRegex.exec(ssContent)) !== null) {
            sharedStrings.push(match[1]);
        }
    }

    files.filter(f => f.endsWith('.xml')).forEach(file => {
        const content = fs.readFileSync(path.join(sheetsDir, file), 'utf8');

        // Let's dump the formulas or specific keywords
        // <f> tags are formulas, <v> are values
        const rowRegex = /<row r="(\d+)"[^>]*>(.*?)<\/row>/g;
        let rMatch;
        console.log(`\n=== Sheet: ${file} ===`);

        while ((rMatch = rowRegex.exec(content)) !== null) {
            const rowNum = rMatch[1];
            const rowData = rMatch[2];

            const cellRegex = /<c r="([A-Z]+)(\d+)"[^>]*t="([a-z])"?[^>]*>.*?<v>(.*?)<\/v><\/c>/g;
            const formulaRegex = /<c r="([A-Z]+)(\d+)"[^>]*>.*?<f>(.*?)<\/f>.*?<\/c>/g;

            let hasInteresting = false;
            let logStr = `Row ${rowNum}: `;

            // Check strings
            let cMatch;
            while ((cMatch = cellRegex.exec(rowData)) !== null) {
                const colLetter = cMatch[1];
                const type = cMatch[3];
                const valIndex = parseInt(cMatch[4], 10);
                if (type === 's' && !isNaN(valIndex) && sharedStrings[valIndex]) {
                    const txt = sharedStrings[valIndex].toLowerCase();
                    if (txt.includes('imposto') || txt.includes('margem') || txt.includes('lucro') || txt.includes('custo') || txt.includes('total') || txt.includes('venda')) {
                        hasInteresting = true;
                        logStr += `[Col ${colLetter}: LABEL -> ${sharedStrings[valIndex]}] `;
                    }
                }
            }

            // Check formulas
            let fMatch;
            while ((fMatch = formulaRegex.exec(rowData)) !== null) {
                hasInteresting = true;
                const colLetter = fMatch[1];
                const formulaStr = fMatch[3];
                logStr += `[Col ${colLetter}: FORMULA -> ${formulaStr}] `;
            }

            if (hasInteresting) {
                console.log(logStr);
            }
        }
    });

} catch (err) {
    console.error("Error inspecting XLSM:", err);
} finally {
    if (fs.existsSync(tempDir)) {
        fs.rmSync(tempDir, { recursive: true, force: true });
    }
}
