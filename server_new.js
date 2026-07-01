const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const ExcelJS = require('exceljs');
const { PDFParse } = require('pdf-parse');
const mammoth = require('mammoth');
const XLSX = require('xlsx');
const nodemailer = require('nodemailer');
const TelegramBot = require('node-telegram-bot-api');
const DxfParser = require('dxf-parser');
const crypto = require('crypto');

// Mail encryption helpers
const MAIL_ENCRYPTION_KEY = process.env.MAIL_ENCRYPTION_KEY || 'GeraPro-Mail-Encrypt-Key-2026!';

function encryptMailPass(password) {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv('aes-256-cbc', crypto.scryptSync(MAIL_ENCRYPTION_KEY, 'mail-salt', 32), iv);
    let enc = cipher.update(password, 'utf8', 'hex');
    enc += cipher.final('hex');
    return iv.toString('hex') + ':' + enc;
}

function decryptMailPass(encrypted) {
    try {
        const parts = encrypted.split(':');
        const iv = Buffer.from(parts[0], 'hex');
        const enc = parts[1];
        const decipher = crypto.createDecipheriv('aes-256-cbc', crypto.scryptSync(MAIL_ENCRYPTION_KEY, 'mail-salt', 32), iv);
        let dec = decipher.update(enc, 'hex', 'utf8');
        dec += decipher.final('utf8');
        return dec;
    } catch (e) {
        console.warn('[Mail] Failed to decrypt password, trying raw');
        return encrypted;
    }
}

// --- Email send abstractions (multi-provider) ---

function sendEmail(settings, { to, cc, bcc, subject, html, attachments }) {
    if (settings.provider === 'sendgrid') {
        return sendViaSendGrid(settings, { to, cc, bcc, subject, html, attachments });
    }
    return sendViaSMTP(settings, { to, cc, bcc, subject, html, attachments });
}

function sendViaSMTP(settings, { to, cc, bcc, subject, html, attachments }) {
    const storedPass = decryptMailPass(settings.pass || '');
    const transporter = nodemailer.createTransport({
        host: settings.host,
        port: settings.port,
        secure: settings.secure === 1,
        auth: { user: settings.user, pass: storedPass }
    });
    const mailAttachments = (attachments || []).map(a => ({
        filename: a.filename,
        content: Buffer.from(a.content, a.encoding || 'base64'),
        contentType: a.contentType
    }));
    return transporter.sendMail({
        from: `"${settings.from_name}" <${settings.from_email}>`,
        to: Array.isArray(to) ? to.join(', ') : to,
        cc: cc ? (Array.isArray(cc) ? cc.join(', ') : cc) : undefined,
        bcc: bcc ? (Array.isArray(bcc) ? bcc.join(', ') : bcc) : undefined,
        subject,
        html,
        attachments: mailAttachments.length > 0 ? mailAttachments : undefined
    });
}

function sendViaSendGrid(settings, { to, cc, bcc, subject, html, attachments }) {
    const sgMail = require('@sendgrid/mail');
    const apiKey = decryptMailPass(settings.api_key || '');
    sgMail.setApiKey(apiKey);
    const msg = {
        to: Array.isArray(to) ? to.join(', ') : to,
        from: { email: settings.from_email, name: settings.from_name },
        subject,
        html,
    };
    if (cc) msg.cc = Array.isArray(cc) ? cc.join(', ') : cc;
    if (bcc) msg.bcc = Array.isArray(bcc) ? bcc.join(', ') : bcc;
    if (attachments && attachments.length > 0) {
        msg.attachments = attachments.map(a => ({
            content: a.content,
            filename: a.filename,
            type: a.contentType,
            disposition: 'attachment'
        }));
    }
    return sgMail.send(msg);
}

// AI Provider configuration — switch via env var
// DB values take precedence over env vars; env vars act as fallback/default
const AI_PROVIDER = process.env.AI_PROVIDER || 'ollama';
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || 'qwen2.5:14b';
const OLLAMA_URL = process.env.OLLAMA_URL || 'http://localhost:11434';
const OPENAI_KEY = process.env.OPENAI_KEY || '';
const OPENAI_MODEL = process.env.OPENAI_MODEL || 'gpt-4o-mini';

// Suppress ExperimentalWarning for node:sqlite
process.removeAllListeners('warning');
process.on('warning', (warn) => {
    if (warn.name === 'ExperimentalWarning' && warn.message.includes('node:sqlite')) return;
    console.warn(warn);
});

const db = require('./js/db');

function getAiConfig() {
    try {
        const dbSettings = db.getAiSettings();
        if (dbSettings && dbSettings.provider) {
            return {
                provider: dbSettings.provider,
                ollamaModel: dbSettings.model || OLLAMA_MODEL,
                ollamaUrl: dbSettings.ollamaUrl || OLLAMA_URL,
                openaiKey: dbSettings.apiKey || OPENAI_KEY,
                openaiModel: dbSettings.model || OPENAI_MODEL
            };
        }
    } catch (e) {
        // DB not available (first startup), fall back to env
    }
    return {
        provider: AI_PROVIDER,
        ollamaModel: OLLAMA_MODEL,
        ollamaUrl: OLLAMA_URL,
        openaiKey: OPENAI_KEY,
        openaiModel: OPENAI_MODEL
    };
}

const PORT = 8082;
const BASE_DIR = process.env.GERAPRO_DATA_DIR || path.join(__dirname, '..', '..');
const MIME_TYPES = {
    '.html': 'text/html; charset=utf-8',
    '.js': 'text/javascript; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon',
    '.webp': 'image/webp',
    '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    '.dxf': 'application/dxf'
};

const JWT_SECRET = process.env.JWT_SECRET || 'gerapro_dev_secret_2026';
const DATA_DIR = path.join(__dirname, 'data');
const USERS_FILE = path.join(DATA_DIR, 'users.json');
const TEMPLATES_DIR = path.join(__dirname, 'templates');
const PTC_BASE_DIR = path.join(BASE_DIR, 'GeraPro');

function loadUsers() {
    try {
        if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
        if (!fs.existsSync(USERS_FILE)) return [];
        const raw = fs.readFileSync(USERS_FILE, 'utf8');
        return JSON.parse(raw);
    } catch (e) {
        console.error('[Auth] Error loading users:', e);
        return [];
    }
}

async function handleExportAIExtraction(data, res) {
    try {
        const workbook = new ExcelJS.Workbook();
        workbook.creator = 'GeraPro';
        workbook.lastModifiedBy = 'GeraPro';
        workbook.created = new Date();
        workbook.modified = new Date();

        const { geral, equipments, loads, normas, vendorList } = data;

        function addSheet(name, headers, rows) {
            const ws = workbook.addWorksheet(name);
            const hRow = ws.addRow(headers);
            hRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
            hRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF16A34A' } };
            hRow.alignment = { vertical: 'middle', horizontal: 'center' };
            for (let i = 1; i <= headers.length; i++) {
                const cell = hRow.getCell(i);
                cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
            }
            hRow.height = 22;

            rows.forEach((rowData, idx) => {
                const row = ws.addRow(rowData);
                row.alignment = { vertical: 'middle', wrapText: true };
                for (let i = 1; i <= rowData.length; i++) {
                    const cell = row.getCell(i);
                    cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
                    if (idx % 2 === 1) {
                        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF8FAFC' } };
                    }
                }
            });

            ws.columns = headers.map(() => ({ width: 22 }));
            ws.views = [{ state: 'frozen', xSplit: 0, ySplit: 1 }];
        }

        // Dados Gerais
        if (geral) {
            const loc = geral.localizacao || [geral.cidade, geral.uf].filter(Boolean).join('/');
            const fields = [
                ['Cliente', geral.cliente],
                ['Projeto', geral.projeto],
                ['Cidade', geral.cidade],
                ['UF', geral.uf],
                ['Localização', loc],
                ['Objeto', geral.objeto],
                ['Data', geral.data]
            ].filter(([_, v]) => v);
            if (fields.length > 0) {
                addSheet('Dados Gerais', ['Campo', 'Valor'], fields);
            }
        }

        // Equipamentos
        if (equipments && equipments.length > 0) {
            const rows = equipments.map(eq => [
                eq.tag || '', eq.type || '',
                eq.tensao ? eq.tensao + 'V' : '',
                eq.icc ? eq.icc + 'kA' : '',
                eq.ip || '',
                eq.correnteNominal ? eq.correnteNominal + 'A' : '',
                eq.frequencia ? eq.frequencia + 'Hz' : '',
                eq.protocolo || '',
                eq.cor || '',
                eq.forma || ''
            ]);
            addSheet('Equipamentos', ['TAG', 'Tipo', 'Tensão', 'ICC', 'IP', 'Corrente Nom.', 'Frequência', 'Protocolo', 'Cor', 'Forma'], rows);
        }

        // Cargas
        if (loads && loads.length > 0) {
            const rows = loads.map((ld, i) => [
                i + 1, ld.tag || '', ld.descricao || '',
                ld.potenciaCV || 0, ld.tensao || '',
                ld.tipoPartida || '', ld.painel || ''
            ]);
            addSheet('Cargas', ['#', 'Tag', 'Descrição', 'Potência (CV)', 'Tensão', 'Tipo Partida', 'Painel'], rows);
        }

        // Normas
        if (normas && normas.length > 0) {
            const rows = normas.map(n => [n]);
            addSheet('Normas', ['Normas Aplicáveis'], rows);
        }

        // Vendor List
        if (vendorList && vendorList.length > 0) {
            const rows = vendorList.map((v, i) => [i + 1, v.componente || '', v.fabricante || '']);
            addSheet('Vendor List', ['#', 'Componente', 'Fabricante'], rows);
        }

        if (workbook.worksheets.length === 0) {
            const ws = workbook.addWorksheet('Informação');
            ws.addRow(['Nenhum dado extraído para exportar.']);
        }

        const clientName = (geral?.cliente || 'documento').replace(/[^a-zA-Z0-9]/g, '_').slice(0, 30) || 'documento';
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
        const filename = `Extracao_IA_${clientName}_${timestamp}.xlsx`;

        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename=${filename}`);
        await workbook.xlsx.write(res);
        res.end();

        console.log(`[Server] AI Extraction exported successfully as ${filename}`);
    } catch (err) {
        console.error('[Server] Error exporting AI extraction:', err);
        if (!res.headersSent) {
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: false, error: err.message }));
        } else {
            res.end();
        }
    }
}

async function handleExportIOBOM(data, res) {
    try {
        const { items, tag, total } = data;

        if (!items || !Array.isArray(items) || items.length === 0) {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: false, error: 'Nenhum item para exportar.' }));
            return;
        }

        const workbook = new ExcelJS.Workbook();
        workbook.creator = 'GeraPro';
        workbook.lastModifiedBy = 'GeraPro';
        workbook.created = new Date();
        workbook.modified = new Date();

        const ws = workbook.addWorksheet('BOM');

        ws.columns = [
            { header: 'Quantidade', key: 'qtd', width: 12 },
            { header: 'Unidade', key: 'un', width: 8 },
            { header: 'Descrição', key: 'desc', width: 42 },
            { header: 'Código Fabricante', key: 'cod', width: 18 },
            { header: 'Fabricante', key: 'fab', width: 18 },
            { header: 'Custo Unitário', key: 'cu', width: 14 },
            { header: 'Custo Total', key: 'ct', width: 14 },
        ];

        ws.getColumn(6).numFmt = '#,##0.00';
        ws.getColumn(7).numFmt = '#,##0.00';

        ws.views = [{ state: 'frozen', ySplit: 1 }];
        ws.showGridLines = false;

        items.forEach(item => {
            const custoUnit = parseFloat(item.custoUnitario) || 0;
            const qtd = parseInt(item.qtd) || 0;
            ws.addRow([
                qtd,
                item.unidade || 'un',
                item.descricao,
                item.codigoFabricante || '',
                item.fabricante || '',
                custoUnit,
                custoUnit * qtd
            ]);
        });

        ws.addRow([]);
        ws.addRow(['', '', '', '', '', '', parseFloat(total) || 0]);

        const hr = ws.getRow(1);
        hr.height = 20;
        hr.eachCell((cell, colNum) => {
            cell.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 11, name: 'Calibri' };
            cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
            cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
            if (colNum <= 7) {
                cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF436511' } };
            }
        });

        for (let i = 2; i <= ws.rowCount; i++) {
            const row = ws.getRow(i);
            const isEven = i % 2 === 0;
            row.eachCell((cell, colNum) => {
                cell.font = { size: 10, name: 'Calibri' };
                cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: isEven ? 'FFFFFFFF' : 'FFF8FAFC' } };
                cell.alignment = { vertical: 'middle', wrapText: true };
                cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
                if (colNum === 3) {
                    cell.alignment.horizontal = 'left';
                } else if (colNum === 6 || colNum === 7) {
                    cell.alignment.horizontal = 'right';
                } else {
                    cell.alignment.horizontal = 'center';
                }
            });
        }

        const tagSafe = (tag || 'BOM_Automacao').replace(/[^a-zA-Z0-9_\-]/g, '_');
        const filename = `BOM_Automacao_${tagSafe}.xlsx`;

        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(filename)}"`);
        await workbook.xlsx.write(res);
        res.end();

        console.log(`[Server] IO BOM exported: ${filename} (${items.length} items)`);
    } catch (err) {
        console.error('[Server] Error exporting IO BOM:', err);
        if (!res.headersSent) {
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: false, error: err.message }));
        } else {
            res.end();
        }
    }
}

async function handleExportIOList(data, res) {
    try {
        const { ioList, tag } = data;
        if (!ioList || !ioList.racks || !Array.isArray(ioList.racks) || ioList.racks.length === 0) {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: false, error: 'Nenhum dado de I/O para exportar.' }));
            return;
        }

        const workbook = new ExcelJS.Workbook();
        workbook.creator = 'GeraPro';
        workbook.lastModifiedBy = 'GeraPro';
        workbook.created = new Date();
        workbook.modified = new Date();

        const ws = workbook.addWorksheet('I_O_List');

        ws.columns = [
            { header: 'Rack', key: 'rack', width: 8 },
            { header: 'Slot', key: 'slot', width: 8 },
            { header: 'Módulo (PN)', key: 'pn', width: 16 },
            { header: 'Tipo Módulo', key: 'modType', width: 14 },
            { header: 'Sinal', key: 'signal', width: 14 },
            { header: 'NºCh', key: 'totalCh', width: 6 },
            { header: 'Ch#', key: 'ch', width: 6 },
            { header: 'Tipo', key: 'type', width: 10 },
            { header: 'Nível Sinal', key: 'level', width: 12 },
            { header: 'Tag', key: 'tag', width: 16 },
            { header: 'Dispositivo de Campo', key: 'device', width: 22 },
            { header: 'Borne', key: 'terminal', width: 10 },
            { header: 'Wire Color', key: 'wireColor', width: 12 },
            { header: 'Wire #', key: 'wireNum', width: 12 },
            { header: 'Cable ID', key: 'cableId', width: 14 },
            { header: 'Junction Box', key: 'jb', width: 14 },
            { header: 'Status', key: 'status', width: 10 },
            { header: 'Notas', key: 'notes', width: 20 },
        ];

        ws.views = [{ state: 'frozen', ySplit: 1 }];
        ws.showGridLines = false;

        ioList.racks.forEach((rack, ri) => {
            (rack.slots || []).forEach((slot, si) => {
                const channels = slot.channels || [];
                if (channels.length === 0) {
                    ws.addRow([
                        rack.position ?? ri + 1,
                        slot.position ?? si + 1,
                        slot.modulePartNumber || '',
                        slot.moduleType || '',
                        slot.signalType || '',
                        slot.totalChannels ?? '',
                        '', '', '', '', '', '', '', '', '', '', '', ''
                    ]);
                } else {
                    channels.forEach((ch, ci) => {
                        ws.addRow([
                            rack.position ?? ri + 1,
                            slot.position ?? si + 1,
                            slot.modulePartNumber || '',
                            slot.moduleType || '',
                            slot.signalType || '',
                            slot.totalChannels ?? '',
                            ch.channelNumber ?? ci,
                            ch.channelType || slot.moduleType || '',
                            ch.signalLevel || slot.signalType || '',
                            ch.tag || '',
                            ch.fieldDevice || '',
                            ch.terminalNumber || '',
                            ch.wireColor || '',
                            ch.wireNumber || '',
                            ch.cableId || '',
                            ch.junctionBox || '',
                            ch.status || 'active',
                            ch.notes || ''
                        ]);
                    });
                }
            });
        });

        const hr = ws.getRow(1);
        hr.height = 20;
        hr.eachCell((cell, colNum) => {
            cell.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 11, name: 'Calibri' };
            cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
            cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
            if (colNum <= 18) {
                cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0F172A' } };
            }
        });

        for (let i = 2; i <= ws.rowCount; i++) {
            const row = ws.getRow(i);
            const isEven = i % 2 === 0;
            row.eachCell((cell, colNum) => {
                cell.font = { size: 10, name: 'Calibri' };
                cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: isEven ? 'FFFFFFFF' : 'FFF8FAFC' } };
                cell.alignment = { vertical: 'middle', wrapText: true };
                cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
                if (colNum === 3 || colNum === 10 || colNum === 11 || colNum === 18) {
                    cell.alignment.horizontal = 'left';
                } else {
                    cell.alignment.horizontal = 'center';
                }
            });
        }

        const tagSafe = (tag || 'IO_List').replace(/[^a-zA-Z0-9_\-]/g, '_');
        const filename = `IO_List_${tagSafe}.xlsx`;

        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(filename)}"`);
        await workbook.xlsx.write(res);
        res.end();

        console.log(`[Server] IO List exported: ${filename} (${ws.rowCount - 1} rows)`);
    } catch (err) {
        console.error('[Server] Error exporting IO List:', err);
        if (!res.headersSent) {
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: false, error: err.message }));
        } else {
            res.end();
        }
    }
}

