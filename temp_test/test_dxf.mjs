import { readFileSync, writeFileSync } from 'fs';

const code = readFileSync('js/dxf-writer.js', 'utf-8');
const getClasses = new Function(code + '\nreturn { DXFWriter, DXFBlock };');
const { DXFWriter, DXFBlock } = getClasses();

function test(name, fn) {
    try {
        fn();
        console.log('  PASS:', name);
    } catch (e) {
        console.log('  FAIL:', name, '-', e.message);
    }
}

// --- Test 1: Basic output ---
console.log('\n=== Test 1: Basic DXF output ===');
{
    const d = new DXFWriter();
    d.addLayer('TEST', 1, 'CONTINUOUS');
    d.setActiveLayer('TEST');
    d.rect(0, 0, 100, 200);
    d.line(0, 0, 100, 200);
    d.text(50, 100, 10, 0, 'Test');
    const dxf = d.toDxfString();

    test('Starts with SECTION', () => {
        if (!dxf.startsWith('0\nSECTION')) throw new Error('Bad start');
    });
    test('Ends with EOF', () => {
        if (!dxf.trimEnd().endsWith('0\nEOF')) throw new Error('Bad EOF');
    });
    test('Has EXTMAX', () => {
        if (dxf.indexOf('$EXTMAX') < 0) throw new Error('Missing EXTMAX');
    });
    test('Has EXTMIN', () => {
        if (dxf.indexOf('$EXTMIN') < 0) throw new Error('Missing EXTMIN');
    });
    test('Has VIEWCTR', () => {
        if (dxf.indexOf('$VIEWCTR') < 0) throw new Error('Missing VIEWCTR');
    });
    test('Has VIEWSIZE', () => {
        if (dxf.indexOf('$VIEWSIZE') < 0) throw new Error('Missing VIEWSIZE');
    });
    test('No VPORT table (R12 compat)', () => {
        if (dxf.indexOf('TABLE\n2\nVPORT') >= 0) throw new Error('Unexpected VPORT');
    });
    test('No STYLE table (R12 compat)', () => {
        if (dxf.indexOf('TABLE\n2\nSTYLE') >= 0) throw new Error('Unexpected STYLE');
    });
    test('Has LTYPE DASHED pattern', () => {
        if (dxf.indexOf('DASHED\n72\n65\n73\n2\n40\n0.75') < 0) throw new Error('Bad DASHED pattern');
    });
    test('Has LTYPE DOTTED pattern', () => {
        if (dxf.indexOf('DOTTED\n72\n65\n73\n2\n40\n0.25') < 0) throw new Error('Bad DOTTED pattern');
    });
    test('No LWPOLYLINE (using POLYLINE)', () => {
        if (dxf.indexOf('LWPOLYLINE') >= 0) throw new Error('Unexpected LWPOLYLINE');
    });
    test('AC1009 version', () => {
        if (dxf.indexOf('AC1009') < 0) throw new Error('Wrong version');
    });
    test('SECTION count matches ENDSEC', () => {
        const sections = (dxf.match(/0\nSECTION/g) || []).length;
        const endsecs = (dxf.match(/0\nENDSEC/g) || []).length;
        if (sections !== endsecs) throw new Error('Mismatch: ' + sections + ' sections, ' + endsecs + ' ENDSEC');
    });
    test('No NaN values', () => {
        if (/\bNaN\b/.test(dxf)) throw new Error('Contains NaN');
    });
    test('Sanitizes non-ASCII text', () => {
        const d2 = new DXFWriter();
        d2.addLayer('T', 7, 'CONTINUOUS');
        d2.setActiveLayer('T');
        d2.text(0, 0, 10, 0, 'coração');
        const dxf2 = d2.toDxfString();
        // Find TEXT entity's text value (after "1\n" that follows a TEXT line)
        const textIdx = dxf2.indexOf('TEXT');
        const afterText = dxf2.substring(textIdx);
        const match = afterText.match(/1\n([^\n]+)/);
        if (!match) throw new Error('No text value found');
        if (match[1].indexOf('_') >= 0) return; // sanitized
        // Check if any non-ASCII bytes remain in text value
        for (let i = 0; i < match[1].length; i++) {
            if (match[1].charCodeAt(i) > 127) throw new Error('Non-ASCII not sanitized: ' + match[1]);
        }
    });

    writeFileSync('temp_test/output.dxf', dxf);
    console.log('  Written: temp_test/output.dxf (' + dxf.length + ' bytes)');
}

