/** Browser-only text extraction for uploaded study materials. */
export async function extractTextFromFile(file: File): Promise<string> {
  const name = file.name.toLowerCase();
  if (name.endsWith(".pdf")) {
    const pdfjs = await import("pdfjs-dist");
    const workerUrl = (await import("pdfjs-dist/build/pdf.worker.min.mjs?url")).default;
    pdfjs.GlobalWorkerOptions.workerSrc = workerUrl;
    const doc = await pdfjs.getDocument({ data: await file.arrayBuffer() }).promise;
    const pages: string[] = [];
    for (let i = 1; i <= doc.numPages; i++) {
      const page = await doc.getPage(i);
      const content = await page.getTextContent();
      pages.push(
        content.items
          .map((it) => ("str" in it ? it.str + (it.hasEOL ? "\n" : "") : ""))
          .join(""),
      );
    }
    return pages.join("\n\n").replace(/[ \t]+\n/g, "\n").trim();
  }
  if (name.endsWith(".docx")) {
    const mammoth = await import("mammoth/mammoth.browser");
    const result = await mammoth.extractRawText({ arrayBuffer: await file.arrayBuffer() });
    return result.value.trim();
  }
  if (name.endsWith(".txt") || name.endsWith(".md") || file.type.startsWith("text/")) {
    return (await file.text()).trim();
  }
  throw new Error("暂时支持 PDF、Word（.docx）、TXT 和 Markdown 文件。");
}
