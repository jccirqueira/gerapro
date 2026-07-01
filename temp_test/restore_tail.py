import os

tail = r"""                        }
                    });

                    return eqData;
                }),
                
                // Itens de Escopo (Loop no Word)
                escopo: (data.scopeItems || []).map(item => ({
                    desc: item.desc || '',
                    dvt: item.dvt ? 'X' : '',
                    cliente: item.cli ? 'X' : ''
                }))
            };

            // Adicionar campos globais em maiúsculo (Strings e Arrays)
            Object.keys(templateData).forEach(key => {
                const val = templateData[key];
                if (typeof val === 'string' || Array.isArray(val)) {
                    templateData[key.toUpperCase()] = val;
                }
            });

            // Carregar Template
            const response = await fetch('TEMPLATE_TEC.docx?v=' + Date.now());
            if (!response.ok) throw new Error('Template TEMPLATE_TEC.docx não encontrado.');
            const arrayBuffer = await response.arrayBuffer();

            const zip = new ZipLib(arrayBuffer);

            // Configurar Módulo de Imagem
            let modules = [];
            if (ImageModule) {
                const imageOpts = {
                    centered: false,
                    getImage(tagValue) {
                        const TINI_PNG = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=";
                        if (!tagValue || typeof tagValue !== 'string' || !tagValue.includes('base64')) {
                            return base64ToBuffer(TINI_PNG);
                        }
                        return base64ToBuffer(tagValue) || base64ToBuffer(TINI_PNG);
                    },
                    getSize(img, tagValue, tagName) {
                        const name = tagName.toLowerCase();
                        if (name.includes('client_logo')) return [264, 105];
                        if (name.includes('logo')) return [150, 60];
                        if (name.includes('watermark')) return [600, 600];
                        return [100, 100];
                    }
                };
                modules.push(new ImageModule(imageOpts));
            }

            const doc = new DocxLib(zip, {
                paragraphLoop: true,
                linebreaks: true,
                modules: modules,
                nullGetter: () => ""
            });

            doc.setData(templateData);
            doc.render();

            const out = doc.getZip().generate({
                type: "blob",
                mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            });

            const fileName = `Proposta_Tecnica_${data.projeto || 'GeraPro'}.docx`;
            const url = window.URL.createObjectURL(out);
            const a = document.createElement("a");
            a.href = url;
            a.download = fileName;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);

            app.toast('Download concluído!', 'success');
        } catch (e) {
            console.error(e);
            app.toast('Erro na exportação: ' + e.message, 'error');
        }
    }
};

PropostaTecnicaModule.init();
export { PropostaTecnicaModule };
"""

with open('js/propostaTecnica.js', 'a', encoding='utf-8') as f:
    f.write(tail)

content = open('js/propostaTecnica.js', encoding='utf-8').read()
total_lines = content.count('\n')
print(f'File restored. Total lines: {total_lines}')
print("Has PropostaTecnicaModule.init():", 'PropostaTecnicaModule.init()' in content)
print("Has export:", 'export { PropostaTecnicaModule }' in content)
print("Has exportToWord function:", 'async exportToWord()' in content)
