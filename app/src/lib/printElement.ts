// src/lib/printElement.ts
// Prints one element on its own A4 page set. The element is copied into a
// hidden iframe together with the app's stylesheets, so dialogs, scrolling
// containers and transforms in the live page can no longer blank the output.

export function printElement(id: string, opts: { landscape?: boolean; title?: string } = {}) {
  const source = document.getElementById(id);
  if (!source) return;

  const iframe = document.createElement("iframe");
  iframe.setAttribute("aria-hidden", "true");
  Object.assign(iframe.style, { position: "fixed", right: "0", bottom: "0", width: "0", height: "0", border: "0", visibility: "hidden" });
  document.body.appendChild(iframe);

  const doc = iframe.contentDocument!;
  const styles = Array.from(document.querySelectorAll('link[rel="stylesheet"], style'))
    .map((n) => (n.tagName === "LINK" ? `<link rel="stylesheet" href="${(n as HTMLLinkElement).href}">` : n.outerHTML))
    .join("\n");

  doc.open();
  doc.write(`<!doctype html><html><head><meta charset="utf-8"><title>${opts.title ?? document.title}</title>${styles}
    <style>
      @page { size: A4 ${opts.landscape ? "landscape" : "portrait"}; margin: 12mm; }
      html, body { background: #fff !important; margin: 0; padding: 0; }
      body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      #print-root { padding: 0 !important; max-height: none !important; overflow: visible !important; }
      #print-root img { max-width: 100%; }
    </style></head><body><div id="print-root">${source.innerHTML}</div></body></html>`);
  doc.close();

  const go = async () => {
    try {
      const imgs = Array.from(doc.images).map((img) => (img.complete ? Promise.resolve() : new Promise((r) => { img.onload = img.onerror = () => r(null); })));
      await Promise.all(imgs);
      await (doc as Document & { fonts?: FontFaceSet }).fonts?.ready;
    } catch { /* print anyway */ }
    iframe.contentWindow!.focus();
    iframe.contentWindow!.print();
    setTimeout(() => iframe.remove(), 1500);
  };
  // wait for the copied stylesheets to load before printing
  const links = Array.from(doc.querySelectorAll('link[rel="stylesheet"]')) as HTMLLinkElement[];
  if (!links.length) { void go(); return; }
  let pending = links.length;
  const done = () => { if (--pending === 0) void go(); };
  links.forEach((l) => { l.onload = done; l.onerror = done; });
  setTimeout(() => { if (pending > 0) { pending = 0; void go(); } }, 3000); // safety net
}
