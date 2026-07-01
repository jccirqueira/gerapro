function _sanitizeDXFText(text) {
    var str = (text != null ? String(text) : '');
    str = str.replace(/\n/g, ' ').replace(/\r/g, '');
    str = str.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    str = str.replace(/[^\x20-\x7E]/g, '_');
    return str;
}

function _fmtNum(v) {
    if (typeof v === 'number' && isFinite(v)) return String(v);
    return '0';
}

function _fmtCoord(v) {
    return _fmtNum(v);
}

class DXFWriter {
    constructor() {
        this.layers = { '0': { color: 7, lineType: 'CONTINUOUS' } };
        this.activeLayer = '0';
        this.entities = [];
        this.blocks = {};
        this.blockOrder = [];
        this.styles = {};
        this.dimStyle = null;
        this.extMinX = Infinity;
        this.extMinY = Infinity;
        this.extMaxX = -Infinity;
        this.extMaxY = -Infinity;
        this.useCRLF = false;
    }

    addStyle(name, fontFile, height, widthFactor) {
        this.styles[name] = { fontFile: fontFile || '', height: height || 0, widthFactor: widthFactor || 1.0 };
    }

    setDimStyle(name, opts) {
        this.dimStyle = {
            name: name || 'GERAPRO',
            scale: (opts && opts.scale) || 1,
            txt: (opts && opts.txt) || 2.5,
            asz: (opts && opts.asz) || 2.0,
            gap: (opts && opts.gap) || 3.75,
            exo: (opts && opts.exo) || 1.25,
            exe: (opts && opts.exe) || 0.625,
            tad: (opts && opts.tad != null) ? opts.tad : 1,
            zin: (opts && opts.zin != null) ? opts.zin : 8,
        };
    }

    dim(x1, y1, x2, y2, text, yDim, styleName) {
        var ts = 1.5;    // tick half-size
        var exo = 3.75;  // extension line gap from object (300% original)
        var exe = 3.0;   // extension line overhang past dim line (300% original)

        var isBelow = yDim < y1;
        var sign = isBelow ? -1 : 1;

        var eStart = y1 + sign * exo;
        var eEnd = yDim + sign * exe;

        // Extension lines
        this.line(x1, eStart, x1, eEnd);
        this.line(x2, eStart, x2, eEnd);

        // Dimension line
        this.line(x1, yDim, x2, yDim);

        // Arrow heads at both ends
        var as = ts * 2;
        // Left arrow (pointing left)
        this.line(x1, yDim, x1 - as, yDim + ts);
        this.line(x1, yDim, x1 - as, yDim - ts);
        // Right arrow (pointing right)
        this.line(x2, yDim, x2 + as, yDim + ts);
        this.line(x2, yDim, x2 + as, yDim - ts);

        // Text on the outside of the dimension line (20mm acima)
        var midX = (x1 + x2) / 2;
        var textY = (isBelow ? (yDim - ts * 2 - 1) : (yDim + ts * 2 + 1)) - 20;
        this.text(midX, textY, 20, 0, text, styleName);
    }

    setUseCRLF(val) {
        this.useCRLF = !!val;
    }

    NL() {
        return this.useCRLF ? '\r\n' : '\n';
    }

    addLayer(name, color, lineType) {
        this.layers[name] = { color: color, lineType: lineType || 'CONTINUOUS' };
    }

    setActiveLayer(name) {
        this.activeLayer = name;
    }

    addBlock(name, callback) {
        if (this.blocks[name]) return;
        var block = new DXFBlock(name);
        callback(block);
        this.blocks[name] = block;
        this.blockOrder.push(name);
    }

    _trackExtents(x, y) {
        if (!isFinite(x) || !isFinite(y)) return;
        if (x < this.extMinX) this.extMinX = x;
        if (y < this.extMinY) this.extMinY = y;
        if (x > this.extMaxX) this.extMaxX = x;
        if (y > this.extMaxY) this.extMaxY = y;
    }

    line(x1, y1, x2, y2) {
        this.entities.push({ type: 'LINE', layer: this.activeLayer, x1: x1, y1: y1, x2: x2, y2: y2 });
        this._trackExtents(x1, y1);
        this._trackExtents(x2, y2);
    }