async function handleExportLM(data, res) {
    try {
        const { items, ptcNumber, withPrices } = data;
        if (!items || !Array.isArray(items) || items.length === 0) {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: false, error: 'Nenhum dado para exportar.' }));
            return;
        }

        const hasPrices = !!withPrices;
        const colCount = hasPrices ? 8 : 6;

        const columns = hasPrices
            ? [
                { header: 'Item', key: 'itemNum', width: 8 },
                { header: 'Qtd', key: 'qtd', width: 8 },
                { header: 'Descrição', key: 'descricao', width: 40 },
                { header: 'Modelo', key: 'modelo', width: 18 },
                { header: 'Cód. Fabricante', key: 'codigoFabricante', width: 20 },
                { header: 'Fabricante', key: 'fabricante', width: 18 },
                { header: 'Unit. (R$)', key: 'custo', width: 14 },
                { header: 'Total (R$)', key: 'total', width: 16 },
            ]
            : [
                { header: 'Item', key: 'itemNum', width: 8 },
                { header: 'Qtd', key: 'qtd', width: 8 },
                { header: 'Descrição', key: 'descricao', width: 45 },
                { header: 'Modelo', key: 'modelo', width: 22 },
                { header: 'Cód. Fabricante', key: 'codigoFabricante', width: 24 },
                { header: 'Fabricante', key: 'fabricante', width: 22 },
            ];

        const workbook = new ExcelJS.Workbook();
        workbook.creator = 'GeraPro';
        workbook.lastModifiedBy = 'GeraPro';
        workbook.created = new Date();
        workbook.modified = new Date();

        const ws = workbook.addWorksheet('Lista de Materiais');
        ws.columns = columns;
        ws.views = [{ state: 'frozen', ySplit: 1 }];
        ws.showGridLines = false;

        const headerRow = ws.getRow(1);
        headerRow.height = 22;
        headerRow.eachCell((cell) => {
            cell.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 11, name: 'Calibri' };
            cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
            cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF436511' } };
        });

        let currentRow = 1;

        for (const [groupIdx, group] of items.entries()) {
            const carga = group.carga || {};
            const typical = group.typical || {};
            const groupItems = group.items || [];
            const groupNum = groupIdx + 1;

            if (groupItems.length === 0) continue;

            // Section header row
            currentRow++;
            const sectionRow = ws.getRow(currentRow);
            sectionRow.getCell(1).value = `${groupNum}`;
            sectionRow.getCell(2).value = `${carga.tag || '?'} - ${typical.nome || 'Sem típico'}`;
            sectionRow.height = 24;
            for (let c = 1; c <= colCount; c++) {
                const cell = sectionRow.getCell(c);
                cell.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 11, name: 'Calibri' };
                cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF436511' } };
                cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
                cell.alignment = { horizontal: 'center', vertical: 'middle' };
            }
            ws.mergeCells(currentRow, 2, currentRow, colCount);

            // Data rows
            let groupSubtotal = 0;
            for (const [itemIdx, item] of groupItems.entries()) {
                currentRow++;
                const qtd = parseFloat(item.qtd) || 0;
                const row = ws.getRow(currentRow);
                const itemNum = `${groupNum}.${itemIdx + 1}`;
                row.getCell(1).value = itemNum;
                row.getCell(2).value = qtd;
                row.getCell(3).value = item.descricao || '';
                row.getCell(4).value = item.modelo || '';
                row.getCell(5).value = item.codigoFabricante || '';
                row.getCell(6).value = item.fabricante || '';

                if (hasPrices) {
                    const custo = parseFloat(item.custo) || 0;
                    const total = qtd * custo;
                    groupSubtotal += total;
                    row.getCell(7).value = custo;
                    row.getCell(8).value = total;
                }

                const isEven = currentRow % 2 === 0;
                for (let c = 1; c <= colCount; c++) {
                    const cell = row.getCell(c);
                    cell.font = { size: 10, name: 'Calibri' };
                    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: isEven ? 'FFFFFFFF' : 'FFF8FAFC' } };
                    cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
                    cell.alignment = { vertical: 'middle', wrapText: true };
                    if (c === 2 || (hasPrices && c >= 7)) {
                        cell.alignment.horizontal = 'right';
                    } else if (c === 3) {
                        cell.alignment.horizontal = 'left';
                    } else {
                        cell.alignment.horizontal = 'center';
                    }
                }
                if (hasPrices) {
                    row.getCell(7).numFmt = '#,##0.00';
                    row.getCell(8).numFmt = '#,##0.00';
                }
            }

            if (hasPrices) {
                currentRow++;
                const subRow = ws.getRow(currentRow);
                subRow.getCell(2).value = 'Subtotal';
                subRow.getCell(8).value = groupSubtotal;
                subRow.height = 20;
                for (let c = 1; c <= colCount; c++) {
                    const cell = subRow.getCell(c);
                    cell.font = { bold: true, size: 10, name: 'Calibri', color: { argb: 'FF1E3A8A' } };
                    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE0E7FF' } };
                    cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
                    cell.alignment = { horizontal: c === 2 ? 'left' : 'center', vertical: 'middle' };
                }
                subRow.getCell(8).numFmt = '#,##0.00';
                subRow.getCell(8).alignment = { horizontal: 'right', vertical: 'middle' };
            }
        }

        if (currentRow > 1) {
            ws.autoFilter = { from: { row: 1, col: 1 }, to: { row: currentRow, col: colCount } };
        }
        const tagSafe = (ptcNumber || 'LM').replace(/[^a-zA-Z0-9_\-]/g, '_');
        const priceSuffix = hasPrices ? 'C_Preco' : 'S_Preco';
        const filename = `LM_${tagSafe}_${priceSuffix}.xlsx`;

        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(filename)}"`);
        await workbook.xlsx.write(res);
        res.end();

        console.log(`[Server] LM exported: ${filename} (${ws.rowCount - 1} rows, withPrices: ${hasPrices})`);
    } catch (err) {
        console.error('[Server] Error exporting LM:', err);
        if (!res.headersSent) {
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: false, error: err.message }));
        } else {
            res.end();
        }
    }
}

async function handleExportPipelineLog(data, res) {
    try {
        const { logs, ptcDisplay, cliente, tipo } = data;
        if (!logs || !Array.isArray(logs) || logs.length === 0) {
            sendJson(res, 400, { error: 'Nenhum log para exportar.' });
            return;
        }
        const workbook = new ExcelJS.Workbook();
        workbook.creator = 'GeraPro';
        workbook.lastModifiedBy = 'GeraPro';
        workbook.created = new Date();
        workbook.modified = new Date();

        const ws = workbook.addWorksheet('Log Revisões');
        ws.views = [{ state: 'frozen', ySplit: 1 }];
        ws.showGridLines = false;

        const showValor = tipo !== 'tecnica';
        const stageLabels = { prospect: 'Aguardando Início', elaboracao: 'Em Elaboração', enviado: 'Proposta Enviada', negociacao: 'Negociação', fechado: 'Fechado', perdido: 'Perdido' };
        const headers = showValor
            ? ['PTC', 'Rev', 'Data/Hora', 'Ação feita na Proposta', 'Eng. Resp.', 'Status', 'Valor', 'Consolidada', 'Prazo']
            : ['PTC', 'Rev', 'Data/Hora', 'Ação feita na Proposta', 'Eng. Resp.', 'Status', 'Consolidada', 'Prazo'];

        const hRow = ws.addRow(headers);
        hRow.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 11 };
        hRow.alignment = { vertical: 'middle', horizontal: 'center' };
        hRow.eachCell(c => {
            c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF436511' } };
            c.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
        });
        hRow.height = 22;

        logs.forEach((l, idx) => {
            const prazo = formatPrazo(l.data_entrega);
            const cells = showValor
                ? [ptcDisplay, l.revisao != null ? String(l.revisao).padStart(2, '0') : '00', l.timestamp ? new Date(l.timestamp).toLocaleString('pt-BR') : '', l.descricao || l.descricao_revisao || '', l.engenheiro_responsavel || l.usuario || '', stageLabels[l.status] || l.status || '', l.valor || 0, l.consolidada ? 'Sim' : 'Não', prazo]
                : [ptcDisplay, l.revisao != null ? String(l.revisao).padStart(2, '0') : '00', l.timestamp ? new Date(l.timestamp).toLocaleString('pt-BR') : '', l.descricao || l.descricao_revisao || '', l.engenheiro_responsavel || l.usuario || '', stageLabels[l.status] || l.status || '', l.consolidada ? 'Sim' : 'Não', prazo];
            const row = ws.addRow(cells);
            row.alignment = { vertical: 'middle', wrapText: true };
            row.eachCell((c, col) => {
                c.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
                if (idx % 2 === 1) c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF8FAFC' } };
                if (showValor && col === 7) c.numFmt = '#,##0.00';
                if (showValor && [1, 2, 8, 9].includes(col)) c.alignment = { horizontal: 'center', vertical: 'middle' };
                if (!showValor && [1, 2, 7, 8].includes(col)) c.alignment = { horizontal: 'center', vertical: 'middle' };
                if (showValor && col === 7) c.alignment = { horizontal: 'right', vertical: 'middle' };
            });
        });

        const colWidths = showValor ? [18, 6, 18, 36, 16, 22, 16, 14, 22] : [18, 6, 18, 36, 16, 22, 14, 22];
        colWidths.forEach((w, i) => { ws.getColumn(i + 1).width = w; });
        ws.autoFilter = { from: { row: 1, col: 1 }, to: { row: logs.length + 1, col: colWidths.length } };

        const fileName = `Log_Revisoes_${(cliente || 'cartao').replace(/[^a-zA-Z0-9]/g, '_')}_${new Date().toISOString().slice(0, 10)}.xlsx`;
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
        await workbook.xlsx.write(res);
        res.end();
    } catch (err) {
        console.error('[Server] Error exporting pipeline log:', err);
        if (!res.headersSent) sendJson(res, 500, { error: err.message });
    }
}

function handleSaveProposal(data, res, empresaId) {
    const { ptcFolder, type, content, revisionFolder } = data; // type: 'tecnica' or 'comercial', revisionFolder: 'Rev1'

    if (!ptcFolder || !type || !content) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, error: 'Missing required fields' }));
        return;
    }

    let docsDir = path.join(getFullPtcPath(empresaId, ptcFolder), 'Documentação Minha_Empresa');

    // If a revision folder is provided, append it to the path
    if (revisionFolder && revisionFolder !== '0' && revisionFolder !== 0) {
        docsDir = path.join(docsDir, revisionFolder);
    }

    // Ensure the target directory exists
    if (!fs.existsSync(docsDir)) {
        try {
            fs.mkdirSync(docsDir, { recursive: true });
        } catch (err) {
            console.error('Error creating revision directory:', err);
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: false, error: `Error creating directory: ${docsDir}` }));
            return;
        }
    }
    let prefix = 'ArquivoDesconhecido';
    if (type === 'tecnica') prefix = 'PropostaTecnica';
    else if (type === 'comercial') prefix = 'PropostaComercial';
    else if (type === 'precificacao') prefix = 'Precificacao';
    else if (type === 'precificacao_map') prefix = 'Precificacao_Map';

    // Always save as base filename when inside a Rev folder, or no suffix needed.
    // If it's root (Rev 0 / None), maybe keep existing behavior or standardize.
    // Standardizing: just save as PropostaTecnica.json
    const filename = `${prefix}.json`;
    const filePath = path.join(docsDir, filename);

    fs.writeFile(filePath, JSON.stringify(content, null, 2), (err) => {
        if (err) {
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: false, error: err.message }));
        } else {
            console.log(`[Server] Saved ${filename} to ${docsDir}`);
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: true, filename: filename, revision: revisionFolder || 0 }));
        }
    });
}

function handleSaveFile(data, res, empresaId) {
    const { ptcFolder, filename, content, isBase64, revisionFolder } = data;
    if (!ptcFolder || !filename || !content) {
        sendJson(res, 400, { success: false, error: 'Missing required fields (ptcFolder, filename, content)' });
        return;
    }
    let docsDir = path.join(getFullPtcPath(empresaId, ptcFolder), 'Documentação Minha_Empresa');
    if (revisionFolder && revisionFolder !== '0' && revisionFolder !== 0) {
        docsDir = path.join(docsDir, revisionFolder);
    }
    if (!fs.existsSync(docsDir)) {
        try { fs.mkdirSync(docsDir, { recursive: true }); } catch (err) {
            sendJson(res, 500, { success: false, error: 'Error creating directory: ' + docsDir });
            return;
        }
    }
    const filePath = path.join(docsDir, filename);
    try {
        const buffer = isBase64 ? Buffer.from(content, 'base64') : Buffer.from(content, 'utf-8');
        fs.writeFileSync(filePath, buffer);
        console.log('[Server] Saved file ' + filename + ' to ' + docsDir);
        sendJson(res, 200, { success: true, filename, revision: revisionFolder || 0 });
    } catch (err) {
        sendJson(res, 500, { success: false, error: err.message });
    }
}

function handleListPtcs(res, empresaId) {
    const baseDir = getEmpresaPtcDir(empresaId);

    fs.readdir(baseDir, { withFileTypes: true }, (err, entries) => {
        if (err) {
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: false, error: err.message }));
            return;
        }

        const ptcs = entries
            .filter(dirent =>
                dirent.isDirectory() &&
                (dirent.name.startsWith('PTC-') || /^\d{8,10}-/.test(dirent.name))
            )
            .map(dirent => dirent.name);

        ptcs.sort().reverse(); // Show newest first

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, ptcs: ptcs }));
    });
}

function handleGetRevisions(ptcFolder, res, empresaId) {
    if (!ptcFolder) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, error: 'Missing PTC Folder' }));
        return;
    }

    const docsDir = path.join(getFullPtcPath(empresaId, ptcFolder), 'Documentação Minha_Empresa');

    if (!fs.existsSync(docsDir)) {
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, error: 'Folder not found' }));
        return;
    }

    fs.readdir(docsDir, (err, files) => {
        if (err) {
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: false, error: err.message }));
            return;
        }

        const jsonFiles = files.filter(f => f.endsWith('.json') && (
            f.startsWith('PropostaTecnica') ||
            f.startsWith('PropostaComercial') ||
            f.startsWith('Precificacao')
        ));

        const result = jsonFiles.map(f => {
            const stats = fs.statSync(path.join(docsDir, f));
            return { name: f, date: stats.mtime };
        });

        result.sort((a, b) => b.date - a.date);

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, files: result }));
    });
}

function handleLoadProposal(ptcFolder, filename, revisionFolder, res, empresaId) {
    if (!ptcFolder || !filename) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, error: 'Missing params' }));
        return;
    }

    let docsDir = path.join(getFullPtcPath(empresaId, ptcFolder), 'Documentação Minha_Empresa');

    if (revisionFolder && revisionFolder !== '0' && revisionFolder !== 0) {
        docsDir = path.join(docsDir, revisionFolder);
    }

    const filePath = path.join(docsDir, filename);

    fs.readFile(filePath, 'utf8', (err, data) => {
        if (err) {
            const status = (err.code === 'ENOENT') ? 200 : 500;
            res.writeHead(status, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: false, error: err.message, code: err.code }));
            return;
        }
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(data);
    });
}

// --- Revision Management Endpoints ---

function handleGetPtcRevisionsFolders(ptcFolder, res, empresaId) {
    if (!ptcFolder) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, error: 'Missing PTC Folder' }));
        return;
    }

    const ptcPath = getFullPtcPath(empresaId, ptcFolder);
    const docsDir = path.join(ptcPath, 'Documentação Minha_Empresa');

    if (!fs.existsSync(docsDir)) {
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, error: 'PTC Folder not found' }));
        return;
    }

    try {
        const items = fs.readdirSync(docsDir, { withFileTypes: true });

        // Rev 0 is the root folder conceptually.
        const revisions = [{ rev: 0, folder: '0', label: 'Rev 0 (Base)' }];

        items.forEach(item => {
            if (item.isDirectory() && item.name.startsWith('Rev')) {
                const numStr = item.name.replace('Rev', '');
                const num = parseInt(numStr, 10);
                if (!isNaN(num)) {
                    revisions.push({ rev: num, folder: item.name, label: `Rev ${num}` });
                }
            }
        });

        // Sort descending
        revisions.sort((a, b) => b.rev - a.rev);

        let ptcInfo = {};
        const infoPath = path.join(ptcPath, 'ptc_info.json');
        if (fs.existsSync(infoPath)) {
            try {
                ptcInfo = JSON.parse(fs.readFileSync(infoPath, 'utf8'));
            } catch (e) {
                console.error('Error reading ptc_info.json:', e);
            }
        }

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, revisions, info: ptcInfo }));
    } catch (err) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, error: err.message }));
    }
}

function handleUprevisionPtc(data, res, empresaId) {
    const { ptcFolder, revisionNum } = data;
    if (!ptcFolder) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, error: 'Missing PTC Folder' }));
        return;
    }

    const rootPath = getFullPtcPath(empresaId, ptcFolder);

    if (!fs.existsSync(rootPath)) {
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, error: 'PTC Root not found' }));
        return;
    }

    const subfolders = [
        'Documentação Cliente',
        'Documentação Minha_Empresa',
        'Documentação Fornecedores',
        'Log das Revisões',
        'Outros'
    ];

    try {
        // Find highest revision based on 'Documentação Minha_Empresa' folder
        const docsDir = path.join(rootPath, 'Documentação Minha_Empresa');
        let maxRev = 0;

        if (fs.existsSync(docsDir)) {
            const items = fs.readdirSync(docsDir, { withFileTypes: true });
            items.forEach(item => {
                if (item.isDirectory() && item.name.startsWith('Rev')) {
                    const num = parseInt(item.name.replace('Rev', ''), 10);
                    if (!isNaN(num) && num > maxRev) {
                        maxRev = num;
                    }
                }
            });
        }

        const nextRevNum = revisionNum || (maxRev + 1);
        const newRevFolder = `Rev${String(nextRevNum).padStart(2, '0')}`;
        const prevRevFolder = maxRev === 0 ? '' : `Rev${String(maxRev).padStart(2, '0')}`;

        // Create the new revision folder inside each main subfolder and copy files
        subfolders.forEach(sub => {
            const subDirPath = path.join(rootPath, sub);
            const newRevPath = path.join(subDirPath, newRevFolder);
            const prevRevPath = prevRevFolder ? path.join(subDirPath, prevRevFolder) : subDirPath;

            if (!fs.existsSync(newRevPath)) {
                fs.mkdirSync(newRevPath, { recursive: true });
            }

            // Copy files from previous revision to new revision
            if (fs.existsSync(prevRevPath)) {
                const items = fs.readdirSync(prevRevPath, { withFileTypes: true });
                items.forEach(item => {
                    if (item.isFile()) {
                        const srcPath = path.join(prevRevPath, item.name);
                        const destPath = path.join(newRevPath, item.name);

                        if (item.name === 'PropostaComercial.json' || item.name === 'PropostaTecnica.json') {
                            try {
                                const raw = fs.readFileSync(srcPath, 'utf8');
                                const json = JSON.parse(raw);
                                if (json.codigo) {
                                    const paddedRev = String(nextRevNum).padStart(2, '0');
                                    // Matches _00, -00, v00, etc at the end of the string
                                    if (/[_v\-]\d+$/i.test(json.codigo)) {
                                        json.codigo = json.codigo.replace(/[_v\-]\d+$/i, '_' + paddedRev);
                                    } else {
                                        json.codigo = json.codigo + '_' + paddedRev;
                                    }
                                }
                                fs.writeFileSync(destPath, JSON.stringify(json, null, 2));
                            } catch (e) {
                                console.error('Error parsing JSON for rev increment:', e);
                                fs.copyFileSync(srcPath, destPath);
                            }
                        } else if (!item.name.endsWith('.docx')) {
                            fs.copyFileSync(srcPath, destPath);
                        }
                    }
                });
            }

            // Garantir que PropostaComercial.json exista na nova revisão
            const pcDest = path.join(newRevPath, 'PropostaComercial.json');
            if (!fs.existsSync(pcDest)) {
                fs.writeFileSync(pcDest, JSON.stringify({ vazio: true }, null, 2));
            }
            // Garantir que PropostaTecnica.json exista na nova revisão
            const ptDest = path.join(newRevPath, 'PropostaTecnica.json');
            if (!fs.existsSync(ptDest)) {
                fs.writeFileSync(ptDest, JSON.stringify({ vazio: true }, null, 2));
            }
        });

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, message: `Revisão ${nextRevNum} criada com sucesso em todas as pastas.`, newRevFolder, newRevNum: nextRevNum }));
    } catch (err) {
        console.error('Error creating new revision:', err);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, error: err.message }));
    }
}

