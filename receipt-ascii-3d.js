/* ============================================================================
   receipt-ascii-3d.js  —  3D isometric ASCII headline generator
   Drop-in sibling of the FIG / figBanner() promo system in index.html.
   Plain script, no build step, no deps.  Exposes window.ReceiptAscii3D.

   USAGE (mirrors figBanner, which returns an array of row strings):
     const rows = ReceiptAscii3D.banner("100%", { depth: 2 });   // string[]
     // draw each row with ctx.fillText in a monospace font, line-height ~1.

   Covers A-Z, 0-9, space, and  % $ / - . ! & +   (lowercase is upper-cased).
   Output is ~ (7 + depth + 2) rows tall — taller than FIG's 5, so give the
   promo panel more vertical room, or use depth: 1 for the shortest result.

   The photocopier wobble (ReceiptAscii3D.XEROX_CSS + injectXeroxFilter) is a
   CSS/SVG filter — it works on DOM <pre> only, NOT on <canvas>. For the canvas
   pipeline, either keep the clean 3D look or add a small per-row x-jitter when
   you fillText each row.
   ========================================================================== */
(function (root) {
  "use strict";

  var GW = 5, GH = 7, SPACE_W = 3;

  var FONT = {
    "A": ["  #  ", " # # ", "#   #", "#   #", "#####", "#   #", "#   #"],
    "B": ["#### ", "#   #", "#   #", "#### ", "#   #", "#   #", "#### "],
    "C": [" ####", "#    ", "#    ", "#    ", "#    ", "#    ", " ####"],
    "D": ["#### ", "#   #", "#   #", "#   #", "#   #", "#   #", "#### "],
    "E": ["#####", "#    ", "#    ", "#### ", "#    ", "#    ", "#####"],
    "F": ["#####", "#    ", "#    ", "#### ", "#    ", "#    ", "#    "],
    "G": [" ####", "#    ", "#    ", "#  ##", "#   #", "#   #", " ####"],
    "H": ["#   #", "#   #", "#   #", "#####", "#   #", "#   #", "#   #"],
    "I": ["#####", "  #  ", "  #  ", "  #  ", "  #  ", "  #  ", "#####"],
    "J": ["#####", "   # ", "   # ", "   # ", "   # ", "#  # ", " ##  "],
    "K": ["#   #", "#  # ", "# #  ", "##   ", "# #  ", "#  # ", "#   #"],
    "L": ["#    ", "#    ", "#    ", "#    ", "#    ", "#    ", "#####"],
    "M": ["#   #", "## ##", "# # #", "# # #", "#   #", "#   #", "#   #"],
    "N": ["#   #", "##  #", "# # #", "# # #", "#  ##", "#   #", "#   #"],
    "O": [" ### ", "#   #", "#   #", "#   #", "#   #", "#   #", " ### "],
    "P": ["#### ", "#   #", "#   #", "#### ", "#    ", "#    ", "#    "],
    "Q": [" ### ", "#   #", "#   #", "#   #", "# # #", "#  # ", " ## #"],
    "R": ["#### ", "#   #", "#   #", "#### ", "# #  ", "#  # ", "#   #"],
    "S": [" ####", "#    ", "#    ", " ### ", "    #", "    #", "#### "],
    "T": ["#####", "  #  ", "  #  ", "  #  ", "  #  ", "  #  ", "  #  "],
    "U": ["#   #", "#   #", "#   #", "#   #", "#   #", "#   #", " ### "],
    "V": ["#   #", "#   #", "#   #", "#   #", "#   #", " # # ", "  #  "],
    "W": ["#   #", "#   #", "#   #", "# # #", "# # #", "## ##", "#   #"],
    "X": ["#   #", "#   #", " # # ", "  #  ", " # # ", "#   #", "#   #"],
    "Y": ["#   #", "#   #", " # # ", "  #  ", "  #  ", "  #  ", "  #  "],
    "Z": ["#####", "   # ", "  #  ", " #   ", "#    ", "#    ", "#####"],
    "0": [" ### ", "#   #", "#  ##", "# # #", "##  #", "#   #", " ### "],
    "1": ["  #  ", " ##  ", "  #  ", "  #  ", "  #  ", "  #  ", "#####"],
    "2": [" ### ", "#   #", "   # ", "  #  ", " #   ", "#    ", "#####"],
    "3": ["#### ", "    #", "    #", " ### ", "    #", "    #", "#### "],
    "4": ["   # ", "  ## ", " # # ", "#  # ", "#####", "   # ", "   # "],
    "5": ["#####", "#    ", "#    ", "#### ", "    #", "    #", "#### "],
    "6": [" ### ", "#    ", "#    ", "#### ", "#   #", "#   #", " ### "],
    "7": ["#####", "   # ", "   # ", "  #  ", "  #  ", " #   ", " #   "],
    "8": [" ### ", "#   #", "#   #", " ### ", "#   #", "#   #", " ### "],
    "9": [" ### ", "#   #", "#   #", " ####", "    #", "    #", " ### "],
    "%": ["##  #", "##  #", "   # ", "  #  ", " #   ", "#  ##", "#  ##"],
    "$": ["  #  ", " ####", "#  # ", " ### ", " #  #", "#### ", "  #  "],
    "/": ["    #", "    #", "   # ", "  #  ", " #   ", "#    ", "#    "],
    "-": ["     ", "     ", "     ", "#####", "     ", "     ", "     "],
    ".": ["     ", "     ", "     ", "     ", "     ", " ##  ", " ##  "],
    "!": ["  #  ", "  #  ", "  #  ", "  #  ", "  #  ", "     ", "  #  "],
    "&": [" ##  ", "#  # ", "#  # ", " ##  ", "#  ##", "#  # ", " ## #"],
    "+": ["     ", "  #  ", "  #  ", "#####", "  #  ", "  #  ", "     "]
  };

  function makeGrid(rows, cols, v) {
    var a = [], i;
    for (i = 0; i < rows; i++) a.push(new Array(cols).fill(v));
    return a;
  }

  // Returns a single string with '\n' between rows.
  function render(text, opts) {
    opts = opts || {};
    var depth = opts.depth == null ? 2 : opts.depth;
    var fill = opts.fill || "#";
    text = String(text).toUpperCase();

    var pad = depth + 1;
    var rows = GH + pad + 1;
    var gap = depth + 1;
    var i, x, y, d, ny, nx;

    var adv = 0;
    for (i = 0; i < text.length; i++) adv += (text[i] === " " ? SPACE_W : GW) + gap;
    var cols = adv + depth + 2;

    var front = makeGrid(rows, cols, false);
    var penX = 0;
    for (i = 0; i < text.length; i++) {
      var ch = text[i];
      if (ch === " ") { penX += SPACE_W + gap; continue; }
      var g = FONT[ch];
      if (!g) { penX += GW + gap; continue; }
      for (y = 0; y < GH; y++)
        for (x = 0; x < GW; x++)
          if (g[y].charAt(x) === "#") front[pad + y][penX + x] = true;
      penX += GW + gap;
    }

    // side face: a front cell sits down-left within the extrusion depth
    var side = makeGrid(rows, cols, false);
    for (y = 0; y < rows; y++)
      for (x = 0; x < cols; x++) {
        if (front[y][x]) continue;
        for (d = 1; d <= depth; d++) {
          var sy = y + d, sx = x - d;
          if (sy >= 0 && sy < rows && sx >= 0 && sx < cols && front[sy][sx]) { side[y][x] = true; break; }
        }
      }

    // exterior cells via flood fill from the border through non-front cells
    var ext = makeGrid(rows, cols, false);
    var stack = [];
    for (x = 0; x < cols; x++) { stack.push([0, x]); stack.push([rows - 1, x]); }
    for (y = 0; y < rows; y++) { stack.push([y, 0]); stack.push([y, cols - 1]); }
    while (stack.length) {
      var p = stack.pop(), py = p[0], px = p[1];
      if (py < 0 || py >= rows || px < 0 || px >= cols) continue;
      if (ext[py][px] || front[py][px]) continue;
      ext[py][px] = true;
      stack.push([py + 1, px], [py - 1, px], [py, px + 1], [py, px - 1]);
    }

    // keep exterior side cells that lean on a front or side cell
    var draw = makeGrid(rows, cols, false);
    for (y = 0; y < rows; y++)
      for (x = 0; x < cols; x++)
        if (side[y][x] && ext[y][x]) draw[y][x] = true;

    var keep = makeGrid(rows, cols, false);
    var nb = [[1, 0], [-1, 0], [0, 1], [0, -1]];
    for (y = 0; y < rows; y++)
      for (x = 0; x < cols; x++) {
        if (!draw[y][x]) continue;
        for (i = 0; i < 4; i++) {
          ny = y + nb[i][0]; nx = x + nb[i][1];
          if (ny >= 0 && ny < rows && nx >= 0 && nx < cols && (front[ny][nx] || draw[ny][nx])) { keep[y][x] = true; break; }
        }
      }

    var buf = makeGrid(rows, cols, " ");
    for (y = 0; y < rows; y++)
      for (x = 0; x < cols; x++) {
        if (front[y][x]) buf[y][x] = fill;
        else if (keep[y][x]) {
          var rim = (y + 1 < rows && front[y + 1][x]) && (y === 0 || !front[y - 1][x]);
          buf[y][x] = rim ? "_" : "/";
        }
      }

    var lines = buf.map(function (r) { return r.join("").replace(/\s+$/, ""); });
    while (lines.length && lines[0].trim() === "") lines.shift();
    while (lines.length && lines[lines.length - 1].trim() === "") lines.pop();
    return lines.join("\n");
  }

  // figBanner-shaped helper: returns an array of equal-length row strings.
  function banner(text, opts) {
    var lines = render(text, opts).split("\n");
    var w = lines.reduce(function (m, l) { return Math.max(m, l.length); }, 0);
    return lines.map(function (l) { return l + " ".repeat(w - l.length); });
  }

  // ---- optional photocopier wobble, DOM <pre> only -------------------------
  var XEROX_CSS =
    ".xerox-on{filter:url(#xerox) contrast(1.42) brightness(.96);}";

  function injectXeroxFilter(id) {
    id = id || "xerox";
    if (document.getElementById(id)) return;
    var ns = "http://www.w3.org/2000/svg";
    var svg = document.createElementNS(ns, "svg");
    svg.setAttribute("width", "0"); svg.setAttribute("height", "0");
    svg.style.position = "absolute";
    svg.innerHTML =
      '<filter id="' + id + '" x="-4%" y="-4%" width="108%" height="108%">' +
      '<feTurbulence type="fractalNoise" baseFrequency="0.9 0.75" numOctaves="1" seed="7" result="n"/>' +
      '<feDisplacementMap in="SourceGraphic" in2="n" scale="2.1" xChannelSelector="R" yChannelSelector="G"/>' +
      '</filter>';
    document.body.appendChild(svg);
  }

  root.ReceiptAscii3D = {
    render: render,
    banner: banner,
    FONT: FONT,
    XEROX_CSS: XEROX_CSS,
    injectXeroxFilter: injectXeroxFilter
  };
})(typeof window !== "undefined" ? window : this);
