const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const tmpDir = fs.mkdtempSync('tmpl_');
try {
  execSync('powershell -NoProfile -Command "Expand-Archive -LiteralPath ''C:\\Users\\jcc\\Documents\\Workspace_A\\GeraPro\\TEMPLATE_COM.docx'' -DestinationPath ''' + tmpDir.replace(/\\/g, '\\\\') + ''' -Force"', { stdio: 'pipe', shell: true, timeout: 15000 });
  const docPath = path.join(tmpDir, 'word', 'document.xml');
  if (fs.existsSync(docPath)) {
    const content = fs.readFileSync(docPath, 'utf8');
    const tags = [...new Set((content.match(/\{[a-zA-Z_][a-zA-Z0-9_]*\}/g) || []))].sort();
    console.log('=== TAGS in document.xml ===');
    console.log(JSON.stringify(tags, null, 2));
    const paymentTags = [...new Set((content.match(/\{[^}]*\}/g) || []).filter(t => /pgto|pagamento|condicao|parcela|evento/i.test(t)))];
    console.log('\n=== Payment-related tags ===');
    console.log(paymentTags.join('\n') || 'none');
    const wordDir = path.join(tmpDir, 'word');
    fs.readdirSync(wordDir).forEach(f => {
      if (f.endsWith('.xml')) {
        const c = fs.readFileSync(path.join(wordDir, f), 'utf8');
        const t = c.match(/\{[a-zA-Z_][a-zA-Z0-9_]*\}/g);
        if (t && t.length > 0) console.log('\n=== Tags in word/' + f + ' ===\n' + [...new Set(t)].sort().join('\n'));
      }
    });
  } else {
    console.log('not found', require('child_process').execSync('dir "' + tmpDir + '" /s /b', {shell: true, encoding: 'utf8'}));
  }
} catch(e) { console.error('Error:', e.message); }
try { fs.rmSync(tmpDir, { recursive: true, force: true }); } catch(e) {}
