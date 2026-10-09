import type { Doc } from "./types";
import { brl, formatDate, subtotal, total, valorExtenso } from "./format";

const fileName = (d: Doc) => `${d.number}-${d.customer.name.trim().replace(/[^\p{L}\p{N}]+/gu, "_") || "cliente"}.pdf`;

async function build(d: Doc): Promise<Blob> {
  const { jsPDF } = await import("jspdf");
  const autoTable = (await import("jspdf-autotable")).default;
  const pdf = new jsPDF({ unit: "mm", format: "a4" });
  const W = pdf.internal.pageSize.getWidth();
  const M = 15;
  let y = 18;

  const isOrc = d.kind === "orcamento";
  pdf.setFont("helvetica", "bold").setFontSize(20).setTextColor(4, 120, 87);
  pdf.text(isOrc ? "ORÇAMENTO" : "RECIBO", M, y);
  pdf.setFont("helvetica", "normal").setFontSize(10).setTextColor(80);
  pdf.text(`Nº ${d.number}  •  Data: ${formatDate(d.date)}`, M, y + 6);
  let headerBottom = y + 8;

  // logo opcional no canto superior direito (até 45 x 22 mm, mantendo a proporção)
  if (d.profile.logo) {
    try {
      const props = pdf.getImageProperties(d.profile.logo);
      const scale = Math.min(45 / props.width, 22 / props.height);
      const lw = props.width * scale;
      const lh = props.height * scale;
      pdf.addImage(d.profile.logo, props.fileType, W - M - lw, 10, lw, lh);
      headerBottom = Math.max(headerBottom, 10 + lh + 2);
    } catch {
      /* logo inválida: segue sem imagem */
    }
  }
  y = headerBottom;
  pdf.setDrawColor(4, 120, 87).setLineWidth(0.6).line(M, y, W - M, y);
  y += 8;

  const block = (title: string, lines: string[]) => {
    pdf.setFont("helvetica", "bold").setFontSize(9).setTextColor(100);
    pdf.text(title.toUpperCase(), M, y);
    y += 5;
    pdf.setFont("helvetica", "normal").setFontSize(10.5).setTextColor(20);
    for (const l of lines.filter(Boolean)) {
      for (const part of pdf.splitTextToSize(l, W - 2 * M) as string[]) {
        pdf.text(part, M, y);
        y += 5;
      }
    }
    y += 3;
  };

  const p = d.profile;
  block("Prestador", [
    p.name + (p.trade ? ` — ${p.trade}` : ""),
    p.document && `CPF/CNPJ: ${p.document}`,
    [p.phone, p.email].filter(Boolean).join("  •  "),
    p.address,
  ]);
  const c = d.customer;
  block("Cliente", [
    c.name,
    c.document && `CPF/CNPJ: ${c.document}`,
    [c.phone, c.email].filter(Boolean).join("  •  "),
    c.address,
  ]);

  autoTable(pdf, {
    startY: y,
    head: [[isOrc ? "Descrição do serviço / material" : "Referente a", "Qtd", "Valor unit.", "Total"]],
    body: d.items.map((i) => [i.description, String(i.qty).replace(".", ","), brl(i.unitPrice), brl(i.qty * i.unitPrice)]),
    theme: "striped",
    styles: { font: "helvetica", fontSize: 10, cellPadding: 2.5 },
    headStyles: { fillColor: [4, 120, 87], textColor: 255 },
    columnStyles: { 1: { halign: "right", cellWidth: 16 }, 2: { halign: "right", cellWidth: 30 }, 3: { halign: "right", cellWidth: 30 } },
    margin: { left: M, right: M },
  });
  y = (pdf as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 6;

  const ensure = (h: number) => {
    if (y + h > 280) {
      pdf.addPage();
      y = 20;
    }
  };

  ensure(30);
  const right = (label: string, value: string, bold = false) => {
    pdf.setFont("helvetica", bold ? "bold" : "normal").setFontSize(bold ? 13 : 10.5).setTextColor(20);
    pdf.text(label, W - M - 55, y);
    pdf.text(value, W - M, y, { align: "right" });
    y += bold ? 7 : 5.5;
  };
  right("Subtotal", brl(subtotal(d)));
  if (d.discount > 0) right("Desconto", `- ${brl(Math.min(d.discount, subtotal(d)))}`);
  right("TOTAL", brl(total(d)), true);
  y += 3;

  const wrap = (text: string) => {
    pdf.setFont("helvetica", "normal").setFontSize(10.5).setTextColor(20);
    for (const part of pdf.splitTextToSize(text, W - 2 * M) as string[]) {
      ensure(6);
      pdf.text(part, M, y);
      y += 5;
    }
    y += 2;
  };

  if (!isOrc) {
    wrap(`Recebi de ${c.name} a importância de ${brl(total(d))} (${valorExtenso(total(d))}), referente ao descrito acima. Dou plena quitação.`);
  }
  if (d.payment) wrap(`Forma de pagamento: ${d.payment}`);
  if (isOrc && d.validityDays) wrap(`Validade deste orçamento: ${d.validityDays} dias a partir de ${formatDate(d.date)}.`);
  if (d.notes) wrap(`Observações: ${d.notes}`);

  ensure(40);
  y += 6;
  if (d.signature) {
    try {
      pdf.addImage(d.signature, "PNG", M, y, 60, 20);
    } catch {
      /* assinatura inválida: segue sem imagem */
    }
  }
  y += 22;
  pdf.setDrawColor(120).setLineWidth(0.3).line(M, y, M + 70, y);
  y += 5;
  pdf.setFont("helvetica", "normal").setFontSize(9).setTextColor(90);
  pdf.text(p.name || "Prestador", M, y);

  pdf.setFontSize(8).setTextColor(150);
  pdf.text("Gerado com OrçaPrático", W / 2, 290, { align: "center" });
  return pdf.output("blob");
}

export async function downloadPdf(d: Doc) {
  const blob = await build(d);
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName(d);
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
}

/** Abre a folha de compartilhar do celular (WhatsApp etc.); se não houver, baixa o arquivo. */
export async function sharePdf(d: Doc) {
  const blob = await build(d);
  const file = new File([blob], fileName(d), { type: "application/pdf" });
  if (navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({ files: [file], title: `${d.kind === "orcamento" ? "Orçamento" : "Recibo"} ${d.number}` });
      return;
    } catch (e) {
      if ((e as Error).name === "AbortError") return;
    }
  }
  await downloadPdf(d);
}