// --- Test 2: Blocks (INSERT) ---
console.log('\n=== Test 2: BLOCK + INSERT ===');
{
    const d = new DXFWriter();
    d.addLayer('BLOCKS', 2, 'CONTINUOUS');
    d.setActiveLayer('BLOCKS');

    d.addBlock('MYBLOCK', (b) => {
        b.rect(0, 0, 50, 30);
        b.circle(25, 15, 10);
        b.text(25, 35, 5, 0, 'Label');
    });

    d.insertBlock('MYBLOCK', 100, 200, 1, 1, 0);
    d.insertBlock('MYBLOCK', 300, 200, 2, 2, 45);

    const dxf = d.toDxfString();

    test('BLOCK section present', () => {
        if (dxf.indexOf('SECTION\n2\nBLOCKS') < 0) throw new Error('Missing BLOCKS section');
    });
    test('ENDBLK present', () => {
        if (dxf.indexOf('ENDBLK') < 0) throw new Error('Missing ENDBLK');
    });
    test('INSERT entities present', () => {
        if (dxf.indexOf('INSERT') < 0) throw new Error('Missing INSERT');
    });
    test('Block name in BLOCK definition', () => {
        if (dxf.indexOf('2\nMYBLOCK') < 0) throw new Error('Missing block name');
    });

    writeFileSync('temp_test/output2.dxf', dxf);
    console.log('  Written: temp_test/output2.dxf (' + dxf.length + ' bytes)');
}

// --- Test 3: Open polyline and ARC simulation ---
console.log('\n=== Test 3: Open polyline + ARC ===');
{
    const d = new DXFWriter();
    d.addLayer('GEO', 3, 'CONTINUOUS');
    d.setActiveLayer('GEO');

    // Open polyline (not closed)
    d.polyline([[0, 0], [100, 50], [200, 0]], false);

    // ARC approximation via open polyline
    const cx = 300, cy = 100, r = 80;
    const startAngle = 0, endAngle = 180;
    const pts = [];
    const segs = 32;
    for (let i = 0; i <= segs; i++) {
        const t = (startAngle + (endAngle - startAngle) * (i / segs)) * Math.PI / 180;
        pts.push([cx + r * Math.cos(t), cy + r * Math.sin(t)]);
    }
    d.polyline(pts, false);

    const dxf = d.toDxfString();

    test('Open polyline (70=0) present', () => {
        // First polyline should have closed=0
        const firstPoly = dxf.indexOf('POLYLINE');
        const afterPoly = dxf.indexOf('70', firstPoly);
        // The first 70 after POLYLINE is the closed flag (before vertices' 70)
        const lines = dxf.substring(firstPoly, firstPoly + 100).split('\n');
        for (let i = 0; i < lines.length; i++) {
            if (lines[i] === '70' && i + 1 < lines.length) {
                if (lines[i + 1] === '0') break; // open polyline found
                if (lines[i + 1] === '1') throw new Error('First polyline is closed (should be open)');
            }
        }
    });

    writeFileSync('temp_test/output3.dxf', dxf);
    console.log('  Written: temp_test/output3.dxf (' + dxf.length + ' bytes)');
}

// --- Test 4: CRLF mode ---
console.log('\n=== Test 4: CRLF mode ===');
{
    const d = new DXFWriter();
    d.setUseCRLF(true);
    d.addLayer('T', 7, 'CONTINUOUS');
    d.setActiveLayer('T');
    d.line(0, 0, 100, 100);
    const dxf = d.toDxfString();

    test('Uses CRLF line endings', () => {
        if (dxf.indexOf('\r\n') < 0) throw new Error('No CRLF found');
    });
    test('Starts with 0\\r\\nSECTION', () => {
        if (!dxf.startsWith('0\r\nSECTION')) throw new Error('Bad CRLF start');
    });

    writeFileSync('temp_test/output_crlf.dxf', dxf);
    console.log('  Written: temp_test/output_crlf.dxf (' + dxf.length + ' bytes)');
}

console.log('\n=== All tests done ===');