function handleListAllProposals(res, req) {
    const allProposals = {
        tecnicas: [],
        comerciais: []
    };

    try {
        const empresaId = req ? getEmpresaId(req) : 'default';
        const baseDir = getEmpresaPtcDir(empresaId);
        // Load pipeline items to map each PTC to its sales stage
        const pipelineItems = db.findAll('pipelineItems', empresaId) || [];
        const pipelineMap = {};
        pipelineItems.forEach(pi => { if (pi.origemId) pipelineMap[pi.origemId] = pi.status; });

        if (!fs.existsSync(baseDir)) {
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: true, ...allProposals }));
            return;
        }

        const ptcFolders = fs.readdirSync(baseDir, { withFileTypes: true })
            .filter(dirent => dirent.isDirectory() && /^(PTC-|\d{8,10}-)/.test(dirent.name))
            .map(dirent => dirent.name);

        for (const ptc of ptcFolders) {
            const docsDir = path.join(baseDir, ptc, 'Documentação Minha_Empresa');
            if (!fs.existsSync(docsDir)) continue;

            // Load ptc_info.json for vendedor fallback
            let ptcInfoVendedor = '';
            const infoPath = path.join(baseDir, ptc, 'ptc_info.json');
            try {
                if (fs.existsSync(infoPath)) {
                    const info = JSON.parse(fs.readFileSync(infoPath, 'utf8'));
                    ptcInfoVendedor = info.vendedor || '';
                }
            } catch (e) { /* ignore */ }

            // 1. Check root of Documentation Minha_Empresa
            processDirectory(docsDir, ptc, '0', ptcInfoVendedor);

            // 2. Check Rev folders
            const items = fs.readdirSync(docsDir, { withFileTypes: true });
            items.forEach(item => {
                if (item.isDirectory() && item.name.startsWith('Rev')) {
                    processDirectory(path.join(docsDir, item.name), ptc, item.name, ptcInfoVendedor);
                }
            });
        }

        function processDirectory(dir, ptcFolderName, rev, ptcInfoVendedor = '') {
            const files = fs.readdirSync(dir);
            files.forEach(file => {
                if (file.endsWith('.json')) {
                    let type = null;
                    if (file.startsWith('PropostaTecnica')) type = 'tecnicas';
                    else if (file.startsWith('PropostaComercial')) type = 'comerciais';

                    if (type) {
                        try {
                            const content = JSON.parse(fs.readFileSync(path.join(dir, file), 'utf8'));
                            // Basic metadata for the list
                            const revisions = content.revisions || [];
                            const entry = {
                                id: content.id || `${ptcFolderName}-${file}-${rev}`,
                                ptcFolder: ptcFolderName,
                                revision: rev,
                                numero: content.numero || content.codigo || 'N/A',
                                clienteName: content.clienteName || (typeof content.cliente === 'string' ? content.cliente : (content.cliente ? (content.cliente.razaoSocial || content.cliente.nome) : 'N/A')),
                                obra: content.obra || content.projeto || content.titulo || '',
                                status: content.status || 'Salvo em Disco',
                                createdAt: content.createdAt || content.data || new Date(),
                                engenheiroResponsavel: content.engenheiroResponsavel || '',
                                vendedor: content.vendedor || ptcInfoVendedor || '',
                                ultimoElab: revisions.length > 0 ? (revisions[revisions.length - 1].elab || '') : '',
                                statusPipeline: pipelineMap[ptcFolderName] || 'prospect',
                                // Store enough info to re-open
                                _file: file,
                                _rev: rev
                            };
                            
                            // Avoid duplicates (take latest rev or keep all? usually user wants to see them in a list, maybe latest per PTC?)
                            // For now, let's keep all and the UI can sort/filter.
                            allProposals[type].push(entry);
                        } catch (e) {
                            console.error(`Error parsing ${file} in ${dir}:`, e);
                        }
                    }
                }
            });
        }

        // Sort by date desc
        allProposals.tecnicas.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        allProposals.comerciais.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, ...allProposals }));

    } catch (err) {
        console.error('[Server] Error listing proposals:', err);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, error: err.message }));
    }
}

// === AI Import Helpers ===

async function extractTextFromPDF(buffer) {
    const uint8 = new Uint8Array(buffer.buffer, buffer.byteOffset, buffer.byteLength);
    const result = await new PDFParse({ data: uint8, verbosity: 0 }).getText();
    return result.text || '';
}

function extractTextFromExcel(buffer, ext) {
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    const sheets = workbook.SheetNames.map(name => {
        const sheet = workbook.Sheets[name];
        return XLSX.utils.sheet_to_csv(sheet);
    });
    return sheets.join('\n\n');
}

function buildExtractionPrompt(text) {
    return `Você é um engenheiro eletricista experiente analisando uma Especificação Técnica.
Extraia APENAS os dados solicitados abaixo. Se um campo não for encontrado, use string vazia "".

REGRAS IMPORTANTES:
- Retorne APENAS o JSON, sem markdown, sem explicações, sem \`\`\`json
- Mapeie tipos de partida: "INVERSOR" ou "INVERSOR DE FREQUÊNCIA" → "IF"
- Mapeie: "SOFT STARTER" ou "SOFT-STARTER" → "SS"
- Mapeie: "DIRETA" ou "PARTIDA DIRETA" → "PD"
- Tensão em Volts (ex: "440V" → "440")
- ICC em kA (ex: "31,5kA" → "31.5")
- Potência de motores em CV (ex: "75" → 75)
- TAGs das cargas: se o documento numerar as cargas como "1", "2", "3" ou "Carga 1", "Carga 2" sem TAGs formais (ex: "M-101"), deixe o campo "tag" VAZIO (""). NÃO crie tags M1, M2, etc.

VALORES ESPERADOS (extraia mesmo sem rótulo explícito no documento):

--- Gerais ---
- tipo: "CCM-BT" | "QGBT" | "CUB-MT" | "TR-MT" | "SEU" | "ELETROCENTRO" | "QTA" | "PLC" | "BC"
- tensao (painel BT): "690V" | "480V" | "440V" | "380V" | "220V"
- tensao (painel MT): "4,16KV" | "6,0KV" | "6,9KV" | "13,8KV"
- frequencia: "60Hz" | "50Hz"
- ip (BT): "IP20" | "IP42" | "IP44" | "IP54" | "IP55" | "IP65" | "IP66"
- ip (MT): "IP4X" | "IP54" | "IP55" | "IP65"
- protocolo: "Ethernet IP" | "Profinet" | "DeviceNet" | "Profibus DP" | "Modbus TCP" | "Modbus RTU" | "CANopen"

--- Construtivos ---
- montagem: "Em Linha" | "Back to Back"
- instalacao: "Abrigada" | "Abrigado" | "Tempo" | "Ao Tempo"
- forma: "Forma 1" | "Forma 2a" | "Forma 2b" | "Forma 3a" | "Forma 3b" | "Forma 4a" | "Forma 4b"
- entradaCabos, saidaCabos: "Inferior" | "Superior" | "Lateral"
- acessoFrontal: "Fecho Borboleta" | "Fecho Yale" | "Fecho Cremona"
- acessoTraseiro: "Tampa Aparafusada" | "Porta Traseira"
- acessoManutencao: "Frontal" | "Traseiro" | "Frontal e Traseiro"
- coordenacao: "Tipo 1" | "Tipo 2"
- execucao: "Fixa" | "Extraivel" | "Plug-in"
- sistemaEletrico: "Monofasico (1F+N+T)" | "Bifasico (2F+N+T)" | "Trifasico (3F+N+T)" | "Trifasico (3F+T)"

--- Pintura ---
- cor: "RAL 7032" | "RAL 7035" | "Munsell N-6,5"
- camadaPintura: "80 um" | "90 um" | "100 um"
- placaMontagem: "RAL 2003" | "RAL 7032" | "Galvanizada"

--- Comando / Auxiliares ---
- comando: "220Vca" | "110Vca" | "125Vcc" | "24Vcc"
- comandoFonte: "Interna" | "Externa"
- auxiliar: "220Vca" | "110Vca" | "125Vcc" | "24Vcc"
- auxiliarFonte: "Interna" | "Externa"

--- Itens Sim/Não ---
- arcoInterno, iluminacao, termostato, ventilacao, termoretratil: "Sim" | "Não"
- tomada: "2P+T (10A)" | "2P+T (20A)" | "Não"

--- Barramento ---
- barramentoTratamento: "Cobre Nú" | "Totalmente Estanhado" | "Prateado nas Conexões" | "Pintado" | "Termoretrátil"

--- Cabo de Comunicação ---
- caboComunicacao: "Patch Cord Profinet Cat5" | "Cabo pra DeviceNet" | "Cabo Profibus DP 1px22 Awg Lilas" | "Modbus TCP 1px22 Awg" | "Modbus RTU 1px22 Awg" | "Cabo Canopen Com Conector Rj45"

--- CUB-MT (Média Tensão) ---
- tensaoMax: "7,2KV" | "15KV" | "17,5KV" | "24,2KV"
- icp: "40KAp" | "50KAp" | "63KAp" | "80KAp" | "100KAp"
- nbi: "60KV" | "75KV" | "95KV" | "110KV" | "125KV"
- suportabilidade: "20KV" | "28KV" | "34KV" | "38KV" | "50KV"
- iac: "IAC AFLR" | "IAC AFL" | "IAC A"
- lsc: "LSC2B" | "LSC2A" | "LSC1"
- particao: "PM" | "PI"
- altitude: "1000m" | "2000m"
- monitoramentoArco: "Vamp 121" | "Vamp 125" | "Vamp 321" | "Arctiq" | "Não"

--- TR-MT (Transformador) ---
- potencia: "500kVA" | "750kVA" | "1000kVA" | "1500kVA" | "2000kVA" | "2500kVA" | "3000kVA"
- enrolamento: "Alumínio" | "Cobre"
- tensaoPrimaria: "6,0kV" | "6,9kV" | "11,9kV" | "13,8kV" | "22kV" | "34,5kV"
- tensaoSecundaria: "220V" | "380V" | "440-254V" | "480V" | "690V"
- ligacaoPrimaria: "Triângulo Δ (delta)" | "Estrela Y" | "Zig-Zag"
- ligacaoSecundaria: "Estrela Y" | "Triângulo Δ (delta)" | "Zig-Zag"
- grupoLigacao: "Dyn1" | "Dyn11" | "Dd0" | "Yyn0" | "Yd1" | "Yd11"
- fatorK: "1" | "4" | "7" | "9" | "13" | "20"
- classe: "15kV" | "24kV" | "36kV" | "72,5kV"
- classeTemperatura: "F" | "H" | "B" | "A"
- resfriamento: "Ar Natural (ONAN)" | "Ar Forçado (ONAF)"
- fabricanteTr: "WEG" | "Tamura" | "Eaton" | "Siemens" | "ABB" | "Trafo"

--- Infraestrutura ---
Extraia itens de infraestrutura classificados por disciplina. Identifique a disciplina do item baseado no contexto:
- "civil": Obra Civil (concreto, alvenaria, fundacoes, estrutura metalica predial, lajes, pisos)
- "eletrica": Infraestrutura Eletrica (condutores, eletrodutos, bandejas, quadros de distribuicao, iluminacao externa)
- "spda": SPDA / Aterramento (para-raios, malha de terra, hastes, conexoes de aterramento)
- "mecanica": Infraestrutura Mecanica (dutos de ar, exaustao, ventilacao, ar condicionado, sprinklers)
- "cabeamento": Cabeamento Estruturado (patch panels, cabos de rede, racks, fibra otica)
- "servicos": Servicos (treinamento, instalacao, comissionamento, startup, documentacao tecnica)
Regras:
- Use "servicos" como fallback se nao conseguir classificar.
- Para cada item extraia: codigo (se houver no documento), descricao, qtd (numerico), un, custoUnitario (numerico, 0 se nao informado), horasInstalacao (numerico, 0 se nao informado).

DOCUMENTO:
${text.slice(0, 60000)}

Retorne este JSON exato:
{
  "geral": {
    "cliente": "",
    "projeto": "",
    "localizacao": "Cidade/UF (ex: Sertãozinho/SP)",
    "cidade": "",
    "uf": "",
    "objeto": "",
    "data": ""
  },
  "equipments": [
    {
      "tag": "", "type": "", "tensao": "", "icc": "", "ip": "",
      "correnteNominal": "", "frequencia": "", "protocolo": "", "cor": "",
      "forma": "", "montagem": "",
      "instalacao": "", "camadaPintura": "", "placaMontagem": "",
      "entradaCabos": "", "saidaCabos": "",
      "acessoFrontal": "", "acessoTraseiro": "", "acessoManutencao": "",
      "caboComunicacao": "", "arcoInterno": "", "iluminacao": "",
      "tomada": "", "termostato": "", "ventilacao": "",
      "barramentoTratamento": "", "termoretratil": "",
      "comandoFonte": "", "auxiliar": "", "auxiliarFonte": ""
    }
  ],
  "loads": [
    {
      "tag": "",
      "descricao": "",
      "potenciaCV": 0,
      "tensao": "",
      "tipoPartida": "",
      "painel": ""
    }
  ],
  "normas": [],
  "vendorList": [
    {
      "componente": "",
      "fabricante": ""
    }
  ],
  "infraestrutura": {
    "disciplinas": [
      { "id": "civil", "itens": [] },
      { "id": "eletrica", "itens": [] },
      { "id": "spda", "itens": [] },
      { "id": "mecanica", "itens": [] },
      { "id": "cabeamento", "itens": [] },
      { "id": "servicos", "itens": [] }
    ]
  }
}`;
}

async function callAIForExtraction(text) {
    const prompt = buildExtractionPrompt(text);
    const cfg = getAiConfig();

        if (cfg.provider === 'ollama') {
            return new Promise((resolve) => {
                try {
                    const postData = JSON.stringify({
                        model: cfg.ollamaModel,
                        messages: [
                            { role: 'system', content: 'Você é um assistente que retorna apenas JSON válido, sem markdown, sem explicações.' },
                            { role: 'user', content: prompt }
                        ],
                        stream: false,
                        keep_alive: '48h',
                        options: { temperature: 0.1 }
                    });

                    const parsed = url.parse(cfg.ollamaUrl);
                    const req = http.request({
                        hostname: parsed.hostname,
                        port: parsed.port || 11434,
                        path: '/api/chat',
                        method: 'POST',
                        timeout: 600000,
                        headers: {
                            'Content-Type': 'application/json',
                            'Content-Length': Buffer.byteLength(postData)
                        }
                    }, (res) => {
                        let body = '';
                        res.on('data', chunk => { body += chunk; });
                        res.on('end', () => {
                            try {
                                const data = JSON.parse(body);
                                const rawText = data.message?.content || '';
                                resolve(robustParseJSON(rawText));
                            } catch (e) {
                                resolve({ _error: 'Resposta inválida do Ollama.', _raw: body.slice(0, 500) });
                            }
                        });
                    });

                    req.on('timeout', () => {
                        req.destroy();
                        console.error('[AI-Ollama] Timeout após 10 minutos aguardando resposta do modelo.');
                        resolve({ _error: 'O modelo de IA está demorando muito para responder (>10 min). Tente novamente — a segunda tentativa costuma ser mais rápida pois o modelo já estará carregado.', _raw: prompt });
                    });

                    req.on('error', (err) => {
                        console.error('[AI-Ollama] Error:', err.message);
                        if (err.code === 'ECONNREFUSED') {
                            resolve({ _error: 'Ollama indisponível. Verifique se está rodando em ' + cfg.ollamaUrl, _raw: prompt });
                        } else if (err.code === 'ECONNRESET') {
                            resolve({ _error: 'Conexão com Ollama foi interrompida. O modelo pode estar sobrecarregado. Tente novamente.', _raw: prompt });
                        } else {
                            resolve({ _error: 'Erro de conexão com Ollama (' + err.code + '): ' + err.message, _raw: prompt });
                        }
                    });

                    req.write(postData);
                    req.end();
                } catch (err) {
                    console.error('[AI-Ollama] Error:', err.message);
                    resolve({ _error: 'Erro ao comunicar com Ollama. ' + err.message, _raw: prompt });
                }
            });
        }

    if (cfg.provider === 'openai') {
        if (!cfg.openaiKey) return { _error: 'Chave da API OpenAI não configurada. Configure em Ajustes > IA.' };
        try {
            const response = await fetch('https://api.openai.com/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${cfg.openaiKey}`
                },
                body: JSON.stringify({
                    model: cfg.openaiModel,
                    messages: [
                        { role: 'system', content: 'Você é um assistente que retorna apenas JSON válido, sem markdown, sem explicações.' },
                        { role: 'user', content: prompt }
                    ],
                    temperature: 0.1
                })
            });
            const data = await response.json();
            const rawText = data.choices?.[0]?.message?.content || '';
            return robustParseJSON(rawText);
        } catch (err) {
            console.error('[AI-OpenAI] Error:', err.message);
            return { _error: 'Erro na API OpenAI: ' + err.message };
        }
    }

    return { _error: 'Provider não configurado. Defina AI_PROVIDER=ollama ou AI_PROVIDER=openai' };
}

function robustParseJSON(raw) {
    if (!raw) return { _error: 'Resposta vazia da IA.' };

    let text = raw.trim();

    // Remove markdown code blocks
    text = text.replace(/```json\s*/gi, '').replace(/```\s*/g, '');

    // Find JSON boundaries
    const firstBrace = text.indexOf('{');
    const lastBrace = text.lastIndexOf('}');
    if (firstBrace === -1 || lastBrace === -1) {
        return { _error: 'JSON não encontrado na resposta.', _raw: raw.slice(0, 500) };
    }
    text = text.slice(firstBrace, lastBrace + 1);

    // Fix common LLM JSON mistakes
    text = text.replace(/,\s*}/g, '}').replace(/,\s*]/g, ']');
    text = text.replace(/'/g, '"');
    text = text.replace(/([{,]\s*)(\w+)(\s*:)/g, '$1"$2"$3');

    try {
        return JSON.parse(text);
    } catch (e) {
        // Last resort: try to fix trailing commas in arrays/objects
        try {
            const fixed = text.replace(/,\s*([}\]])/g, '$1');
            return JSON.parse(fixed);
        } catch (e2) {
            console.error('[robustParseJSON] Failed:', e2.message);
            console.error('[robustParseJSON] Raw (first 500):', raw.slice(0, 500));
            return { _error: 'Falha ao interpretar JSON da IA. Tente novamente.', _raw: raw.slice(0, 1000) };
        }
    }
}

// === AI IMPORT DOCUMENT ===