    circle(cx, cy, r) {
        this.entities.push({ type: 'CIRCLE', layer: this.activeLayer, cx: cx, cy: cy, r: r });
        this._trackExtents(cx - r, cy - r);
        this._trackExtents(cx + r, cy + r);
    }

    rect(x, y, w, h) {
        this.polyline([[x, y], [x + w, y], [x + w, y + h], [x, y + h], [x, y]], true);
    }

    polyline(points, closed) {
        if (points.length < 2) return;
        if (closed === undefined) closed = true;
        this.entities.push({ type: 'POLYLINE', layer: this.activeLayer, points: points, closed: !!closed });
        for (var i = 0; i < points.length; i++) {
            this._trackExtents(points[i][0], points[i][1]);
        }
    }

    text(x, y, height, rotation, text, styleName) {
        var ent = { type: 'TEXT', layer: this.activeLayer, x: x, y: y, height: height || 10, rotation: rotation || 0, text: _sanitizeDXFText(text) };
        if (styleName && this.styles[styleName]) ent.styleName = styleName;
        this.entities.push(ent);
        this._trackExtents(x, y);
    }

    point(x, y) {
        this.entities.push({ type: 'POINT', layer: this.activeLayer, x: x, y: y });
        this._trackExtents(x, y);
    }

    insertBlock(name, x, y, scaleX, scaleY, rotation) {
        this.entities.push({ type: 'INSERT', layer: this.activeLayer, block: name, x: x, y: y, scaleX: scaleX || 1, scaleY: scaleY || 1, rotation: rotation || 0 });
        this._trackExtents(x, y);
        if (this.blocks[name]) {
            var blk = this.blocks[name];
            for (var i = 0; i < blk.entities.length; i++) {
                var e = blk.entities[i];
                if (e.type === 'LINE') {
                    this._trackExtents(x + e.x1, y + e.y1);
                    this._trackExtents(x + e.x2, y + e.y2);
                } else if (e.type === 'CIRCLE') {
                    this._trackExtents(x + e.cx - e.r, y + e.cy - e.r);
                    this._trackExtents(x + e.cx + e.r, y + e.cy + e.r);
                } else if (e.type === 'POLYLINE') {
                    for (var j = 0; j < e.points.length; j++) {
                        this._trackExtents(x + e.points[j][0], y + e.points[j][1]);
                    }
                } else if (e.type === 'TEXT' || e.type === 'POINT') {
                    this._trackExtents(x + e.x, y + e.y);
                }
            }
        }
    }

