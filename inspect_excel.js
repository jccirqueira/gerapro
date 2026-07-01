const ExcelJS = require('exceljs');

async function inspectFormulas() {
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile('DVT260006-PTC_00.xlsm');

    workbook.eachSheet((sheet, id) => {
        if (sheet.name === 'PC' || sheet.name.includes('Custos')) {
            console.log(`\n=== PLANILHA: ${sheet.name} ===`);
            sheet.eachRow((row, rowNumber) => {
                let rowData = `Row ${rowNumber}: `;
                let hasImportantData = false;

                row.eachCell((cell, colNumber) => {
                    if (cell.type === ExcelJS.ValueType.Formula) {
                        hasImportantData = true;
                        rowData += `[Col ${colNumber}: FORMULA -> ${cell.formula} = ${cell.result}] `;
                    } else if (cell.value && typeof cell.value === 'string') {
                        // Print labels that might indicate totals, margins, taxes
                        const valLower = cell.value.toLowerCase();
                        if (valLower.includes('imposto') || valLower.includes('margem') ||
                            valLower.includes('total') || valLower.includes('lucro') ||
                            valLower.includes('custo') || valLower.includes('venda') ||
                            valLower.includes('desconto')) {
                            hasImportantData = true;
                            rowData += `[Col ${colNumber}: LABEL -> ${cell.value}] `;
                        }
                    } else if (cell.value && typeof cell.value === 'number') {
                        rowData += `[Col ${colNumber}: NUM -> ${cell.value}] `;
                    }
                });

                if (hasImportantData) console.log(rowData);
            });
        }
    });
}

inspectFormulas().catch(err => console.error(err));