async function handleImportDocument(body, res) {
    try {
        const { filename, content, mimeType } = body;
        if (!filename || !content) {
            sendJson(res, 400, { success: false, error: 'filename e content obrigatórios' });
            return;
        }

        const buffer = Buffer.from(content, 'base64');
        const ext = path.extname(filename).toLowerCase();
        let text = '';

        if (ext === '.pdf' || mimeType === 'application/pdf') {
            console.log('[Import] Extracting PDF text...');
            text = await extractTextFromPDF(buffer);
        } else if (['.docx', '.doc'].includes(ext) || mimeType?.includes('word')) {
            console.log('[Import] Extracting DOCX text...');
            const result = await mammoth.extractRawText({ buffer });
            text = result.value || '';
        } else if (['.xlsx', '.xls', '.csv'].includes(ext) || mimeType?.includes('spreadsheet') || mimeType?.includes('excel')) {
            console.log('[Import] Extracting Excel/CSV text...');
            text = extractTextFromExcel(buffer, ext);
        } else {
            text = buffer.toString('utf8');
        }

        if (!text || text.trim().length < 10) {
            sendJson(res, 200, { success: false, error: 'Não foi possível extrair texto suficiente do documento.' });
            return;
        }

        console.log(`[Import] Text extracted (${text.length} chars). Calling AI...`);
        const result = await callAIForExtraction(text);

        sendJson(res, 200, { success: true, data: result });
    } catch (err) {
        console.error('[Import] Error:', err);
        sendJson(res, 500, { success: false, error: err.message });
    }
}

// === AI CONNECTION TEST ===

async function testAiConnection() {
    const cfg = getAiConfig();
    if (cfg.provider === 'ollama') {
        try {
            const res = await fetch(`${cfg.ollamaUrl}/api/tags`, { signal: AbortSignal.timeout(5000) });
            if (!res.ok) return { success: false, error: `Ollama retornou status ${res.status}` };
            const data = await res.json();
            const models = (data.models || []).map(m => m.name);
            const hasModel = models.some(m => m.startsWith(cfg.ollamaModel));
            return {
                success: true,
                message: hasModel
                    ? `Ollama conectado em ${cfg.ollamaUrl}. Modelo ${cfg.ollamaModel} disponível.`
                    : `Ollama conectado em ${cfg.ollamaUrl}. Modelo ${cfg.ollamaModel} NÃO encontrado (disponíveis: ${models.join(', ') || 'nenhum'})`
            };
        } catch (err) {
            return { success: false, error: `Ollama indisponível em ${cfg.ollamaUrl}: ${err.message}` };
        }
    }
    if (cfg.provider === 'openai') {
        if (!cfg.openaiKey) return { success: false, error: 'API Key da OpenAI não configurada.' };
        try {
            const res = await fetch('https://api.openai.com/v1/models', {
                headers: { 'Authorization': `Bearer ${cfg.openaiKey}` },
                signal: AbortSignal.timeout(10000)
            });
            if (!res.ok) return { success: false, error: `OpenAI retornou status ${res.status}. Verifique sua API Key.` };
            return { success: true, message: `OpenAI conectada. Modelo configurado: ${cfg.openaiModel}` };
        } catch (err) {
            return { success: false, error: `Erro ao conectar com OpenAI: ${err.message}` };
        }
    }
    return { success: false, error: 'Nenhum provider configurado (selecione Ollama ou OpenAI).' };
}

// === Helpers ===

function sendJson(res, status, data) {
    res.writeHead(status, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(data));
}

function readBody(req) {
    return new Promise((resolve, reject) => {
        let body = '';
        req.on('data', chunk => { body += chunk.toString(); });
        req.on('end', () => {
            try { resolve(JSON.parse(body)); }
            catch (e) { reject(new Error('Invalid JSON')); }
        });
        req.on('error', reject);
    });
}

function getTokenUser(req) {
    const auth = req.headers['authorization'];
    if (!auth || !auth.startsWith('Bearer ')) return null;
    try {
        const token = auth.slice(7);
        return jwt.verify(token, JWT_SECRET);
    } catch { return null; }
}

function requireAdmin(req) {
    const user = getTokenUser(req);
    return user && user.nivel === 'admin' ? user : null;
}

function getEmpresaId(req) {
    const user = getTokenUser(req);
    return user?.empresa_id || 'default';
}

function saveUsers(users) {
    if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
    fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
}

function getEmpresaFoldername(empresaId) {
    const emp = db.findEmpresaById(empresaId || 'default');
    return emp?.folder_name || empresaId || 'default';
}

function getEmpresaTemplatesDir(empresaId) {
    return path.join(TEMPLATES_DIR, getEmpresaFoldername(empresaId));
}

function ensureEmpresaTemplatesDir(empresaId) {
    const dir = getEmpresaTemplatesDir(empresaId);
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
    return dir;
}

function getEmpresaPtcDir(empresaId) {
    const dir = path.join(PTC_BASE_DIR, getEmpresaFoldername(empresaId));
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    return dir;
}

function getFullPtcPath(empresaId, ptcFolder) {
    return path.join(getEmpresaPtcDir(empresaId), ptcFolder);
}

// Migrate root-level .docx files to templates/default/ on first run
function migrateRootTemplates() {
    const defaultDir = getEmpresaTemplatesDir('default');
    if (!fs.existsSync(defaultDir)) {
        fs.mkdirSync(defaultDir, { recursive: true });
    }
    // Check if already migrated (has files)
    const existing = fs.readdirSync(defaultDir).filter(f => f.endsWith('.docx'));
    if (existing.length > 0) return;
    // Copy root .docx files
    const rootFiles = fs.readdirSync(__dirname).filter(f => f.endsWith('.docx'));
    for (const f of rootFiles) {
        try {
            const src = path.join(__dirname, f);
            const dst = path.join(defaultDir, f);
            if (!fs.existsSync(dst)) {
                fs.copyFileSync(src, dst);
                console.log(`[Templates] Migrated ${f} to ${defaultDir}`);
            }
        } catch (e) {
            console.warn(`[Templates] Erro ao migrar ${f}:`, e.message);
        }
    }
}

// Migrate root-level PTC folders to GeraPro/default/ on first run
function migrateRootPtcs() {
    const defaultDir = getEmpresaPtcDir('default');
    if (!fs.existsSync(defaultDir)) {
        fs.mkdirSync(defaultDir, { recursive: true });
    }
    // Find PTC folders in BASE_DIR (old location)
    const entries = fs.readdirSync(BASE_DIR, { withFileTypes: true });
    const ptcDirs = entries.filter(dirent =>
        dirent.isDirectory() && (dirent.name.startsWith('PTC-') || /^\d{8,10}-/.test(dirent.name))
    );
    if (ptcDirs.length === 0) {
        console.log('[PTC] Nenhuma pasta PTC encontrada para migrar');
        return;
    }
    let moved = 0;
    for (const dirent of ptcDirs) {
        const src = path.join(BASE_DIR, dirent.name);
        const dst = path.join(defaultDir, dirent.name);
        // Skip if destination already exists and is complete
        if (fs.existsSync(dst)) {
            try {
                const dstItems = fs.readdirSync(dst);
                const hasInfo = dstItems.includes('ptc_info.json');
                const hasDocs = dstItems.some(i => i.startsWith('Documentação') || i === 'Log das Revisões');
                if (hasInfo && hasDocs) {
                    console.log(`[PTC] ${dirent.name} já existe no destino, pulando.`);
                    continue;
                }
                console.warn(`[PTC] ${dirent.name} incompleto no destino, re-migrando...`);
                fs.rmSync(dst, { recursive: true, force: true });
            } catch (e) {
                console.warn(`[PTC] Erro ao limpar destino incompleto ${dirent.name}:`, e.message);
            }
        }
        try {
            fs.cpSync(src, dst, { recursive: true });
            // Verify integrity
            const dstItems = fs.readdirSync(dst);
            const hasInfo = dstItems.includes('ptc_info.json');
            const hasDocs = dstItems.some(i => i.startsWith('Documentação') || i === 'Log das Revisões');
            if (!hasInfo || !hasDocs) {
                console.warn(`[PTC] Integridade falhou para ${dirent.name}, removendo destino...`);
                fs.rmSync(dst, { recursive: true, force: true });
                continue;
            }
            fs.rmSync(src, { recursive: true, force: true });
            console.log(`[PTC] Migrated ${dirent.name} to ${defaultDir}`);
            moved++;
        } catch (e) {
            console.warn(`[PTC] Erro ao migrar ${dirent.name}:`, e.message);
        }
    }
    if (moved > 0) console.log(`[PTC] Migração concluída: ${moved} pasta(s) movida(s)`);
}

// === TELEGRAM BOT ===

let telegramBot = null;

function initTelegramBot(token) {
    if (!token) { telegramBot = null; return; }
    try {
        telegramBot = new TelegramBot(token, { polling: false });
        console.log('[Telegram] Bot initialized');
    } catch (e) {
        console.error('[Telegram] Error initializing bot:', e);
        telegramBot = null;
    }
}

