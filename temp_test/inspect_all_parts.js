const PizZip = require('pizzip');
const Docxtemplater = require('docxtemplater');
const ImageModule = require('docxtemplater-image-module-free');
const fs = require('fs');
const path = require('path');

const zip = new PizZip(fs.readFileSync(path.join(__dirname, "..", "TEMPLATE_TEC.docx")));
const imageOpts = {
    centered: false,
    fileType: "docx",
    getImage: () => Buffer.alloc(0),
    getSize: () => [100, 100]
};
const imgModule = new ImageModule(imageOpts);

const doc = new Docxtemplater(zip, {
    paragraphLoop: true,
    linebreaks: true,
    modules: [imgModule]
});

doc.compile();

console.log("Keys of doc.compiled:", Object.keys(doc.compiled || {}));
if (doc.compiled) {
    for (const key in doc.compiled) {
        const compiledFile = doc.compiled[key];
        console.log(`File: ${key}`);
        if (compiledFile.parsed) {
            console.log(`  Parsed length: ${compiledFile.parsed.length}`);
            const placeholders = compiledFile.parsed.filter(p => p.type === 'placeholder');
            console.log(`  Placeholders length: ${placeholders.length}`);
            placeholders.forEach(p => console.log(`    Placeholder:`, JSON.stringify(p)));
        }
    }
}