    toDxfString() {
        var nl = this.NL();
        var s = '';

        s += '0' + nl + 'SECTION' + nl + '2' + nl + 'HEADER' + nl;
        s += '9' + nl + '$ACADVER' + nl + '1' + nl + 'AC1009' + nl;

        var pad = 50;

        // Recompute extents from all entities to ensure correctness
        this.extMinX = Infinity; this.extMinY = Infinity; this.extMaxX = -Infinity; this.extMaxY = -Infinity;
        for (var ei = 0; ei < this.entities.length; ei++) {
            var ee = this.entities[ei];
            if (ee.type === 'LINE') { this._trackExtents(ee.x1, ee.y1); this._trackExtents(ee.x2, ee.y2); }
            else if (ee.type === 'CIRCLE') { this._trackExtents(ee.cx - ee.r, ee.cy - ee.r); this._trackExtents(ee.cx + ee.r, ee.cy + ee.r); }
            else if (ee.type === 'POLYLINE') { for (var pj = 0; pj < ee.points.length; pj++) { this._trackExtents(ee.points[pj][0], ee.points[pj][1]); } }
            else if (ee.type === 'TEXT' || ee.type === 'POINT' || ee.type === 'INSERT') { this._trackExtents(ee.x, ee.y); }
        }

        var exMinX = isFinite(this.extMinX) ? this.extMinX - pad : -10;
        var exMinY = isFinite(this.extMinY) ? this.extMinY - pad : -10;
        var exMaxX = isFinite(this.extMaxX) ? this.extMaxX + pad : 10;
        var exMaxY = isFinite(this.extMaxY) ? this.extMaxY + pad : 10;

        s += '9' + nl + '$EXTMIN' + nl + '10' + nl + _fmtCoord(exMinX) + nl + '20' + nl + _fmtCoord(exMinY) + nl;
        s += '9' + nl + '$EXTMAX' + nl + '10' + nl + _fmtCoord(exMaxX) + nl + '20' + nl + _fmtCoord(exMaxY) + nl;

        var vcX = _fmtCoord((exMinX + exMaxX) / 2);
        var vcY = _fmtCoord((exMinY + exMaxY) / 2);
        s += '9' + nl + '$VIEWCTR' + nl + '10' + nl + vcX + nl + '20' + nl + vcY + nl;

        var vs = _fmtCoord(Math.max(exMaxX - exMinX, exMaxY - exMinY) * 2);
        if (parseFloat(vs) <= 0) vs = '1000';
        s += '9' + nl + '$VIEWSIZE' + nl + '40' + nl + vs + nl;
        s += '9' + nl + '$LTSCALE' + nl + '40' + nl + '100' + nl;

        // Dimension style header variables
        if (this.dimStyle) {
            var ds = this.dimStyle;
            s += '9' + nl + '$DIMSCALE' + nl + '40' + nl + _fmtNum(ds.scale) + nl;
            s += '9' + nl + '$DIMTXT' + nl + '40' + nl + _fmtNum(ds.txt) + nl;
            s += '9' + nl + '$DIMASZ' + nl + '40' + nl + _fmtNum(ds.asz) + nl;
            s += '9' + nl + '$DIMGAP' + nl + '40' + nl + _fmtNum(ds.gap) + nl;
            s += '9' + nl + '$DIMEXO' + nl + '40' + nl + _fmtNum(ds.exo) + nl;
            s += '9' + nl + '$DIMEXE' + nl + '40' + nl + _fmtNum(ds.exe) + nl;
            s += '9' + nl + '$DIMTAD' + nl + '70' + nl + ds.tad + nl;
            s += '9' + nl + '$DIMZIN' + nl + '70' + nl + ds.zin + nl;
        }

        s += '0' + nl + 'ENDSEC' + nl;

        s += this._tables(nl);
        s += this._blocks(nl);
        s += this._entities(nl);
        s += '0' + nl + 'EOF' + nl;

        s = s.replace(/\bNaN\b/g, '0');
        return s;
    }

    _tables(nl) {
        var s = '0' + nl + 'SECTION' + nl + '2' + nl + 'TABLES' + nl;

        // LTYPE
        var ltNames = ['CONTINUOUS', 'DASHED', 'DOTTED'];
        s += '0' + nl + 'TABLE' + nl + '2' + nl + 'LTYPE' + nl + '70' + nl + ltNames.length + nl;
        for (var li = 0; li < ltNames.length; li++) {
            var lt = ltNames[li];
            s += '0' + nl + 'LTYPE' + nl + '2' + nl + lt + nl + '70' + nl + '0' + nl + '3' + nl + lt + nl + '72' + nl + '65';
            if (lt === 'DASHED') {
                s += nl + '73' + nl + '2' + nl + '40' + nl + '0.75' + nl + '49' + nl + '0.5' + nl + '49' + nl + '-0.25';
            } else if (lt === 'DOTTED') {
                s += nl + '73' + nl + '2' + nl + '40' + nl + '0.25' + nl + '49' + nl + '0.0' + nl + '49' + nl + '-0.25';
            } else {
                s += nl + '73' + nl + '0' + nl + '40' + nl + '0';
            }
            s += nl;
        }
        s += '0' + nl + 'ENDTAB' + nl;

        // LAYER
        var layerNames = Object.keys(this.layers);
        s += '0' + nl + 'TABLE' + nl + '2' + nl + 'LAYER' + nl + '70' + nl + layerNames.length + nl;
        for (var i = 0; i < layerNames.length; i++) {
            var name = layerNames[i];
            var l = this.layers[name];
            s += '0' + nl + 'LAYER' + nl + '2' + nl + name + nl + '70' + nl + '0' + nl + '62' + nl + l.color + nl + '6' + nl + l.lineType + nl;
        }
        s += '0' + nl + 'ENDTAB' + nl;

        // STYLE (if any registered)
        var styleNames = Object.keys(this.styles);
        if (styleNames.length > 0) {
            s += '0' + nl + 'TABLE' + nl + '2' + nl + 'STYLE' + nl + '70' + nl + styleNames.length + nl;
            for (var si = 0; si < styleNames.length; si++) {
                var stName = styleNames[si];
                var st = this.styles[stName];
                s += '0' + nl + 'STYLE' + nl + '2' + nl + stName + nl;
                s += '70' + nl + '0' + nl;
                s += '40' + nl + _fmtNum(st.height) + nl;
                s += '41' + nl + _fmtNum(st.widthFactor) + nl;
                s += '50' + nl + '0' + nl;
                s += '71' + nl + '0' + nl;
                s += '42' + nl + '20' + nl;
                s += '3' + nl + (st.fontFile || '') + nl;
                s += '4' + nl + '' + nl;
            }
            s += '0' + nl + 'ENDTAB' + nl;
        }

        s += '0' + nl + 'ENDSEC' + nl;
        return s;
    }

