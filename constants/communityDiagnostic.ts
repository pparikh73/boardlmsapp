/**
 * TEMPORARY diagnostic overlay for the Community horizontal white-space bug.
 *
 * Delete this file and the two references to it in app/(tabs)/community.tsx once
 * the bug is identified. It is gated behind COMMUNITY_DIAGNOSTICS in
 * constants/skilljar.ts, which MUST be false for any public App Store release.
 *
 * Why this exists: two fixes have now failed on this bug (bounces={false}, then
 * overflow-x:clip), each costing a TestFlight round. Rather than guess a third
 * time, this reports what is actually happening on the device — crucially,
 * whether the clip rule applied at all, and which of three distinct mechanisms
 * is producing scrollable width:
 *
 *   1. Ordinary document overflow — an element wider than the viewport.
 *      Would be clipped by overflow-x:clip, so if this is all we see, the clip
 *      rule is not being applied (check clipSupported / html.ovx in the output).
 *   2. A position:fixed descendant — its containing block is the viewport, so an
 *      ancestor's overflow does NOT clip it. Reported via the pos= field.
 *   3. A nested horizontal scroll container — a wrapper with overflow-x:auto or
 *      scroll. Clipping html/body cannot help; the wrapper itself must be fixed.
 */
export const COMMUNITY_DIAGNOSTIC_JS = `
try {
  (function () {
    if (document.getElementById('__bc_diag')) return;

    var box = document.createElement('div');
    box.id = '__bc_diag';
    box.style.cssText = [
      'position:fixed', 'left:0', 'right:0', 'bottom:0', 'z-index:2147483647',
      'background:rgba(0,0,0,0.88)', 'color:#0f0',
      'font:11px/1.35 ui-monospace,Menlo,monospace',
      'padding:6px 8px', 'white-space:pre-wrap', 'word-break:break-all',
      'max-height:45vh', 'overflow:auto',
      '-webkit-user-select:text', 'user-select:text'
    ].join(';');
    // Appended to <html>, not <body>, so it stays out of the body scan below.
    document.documentElement.appendChild(box);

    var collapsed = false;
    box.addEventListener('click', function () {
      collapsed = !collapsed;
      box.style.maxHeight = collapsed ? '16px' : '45vh';
    });

    function desc(el) {
      if (!el) return 'none';
      var s = el.tagName.toLowerCase();
      if (el.id) s += '#' + el.id;
      var c = (el.className && el.className.baseVal !== undefined) ? el.className.baseVal : el.className;
      if (c && typeof c === 'string' && c.trim()) {
        s += '.' + c.trim().split(/\\s+/).slice(0, 3).join('.');
      }
      return s;
    }

    function measure() {
      var de = document.documentElement;
      var vw = de.clientWidth;
      var offenders = [];
      var scrollers = [];
      var all = document.body ? document.body.getElementsByTagName('*') : [];

      for (var i = 0; i < all.length; i++) {
        var el = all[i];
        var r = el.getBoundingClientRect();
        if (r.width === 0 && r.height === 0) continue;
        var cs = window.getComputedStyle(el);
        // Add scrollX so a right edge is reported in document space, not
        // viewport space — otherwise the numbers move as you scroll.
        var right = r.right + (window.scrollX || 0);
        if (right > vw + 1) {
          offenders.push({ el: el, right: right, pos: cs.position });
        }
        if (el.scrollWidth > el.clientWidth + 1 &&
            (cs.overflowX === 'auto' || cs.overflowX === 'scroll')) {
          scrollers.push(el);
        }
      }
      offenders.sort(function (a, b) { return b.right - a.right; });

      var hcs = window.getComputedStyle(de);
      var bcs = document.body ? window.getComputedStyle(document.body) : null;
      var fixedOffenders = offenders.filter(function (o) { return o.pos === 'fixed'; }).length;

      var lines = [];
      lines.push('BC DIAG v2 (tap to collapse)');
      lines.push('vw=' + vw + ' innerW=' + window.innerWidth + ' screenW=' + screen.width + ' dpr=' + window.devicePixelRatio);
      lines.push('doc.scrollW=' + de.scrollWidth + ' body.scrollW=' + (document.body ? document.body.scrollWidth : '-') + ' scrollX=' + Math.round(window.scrollX || 0));
      lines.push('clipSupported=' + (window.CSS && CSS.supports ? CSS.supports('overflow-x', 'clip') : '?') +
                 ' html.ovx=' + hcs.overflowX + ' body.ovx=' + (bcs ? bcs.overflowX : '-'));
      if (window.visualViewport) {
        lines.push('vv.w=' + Math.round(visualViewport.width) + ' vv.offL=' + Math.round(visualViewport.offsetLeft) + ' vv.scale=' + (visualViewport.scale || 1));
      }
      lines.push('overflowing=' + offenders.length + ' (fixed=' + fixedOffenders + ') nestedXScrollers=' + scrollers.length);

      for (var j = 0; j < Math.min(5, offenders.length); j++) {
        var o = offenders[j];
        lines.push(' #' + (j + 1) + ' right=' + Math.round(o.right) + ' pos=' + o.pos + ' ' + desc(o.el));
      }
      for (var k = 0; k < Math.min(3, scrollers.length); k++) {
        lines.push(' scroller: ' + desc(scrollers[k]) + ' sw=' + scrollers[k].scrollWidth + ' cw=' + scrollers[k].clientWidth);
      }

      // Targeted carousel probe. The generic lists above only surface an element
      // if it still overflows AND still computes overflow-x auto/scroll — a
      // collapsed carousel satisfies neither, so it would be invisible there.
      // These are reported unconditionally.
      var ratio = document.querySelectorAll('[class*="ratioContainer"]');
      var scroll = document.querySelectorAll('[class*="carousel-scrollContainer"]');
      lines.push('--- carousel probe ---');
      lines.push('selector hits: ratioContainer=' + ratio.length + ' scrollContainer=' + scroll.length);
      if (ratio.length === 0 && scroll.length === 0) {
        lines.push('!! NEITHER SELECTOR MATCHES — class names changed, rules are dead');
      }
      function probe(label, el) {
        if (!el) return;
        var cs = window.getComputedStyle(el);
        var track = el.firstElementChild;
        lines.push(' ' + label + ' ' + desc(el));
        lines.push('   sw=' + el.scrollWidth + ' cw=' + el.clientWidth + ' ow=' + el.offsetWidth +
                   ' scrollable=' + (el.scrollWidth > el.clientWidth + 1));
        lines.push('   ovx=' + cs.overflowX + ' ovy=' + cs.overflowY + ' maxW=' + cs.maxWidth +
                   ' w=' + cs.width + ' disp=' + cs.display);
        lines.push('   kids=' + el.children.length +
                   (track ? ' track.sw=' + track.scrollWidth + ' track.ow=' + track.offsetWidth : ''));
      }
      for (var p = 0; p < Math.min(2, scroll.length); p++) probe('scrollContainer', scroll[p]);
      for (var q = 0; q < Math.min(2, ratio.length); q++) probe('ratioContainer', ratio[q]);
      // Walk up from the first scroll container: any ancestor still clipping, or
      // any ancestor narrower than the track, explains a truncated carousel.
      if (scroll.length) {
        var up = scroll[0].parentElement, depth = 0;
        while (up && up !== document.body && depth < 6) {
          var ucs = window.getComputedStyle(up);
          if (ucs.overflowX !== 'visible' || ucs.overflowY !== 'visible') {
            lines.push('   ^clip@' + depth + ' ' + desc(up) + ' ovx=' + ucs.overflowX + ' ovy=' + ucs.overflowY + ' cw=' + up.clientWidth);
          }
          up = up.parentElement; depth++;
        }
      }

      var text = lines.join('\\n');
      box.textContent = text;
      if (window.ReactNativeWebView) {
        try { window.ReactNativeWebView.postMessage(JSON.stringify({ bcDiag: text })); } catch (e) {}
      }
    }

    measure();
    // The site's own JS keeps mutating layout after load, so re-measure for a
    // while rather than trusting a single reading.
    var n = 0;
    var timer = setInterval(function () { measure(); if (++n > 15) clearInterval(timer); }, 700);
    window.addEventListener('resize', measure, { passive: true });
    window.addEventListener('scroll', measure, { passive: true });
  })();
} catch (e) {
  try {
    var err = document.createElement('div');
    err.style.cssText = 'position:fixed;bottom:0;left:0;right:0;z-index:2147483647;background:#900;color:#fff;font:11px monospace;padding:4px';
    err.textContent = 'BC DIAG failed: ' + (e && e.message ? e.message : e);
    document.documentElement.appendChild(err);
  } catch (e2) {}
}
`;
