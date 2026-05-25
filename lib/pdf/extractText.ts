"use client";

export async function extractTextFromPdf(file: File): Promise<string> {
  const pdfjs = await import("pdfjs-dist");

  pdfjs.GlobalWorkerOptions.workerSrc = new URL("pdfjs-dist/build/pdf.worker.mjs", import.meta.url).toString();

  const buffer = await file.arrayBuffer();
  const pdf = await pdfjs.getDocument({ data: buffer }).promise;
  const pages: string[] = [];

  for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
    const page = await pdf.getPage(pageNumber);
    const content = await page.getTextContent();
    let lastY: number | undefined;
    const lines: string[] = [];
    let currentLine = "";

    for (const item of content.items) {
      if (!("str" in item)) continue;
      const y = Math.round(item.transform[5]);
      if (lastY !== undefined && Math.abs(y - lastY) > 6) {
        lines.push(currentLine.trim());
        currentLine = "";
      }
      currentLine += `${item.str} `;
      lastY = y;
    }

    if (currentLine.trim()) lines.push(currentLine.trim());
    pages.push(`--- Page ${pageNumber} ---\n${lines.filter(Boolean).join("\n")}`);
  }

  return cleanExtractedText(pages.join("\n\n"));
}

function cleanExtractedText(text: string) {
  return text
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/[ \t]{2,}/g, " ")
    .trim();
}