    _blocks(nl) {
        var s = '0' + nl + 'SECTION' + nl + '2' + nl + 'BLOCKS' + nl;
        for (var i = 0; i < this.blockOrder.length; i++) {
            s += this.blocks[this.blockOrder[i]].toDxfString(nl);
        }
        s += '0' + nl + 'ENDSEC' + nl;
        return s;
    }

    _entities(nl) {
        var s = '0' + nl + 'SECTION' + nl + '2' + nl + 'ENTITIES' + nl;
        for (var i = 0; i < this.entities.length; i++) {
            s += this._entityToDxf(this.entities[i], nl);
        }
        s += '0' + nl + 'ENDSEC' + nl;
        return s;
    }

    _entityToDxf(e, nl) {
        var layer = e.layer || '0';
        var s = '';
        switch (e.type) {
            case 'LINE':
                s += '0' + nl + 'LINE' + nl + '8' + nl + layer + nl + '10' + nl + _fmtNum(e.x1) + nl + '20' + nl + _fmtNum(e.y1) + nl + '11' + nl + _fmtNum(e.x2) + nl + '21' + nl + _fmtNum(e.y2) + nl;
                break;
            case 'CIRCLE':
                s += '0' + nl + 'CIRCLE' + nl + '8' + nl + layer + nl + '10' + nl + _fmtNum(e.cx) + nl + '20' + nl + _fmtNum(e.cy) + nl + '40' + nl + _fmtNum(e.r) + nl;
                break;
            case 'POLYLINE':
                s += this._polylineToDxf(e, layer, nl);
                break;
            case 'TEXT':
                s += '0' + nl + 'TEXT' + nl + '8' + nl + layer + nl + '10' + nl + _fmtNum(e.x) + nl + '20' + nl + _fmtNum(e.y) + nl + '40' + nl + _fmtNum(e.height) + nl;
                if (e.styleName) s += '7' + nl + e.styleName + nl;
                s += '72' + nl + '1' + nl + '73' + nl + '2' + nl;
                s += '11' + nl + _fmtNum(e.x) + nl + '21' + nl + _fmtNum(e.y) + nl;
                s += '1' + nl + (e.text != null ? e.text : '') + nl;
                s += '50' + nl + _fmtNum(e.rotation) + nl;
                break;
            case 'POINT':
                s += '0' + nl + 'POINT' + nl + '8' + nl + layer + nl + '10' + nl + _fmtNum(e.x) + nl + '20' + nl + _fmtNum(e.y) + nl;
                break;
            case 'INSERT':
                s += '0' + nl + 'INSERT' + nl + '8' + nl + layer + nl + '2' + nl + (e.block || '') + nl + '10' + nl + _fmtNum(e.x) + nl + '20' + nl + _fmtNum(e.y) + nl + '41' + nl + _fmtNum(e.scaleX) + nl + '42' + nl + _fmtNum(e.scaleY) + nl + '50' + nl + _fmtNum(e.rotation) + nl;
                break;
        }
        return s;
    }

    _polylineToDxf(e, layer, nl) {
        var flags = e.closed ? 1 : 0;
        var s = '0' + nl + 'POLYLINE' + nl + '8' + nl + layer + nl + '66' + nl + '1' + nl + '70' + nl + flags + nl;
        for (var i = 0; i < e.points.length; i++) {
            var p = e.points[i];
            s += '0' + nl + 'VERTEX' + nl + '8' + nl + layer + nl + '70' + nl + '0' + nl + '10' + nl + _fmtNum(p[0]) + nl + '20' + nl + _fmtNum(p[1]) + nl;
        }
        s += '0' + nl + 'SEQEND' + nl + '8' + nl + layer + nl;
        return s;
    }
}

