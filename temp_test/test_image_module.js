const PizZip = require('pizzip');
const Docxtemplater = require('docxtemplater');
const ImageModule = require('docxtemplater-image-module-free');

const fs = require('fs');
const path = require('path');
const zip = new PizZip(fs.readFileSync(path.join(__dirname, "..", "TEMPLATE_TEC.docx")));

let logs = [];
const imageOpts = {
    centered: false,
    fileType: "docx",
    getImage(tagValue, tagName) {
        logs.push(`getImage called for: ${tagName} with value length: ${tagValue ? tagValue.length : 0}`);
        return Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=", "base64");
    },
    getSize(img, tagValue, tagName) {
        logs.push(`getSize called for: ${tagName}`);
        return [100, 100];
    }
};
const imgModule = new ImageModule(imageOpts);

// Wrap the parse and render methods to log their executions
const originalParse = imgModule.parse;
imgModule.parse = function(placeHolderContent) {
    const res = originalParse.apply(this, arguments);
    if (placeHolderContent.includes("logo")) {
        logs.push(`parse called for: "${placeHolderContent}" => returned: ${JSON.stringify(res)}`);
    }
    return res;
};

const originalRender = imgModule.render;
imgModule.render = function(part, options) {
    if (part.value && part.value.includes("logo")) {
        logs.push(`render called for part: ${JSON.stringify(part)}`);
        // Check what value is in the scope
        const val = options.scopeManager.getValue(part.value, { part });
        logs.push(` - scope value for "${part.value}": type=${typeof val}, valueExists=${val !== undefined && val !== null}, value=${JSON.stringify(val)}`);
    }
    const res = originalRender.apply(this, arguments);
    if (part.value && part.value.includes("logo")) {
        logs.push(` - render returned: ${JSON.stringify(res)}`);
    }
    return res;
};

const doc = new Docxtemplater(zip, {
    paragraphLoop: true,
    linebreaks: true,
    modules: [imgModule]
});

doc.setData({
    client_logo_img: "data:image/png;base64,iVBORw0KGgoAAA="
});

try {
    logs.push("Compiling...");
    doc.compile();
    logs.push("Rendering...");
    doc.render();
    logs.push("Render completed successfully!");
} catch (e) {
    logs.push(`Render failed: ${e.message}`);
}

fs.writeFileSync(path.join(__dirname, "instrumented_logs.txt"), logs.join("\n"), "utf-8");
console.log("Logs written to instrumented_logs.txt!");
