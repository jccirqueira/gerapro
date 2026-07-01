const PizZip = require('pizzip');
const Docxtemplater = require('docxtemplater');
const ImageModule = require('docxtemplater-image-module-free');
const fs = require('fs');
const path = require('path');

const backupPath = "c:\\Users\\usuario\\Documents\\GeraPro\\TEMPLATE_TEC.docx";
const zip = new PizZip(fs.readFileSync(backupPath));

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
        if (compiledFile.parsed) {
            const placeholders = compiledFile.parsed.filter(p => p.type === 'placeholder');
            if (placeholders.length > 0) {
                console.log(`File: ${key} - Found ${placeholders.length} placeholders`);
                placeholders.forEach(p => {
                    if (p.value.toLowerCase().includes('logo') || p.value.toLowerCase().includes('cliente')) {
                        console.log(`  Placeholder:`, JSON.stringify(p));
                    }
                });
            }
        }
    }
}
