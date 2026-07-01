const ImageModule = require('docxtemplater-image-module-free');
const instance = new ImageModule({
    centered: false,
    fileType: "docx",
    getImage() {},
    getSize() {}
});
console.log("instance.name:", instance.name);
