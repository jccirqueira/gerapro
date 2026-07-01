const fs = require('fs');
const path = require('path');
const PizZip = require('pizzip');
const Docxtemplater = require('docxtemplater');
const ImageModule = require('docxtemplater-image-module-free');

const docsDir = "c:\\Users\\usuario\\Documents";
const entries = fs.readdirSync(docsDir);
const ptcFolder = entries.find(e => e.includes("1488"));
const jsonPath = path.join(docsDir, ptcFolder, "Documentação Minha_Empresa", "Rev1", "PropostaTecnica.json");

console.log("Loading proposal data from:", jsonPath);
const data = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));

const templatePath = path.join(__dirname, "..", "TEMPLATE_TEC.docx");
const templateBuffer = fs.readFileSync(templatePath);

const base64ToBuffer = (base64) => {
    if (!base64) return null;
    const base64String = base64.split(',')[1] || base64;
    try {
        return Buffer.from(base64String, 'base64');
    } catch (e) {
        console.error("Error decoding base64:", e);
        return null;
    }
};

function runSimulation(isFixed, outputPath) {
    console.log(`Running simulation (isFixed=${isFixed})`);
    
    const templateData = {
        projeto: data.projeto || '',
        cliente: data.cliente || '',
        objeto: data.objeto || '',
        localizacao: data.localizacao || '',
        aos_cuidados: data.aos_cuidados || '',
        email: data.email || '',
        telefone: data.telefone || '',
        data_emissao: new Date().toLocaleDateString('pt-BR'),
        revisao: data.revisions?.length > 0 ? data.revisions[data.revisions.length - 1].no : '00',
        codigo: data.codigo || '',
        revisoes: (data.revisions || []).map(r => ({
            no: r.no || '',
            desc: r.desc || '',
            elab: r.elab || '',
            verif: r.verif || '',
            aprov: r.aprov || '',
            data: r.data || ''
        })),
        
        logo_img: data.logo_base64 || '',
        client_logo_img: data.client_logo_base64 || '',
        watermark_img: data.watermark_base64 || '',
        
        lista_paineis: [],
        escopo: []
    };

    // Spread upper-case keys
    Object.keys(templateData).forEach(key => {
        const val = templateData[key];
        if (typeof val === 'string' || Array.isArray(val)) {
            templateData[key.toUpperCase()] = val;
        }
    });

    const zip = new PizZip(templateBuffer);
    
    const imageOpts = {
        centered: false,
        getImage(tagValue, tagName) {
            console.log(`[getImage] called for tag: ${tagName}, tagValue length: ${tagValue ? tagValue.length : 0}`);
            if (isFixed) {
                const TINI_PNG = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=";
                if (!tagValue || !tagValue.includes('base64')) {
                    return base64ToBuffer(TINI_PNG);
                }
                return base64ToBuffer(tagValue);
            } else {
                if (!tagValue || !tagValue.includes('base64')) return null;
                return base64ToBuffer(tagValue);
            }
        },
        getSize(img, tagValue, tagName) {
            console.log(`[getSize] called for tag: ${tagName}`);
            if (isFixed) {
                if (!tagValue || !tagValue.includes('base64')) {
                    return [1, 1];
                }
            }
            const name = tagName.toLowerCase();
            if (name.includes('client_logo')) return [264, 105];
            if (name.includes('logo')) return [150, 60];
            if (name.includes('watermark')) return [600, 600];
            return [100, 100];
        }
    };
    const imgModule = new ImageModule(imageOpts);

    const doc = new Docxtemplater(zip, {
        paragraphLoop: true,
        linebreaks: true,
        modules: [imgModule],
        nullGetter: () => ""
    });

    doc.setData(templateData);
    doc.render();

    const out = doc.getZip().generate({
        type: "nodebuffer",
        mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    });

    fs.writeFileSync(outputPath, out);
    console.log("Generated document successfully!\n");
}

try {
    runSimulation(false, path.join(__dirname, "..", "output_rev1_corrupt.docx"));
} catch (err) {
    console.error("Simulation with original code failed during generation:", err);
}

try {
    runSimulation(true, path.join(__dirname, "..", "output_rev1_fixed.docx"));
} catch (err) {
    console.error("Simulation with fixed code failed during generation:", err);
}
