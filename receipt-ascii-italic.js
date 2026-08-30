/* ============================================================================
   receipt-ascii-italic.js  —  fixed-style italic-serif → ASCII for the HEADLINE
   ----------------------------------------------------------------------------
   Locked settings (not user-configurable):
     face   Playfair Display        weight 400 (regular)
     grid   200 columns             slant  0°
     render gray ramp               darkest cells → '#'

   Plain script, no deps. Exposes window.ReceiptAsciiItalic.
   Needs Playfair Display italic loaded — add to the Google Fonts <link>:
       family=Playfair+Display:ital@1

   API (both async — they await the web font):
     await ReceiptAsciiItalic.render(text)          -> string[]  (rows)
     await ReceiptAsciiItalic.toCanvas(text, opts)  -> HTMLCanvasElement
         opts.fontPx  (default 14)   cell height of the rendered band, px
         opts.color   (default "#1a1918")
     The band canvas is tightly sized with a transparent background. Draw it
     into the receipt scaled to the content width:
         const bw = CW, bh = bw * band.height / band.width;
         ctx.drawImage(band, PAD, y, bw, bh);
   ========================================================================== */
(function (root) {
  "use strict";

  var FACE   = "Playfair Display";
  var WEIGHT = 400;
  var COLS   = 200;
  var FS     = 260;            // source raster size
  var ASPECT = 0.52;           // monospace cell width / height
  var RAMP   = " .:-=+*oO#%@";
  var INK    = "#";            // darkest-bucket glyph

  function fontReady() {
    var spec = 'italic ' + WEIGHT + ' 40px "' + FACE + '"';
    if (root.document && document.fonts && document.fonts.load) {
      return document.fonts.load(spec).catch(function () {});
    }
    return Promise.resolve();
  }

  function rasterize(text) {
    var src = document.createElement("canvas");
    var fontStr = 'italic ' + WEIGHT + ' ' + FS + 'px "' + FACE + '", Georgia, serif';
    var mc = src.getContext("2d");
    mc.font = fontStr;
    var m = mc.measureText(text);
    var asc  = m.actualBoundingBoxAscent  || FS * 0.78;
    var desc = m.actualBoundingBoxDescent || FS * 0.28;
    var left = m.actualBoundingBoxLeft    || 0;
    var right = m.actualBoundingBoxRight  || m.width;
    var padX = Math.ceil(FS * 0.16), padY = Math.ceil(FS * 0.12);
    var W = Math.ceil(left + right) + padX * 2 + 2;
    var H = Math.ceil(asc + desc) + padY * 2;
    src.width = W; src.height = H;
    var c = src.getContext("2d");
    c.fillStyle = "#fff"; c.fillRect(0, 0, W, H);
    c.fillStyle = "#000";
    c.font = fontStr;
    c.textBaseline = "alphabetic";
    c.fillText(text, padX + left, padY + Math.ceil(asc));
    return { canvas: src, W: W, H: H };
  }

  function asciiLines(text) {
    text = String(text).trim();
    if (!text) return [];
    var r = rasterize(text);
    var cols = COLS;
    var rows = Math.max(1, Math.round(cols * (r.H / r.W) * ASPECT));

    var cell = document.createElement("canvas");
    cell.width = cols; cell.height = rows;
    var cc = cell.getContext("2d");
    cc.imageSmoothingEnabled = true;
    cc.imageSmoothingQuality = "high";
    cc.drawImage(r.canvas, 0, 0, cols, rows);
    var d = cc.getImageData(0, 0, cols, rows).data;

    var n = cols * rows, dark = new Float32Array(n), p, i;
    for (p = 0; p < n; p++) {
      i = p * 4;
      dark[p] = 1 - (0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2]) / 255;
    }
    var at = function (x, y) {
      return (x < 0 || y < 0 || x >= cols || y >= rows) ? 0 : dark[y * cols + x];
    };

    var lines = [], x, y;
    for (y = 0; y < rows; y++) {
      var ln = "";
      for (x = 0; x < cols; x++) {
        var v = dark[y * cols + x] * 1.28;
        if (v < 0.34) {
          if (((at(x - 1, y) > 0.30) && (at(x + 1, y) > 0.30)) ||
              ((at(x, y - 1) > 0.30) && (at(x, y + 1) > 0.30))) v = 0.42;
        }
        if (v > 0 && v < 0.06) v = 0.06;
        if (v > 1) v = 1;
        var k = Math.round(v * (RAMP.length - 1));
        if (k < 0) k = 0; if (k > RAMP.length - 1) k = RAMP.length - 1;
        ln += (k === RAMP.length - 1) ? INK : RAMP.charAt(k);
      }
      lines.push(ln.replace(/\s+$/, ""));
    }
    while (lines.length && !lines[0].trim()) lines.shift();
    while (lines.length && !lines[lines.length - 1].trim()) lines.pop();
    return lines;
  }

  function render(text) {
    return fontReady().then(function () { return asciiLines(text); });
  }

  function toCanvas(text, opts) {
    opts = opts || {};
    var fontPx = opts.fontPx || 14;
    var lh = Math.round(fontPx * (opts.lineHeight || 1));
    var color = opts.color || "#1a1918";
    var font = fontPx + 'px "JetBrains Mono", ui-monospace, SFMono-Regular, monospace';

    return render(text).then(function (lines) {
      var cv = document.createElement("canvas");
      if (!lines.length) { cv.width = 1; cv.height = 1; return cv; }

      var probe = document.createElement("canvas").getContext("2d");
      probe.font = font;
      var chW = probe.measureText("MMMMMMMMMM").width / 10 || fontPx * 0.6;
      var maxLen = lines.reduce(function (mx, l) { return Math.max(mx, l.length); }, 0);

      cv.width = Math.ceil(chW * maxLen) + 2;
      cv.height = lh * lines.length + 2;
      var ctx = cv.getContext("2d");
      ctx.font = font;
      ctx.textBaseline = "top";
      ctx.fillStyle = color;
      for (var j = 0; j < lines.length; j++) ctx.fillText(lines[j], 1, 1 + j * lh);
      return cv;
    });
  }

  root.ReceiptAsciiItalic = {
    render: render,
    toCanvas: toCanvas,
    CONFIG: { face: FACE, weight: WEIGHT, cols: COLS, slant: 0, mode: "ramp", ink: INK }
  };
})(typeof window !== "undefined" ? window : this);