function escapeMarkdown(text) {
    return String(text).replace(/([_*[\]`])/g, '\\$1');
}

function formatPrazo(dataEntrega) {
    if (!dataEntrega) return '—';
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    const entrega = new Date(dataEntrega + 'T00:00:00');
    const diff = entrega - hoje;
    const diffDays = Math.round(diff / (1000 * 60 * 60 * 24));
    if (diffDays > 0) return `No Prazo (Faltam ${diffDays} dia${diffDays !== 1 ? 's' : ''})`;
    if (diffDays === 0) return 'Último dia';
    return `Atrasado (${Math.abs(diffDays)} dia${Math.abs(diffDays) !== 1 ? 's' : ''})`;
}

async function notifyTelegramUsers({ cliente, projeto, acao, responsavel, vendedor, tipo, ptc, engenheiro_responsavel, dataHora, origemTipo, revisao, data_entrega }) {
    if (!telegramBot) return;
    try {
        const settings = db.getSettings('default');
        const token = settings.telegram_bot_token;
        if (!token) { telegramBot = null; return; }
        const usuarios = db.listUsuarios();
        const targets = usuarios.filter(u =>
            u.ativo !== false &&
            u.telegram_chat_id &&
            (u.nivel === 'admin' || u.nivel === 'engenheiro')
        );
        if (targets.length === 0) return;
        const tipoEmoji = {
            criacao: '🆕',
            movimentacao: '🔀',
            exclusao: '🗑️',
            atribuicao_eng: '👤',
            edicao: '✏️',
            interacao: '💬'
        };
        const emoji = tipoEmoji[tipo] || '🔔';
        const tipoLabels = { tecnica: 'PT', comercial: 'PC', tecnica_comercial: 'PTC' };
        const tipoLabel = tipoLabels[origemTipo] || 'PTC';
        let codigo = '';
        if (ptc) {
            const numMatch = ptc.match(/^(\d{8,10})/);
            if (numMatch) {
                const revStr = (revisao !== undefined && revisao !== null && revisao !== '') ? `-Rev${String(revisao).padStart(2, '0')}` : '';
                codigo = `${numMatch[1]}-${tipoLabel}${revStr}`;
            }
        }
        const codigoLine = codigo ? `*${codigo}*` : `*PTC:* ${escapeMarkdown(ptc) || '—'}`;
        const dataHoraStr = dataHora ? `\n*Data/Hora:* ${dataHora}` : '';
        const prazoStr = data_entrega ? `\n*Prazo:* ${formatPrazo(data_entrega)}` : '';
        const msg = `${emoji} *GeraPro — Pipeline*\n${codigoLine}\n*Cliente:* ${escapeMarkdown(cliente) || '—'}\n*Projeto:* ${escapeMarkdown(projeto) || '—'}\n*Ação:* ${acao || '—'}\n*Eng. Resp.:* ${escapeMarkdown(engenheiro_responsavel) || '—'}\n*Vendedor:* ${escapeMarkdown(vendedor) || '—'}${dataHoraStr}${prazoStr}`;
        for (const user of targets) {
            telegramBot.sendMessage(user.telegram_chat_id, msg, { parse_mode: 'Markdown' })
                .catch(err => console.warn('[Telegram] send fail for', user.name, err.message));
        }
    } catch (e) {
        console.error('[Telegram] notification error:', e);
    }
}

// === CREATE PTC ===

function handleCreatePtc(data, res, empresaId) {
    const { ptcNumber, ptcTitle, clientName, contact, email, phone, role, type, businessType, vendedor, dates } = data;
    if (!ptcTitle || !clientName) {
        sendJson(res, 400, { success: false, error: 'Título e Cliente são obrigatórios' });
        return;
    }

    const num = (ptcNumber || String(Date.now()).slice(-4)).replace(/[^a-zA-Z0-9]/g, '');
    const titleSlug = ptcTitle.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-zA-Z0-9\s]/g, '').trim().replace(/\s+/g, '-').slice(0, 40);
    const folderName = `${num}-${titleSlug}`;
    const rootPath = path.join(getEmpresaPtcDir(empresaId), folderName);

    if (fs.existsSync(rootPath)) {
        sendJson(res, 409, { success: false, error: `Pasta ${folderName} já existe` });
        return;
    }

    try {
        const subfolders = [
            'Documentação Cliente', 'Documentação Minha_Empresa',
            'Documentação Fornecedores', 'Log das Revisões', 'Outros'
        ];
        subfolders.forEach(sub => fs.mkdirSync(path.join(rootPath, sub), { recursive: true }));

        fs.writeFileSync(path.join(rootPath, 'ptc_info.json'), JSON.stringify({
            ptcNumber: num, title: ptcTitle, clientName,
            contact: contact || '', email: email || '', phone: phone || '', role: role || '',
            type: type || '', businessType: businessType || 'Industrialização',
            vendedor: data.vendedor || '',
            dates: dates || {}, createdAt: new Date().toISOString()
        }, null, 2));

        console.log(`[Server] PTC created: ${folderName}`);
        sendJson(res, 200, { success: true, path: rootPath, folder: folderName });
    } catch (err) {
        console.error('[Server] Error creating PTC:', err);
        sendJson(res, 500, { success: false, error: err.message });
    }
}

// === STATIC FILE SERVING ===

function serveStatic(pathname, res) {
    if (pathname.startsWith('/uploads/')) {
        const filePath = path.join(__dirname, 'data', pathname);
        const ext = path.extname(filePath);
        const contentType = MIME_TYPES[ext] || 'application/octet-stream';
        fs.readFile(filePath, (err, data) => {
            if (err) { sendJson(res, 404, { error: 'Not Found' }); return; }
            res.writeHead(200, { 'Content-Type': contentType });
            res.end(data);
        });
        return;
    }
    let filePath = pathname === '/'
        ? path.join(__dirname, 'index.html')
        : path.join(__dirname, pathname);

    if (!filePath.startsWith(__dirname)) {
        sendJson(res, 403, { error: 'Forbidden' });
        return;
    }

    const ext = path.extname(filePath);
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    fs.readFile(filePath, (err, data) => {
        if (err) {
            sendJson(res, err.code === 'ENOENT' ? 404 : 500, { error: err.code === 'ENOENT' ? 'Not Found' : err.message });
            return;
        }
        res.writeHead(200, { 'Content-Type': contentType });
        res.end(data);
    });
}

// === ROUTER ===

const server = http.createServer(async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') {
        res.writeHead(204);
        res.end();
        return;
    }

    const parsedUrl = url.parse(req.url, true);
    const pathname = parsedUrl.pathname;

    try {
        // === AUTH ROUTES ===

        if (pathname === '/api/auth/register' && req.method === 'POST') {
            const body = await readBody(req);
            const { email, password, name, empresa_id } = body;
            if (!email || !password || !name) { sendJson(res, 400, { error: 'Email, senha e nome obrigatórios' }); return; }
            const existing = db.findUsuarioByEmail(email);
            if (existing) { sendJson(res, 409, { error: 'Email já cadastrado' }); return; }
            // Find or create empresa
            let empId = empresa_id || 'default';
            let emp = db.findEmpresaById(empId);
            if (!emp) {
                emp = db.createEmpresa({ id: empId, nome: 'Empresa Padrão', cnpj: '', sigla: 'DEF', plano: 'trial' });
            }
            const hashed = bcrypt.hashSync(password, 10);
            const newUser = db.createUsuario({ id: crypto.randomUUID(), empresa_id: empId, email, password: hashed, name, nivel: 'admin', ativo: true });
            const token = jwt.sign({ id: newUser.id, email: newUser.email, name: newUser.name, nivel: newUser.nivel, empresa_id: empId }, JWT_SECRET, { expiresIn: '7d' });
            const { password: _, ...safeUser } = newUser;
            sendJson(res, 200, { token, user: safeUser });
            return;
        }

        if (pathname === '/api/auth/login' && req.method === 'POST') {
            const body = await readBody(req);
            const { email, password } = body;
            if (!email || !password) { sendJson(res, 400, { error: 'Email e senha obrigatórios' }); return; }
            const user = db.findUsuarioByEmail(email);
            if (!user || !bcrypt.compareSync(password, user.password)) { sendJson(res, 401, { error: 'Credenciais inválidas' }); return; }
            if (!user.ativo) { sendJson(res, 403, { error: 'Usuário desativado' }); return; }
            const token = jwt.sign({ id: user.id, email: user.email, name: user.name, nivel: user.nivel, empresa_id: user.empresa_id }, JWT_SECRET, { expiresIn: '7d' });
            const { password: _, ...safeUser } = user;
            sendJson(res, 200, { token, user: safeUser });
            return;
        }

        if (pathname === '/api/auth/me' && req.method === 'GET') {
            const tokenUser = getTokenUser(req);
            if (!tokenUser) { sendJson(res, 401, { error: 'Não autenticado' }); return; }
            const user = db.findUsuarioById(tokenUser.id);
            if (!user) { sendJson(res, 401, { error: 'Usuário não encontrado' }); return; }
            const { password: _, ...safeUser } = user;
            sendJson(res, 200, { success: true, user: safeUser });
            return;
        }

        // === PUBLIC USERS (any authenticated user) ===

        if (pathname === '/api/users' && req.method === 'GET') {
            const tokenUser = getTokenUser(req);
            if (!tokenUser) { sendJson(res, 401, { error: 'Não autenticado' }); return; }
            const empresaId = tokenUser.empresa_id || 'default';
            const users = db.listUsuarios(empresaId)
                .filter(u => u.ativo !== false)
                .map(({ password, ...safe }) => safe);
            sendJson(res, 200, { users });
            return;
        }

        // === ADMIN USERS ===

        if (pathname === '/api/admin/users' && req.method === 'GET') {
            const admin = requireAdmin(req);
            if (!admin) { sendJson(res, 403, { error: 'Acesso restrito' }); return; }
            const users = db.listUsuarios().map(({ password, ...u }) => u);
            sendJson(res, 200, { users });
            return;
        }

        if (pathname === '/api/admin/users' && req.method === 'POST') {
            const admin = requireAdmin(req);
            if (!admin) { sendJson(res, 403, { error: 'Acesso restrito' }); return; }
            const body = await readBody(req);
            const { email, password, name, nivel, empresa_id } = body;
            if (!email || !password || !name) { sendJson(res, 400, { error: 'Email, senha e nome obrigatórios' }); return; }
            const existing = db.findUsuarioByEmail(email);
            if (existing) { sendJson(res, 409, { error: 'Email já cadastrado' }); return; }
            const hashed = bcrypt.hashSync(password, 10);
            const newUser = db.createUsuario({ id: crypto.randomUUID(), empresa_id: empresa_id || 'default', email, password: hashed, name, nivel: nivel || 'engenheiro', ativo: true });
            const { password: _, ...safeUser } = newUser;
            sendJson(res, 200, { success: true, user: safeUser });
            return;
        }

        const userMatch = pathname.match(/^\/api\/admin\/users\/(.+)$/);
        if (userMatch) {
            const userId = userMatch[1];
            const admin = requireAdmin(req);
            if (!admin) { sendJson(res, 403, { error: 'Acesso restrito' }); return; }
            if (req.method === 'PUT') {
                const body = await readBody(req);
                const user = db.findUsuarioById(userId);
                if (!user) { sendJson(res, 404, { error: 'Usuário não encontrado' }); return; }
                const updates = {};
                if (body.name !== undefined) updates.name = body.name;
                if (body.email !== undefined) updates.email = body.email.toLowerCase();
                if (body.nivel !== undefined) updates.nivel = body.nivel;
                if (body.empresa_id !== undefined) updates.empresa_id = body.empresa_id;
                if (body.password) updates.password = bcrypt.hashSync(body.password, 10);
                if (body.telegram_chat_id !== undefined) updates.telegram_chat_id = body.telegram_chat_id;
                const updated = db.updateUsuario(userId, updates);
                if (!updated) { sendJson(res, 500, { error: 'Erro ao atualizar' }); return; }
                const { password: _, ...safeUser } = updated;
                sendJson(res, 200, { success: true, user: safeUser });
                return;
            }
            if (req.method === 'DELETE') {
                const user = db.findUsuarioById(userId);
                if (!user) { sendJson(res, 404, { error: 'Usuário não encontrado' }); return; }
                db.deactivateUsuario(userId);
                sendJson(res, 200, { success: true });
                return;
            }
        }

        // === EMPRESAS ===

        if (pathname === '/api/empresas' && req.method === 'GET') {
            const admin = requireAdmin(req);
            if (!admin) { sendJson(res, 403, { error: 'Acesso restrito' }); return; }
            const empresas = db.listEmpresas();
            sendJson(res, 200, { success: true, empresas });
            return;
        }

        if (pathname === '/api/empresas' && req.method === 'POST') {
            const admin = requireAdmin(req);
            if (!admin) { sendJson(res, 403, { error: 'Acesso restrito' }); return; }
            const body = await readBody(req);
            if (!body.nome) { sendJson(res, 400, { error: 'Nome da empresa é obrigatório' }); return; }
            const emp = db.createEmpresa({ id: crypto.randomUUID(), nome: body.nome, cnpj: body.cnpj || '', sigla: body.sigla || '', plano: body.plano || 'trial', ativo: true });
            ensureEmpresaTemplatesDir(emp.id);
            getEmpresaPtcDir(emp.id);
            sendJson(res, 200, { success: true, empresa: emp });
            return;
        }

        if (pathname === '/api/empresas' && req.method === 'PUT') {
            const admin = requireAdmin(req);
            if (!admin) { sendJson(res, 403, { error: 'Acesso restrito' }); return; }
            const body = await readBody(req);
            if (!body.id) { sendJson(res, 400, { error: 'ID da empresa é obrigatório' }); return; }
            if (!body.nome) { sendJson(res, 400, { error: 'Nome da empresa é obrigatório' }); return; }
            db.updateEmpresa(body.id, body);
            const emp = db.findEmpresaById(body.id);
            sendJson(res, 200, { success: true, empresa: emp });
            return;
        }

        if (pathname === '/api/empresas' && req.method === 'DELETE') {
            const admin = requireAdmin(req);
            if (!admin) { sendJson(res, 403, { error: 'Acesso restrito' }); return; }
            const id = parsedUrl.query.id;
            if (!id) { sendJson(res, 400, { error: 'ID da empresa é obrigatório' }); return; }
            if (id === 'default') { sendJson(res, 400, { error: 'Não é permitido excluir a empresa padrão.' }); return; }
            const folderName = getEmpresaFoldername(id);
            db.deleteEmpresa(id);
            try { fs.rmSync(path.join(TEMPLATES_DIR, folderName), { recursive: true, force: true }); } catch (e) { /* ignore */ }
            try { fs.rmSync(path.join(PTC_BASE_DIR, folderName), { recursive: true, force: true }); } catch (e) { /* ignore */ }
            sendJson(res, 200, { success: true });
            return;
        }

        // === DATA SYNC ===

        if (pathname === '/api/pipeline-item/revision' && req.method === 'PUT') {
            const tokenUser = getTokenUser(req);
            if (!tokenUser) { sendJson(res, 401, { error: 'Não autenticado' }); return; }
            try {
                const body = await readBody(req);
                const oldItem = db.findById('pipelineItems', body.id);
                if (oldItem?.status === 'fechado') {
                    sendJson(res, 403, { success: false, error: 'Proposta Fechada não pode ter revisão alterada.' });
                    return;
                }
                const empresaId = tokenUser.empresa_id || 'default';
                db.updatePipelineRevision(body.id, body.data, empresaId);
                sendJson(res, 200, { success: true });
            } catch (err) { sendJson(res, 500, { success: false, error: err.message }); }
            return;
        }

        if (pathname === '/api/data/sync/full' && req.method === 'GET') {
            const tokenUser = getTokenUser(req);
            if (!tokenUser) { sendJson(res, 401, { error: 'Não autenticado' }); return; }
            try {
                const empresaId = tokenUser.empresa_id || 'default';
                sendJson(res, 200, { success: true, data: db.getFullSync(empresaId) });
            }
            catch (err) { console.error('[Sync] Error:', err); sendJson(res, 500, { success: false, error: err.message }); }
            return;
        }

        if (pathname === '/api/data/sync/migrate' && req.method === 'POST') {
            const tokenUser = getTokenUser(req);
            if (!tokenUser) { sendJson(res, 401, { error: 'Não autenticado' }); return; }
            try {
                const body = await readBody(req);
                const empresaId = tokenUser.empresa_id || 'default';
                db.migrateFromLegacy(body, empresaId);
                sendJson(res, 200, { success: true, data: db.getFullSync(empresaId) });
            } catch (err) { sendJson(res, 500, { success: false, error: err.message }); }
            return;
        }

        if (pathname === '/api/materiais/import-bulk' && req.method === 'POST') {
            const tokenUser = getTokenUser(req);
            if (!tokenUser) { sendJson(res, 401, { error: 'Não autenticado' }); return; }
            try {
                const body = await readBody(req);
                const items = body.items || [];
                console.log(`[ImportBulk] Recebidos ${items.length} itens do cliente`);
                const empresaId = tokenUser.empresa_id || 'default';
                const result = db.bulkImportMateriais(items, empresaId);
                console.log(`[ImportBulk] Resultado: ${result.addedIds.length} criados, ${result.updatedIds.length} atualizados`);
                sendJson(res, 200, { success: true, ...result });
            } catch (err) {
                console.error('[ImportBulk] Error:', err);
                sendJson(res, 500, { success: false, error: err.message });
            }
            return;
        }

        if (pathname === '/api/crmLeads/import-bulk' && req.method === 'POST') {
            const tokenUser = getTokenUser(req);
            if (!tokenUser) { sendJson(res, 401, { error: 'Não autenticado' }); return; }
            try {
                const body = await readBody(req);
                const items = body.items || [];
                const empresaId = tokenUser.empresa_id || 'default';
                let created = 0, errors = [];
                const now = new Date().toISOString();
                for (const item of items) {
                    try {
                        const record = { ...item, empresa_id: empresaId, created_at: now, updated_at: now };
                        db.create('crmLeads', record, empresaId);
                        created++;
                    } catch (e) {
                        errors.push({ id: item.id, nome: item.nome, error: e.message });
                    }
                }
                sendJson(res, 200, { success: true, created, errors });
            } catch (err) {
                console.error('[CrmBulkImport] Error:', err);
                sendJson(res, 500, { success: false, error: err.message });
            }
            return;
        }

        if (pathname === '/api/materiais/search' && req.method === 'GET') {
            const tokenUser = getTokenUser(req);
            if (!tokenUser) { sendJson(res, 401, { error: 'Não autenticado' }); return; }
            try {
                const url = new URL(req.url, `http://${req.headers.host}`);
                const q = url.searchParams.get('q') || '';
                const fabricante = url.searchParams.get('fabricante') || '';
                const categoria = url.searchParams.get('categoria') || '';
                const grupoSiemens = url.searchParams.get('grupoSiemens') || '';
                const favorito = url.searchParams.get('favorito') || '';
                const page = parseInt(url.searchParams.get('page') || '1', 10);
                const limit = parseInt(url.searchParams.get('limit') || '100', 10);
                const empresaId = tokenUser.empresa_id || 'default';
                const result = db.searchMateriais({ q, fabricante, categoria, grupoSiemens, favorito, page, limit }, empresaId);
                sendJson(res, 200, { success: true, ...result });
            } catch (err) {
                sendJson(res, 500, { success: false, error: err.message });
            }
            return;
        }

        // --- CRM Stages Endpoints ---
        if (pathname === '/api/crmStages/reorder' && req.method === 'PUT') {
            const tokenUser = getTokenUser(req);
            if (!tokenUser) { sendJson(res, 401, { error: 'Não autenticado' }); return; }
            try {
                const body = await readBody(req);
                const empresaId = tokenUser.empresa_id || 'default';
                const stages = db.reorderCrmStages(empresaId, body.orderedIds || []);
                sendJson(res, 200, { success: true, data: stages });
            } catch (err) { sendJson(res, 500, { success: false, error: err.message }); }
            return;
        }
        if (pathname === '/api/crmStages/reset' && req.method === 'POST') {
            const tokenUser = getTokenUser(req);
            if (!tokenUser) { sendJson(res, 401, { error: 'Não autenticado' }); return; }
            try {
                const empresaId = tokenUser.empresa_id || 'default';
                const stages = db.resetCrmStages(empresaId);
                sendJson(res, 200, { success: true, data: stages });
            } catch (err) { sendJson(res, 500, { success: false, error: err.message }); }
            return;
        }
        const crmStageMatch = pathname.match(/^\/api\/crmStages\/(.+)$/);
        if (crmStageMatch && req.method === 'PUT') {
            const tokenUser = getTokenUser(req);
            if (!tokenUser) { sendJson(res, 401, { error: 'Não autenticado' }); return; }
            try {
                const id = crmStageMatch[1];
                const body = await readBody(req);
                const empresaId = tokenUser.empresa_id || 'default';
                const updated = db.updateCrmStage(id, empresaId, body);
                if (!updated) { sendJson(res, 404, { success: false, error: 'Estágio não encontrado' }); return; }
                sendJson(res, 200, { success: true, data: updated });
            } catch (err) { sendJson(res, 500, { success: false, error: err.message }); }
            return;
        }
        if (crmStageMatch && req.method === 'DELETE') {
            const tokenUser = getTokenUser(req);
            if (!tokenUser) { sendJson(res, 401, { error: 'Não autenticado' }); return; }
            try {
                const id = crmStageMatch[1];
                const empresaId = tokenUser.empresa_id || 'default';
                // Check if any leads use this stage
                const leadsCount = db.getDb().prepare('SELECT COUNT(*) as cnt FROM crm_leads WHERE empresa_id = ? AND status = ?').get(empresaId, id);
                if (leadsCount && leadsCount.cnt > 0) {
                    sendJson(res, 400, { success: false, error: `Existem ${leadsCount.cnt} lead(s) neste estágio. Reatribua-os antes de excluir.` });
                    return;
                }
                const deleted = db.deleteCrmStage(id, empresaId);
                if (!deleted) { sendJson(res, 404, { success: false, error: 'Estágio não encontrado' }); return; }
                sendJson(res, 200, { success: true, data: deleted });
            } catch (err) { sendJson(res, 500, { success: false, error: err.message }); }
            return;
        }
        if (pathname === '/api/crmStages' && req.method === 'POST') {
            const tokenUser = getTokenUser(req);
            if (!tokenUser) { sendJson(res, 401, { error: 'Não autenticado' }); return; }
            try {
                const body = await readBody(req);
                const empresaId = tokenUser.empresa_id || 'default';
                const created = db.createCrmStage(empresaId, body);
                sendJson(res, 200, { success: true, data: created });
            } catch (err) { sendJson(res, 500, { success: false, error: err.message }); }
            return;
        }
        if (pathname === '/api/crmStages' && req.method === 'GET') {
            const tokenUser = getTokenUser(req);
            if (!tokenUser) { sendJson(res, 401, { error: 'Não autenticado' }); return; }
            try {
                const empresaId = tokenUser.empresa_id || 'default';
                const stages = db.findAllCrmStages(empresaId);
                sendJson(res, 200, { success: true, data: stages });
            } catch (err) { sendJson(res, 500, { success: false, error: err.message }); }
            return;
        }

        const entityMatch = pathname.match(/^\/api\/data\/(\w+)$/);
        const entityMatchWithId = pathname.match(/^\/api\/data\/(\w+)\/(.+)$/);
        const validEntities = ['clientes','fornecedores','materiais','paineis','tipicos','cubiculos','cargas','orcamentos','loadLists','chapariaLists','propostasTecnicas','propostasComerciais','propostasCompletas','pipelineItems','vendedores','composicoes','regrasDerivacao','crmLeads','crmInteracoes','crmTarefas','crmEmailTemplates','crmStages','manufaturaProjetos','manufaturaColunas','manufaturaGavetas','manufaturaComponentes','manufaturaHistorico','manufaturaPerfisTeste','manufaturaResultadosTeste','manufaturaAnexos'];

        if (entityMatch && req.method === 'POST') {
            const tokenUser = getTokenUser(req);
            if (!tokenUser) { sendJson(res, 401, { error: 'Não autenticado' }); return; }
            if (!validEntities.includes(entityMatch[1])) { sendJson(res, 400, { error: 'Entidade inválida' }); return; }
            try {
                const entity = entityMatch[1];
                const body = await readBody(req);
                const empresaId = tokenUser.empresa_id || 'default';
                const created = db.create(entity, body, empresaId);

                // Auto-log for pipelineItems creation
                if (entity === 'pipelineItems' && body.tipo && body.origemId) {
                    const logDir = path.join(getFullPtcPath(empresaId, body.origemId), 'Log das Revisões');
                    if (!fs.existsSync(logDir)) fs.mkdirSync(logDir, { recursive: true });
                    const now = new Date();
                    const ts = now.toISOString().replace(/[-:]/g, '').slice(0, 15).replace('T', '_');
                    const rand = Math.random().toString(36).substring(2, 6);
                    const descricao = body.tipo === 'tecnica' ? 'Nova PT Criada' : body.tipo === 'comercial' ? 'Nova PC Criada' : 'Nova PTC Criada';
                    fs.writeFileSync(path.join(logDir, `ACT_${ts}_${rand}.json`), JSON.stringify({
                        item_tipo: body.tipo, tipo: 'criacao', descricao,
                        revisao: body.revisao || 0,
                        usuario: tokenUser.name || 'Sistema',
                        cliente: body.cliente || '', projeto: body.projeto || '',
                        valor: body.valor || 0, vendedor: body.vendedor || '',
                        engenheiro_responsavel: '', data_entrega: '', observacoes: '',
                        status: body.status || 'prospect', consolidada: false,
                        interacoes: [], createdAt: body.createdAt || now.toISOString(),
                        ultimoContato: '', timestamp: now.toISOString()
                    }, null, 2));

                    // Notificação Telegram para criação
                    notifyTelegramUsers({
                        cliente: body.cliente || '',
                        projeto: body.projeto || '',
                        acao: descricao,
                        responsavel: tokenUser.name || 'Sistema',
                        vendedor: body.vendedor || '',
                        tipo: 'criacao',
                        ptc: body.origemId || '',
                        origemTipo: body.tipo || '',
                        revisao: body.revisao,
                        engenheiro_responsavel: body.engenheiro_responsavel || '',
                        dataHora: new Date().toLocaleString('pt-BR'),
                        data_entrega: body.data_entrega || ''
                    });
                }

                sendJson(res, 200, { success: true, item: created });
            }
            catch (err) { sendJson(res, 500, { success: false, error: err.message }); }
            return;
        }

        if (entityMatchWithId && req.method === 'PUT') {
            const tokenUser = getTokenUser(req);
            if (!tokenUser) { sendJson(res, 401, { error: 'Não autenticado' }); return; }
            try {
                const entity = entityMatchWithId[1];
                const id = entityMatchWithId[2];
                const body = await readBody(req);
                const oldItem = db.findById(entity, id);
                if (entity === 'pipelineItems' && oldItem?.status === 'fechado' && body.status && body.status !== oldItem.status) {
                    sendJson(res, 403, { success: false, error: 'Proposta Fechada não pode ter status alterado.' });
                    return;
                }
                const item = db.update(entity, id, body);

                if (entity === 'pipelineItems' && item) {
                    const stageLabels = { prospect: 'Aguardando Início', elaboracao: 'Em Elaboração', enviado: 'Proposta Enviada', negociacao: 'Negociação', fechado: 'Fechado', perdido: 'Perdido' };
                    const isStatusChange = oldItem && body.status && body.status !== oldItem.status;

                    if (isStatusChange) {
                        const oldSt = oldItem.status;
                        const newSt = body.status;
                        const rev = item.revisao ?? oldItem?.revisao;
                        const padRev = (rev !== undefined && rev !== null && rev !== '') ? String(rev).padStart(2, '0') : '';
                        let acao;

                        if (newSt === 'enviado') {
                            acao = 'Proposta Enviada ao Cliente';
                        } else if (newSt === 'negociacao') {
                            acao = 'Proposta Em Negociação';
                        } else if (newSt === 'fechado') {
                            acao = '*FECHADO* ✅';
                        } else if (newSt === 'perdido') {
                            acao = '*PERDIDO* 🚫';
                        } else if (oldSt === 'prospect' && newSt === 'elaboracao') {
                            acao = padRev ? `Início de Elaboração da Rev${padRev}` : 'Início de Elaboração';
                        } else if (oldSt === 'enviado' && newSt === 'prospect') {
                            acao = padRev ? `Proposta Enviada para Rev${padRev}` : 'Proposta Enviada';
                        } else if (oldSt === 'negociacao' && newSt === 'prospect') {
                            acao = padRev ? `Proposta Enviada para Rev${padRev}` : 'Proposta Enviada';
                        } else {
                            acao = `Cartão movido de "${stageLabels[oldSt] || oldSt}" para "${stageLabels[newSt] || newSt}"`;
                        }

                        notifyTelegramUsers({
                            cliente: item.cliente || '',
                            projeto: item.projeto || '',
                            acao,
                            responsavel: tokenUser.name || 'Sistema',
                            vendedor: item.vendedor || '',
                            tipo: 'movimentacao',
                            ptc: item.origemId || oldItem?.origemId || '',
                            origemTipo: item.tipo || oldItem?.tipo || '',
                            revisao: item.revisao ?? oldItem?.revisao,
                            engenheiro_responsavel: item.engenheiro_responsavel || oldItem?.engenheiro_responsavel || '',
                            dataHora: new Date().toLocaleString('pt-BR'),
                            data_entrega: item.data_entrega || ''
                        });
                    }
                }

                sendJson(res, 200, { success: true, item });
            }
            catch (err) { sendJson(res, 500, { success: false, error: err.message }); }
            return;
        }

        if (entityMatchWithId && req.method === 'DELETE') {
            const tokenUser = getTokenUser(req);
            if (!tokenUser) { sendJson(res, 401, { error: 'Não autenticado' }); return; }
            try {
                const entity = entityMatchWithId[1];
                const id = entityMatchWithId[2];
                const item = db.findById(entity, id);
                db.remove(entity, id);

                if (entity === 'pipelineItems' && item) {
                    notifyTelegramUsers({
                        cliente: item.cliente || '',
                        projeto: item.projeto || '',
                        acao: 'Proposta Excluída',
                        responsavel: tokenUser.name || 'Sistema',
                        vendedor: item.vendedor || '',
                        tipo: 'exclusao',
                        ptc: item.origemId || '',
                        origemTipo: item.tipo || '',
                        revisao: item.revisao,
                        engenheiro_responsavel: item.engenheiro_responsavel || '',
                        dataHora: new Date().toLocaleString('pt-BR'),
                        data_entrega: item.data_entrega || ''
                    });
                }

                sendJson(res, 200, { success: true });
            }
            catch (err) { sendJson(res, 500, { success: false, error: err.message }); }
            return;
        }

        if (pathname === '/api/templates/upload' && req.method === 'POST') {
            const tokenUser = getTokenUser(req);
            if (!tokenUser) { sendJson(res, 401, { error: 'Não autenticado' }); return; }
            try {
                const body = await readBody(req);
                if (!body.fileName || !body.fileData) {
                    sendJson(res, 400, { error: 'fileName e fileData (base64) são obrigatórios' });
                    return;
                }
                const empresaId = tokenUser.empresa_id || 'default';
                const dir = ensureEmpresaTemplatesDir(empresaId);
                const safeName = body.fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
                if (!safeName.endsWith('.docx')) {
                    sendJson(res, 400, { error: 'Apenas arquivos .docx são permitidos' });
                    return;
                }
                const filePath = path.join(dir, safeName);
                const buffer = Buffer.from(body.fileData, 'base64');
                fs.writeFileSync(filePath, buffer);
                console.log(`[Templates] Uploaded ${safeName} para empresa ${empresaId}`);
                sendJson(res, 200, { success: true, name: safeName });
            } catch (err) { sendJson(res, 500, { success: false, error: err.message }); }
            return;
        }

        const templateDeleteMatch = pathname.match(/^\/api\/templates\/(.+)$/);
        if (templateDeleteMatch && req.method === 'DELETE') {
            const tokenUser = getTokenUser(req);
            if (!tokenUser) { sendJson(res, 401, { error: 'Não autenticado' }); return; }
            try {
                const empresaId = tokenUser.empresa_id || 'default';
                const fileName = templateDeleteMatch[1];
                const safeName = fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
                const filePath = path.join(getEmpresaTemplatesDir(empresaId), safeName);
                if (fs.existsSync(filePath)) {
                    fs.unlinkSync(filePath);
                    console.log(`[Templates] Deleted ${safeName} da empresa ${empresaId}`);
                    sendJson(res, 200, { success: true });
                } else {
                    sendJson(res, 404, { error: 'Template não encontrado' });
                }
            } catch (err) { sendJson(res, 500, { success: false, error: err.message }); }
            return;
        }

        // === PTC ===

        if (pathname === '/api/next-proposal-number-preview' && req.method === 'GET') {
            const tokenUser = getTokenUser(req);
            if (!tokenUser) { sendJson(res, 401, { error: 'Não autenticado' }); return; }
            try {
                const numero = db.peekNextProposalNumber();
                sendJson(res, 200, { success: true, numero });
            } catch (err) { sendJson(res, 500, { success: false, error: err.message }); }
            return;
        }

        if (pathname === '/api/next-proposal-number' && req.method === 'GET') {
            const tokenUser = getTokenUser(req);
            if (!tokenUser) { sendJson(res, 401, { error: 'Não autenticado' }); return; }
            try {
                const numero = db.getNextProposalNumber();
                sendJson(res, 200, { success: true, numero });
            } catch (err) { sendJson(res, 500, { success: false, error: err.message }); }
            return;
        }

        if (pathname === '/api/create-ptc' && req.method === 'POST') {
            const tokenUser = getTokenUser(req);
            if (!tokenUser) { sendJson(res, 401, { error: 'Não autenticado' }); return; }
            const empresaId = tokenUser.empresa_id || 'default';
            handleCreatePtc(await readBody(req), res, empresaId); return;
        }
        if (pathname === '/api/list-ptcs' && req.method === 'GET') {
            const tokenUser = getTokenUser(req);
            if (!tokenUser) { sendJson(res, 401, { error: 'Não autenticado' }); return; }
            const empresaId = tokenUser.empresa_id || 'default';
            handleListPtcs(res, empresaId); return;
        }
        if (pathname === '/api/list-templates' && req.method === 'GET') {
            const tokenUser = getTokenUser(req);
            if (!tokenUser) { sendJson(res, 401, { error: 'Não autenticado' }); return; }
            try {
                const empresaId = tokenUser.empresa_id || 'default';
                const dir = getEmpresaTemplatesDir(empresaId);
                if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
                const files = fs.readdirSync(dir)
                    .filter(f => f.endsWith('.docx'))
                    .map(f => ({ name: f }));
                sendJson(res, 200, { success: true, templates: files });
            } catch (err) { sendJson(res, 500, { success: false, error: err.message }); }
            return;
        }
        if (pathname === '/api/save-proposal' && req.method === 'POST') {
            const tokenUser = getTokenUser(req);
            if (!tokenUser) { sendJson(res, 401, { error: 'Não autenticado' }); return; }
            const empresaId = tokenUser.empresa_id || 'default';
            handleSaveProposal(await readBody(req), res, empresaId); return;
        }
        if (pathname === '/api/save-file' && req.method === 'POST') {
            const tokenUser = getTokenUser(req);
            if (!tokenUser) { sendJson(res, 401, { error: 'Não autenticado' }); return; }
            const empresaId = tokenUser.empresa_id || 'default';
            handleSaveFile(await readBody(req), res, empresaId); return;
        }
        if (pathname === '/api/load-proposal' && req.method === 'GET') {
            const tokenUser = getTokenUser(req);
            if (!tokenUser) { sendJson(res, 401, { error: 'Não autenticado' }); return; }
            const { ptc, file, revisionFolder } = parsedUrl.query;
            if (!ptc || !file) { sendJson(res, 400, { error: 'Missing ptc or file params' }); return; }
            const empresaId = tokenUser.empresa_id || 'default';
            handleLoadProposal(ptc, file, revisionFolder || '', res, empresaId);
            return;
        }
        if (pathname === '/api/ptc-revisions-folders' && req.method === 'GET') {
            const tokenUser = getTokenUser(req);
            if (!tokenUser) { sendJson(res, 401, { error: 'Não autenticado' }); return; }
            if (!parsedUrl.query.ptc) { sendJson(res, 400, { error: 'Missing ptc param' }); return; }
            const empresaId = tokenUser.empresa_id || 'default';
            handleGetPtcRevisionsFolders(parsedUrl.query.ptc, res, empresaId);
            return;
        }
        if (pathname === '/api/uprevision-ptc' && req.method === 'POST') {
            const tokenUser = getTokenUser(req);
            if (!tokenUser) { sendJson(res, 401, { error: 'Não autenticado' }); return; }
            const empresaId = tokenUser.empresa_id || 'default';
            handleUprevisionPtc(await readBody(req), res, empresaId); return;
        }
        if (pathname === '/api/list-all-proposals' && req.method === 'GET') {
            const tokenUser = getTokenUser(req);
            if (!tokenUser) { sendJson(res, 401, { error: 'Não autenticado' }); return; }
            handleListAllProposals(res, req); return;
        }

        // === PIPELINE LOG REVISIONS ===

        if (pathname === '/api/pipeline-log-revision' && req.method === 'POST') {
            const tokenUser = getTokenUser(req);
            if (!tokenUser) { sendJson(res, 401, { error: 'Não autenticado' }); return; }
            try {
                const body = await readBody(req);
                const { ptcFolder, revisionData } = body;
                if (!ptcFolder || !revisionData) {
                    sendJson(res, 400, { error: 'ptcFolder e revisionData são obrigatórios' });
                    return;
                }
                const empresaId = tokenUser.empresa_id || 'default';
                const logDir = path.join(getFullPtcPath(empresaId, ptcFolder), 'Log das Revisões');
                if (!fs.existsSync(logDir)) {
                    fs.mkdirSync(logDir, { recursive: true });
                }
                const now = new Date();
                const ts = now.toISOString().replace(/[-:]/g, '').slice(0, 15).replace('T', '_');
                const rev = String(revisionData.revisao).padStart(2, '0');
                const filename = `R${rev}_${ts}.json`;
                const logEntry = {
                    ...revisionData,
                    timestamp: now.toISOString()
                };
                fs.writeFileSync(path.join(logDir, filename), JSON.stringify(logEntry, null, 2));
                sendJson(res, 200, { success: true, filename });
            } catch (err) {
                console.error('[Pipeline] Erro ao escrever log de revisão:', err);
                sendJson(res, 500, { error: err.message });
            }
            return;
        }

        if (pathname === '/api/pipeline-log-action' && req.method === 'POST') {
            const tokenUser = getTokenUser(req);
            if (!tokenUser) { sendJson(res, 401, { error: 'Não autenticado' }); return; }
            try {
                const body = await readBody(req);
                const { ptcFolder, actionData } = body;
                if (!ptcFolder || !actionData) {
                    sendJson(res, 400, { error: 'ptcFolder e actionData são obrigatórios' });
                    return;
                }
                const empresaId = tokenUser.empresa_id || 'default';
                const logDir = path.join(getFullPtcPath(empresaId, ptcFolder), 'Log das Revisões');
                if (!fs.existsSync(logDir)) {
                    fs.mkdirSync(logDir, { recursive: true });
                }
                const now = new Date();
                const ts = now.toISOString().replace(/[-:]/g, '').slice(0, 15).replace('T', '_');
                const rand = Math.random().toString(36).substring(2, 6);
                const filename = `ACT_${ts}_${rand}.json`;
                const logEntry = {
                    ...actionData,
                    timestamp: now.toISOString()
                };
                fs.writeFileSync(path.join(logDir, filename), JSON.stringify(logEntry, null, 2));
                sendJson(res, 200, { success: true, filename });
            } catch (err) {
                console.error('[Pipeline] Erro ao escrever log de ação:', err);
                sendJson(res, 500, { error: err.message });
            }
            return;
        }

        if (pathname === '/api/pipeline-log-revisions' && req.method === 'GET') {
            const tokenUser = getTokenUser(req);
            if (!tokenUser) { sendJson(res, 401, { error: 'Não autenticado' }); return; }
            try {
                const ptcFolder = parsedUrl.query.ptcFolder;
                if (!ptcFolder) {
                    sendJson(res, 400, { error: 'ptcFolder é obrigatório' });
                    return;
                }
                const empresaId = tokenUser.empresa_id || 'default';
                const logDir = path.join(getFullPtcPath(empresaId, ptcFolder), 'Log das Revisões');
                if (!fs.existsSync(logDir)) {
                    sendJson(res, 200, { success: true, logs: [] });
                    return;
                }
                const files = fs.readdirSync(logDir).filter(f => (f.startsWith('R') || f.startsWith('ACT_')) && f.endsWith('.json')).sort().reverse();
                const logs = files.map(f => {
                    try {
                        return JSON.parse(fs.readFileSync(path.join(logDir, f), 'utf-8'));
                    } catch { return null; }
                }).filter(Boolean);
                sendJson(res, 200, { success: true, logs });
            } catch (err) {
                console.error('[Pipeline] Erro ao ler logs de revisão:', err);
                sendJson(res, 500, { error: err.message });
            }
            return;
        }

        // === AI SETTINGS ===

        if (pathname === '/api/settings/ai' && req.method === 'GET') {
            const tokenUser = getTokenUser(req);
            if (!tokenUser) { sendJson(res, 401, { error: 'Não autenticado' }); return; }
            try {
                const empresaId = tokenUser.empresa_id || 'default';
                sendJson(res, 200, { success: true, data: db.getAiSettings(empresaId) });
            }
            catch (err) { sendJson(res, 500, { success: false, error: err.message }); }
            return;
        }

        if (pathname === '/api/settings/ai' && req.method === 'PUT') {
            const tokenUser = getTokenUser(req);
            if (!tokenUser) { sendJson(res, 401, { error: 'Não autenticado' }); return; }
            try {
                const empresaId = tokenUser.empresa_id || 'default';
                db.saveAiSettings(await readBody(req), empresaId);
                sendJson(res, 200, { success: true });
            }
            catch (err) { sendJson(res, 500, { success: false, error: err.message }); }
            return;
        }

        if (pathname === '/api/settings/ai/test' && req.method === 'POST') {
            const tokenUser = getTokenUser(req);
            if (!tokenUser) { sendJson(res, 401, { error: 'Não autenticado' }); return; }
            try { sendJson(res, 200, await testAiConnection()); }
            catch (err) { sendJson(res, 200, { success: false, error: err.message }); }
            return;
        }

        // === TELEGRAM SETTINGS ===

        if (pathname === '/api/settings/telegram' && req.method === 'GET') {
            const tokenUser = getTokenUser(req);
            if (!tokenUser) { sendJson(res, 401, { error: 'Não autenticado' }); return; }
            try {
                const settings = db.getSettings('default');
                const filteredUsers = db.listUsuarios().filter(u => u.ativo !== false && (u.nivel === 'admin' || u.nivel === 'engenheiro'))
                    .map(u => ({ id: u.id, name: u.name, email: u.email, nivel: u.nivel, telegram_chat_id: u.telegram_chat_id || '' }));
                sendJson(res, 200, { success: true, botToken: settings.telegram_bot_token || '', users: filteredUsers });
            } catch (err) { sendJson(res, 500, { success: false, error: err.message }); }
            return;
        }

        if (pathname === '/api/settings/telegram' && req.method === 'PUT') {
            const tokenUser = getTokenUser(req);
            if (!tokenUser) { sendJson(res, 401, { error: 'Não autenticado' }); return; }
            try {
                const body = await readBody(req);
                db.saveSettings({ telegram_bot_token: body.botToken || '' });
                if (body.users) {
                    body.users.forEach(u => {
                        if (u.telegram_chat_id !== undefined) {
                            db.updateUsuario(u.id, { telegram_chat_id: u.telegram_chat_id || '' });
                        }
                    });
                }
                initTelegramBot(body.botToken || '');
                sendJson(res, 200, { success: true });
            } catch (err) { sendJson(res, 500, { success: false, error: err.message }); }
            return;
        }

        // === TELEGRAM NOTIFY ===

        if (pathname === '/api/notify-telegram' && req.method === 'POST') {
            const tokenUser = getTokenUser(req);
            if (!tokenUser) { sendJson(res, 401, { error: 'Não autenticado' }); return; }
            try {
                const body = await readBody(req);
                notifyTelegramUsers(body);
                sendJson(res, 200, { success: true });
            } catch (err) { sendJson(res, 500, { success: false, error: err.message }); }
            return;
        }

        // === MAIL SETTINGS ===

        if (pathname === '/api/settings/mail' && req.method === 'GET') {
            const tokenUser = getTokenUser(req);
            if (!tokenUser) { sendJson(res, 401, { error: 'Não autenticado' }); return; }
            try {
                const empresaId = tokenUser.empresa_id || 'default';
                const settings = db.findMailSettings(empresaId);
                if (settings) {
                    const { pass, api_key, ...safe } = settings;
                    sendJson(res, 200, { success: true, settings: safe });
                } else {
                    sendJson(res, 200, { success: true, settings: null });
                }
            } catch (err) { sendJson(res, 500, { success: false, error: err.message }); }
            return;
        }

        if (pathname === '/api/settings/mail' && req.method === 'PUT') {
            const tokenUser = getTokenUser(req);
            if (!tokenUser) { sendJson(res, 401, { error: 'Não autenticado' }); return; }
            try {
                const body = await readBody(req);
                const empresaId = tokenUser.empresa_id || 'default';
                let data = { ...body };
                if (data.pass && data.pass !== '') {
                    data.pass = encryptMailPass(data.pass);
                } else {
                    delete data.pass;
                }
                if (data.api_key && data.api_key !== '') {
                    data.api_key = encryptMailPass(data.api_key);
                } else {
                    delete data.api_key;
                }
                const result = db.upsertMailSettings(empresaId, data);
                const { pass, api_key, ...safe } = result;
                sendJson(res, 200, { success: true, settings: safe });
            } catch (err) { sendJson(res, 500, { success: false, error: err.message }); }
            return;
        }

        // === SEND EMAIL ===

        if (pathname === '/api/send-email' && req.method === 'POST') {
            const tokenUser = getTokenUser(req);
            if (!tokenUser) { sendJson(res, 401, { error: 'Não autenticado' }); return; }
            let emailBody, emailEmpresaId, emailSettings, emailProvider;
            try {
                emailBody = await readBody(req);
                emailEmpresaId = tokenUser.empresa_id || 'default';
                const { to, cc, bcc, assunto, corpo, lead_id, attachments } = emailBody;

                if (!to || to.length === 0) {
                    sendJson(res, 400, { success: false, error: 'Destinatário obrigatório' });
                    return;
                }
                if (!assunto) {
                    sendJson(res, 400, { success: false, error: 'Assunto obrigatório' });
                    return;
                }

                emailSettings = db.findMailSettings(emailEmpresaId);
                emailProvider = emailSettings?.provider || 'smtp';
                if (!emailSettings || !emailSettings.from_email) {
                    sendJson(res, 400, { success: false, error: 'E-mail não configurado. Acesse Configurações > E-mail e configure um provedor.' });
                    return;
                }
                if (emailProvider === 'smtp' && (!emailSettings.host || !emailSettings.user)) {
                    sendJson(res, 400, { success: false, error: 'SMTP não configurado. Preencha servidor, usuário e senha em Configurações > E-mail.' });
                    return;
                }
                if (emailProvider === 'sendgrid' && !emailSettings.api_key) {
                    sendJson(res, 400, { success: false, error: 'SendGrid não configurado. Informe a API Key em Configurações > E-mail.' });
                    return;
                }

                // Generate tracking token
                const trackingToken = crypto.randomUUID();
                const host = req.headers['host'] || 'localhost:8082';
                const trackingPixelUrl = `http://${host}/api/email-track/${trackingToken}`;
                const corpoComTracking = (corpo || '') + `<img src="${trackingPixelUrl}" width="1" height="1" style="display:none" alt=""/>`;

                const info = await sendEmail(emailSettings, {
                    to, cc, bcc, subject: assunto, html: corpoComTracking, attachments
                });

                const messageId = info.messageId || info[0]?.headers?.['message-id'] || '';

                // Auto-log to crm_email_log
                try {
                    db.logCrmEmail(emailEmpresaId, {
                        lead_id: lead_id || null,
                        to_email: Array.isArray(to) ? to.join(', ') : to,
                        cc: cc ? (Array.isArray(cc) ? cc.join(', ') : cc) : '',
                        bcc: bcc ? (Array.isArray(bcc) ? bcc.join(', ') : bcc) : '',
                        from_email: emailSettings.from_email || '',
                        from_name: emailSettings.from_name || '',
                        subject: assunto,
                        body_preview: (corpo || '').replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim().substring(0, 200),
                        status: 'sent',
                        provider: emailProvider || 'smtp',
                        message_id: messageId,
                        attachments_count: (attachments || []).length,
                        tracking_token: trackingToken
                    });
                } catch (logErr) { console.warn('[SendEmail] Error logging to crm_email_log:', logErr.message); }

                // Auto-register interaction if lead_id provided
                if (lead_id) {
                    try {
                        db.create('crmInteracoes', {
                            id: crypto.randomUUID(),
                            lead_id,
                            tipo: 'email',
                            descricao: `E-mail enviado: ${assunto}`,
                            data_hora: new Date().toISOString(),
                            duracao_min: 0,
                            realizado_por: tokenUser.nome || tokenUser.name || 'Sistema',
                            resultado: `Enviado para: ${Array.isArray(to) ? to.join(', ') : to}`,
                            created_at: new Date().toISOString()
                        }, emailEmpresaId);
                    } catch (e) { console.warn('[SendEmail] Error logging interaction:', e.message); }
                }

                sendJson(res, 200, { success: true, messageId });
            } catch (err) {
                console.error('[SendEmail] Error:', err);
                if (emailBody && emailEmpresaId) {
                    try {
                        const settingsErr = emailSettings || db.findMailSettings(emailEmpresaId);
                        const providerErr = emailProvider || settingsErr?.provider || 'smtp';
                        db.logCrmEmail(emailEmpresaId, {
                            lead_id: emailBody.lead_id || null,
                            to_email: emailBody.to ? (Array.isArray(emailBody.to) ? emailBody.to.join(', ') : emailBody.to) : '',
                            from_email: settingsErr?.from_email || '',
                            from_name: settingsErr?.from_name || '',
                            subject: emailBody.assunto || '',
                            body_preview: '',
                            status: 'failed',
                            error_message: err.message || 'Erro desconhecido',
                            provider: providerErr
                        });
                    } catch (logErr) { console.warn('[SendEmail] Error logging failure:', logErr.message); }
                }
                sendJson(res, 500, { success: false, error: err.message });
            }
            return;
        }

        // === EMAIL LOG ===

        if (pathname === '/api/email-log' && req.method === 'GET') {
            const tokenUser = getTokenUser(req);
            if (!tokenUser) { sendJson(res, 401, { error: 'Não autenticado' }); return; }
            try {
                const empresaId = tokenUser.empresa_id || 'default';
                const leadId = parsedUrl.query.lead_id || null;
                const limit = parseInt(parsedUrl.query.limit || '50', 10);
                const logs = db.findCrmEmailLogByLead(empresaId, leadId, limit);
                sendJson(res, 200, { success: true, data: logs });
            } catch (err) { sendJson(res, 500, { success: false, error: err.message }); }
            return;
        }

        // === TEST MAIL ===

        if (pathname === '/api/test-email' && req.method === 'POST') {
            const tokenUser = getTokenUser(req);
            if (!tokenUser) { sendJson(res, 401, { error: 'Não autenticado' }); return; }
            try {
                const body = await readBody(req);
                const empresaId = tokenUser.empresa_id || 'default';

                const settings = db.findMailSettings(empresaId);
                const provider = settings?.provider || 'smtp';
                if (!settings || !settings.from_email) {
                    sendJson(res, 400, { success: false, error: 'E-mail não configurado. Acesse Configurações > E-mail.' });
                    return;
                }
                if (provider === 'smtp' && (!settings.host || !settings.user)) {
                    sendJson(res, 400, { success: false, error: 'SMTP não configurado.' });
                    return;
                }
                if (provider === 'sendgrid' && !settings.api_key) {
                    sendJson(res, 400, { success: false, error: 'SendGrid não configurado.' });
                    return;
                }

                const testTo = body.to || settings.from_email || tokenUser.email || '';
                if (!testTo) {
                    sendJson(res, 400, { success: false, error: 'Nenhum destinatário de teste disponível.' });
                    return;
                }

                const providerLabel = provider === 'sendgrid' ? 'SendGrid' : 'SMTP';

                await sendEmail(settings, {
                    to: testTo,
                    subject: `GeraPro — Teste de Configuração ${providerLabel}`,
                    html: `<h3>Teste de E-mail (${providerLabel})</h3><p>Se você recebeu esta mensagem, a configuração de e-mail do GeraPro está funcionando corretamente!</p>`
                });

                sendJson(res, 200, { success: true, message: 'E-mail de teste enviado com sucesso!' });
            } catch (err) {
                console.error('[TestEmail] Error:', err);
                sendJson(res, 500, { success: false, error: err.message });
            }
            return;
        }

        // === EMAIL TRACKING PIXEL ===

        const emailTrackMatch = pathname.match(/^\/api\/email-track\/(.+)$/);
        if (emailTrackMatch && req.method === 'GET') {
            const token = emailTrackMatch[1];
            try {
                db.markEmailOpened(token, req.headers['user-agent'] || '');
            } catch (e) {
                console.warn('[EmailTrack] Error tracking:', e.message);
            }
            const PIXEL_GIF = Buffer.from('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7', 'base64');
            res.writeHead(200, {
                'Content-Type': 'image/gif',
                'Content-Length': PIXEL_GIF.length,
                'Cache-Control': 'no-cache, no-store, must-revalidate',
                'Pragma': 'no-cache',
                'Expires': '0'
            });
            res.end(PIXEL_GIF);
            return;
        }

        if (pathname === '/api/settings/login-theme' && req.method === 'PUT') {
            const tokenUser = getTokenUser(req);
            if (!tokenUser) { sendJson(res, 401, { error: 'Não autenticado' }); return; }
            try {
                const body = await readBody(req);
                db.saveLoginTheme(body.loginTheme || {});
                sendJson(res, 200, { success: true });
            } catch (err) { sendJson(res, 500, { success: false, error: err.message }); }
            return;
        }

        if (pathname === '/api/settings/company' && req.method === 'PUT') {
            const tokenUser = getTokenUser(req);
            if (!tokenUser) { sendJson(res, 401, { error: 'Não autenticado' }); return; }
            try {
                const body = await readBody(req);
                const empresaId = tokenUser.empresa_id || 'default';
                db.saveSettings(body, empresaId);
                sendJson(res, 200, { success: true });
            } catch (err) { sendJson(res, 500, { success: false, error: err.message }); }
            return;
        }

        if (pathname === '/api/settings/templates' && req.method === 'PUT') {
            const tokenUser = getTokenUser(req);
            if (!tokenUser) { sendJson(res, 401, { error: 'Não autenticado' }); return; }
            try {
                const body = await readBody(req);
                const empresaId = tokenUser.empresa_id || 'default';
                const existing = db.prepare('SELECT * FROM settings WHERE empresa_id = ?').get(empresaId);
                if (existing) {
                    db.prepare('UPDATE settings SET template_tecnica = ?, template_comercial = ?, template_completa = ? WHERE empresa_id = ?').run(
                        body.template_tecnica || 'TEMPLATE_TEC.docx',
                        body.template_comercial || 'TEMPLATE_COM.docx',
                        body.template_completa || 'TEMPLATE_TEC_COM.docx',
                        empresaId
                    );
                } else {
                    db.prepare('INSERT INTO settings (empresa_id, template_tecnica, template_comercial, template_completa) VALUES (?, ?, ?, ?)').run(
                        empresaId,
                        body.template_tecnica || 'TEMPLATE_TEC.docx',
                        body.template_comercial || 'TEMPLATE_COM.docx',
                        body.template_completa || 'TEMPLATE_TEC_COM.docx'
                    );
                }
                sendJson(res, 200, { success: true });
            } catch (err) { sendJson(res, 500, { success: false, error: err.message }); }
            return;
        }

        if (pathname === '/api/settings/vendor-defaults' && req.method === 'PUT') {
            const tokenUser = getTokenUser(req);
            if (!tokenUser) { sendJson(res, 401, { error: 'Não autenticado' }); return; }
            try {
                const body = await readBody(req);
                const empresaId = tokenUser.empresa_id || 'default';
                const existing = db.prepare('SELECT * FROM settings WHERE empresa_id = ?').get(empresaId);
                if (existing) {
                    db.prepare('UPDATE settings SET vendor_defaults = ? WHERE empresa_id = ?').run(JSON.stringify(body.vendorDefaults || []), empresaId);
                } else {
                    db.prepare('INSERT INTO settings (empresa_id, vendor_defaults) VALUES (?, ?)').run(empresaId, JSON.stringify(body.vendorDefaults || []));
                }
                sendJson(res, 200, { success: true });
            } catch (err) { sendJson(res, 500, { success: false, error: err.message }); }
            return;
        }

        if (pathname === '/api/upload' && req.method === 'POST') {
            const tokenUser = getTokenUser(req);
            if (!tokenUser) { sendJson(res, 401, { error: 'Não autenticado' }); return; }
            try {
                const body = await readBody(req);
                if (!body.fileName || !body.fileData) {
                    sendJson(res, 400, { error: 'fileName e fileData (base64) são obrigatórios' });
                    return;
                }
                const uploadsDir = path.join(__dirname, 'data', 'uploads');
                if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
                const ext = path.extname(body.fileName) || '.png';
                const safeName = Date.now() + '_' + body.fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
                const filePath = path.join(uploadsDir, safeName);
                const buffer = Buffer.from(body.fileData, 'base64');
                fs.writeFileSync(filePath, buffer);
                const url = '/uploads/' + safeName;
                sendJson(res, 200, { success: true, url });
            } catch (err) { sendJson(res, 500, { success: false, error: err.message }); }
            return;
        }

        // === MANUFATURA QR SCAN ===

        if (pathname === '/api/manufatura/scan' && req.method === 'GET') {
            const parsedUrl = url.parse(req.url, true);
            const data = parsedUrl.query.d;
            if (!data) { sendJson(res, 400, { error: 'Parâmetro d é obrigatório' }); return; }
            try {
                const payload = JSON.parse(decodeURIComponent(data));
                res.writeHead(200, { 'Content-Type': 'text/html' });
                res.end(`
                    <!DOCTYPE html><html lang="pt-BR"><head><meta charset="UTF-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <title>GeraPro - ${payload.tag || 'QR Code'}</title>
                    <style>body{font-family:sans-serif;display:flex;justify-content:center;align-items:center;min-height:100vh;margin:0;background:#f1f5f9;padding:20px}
                    .card{background:white;border-radius:16px;padding:32px;max-width:400px;width:100%;box-shadow:0 4px 24px rgba(0,0,0,0.1);text-align:center}
                    h2{color:#1e293b;margin:0 0 8px 0}.tag{color:#3b82f6;font-size:14px;font-weight:600;margin-bottom:16px}
                    .info{font-size:13px;color:#64748b;margin-bottom:4px}
                    .badge{display:inline-block;padding:4px 12px;border-radius:8px;font-size:12px;font-weight:600;background:#dbeafe;color:#1e40af;margin-top:12px}
                    .footer{font-size:11px;color:#94a3b8;margin-top:20px;padding-top:16px;border-top:1px solid #e2e8f0}
                    </style></head><body>
                    <div class="card">
                        <div style="font-size:40px;margin-bottom:12px;">📦</div>
                        <h2>${payload.tag || 'Sem identificação'}</h2>
                        <div class="tag">${payload.type || 'Desconhecido'}</div>
                        <div class="info">ID: ${payload.id || '-'}</div>
                        ${payload.projeto ? `<div class="info">Projeto: ${payload.projeto}</div>` : ''}
                        ${payload.cliente ? `<div class="info">Cliente: ${payload.cliente}</div>` : ''}
                        ${payload.coluna_tag ? `<div class="info">Coluna: ${payload.coluna_tag}</div>` : ''}
                        <div class="badge">GeraPro - Rastreabilidade</div>
                        <div class="footer">Escaneie com o sistema GeraPro para mais detalhes</div>
                    </div></body></html>
                `);
            } catch (e) { sendJson(res, 400, { error: 'Dados inválidos' }); }
            return;
        }

        // === MANUFATURA TEST BENCH API ===

        if (pathname === '/api/manufatura/teste/submit' && req.method === 'POST') {
            const tokenUser = getTokenUser(req);
            if (!tokenUser) { sendJson(res, 401, { error: 'Não autenticado' }); return; }
            try {
                const body = await readBody(req);
                const empresaId = tokenUser.empresa_id || 'default';
                if (!body.gaveta_id) { sendJson(res, 400, { error: 'gaveta_id é obrigatório' }); return; }
                const now = new Date().toISOString();
                const record = {
                    id: body.id || 'TST-' + Date.now().toString(36).toUpperCase(),
                    empresa_id: empresaId,
                    gaveta_id: body.gaveta_id,
                    perfil_id: body.perfil_id || '',
                    status: body.status || 'pendente',
                    resultados: typeof body.resultados === 'string' ? body.resultados : JSON.stringify(body.resultados || {}),
                    operador: body.operador || (tokenUser.name || ''),
                    data_teste: body.data_teste || now,
                    observacoes: body.observacoes || '',
                    created_at: now,
                    updated_at: now
                };
                const created = db.create('manufaturaResultadosTeste', record, empresaId);
                if (body.status === 'pass') {
                    try {
                        const gaveta = db.findById('manufaturaGavetas', body.gaveta_id);
                        if (gaveta && gaveta.etapa === 'teste') {
                            db.update('manufaturaGavetas', body.gaveta_id, { etapa: 'liberado', updated_at: now });
                        }
                    } catch (e) { /* gaveta may not exist */ }
                }
                sendJson(res, 200, { success: true, item: created });
            } catch (err) { sendJson(res, 500, { success: false, error: err.message }); }
            return;
        }

        if (pathname === '/api/manufatura/teste/perfil-por-tipo' && req.method === 'GET') {
            const tokenUser = getTokenUser(req);
            if (!tokenUser) { sendJson(res, 401, { error: 'Não autenticado' }); return; }
            try {
                const url = new URL(req.url, `http://${req.headers.host}`);
                const tipo = url.searchParams.get('tipo') || '';
                const empresaId = tokenUser.empresa_id || 'default';
                const todos = db.findAll('manufaturaPerfisTeste', empresaId);
                const perfis = tipo ? todos.filter(p => p.tipo_gaveta === tipo) : todos;
                sendJson(res, 200, { success: true, data: perfis });
            } catch (err) { sendJson(res, 500, { success: false, error: err.message }); }
            return;
        }

        // === MANUFATURA DATA BOOK & EXPORT ===

        if (pathname === '/api/manufatura/export/databook' && req.method === 'GET') {
            const tokenUser = getTokenUser(req);
            if (!tokenUser) { sendJson(res, 401, { error: 'Não autenticado' }); return; }
            try {
                const url = new URL(req.url, `http://${req.headers.host}`);
                const projectId = url.searchParams.get('projetoId') || '';
                const empresaId = tokenUser.empresa_id || 'default';
                if (!projectId) { sendJson(res, 400, { error: 'projetoId é obrigatório' }); return; }

                const proj = db.findById('manufaturaProjetos', projectId);
                if (!proj) { sendJson(res, 404, { error: 'Projeto não encontrado' }); return; }

                const colunas = db.findAll('manufaturaColunas', empresaId).filter(c => c.projeto_id === projectId);
                const colunaIds = colunas.map(c => c.id);
                const gavetas = db.findAll('manufaturaGavetas', empresaId).filter(g => colunaIds.includes(g.coluna_id));
                const gavetaIds = gavetas.map(g => g.id);
                const componentes = db.findAll('manufaturaComponentes', empresaId).filter(c => gavetaIds.includes(c.gaveta_id));
                const resultados = db.findAll('manufaturaResultadosTeste', empresaId).filter(r => gavetaIds.includes(r.gaveta_id));

                const wb = new (require('exceljs')).Workbook();
                const ws = wb.addWorksheet('Data Book');

                ws.columns = [
                    { header: 'Coluna', key: 'coluna', width: 14 },
                    { header: 'Gaveta', key: 'gaveta', width: 14 },
                    { header: 'Tipo', key: 'tipo', width: 18 },
                    { header: 'Modelo', key: 'modelo', width: 14 },
                    { header: 'Potência(kW)', key: 'potencia', width: 12 },
                    { header: 'Etapa', key: 'etapa', width: 20 },
                    { header: 'Status', key: 'status', width: 14 },
                    { header: 'Componentes', key: 'componentes', width: 30 },
                    { header: 'Teste', key: 'teste', width: 14 },
                    { header: 'Operador', key: 'operador', width: 16 },
                    { header: 'Data Teste', key: 'data_teste', width: 18 }
                ];

                for (const col of colunas) {
                    const colGavetas = gavetas.filter(g => g.coluna_id === col.id);
                    if (colGavetas.length === 0) {
                        ws.addRow({ coluna: col.tag, gaveta: '-', tipo: col.tipo, etapa: col.etapa, status: col.status });
                    }
                    for (const gav of colGavetas) {
                        const comps = componentes.filter(c => c.gaveta_id === gav.id).map(c => `${c.tipo}:${c.codigo}`).join(', ');
                        const teste = resultados.filter(r => r.gaveta_id === gav.id).sort((a, b) => (b.created_at || '').localeCompare(a.created_at || ''))[0];
                        ws.addRow({
                            coluna: col.tag,
                            gaveta: gav.tag,
                            tipo: gav.tipo,
                            modelo: gav.modelo,
                            potencia: gav.potencia_kw,
                            etapa: gav.etapa,
                            status: gav.status,
                            componentes: comps,
                            teste: teste?.status || 'pendente',
                            operador: teste?.operador || '',
                            data_teste: teste?.data_teste || ''
                        });
                    }
                }

                ws.getRow(1).font = { bold: true };
                res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
                res.setHeader('Content-Disposition', `attachment; filename="databook_${proj.nome?.replace(/[^a-zA-Z0-9]/g, '_')}.xlsx"`);
                await wb.xlsx.write(res);
                res.end();
            } catch (err) { sendJson(res, 500, { success: false, error: err.message }); }
            return;
        }

        if (pathname.startsWith('/api/manufatura/anexo/upload') && req.method === 'POST') {
            const tokenUser = getTokenUser(req);
            if (!tokenUser) { sendJson(res, 401, { error: 'Não autenticado' }); return; }
            try {
                const body = await readBody(req);
                const empresaId = tokenUser.empresa_id || 'default';
                const now = new Date().toISOString();

                const anexosDir = path.join(__dirname, 'data', 'anexos_manufatura', empresaId);
                if (!fs.existsSync(anexosDir)) fs.mkdirSync(anexosDir, { recursive: true });

                const safeName = (body.nome_arquivo || 'arquivo').replace(/[^a-zA-Z0-9._-]/g, '_');
                const fileName = Date.now() + '_' + safeName;
                const filePath = path.join(anexosDir, fileName);

                if (body.fileData) {
                    fs.writeFileSync(filePath, Buffer.from(body.fileData, 'base64'));
                }

                const record = {
                    id: 'ANEXO-' + Date.now().toString(36).toUpperCase(),
                    empresa_id: empresaId,
                    entidade_tipo: body.entidade_tipo || 'projeto',
                    entidade_id: body.entidade_id || '',
                    nome_arquivo: safeName,
                    tipo_arquivo: body.tipo_arquivo || '',
                    tamanho_bytes: body.fileData ? Math.round(Buffer.from(body.fileData, 'base64').length / 1024) : 0,
                    caminho: fileName,
                    descricao: body.descricao || '',
                    usuario: tokenUser.name || '',
                    created_at: now
                };
                const created = db.create('manufaturaAnexos', record, empresaId);
                sendJson(res, 200, { success: true, item: created });
            } catch (err) { sendJson(res, 500, { success: false, error: err.message }); }
            return;
        }

        if (pathname.startsWith('/api/manufatura/anexo/download/') && req.method === 'GET') {
            const tokenUser = getTokenUser(req);
            if (!tokenUser) { sendJson(res, 401, { error: 'Não autenticado' }); return; }
            try {
                const anexoId = pathname.split('/').pop();
                const anexo = db.findById('manufaturaAnexos', anexoId);
                if (!anexo) { sendJson(res, 404, { error: 'Anexo não encontrado' }); return; }
                const empresaId = anexo.empresa_id || tokenUser.empresa_id || 'default';
                const filePath = path.join(__dirname, 'data', 'anexos_manufatura', empresaId, anexo.caminho);
                if (!fs.existsSync(filePath)) { sendJson(res, 404, { error: 'Arquivo não encontrado' }); return; }
                const content = fs.readFileSync(filePath);
                res.setHeader('Content-Type', anexo.tipo_arquivo || 'application/octet-stream');
                res.setHeader('Content-Disposition', `attachment; filename="${anexo.nome_arquivo}"`);
                res.end(content);
            } catch (err) { sendJson(res, 500, { error: err.message }); }
            return;
        }

        // === MANUFATURA PUBLIC CERTIFICATE (no auth required, accessed via QR) ===

        if (pathname === '/api/manufatura/certificate/projeto' && req.method === 'GET') {
            const parsedUrl = url.parse(req.url, true);
            const projectId = parsedUrl.query.id;
            if (!projectId) { sendJson(res, 400, { error: 'id é obrigatório' }); return; }
            try {
                const proj = db.findById('manufaturaProjetos', projectId);
                if (!proj) { sendJson(res, 404, { error: 'Projeto não encontrado' }); return; }
                const empresaId = proj.empresa_id || 'default';
                const colunas = db.findAll('manufaturaColunas', empresaId).filter(c => c.projeto_id === projectId);
                const colunaIds = colunas.map(c => c.id);
                const gavetas = db.findAll('manufaturaGavetas', empresaId).filter(g => colunaIds.includes(g.coluna_id));
                const gavetaIds = gavetas.map(g => g.id);
                const comps = db.findAll('manufaturaComponentes', empresaId).filter(c => gavetaIds.includes(c.gaveta_id));
                const testes = db.findAll('manufaturaResultadosTeste', empresaId).filter(r => gavetaIds.includes(r.gaveta_id));

                const totalGavetas = gavetas.length;
                const testadas = testes.filter(t => t.status !== 'pendente').length;
                const aprovadas = testes.filter(t => t.status === 'pass').length;

                const etapaLabels = { inicio:'Início', montagem_mecanica:'Montagem Mecânica', fiacao:'Fiação', teste:'Teste', liberado:'Liberado' };

                res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
                res.end(`<!DOCTYPE html><html lang="pt-BR"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0">
                <title>Data Book - ${proj.nome || 'Projeto'}</title>
                <style>body{font-family:sans-serif;margin:0;padding:20px;background:#f1f5f9;color:#1e293b}
                .container{max-width:800px;margin:0 auto}
                .card{background:#fff;border-radius:12px;padding:24px;margin-bottom:16px;box-shadow:0 1px 4px rgba(0,0,0,0.08)}
                h1{font-size:20px;margin:0 0 4px 0}h2{font-size:16px;margin:0 0 12px 0;color:#475569}
                .stats{display:flex;gap:12px;margin:16px 0;flex-wrap:wrap}
                .stat{background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:12px 16px;text-align:center;flex:1;min-width:100px}
                .stat-value{font-size:22px;font-weight:700;color:#3b82f6}.stat-label{font-size:11px;color:#64748b;margin-top:2px}
                table{width:100%;border-collapse:collapse;font-size:13px;margin-top:8px}
                th{background:#f8fafc;padding:8px 10px;text-align:left;border-bottom:2px solid #e2e8f0;font-size:11px;color:#64748b;text-transform:uppercase}
                td{padding:8px 10px;border-bottom:1px solid #f1f5f9}
                .badge{display:inline-block;padding:2px 8px;border-radius:6px;font-size:11px;font-weight:600}
                .badge-pass{background:#dcfce7;color:#166534}.badge-fail{background:#fee2e2;color:#991b1b}.badge-pending{background:#f1f5f9;color:#64748b}
                .footer{text-align:center;font-size:11px;color:#94a3b8;padding:20px}
                </style></head><body>
                <div class="container">
                    <div class="card">
                        <h1>📦 ${proj.nome || 'Sem nome'}</h1>
                        <div style="font-size:13px;color:#64748b">${proj.cliente || 'Sem cliente'} | ${proj.data_criacao ? new Date(proj.data_criacao).toLocaleDateString('pt-BR') : '-'}</div>
                        <div class="stats">
                            <div class="stat"><div class="stat-value">${colunas.length}</div><div class="stat-label">Colunas</div></div>
                            <div class="stat"><div class="stat-value">${totalGavetas}</div><div class="stat-label">Gavetas</div></div>
                            <div class="stat"><div class="stat-value">${aprovadas}/${testadas}</div><div class="stat-label">Testes Aprovados</div></div>
                            <div class="stat"><div class="stat-value">${comps.length}</div><div class="stat-label">Componentes</div></div>
                        </div>
                    </div>
                    ${colunas.map(col => {
                        const colGavetas = gavetas.filter(g => g.coluna_id === col.id);
                        return `
                        <div class="card">
                            <h2>🔲 ${col.tag} (${col.tipo || 'CCM-BT'}) — ${etapaLabels[col.etapa] || col.etapa}</h2>
                            ${colGavetas.length === 0 ? '<div style="font-size:13px;color:#94a3b8">Nenhuma gaveta</div>' : `
                            <table><thead><tr><th>Gaveta</th><th>Tipo</th><th>Modelo</th><th>Potência</th><th>Etapa</th><th>Teste</th></tr></thead>
                            <tbody>${colGavetas.map(g => {
                                const t = testes.filter(x => x.gaveta_id === g.id).sort((a,b)=>(b.created_at||'').localeCompare(a.created_at||''))[0];
                                const tClass = t?.status === 'pass' ? 'pass' : t?.status === 'fail' ? 'fail' : 'pending';
                                const tLabel = t?.status === 'pass' ? 'Aprovado' : t?.status === 'fail' ? 'Reprovado' : 'Pendente';
                                return `<tr><td><strong>${g.tag}</strong></td><td>${(g.tipo||'').replace(/_/g,' ')}</td><td>${g.modelo||'-'}</td><td>${g.potencia_kw||'-'}</td><td>${etapaLabels[g.etapa]||g.etapa}</td><td><span class="badge badge-${tClass}">${tLabel}</span></td></tr>`;
                            }).join('')}</tbody></table>`}
                        </div>`;
                    }).join('')}
                    <div class="footer">Documento gerado pelo GeraPro — Sistema de Rastreabilidade de Manufatura</div>
                </div></body></html>`);
            } catch (err) { sendJson(res, 500, { error: err.message }); }
            return;
        }

        if (pathname === '/api/manufatura/substituir-gaveta' && req.method === 'POST') {
            const tokenUser = getTokenUser(req);
            if (!tokenUser) { sendJson(res, 401, { error: 'Não autenticado' }); return; }
            try {
                const body = await readBody(req);
                const empresaId = tokenUser.empresa_id || 'default';
                const now = new Date().toISOString();
                const { gaveta_id, motivo, gaveta_substituta_id } = body;
                if (!gaveta_id || !motivo) { sendJson(res, 400, { error: 'gaveta_id e motivo são obrigatórios' }); return; }

                const gaveta = db.findById('manufaturaGavetas', gaveta_id);
                if (!gaveta) { sendJson(res, 404, { error: 'Gaveta não encontrada' }); return; }

                db.update('manufaturaGavetas', gaveta_id, { status: 'cancelado', observacoes: `Substituída: ${motivo}`, updated_at: now });

                if (gaveta_substituta_id) {
                    db.update('manufaturaGavetas', gaveta_substituta_id, { coluna_id: gaveta.coluna_id, etapa: 'inicio', status: 'em_andamento', updated_at: now });
                }

                const histPayload = {
                    id: 'HST-' + Date.now().toString(36).toUpperCase(),
                    entidade_tipo: 'gaveta',
                    entidade_id: gaveta_id,
                    acao: `Gaveta ${gaveta.tag} substituída. Motivo: ${motivo}`,
                    usuario: tokenUser.name || 'Sistema',
                    dados: JSON.stringify({ motivo, gaveta_substituta_id, gaveta_antiga_tag: gaveta.tag }),
                    created_at: now
                };
                db.create('manufaturaHistorico', histPayload, empresaId);

                sendJson(res, 200, { success: true });
            } catch (err) { sendJson(res, 500, { success: false, error: err.message }); }
            return;
        }

        // === MANUFATURA NOTIFICATION ===

        if (pathname === '/api/manufatura/notify' && req.method === 'POST') {
            const tokenUser = getTokenUser(req);
            if (!tokenUser) { sendJson(res, 401, { error: 'Não autenticado' }); return; }
            try {
                const body = await readBody(req);
                const empresaId = tokenUser.empresa_id || 'default';
                const settings = db.getSettings(empresaId);
                const tokenBot = settings?.telegram_bot_token || process.env.TELEGRAM_BOT_TOKEN || '';
                if (!tokenBot) { sendJson(res, 200, { success: true, notified: false, reason: 'No bot token' }); return; }

                const chatIds = db.findAll('usuarios', empresaId)
                    .filter(u => u.telegram_chat_id)
                    .map(u => u.telegram_chat_id);

                if (chatIds.length === 0) { sendJson(res, 200, { success: true, notified: false, reason: 'No chat IDs' }); return; }

                const text = `🏭 *Manufatura - ${body.evento || 'Notificação'}*\n\n${body.mensagem || ''}\n\n_${new Date().toLocaleString('pt-BR')}_`;

                for (const chatId of chatIds) {
                    try {
                        const urlTelegram = `https://api.telegram.org/bot${tokenBot}/sendMessage`;
                        await fetch(urlTelegram, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ chat_id: chatId, text, parse_mode: 'Markdown' })
                        }).catch(() => {});
                    } catch (e) {}
                }
                sendJson(res, 200, { success: true, notified: true, chats: chatIds.length });
            } catch (err) { sendJson(res, 500, { success: false, error: err.message }); }
            return;
        }

        // === AI IMPORT/EXPORT ===

        if (pathname === '/api/import-document' && req.method === 'POST') { handleImportDocument(await readBody(req), res); return; }
        if (pathname === '/api/export-ai-extraction' && req.method === 'POST') { handleExportAIExtraction(await readBody(req), res); return; }
        if (pathname === '/api/export-io-bom' && req.method === 'POST') { handleExportIOBOM(await readBody(req), res); return; }
        if (pathname === '/api/export-io-list' && req.method === 'POST') { handleExportIOList(await readBody(req), res); return; }
        if (pathname === '/api/export-lm' && req.method === 'POST') { handleExportLM(await readBody(req), res); return; }
        if (pathname === '/api/export-pipeline-log-xlsx' && req.method === 'POST') { handleExportPipelineLog(await readBody(req), res); return; }

        // === DXF BLOCK API ===

        const dxfMatch = pathname.match(/^\/api\/materiais\/(.+)\/dxf$/);
        if (dxfMatch && req.method === 'GET') {
            const tokenUser = getTokenUser(req);
            if (!tokenUser) { sendJson(res, 401, { error: 'Não autenticado' }); return; }
            const materialId = dxfMatch[1];
            const content = db.getMaterialDxf(materialId);
            sendJson(res, 200, { dxf_block: content });
            return;
        }
        if (dxfMatch && req.method === 'PUT') {
            const tokenUser = getTokenUser(req);
            if (!tokenUser) { sendJson(res, 401, { error: 'Não autenticado' }); return; }
            try {
                const body = await readBody(req);
                const { fileData } = body;
                const materialId = dxfMatch[1];
                if (!fileData) { sendJson(res, 400, { error: 'fileData é obrigatório' }); return; }
                const buffer = Buffer.from(fileData, 'base64');
                let content = buffer.toString('utf-8');
                content = content.replace(/^\uFEFF/, '').trimStart();
                if (!/^0[\r\n]/.test(content)) { sendJson(res, 400, { error: 'Arquivo DXF inválido: arquivo não parece ser um DXF' }); return; }
                let entities = [];
                try {
                    const parser = new DxfParser();
                    const parsed = parser.parseSync(content);
                    if (parsed && parsed.entities) {
                        entities = parsed.entities.map(e => {
                            const base = { type: e.type };
                            if (e.type === 'LINE') {
                                base.startPoint = e.startPoint;
                                base.endPoint = e.endPoint;
                            } else if (e.type === 'CIRCLE' || e.type === 'ARC') {
                                base.center = e.center;
                                base.radius = e.radius;
                                if (e.type === 'ARC') { base.startAngle = e.startAngle; base.endAngle = e.endAngle; }
                            } else if (e.type === 'LWPOLYLINE' || e.type === 'POLYLINE') {
                                base.vertices = (e.vertices || []).map(v => ({ x: v.x, y: v.y }));
                                base.closed = e.closed;
                            } else if (e.type === 'TEXT' || e.type === 'MTEXT') {
                                base.startPoint = e.startPoint;
                                base.text = e.text;
                                base.textHeight = e.textHeight;
                            } else if (e.type === 'POINT') {
                                base.position = e.position;
                            } else if (e.type === 'ELLIPSE') {
                                base.center = e.center;
                                base.majorAxisEndPoint = e.majorAxisEndPoint;
                                base.ratio = e.axisRatio;
                            } else if (e.type === 'SOLID' || e.type === 'TRACE') {
                                base.points = e.points;
                            } else if (e.type === 'INSERT') {
                                base.position = e.position;
                                base.block = e.block;
                            } else if (e.type === 'SPLINE') {
                                base.controlPoints = e.controlPoints;
                                base.degree = e.degree;
                            }
                            return base;
                        });
                    }
                } catch (parseErr) {
                    console.error('[DXF] Parse error:', parseErr.message);
                    sendJson(res, 400, { error: 'Arquivo DXF inválido: ' + parseErr.message });
                    return;
                }
                const enriched = JSON.stringify({ entities });
                db.setMaterialDxf(materialId, enriched);
                sendJson(res, 200, { success: true });
            } catch (err) { sendJson(res, 500, { error: err.message }); }
            return;
        }
        if (dxfMatch && req.method === 'DELETE') {
            const tokenUser = getTokenUser(req);
            if (!tokenUser) { sendJson(res, 401, { error: 'Não autenticado' }); return; }
            const materialId = dxfMatch[1];
            db.setMaterialDxf(materialId, null);
            sendJson(res, 200, { success: true });
            return;
        }

        // === STATIC FILES ===

        serveStatic(pathname, res);

    } catch (err) {
        console.error('[Server] Unhandled error:', err);
        if (!res.headersSent) sendJson(res, 500, { error: err.message || 'Erro interno do servidor' });
    }
});

