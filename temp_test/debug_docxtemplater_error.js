const fs = require('fs');
const path = require('path');
const PizZip = require('pizzip');
const Docxtemplater = require('docxtemplater');
const ImageModule = require('docxtemplater-image-module-free');

const docsDir = "c:\\Users\\usuario\\Documents";
const entries = fs.readdirSync(docsDir);
const ptcFolder = entries.find(e => e.includes("1488"));
const jsonPath = path.join(docsDir, ptcFolder, "Documentação Minha_Empresa", "Rev1", "PropostaTecnica.json");

console.log("Loading proposal data...");
const data = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));

const templatePath = path.join(__dirname, "..", "TEMPLATE_TEC.docx");
const templateBuffer = fs.readFileSync(templatePath);

const base64ToBuffer = (base64) => {
    if (!base64) return null;
    const base64String = base64.split(',')[1] || base64;
    return Buffer.from(base64String, 'base64');
};

const templateData = {
    projeto: data.projeto || '',
    cliente: data.cliente || '',
    objeto: data.objeto || '',
    localizacao: data.localizacao || '',
    aos_cuidados: data.aos_cuidados || '',
    email: data.email || '',
    telefone: data.telefone || '',
    data_emissao: new Date().toLocaleDateString('pt-BR'),
    revisao: '00',
    codigo: data.codigo || '',
    revisoes: [],
    logo_img: '',
    client_logo_img: '',
    watermark_img: '',
    tem_eletrocentro: true,
    escopo_eletrocentro: [],
    lista_paineis: [],
    escopo: []
};

const zip = new PizZip(templateBuffer);
const imageOpts = {
    centered: false,
    getImage(tagValue) {
        return base64ToBuffer(tagValue);
    },
    getSize() {
        return [100, 100];
    }
};
const imgModule = new ImageModule(imageOpts);

try {
    const doc = new Docxtemplater(zip, {
        paragraphLoop: true,
        linebreaks: true,
        modules: [imgModule],
        nullGetter: () => ""
    });

    doc.setData(templateData);
    doc.render();
    console.log("SUCCESS! No errors during docxtemplater render in node simulation.");
} catch (error) {
    console.error("FAILED! Docxtemplater thrown error:");
    console.error("Message:", error.message);
    if (error.properties && error.properties.errors) {
        console.error("Detailed Errors count:", error.properties.errors.length);
        error.properties.errors.forEach((err, idx) => {
            console.error(`Error #${idx + 1}:`);
            console.error("  ID:", err.id);
            console.error("  Name:", err.name);
            console.error("  Message:", err.message);
            console.error("  Properties:", JSON.stringify(err.properties || {}));
        });
    } else {
        console.error("Error properties:", error.properties);
    }
}