class DXFBlock {
    constructor(name) {
        this.name = name;
        this.entities = [];
    }

    line(x1, y1, x2, y2) {
        this.entities.push({ type: 'LINE', x1: x1, y1: y1, x2: x2, y2: y2 });
    }

    circle(cx, cy, r) {
        this.entities.push({ type: 'CIRCLE', cx: cx, cy: cy, r: r });
    }

    polyline(points, closed) {
        if (points.length < 2) return;
        if (closed === undefined) closed = true;
        this.entities.push({ type: 'POLYLINE', points: points, closed: !!closed });
    }

    rect(x, y, w, h) {
        this.polyline([[x, y], [x + w, y], [x + w, y + h], [x, y + h], [x, y]], true);
    }

    text(x, y, height, rotation, text, styleName) {
        var ent = { type: 'TEXT', x: x, y: y, height: height || 10, rotation: rotation || 0, text: _sanitizeDXFText(text) };
        if (styleName) ent.styleName = styleName;
        this.entities.push(ent);
    }

    toDxfString(nl) {
        if (!nl) nl = '\n';
        var s = '0' + nl + 'BLOCK' + nl + '8' + nl + '0' + nl + '2' + nl + this.name + nl + '70' + nl + '0' + nl + '10' + nl + '0' + nl + '20' + nl + '0' + nl;
        for (var i = 0; i < this.entities.length; i++) {
            var e = this.entities[i];
            switch (e.type) {
                case 'LINE':
                    s += '0' + nl + 'LINE' + nl + '8' + nl + '0' + nl + '10' + nl + _fmtNum(e.x1) + nl + '20' + nl + _fmtNum(e.y1) + nl + '11' + nl + _fmtNum(e.x2) + nl + '21' + nl + _fmtNum(e.y2) + nl;
                    break;
                case 'CIRCLE':
                    s += '0' + nl + 'CIRCLE' + nl + '8' + nl + '0' + nl + '10' + nl + _fmtNum(e.cx) + nl + '20' + nl + _fmtNum(e.cy) + nl + '40' + nl + _fmtNum(e.r) + nl;
                    break;
                case 'POLYLINE':
                    s += '0' + nl + 'POLYLINE' + nl + '8' + nl + '0' + nl + '66' + nl + '1' + nl + '70' + nl + (e.closed ? '1' : '0') + nl;
                    for (var j = 0; j < e.points.length; j++) {
                        var p = e.points[j];
                        s += '0' + nl + 'VERTEX' + nl + '8' + nl + '0' + nl + '70' + nl + '0' + nl + '10' + nl + _fmtNum(p[0]) + nl + '20' + nl + _fmtNum(p[1]) + nl;
                    }
                    s += '0' + nl + 'SEQEND' + nl + '8' + nl + '0' + nl;
                    break;
                case 'TEXT':
                    s += '0' + nl + 'TEXT' + nl + '8' + nl + '0' + nl + '10' + nl + _fmtNum(e.x) + nl + '20' + nl + _fmtNum(e.y) + nl + '40' + nl + _fmtNum(e.height) + nl;
                    if (e.styleName) s += '7' + nl + e.styleName + nl;
                    s += '72' + nl + '1' + nl + '73' + nl + '2' + nl;
                    s += '11' + nl + _fmtNum(e.x) + nl + '21' + nl + _fmtNum(e.y) + nl;
                    s += '1' + nl + (e.text != null ? e.text : '') + nl;
                    s += '50' + nl + _fmtNum(e.rotation) + nl;
                    break;
                case 'POINT':
                    s += '0' + nl + 'POINT' + nl + '8' + nl + '0' + nl + '10' + nl + _fmtNum(e.x) + nl + '20' + nl + _fmtNum(e.y) + nl;
                    break;
            }
        }
        s += '0' + nl + 'ENDBLK' + nl + '8' + nl + '0' + nl;
        return s;
    }
}