server.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}/`);
    console.log('Press Ctrl+C to stop.');
    // Migrate users from JSON to SQLite
    try {
        const migrated = db.migrateUsersFromJson();
        if (migrated > 0) console.log(`[Server] ${migrated} usuários migrados para SQLite`);
    } catch (e) {
        console.warn('[Server] Erro na migração de usuários:', e.message);
    }
    // Initialize templates directory and migrate root .docx files
    try {
        if (!fs.existsSync(TEMPLATES_DIR)) fs.mkdirSync(TEMPLATES_DIR, { recursive: true });
        migrateRootTemplates();
        // Backfill folder_name and rename existing folders
        db.backfillFolderNames();
        const empresas = db.listEmpresas();
        for (const emp of empresas) {
            ensureEmpresaTemplatesDir(emp.id);
            // Rename old UUID-only folder to new folder_name format if it exists
            const oldTemplatesDir = path.join(TEMPLATES_DIR, emp.id);
            const newTemplatesDir = getEmpresaTemplatesDir(emp.id);
            if (fs.existsSync(oldTemplatesDir) && oldTemplatesDir !== newTemplatesDir) {
                try { fs.renameSync(oldTemplatesDir, newTemplatesDir); console.log(`[Templates] Renamed ${emp.id} -> ${emp.folder_name}`); } catch (e) { /* folder may already be migrated */ }
            }
            // Same for PTC dirs
            const oldPtcDir = path.join(PTC_BASE_DIR, emp.id);
            const newPtcDir = getEmpresaPtcDir(emp.id);
            if (fs.existsSync(oldPtcDir) && oldPtcDir !== newPtcDir) {
                try { fs.renameSync(oldPtcDir, newPtcDir); console.log(`[PTC] Renamed ${emp.id} -> ${emp.folder_name}`); } catch (e) { /* folder may already be migrated */ }
            }
        }
        console.log('[Templates] Diretório de templates inicializado.');
    } catch (e) {
        console.warn('[Templates] Erro na inicialização:', e.message);
    }
    // Migrate root PTC folders to GeraPro/default/ on first run
    try {
        if (!fs.existsSync(PTC_BASE_DIR)) fs.mkdirSync(PTC_BASE_DIR, { recursive: true });
        migrateRootPtcs();
        console.log('[PTC] Diretório de PTCs inicializado.');
    } catch (e) {
        console.warn('[PTC] Erro na inicialização:', e.message);
    }
    // Initialize Telegram bot if token exists
    try {
        const settings = db.getSettings('default');
        if (settings && settings.telegram_bot_token) {
            initTelegramBot(settings.telegram_bot_token);
        } else {
            console.log('[Telegram] Token não encontrado — bot não inicializado.');
        }
    } catch (e) {
        console.warn('[Telegram] Could not init bot at startup:', e.message);
    }
});
