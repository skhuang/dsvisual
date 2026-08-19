const fs = require('fs');

// methodId -> base filename (without language-specific extension)
const METHOD_SRC = {
    'graph-dijkstra': 'graph_dijkstra',
};

const LANGS = [
    { key: 'python', ext: 'py' },
    { key: 'rust', ext: 'rs' },
    { key: 'go', ext: 'go' },
    { key: 'php', ext: 'php' },
];

function escapeForTemplateLiteral(content) {
    return content.replace(/\\/g, '\\\\').replace(/`/g, '\\`').replace(/\$/g, '\\$');
}

let out = "// Auto-generated multi-language code DB — edit src/<lang>/*, then run: node build_multilang.js\n";
out += 'const CODE_MULTILANG = {\n';

for (const [methodId, base] of Object.entries(METHOD_SRC)) {
    out += `    ${JSON.stringify(methodId)}: {\n`;
    for (const { key, ext } of LANGS) {
        const spath = `src/${key}/${base}.${ext}`;
        if (!fs.existsSync(spath)) {
            continue;
        }
        const content = fs.readFileSync(spath, 'utf8');
        out += `        ${key}: \`${escapeForTemplateLiteral(content)}\`,\n`;
    }
    out += '    },\n';
}

out += '};\n\n';
out += "if (typeof window !== 'undefined') window.CODE_MULTILANG = CODE_MULTILANG;\n";
out += "if (typeof module !== 'undefined' && module.exports) module.exports = CODE_MULTILANG;\n";

fs.writeFileSync('js/code_multilang.js', out);
