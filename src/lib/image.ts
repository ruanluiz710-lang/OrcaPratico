/** Lê uma imagem escolhida pelo usuário e devolve uma versão reduzida (data URL), para não lotar o armazenamento. */
export async function resizeImage(file: File, max = 240): Promise<string> {
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const i = new Image();
      i.onload = () => resolve(i);
      i.onerror = () => reject(new Error("Imagem inválida"));
      i.src = url;
    });
    const scale = Math.min(1, max / Math.max(img.width, img.height));
    const w = Math.max(1, Math.round(img.width * scale));
    const h = Math.max(1, Math.round(img.height * scale));
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d")!;
    const jpeg = file.type === "image/jpeg";
    if (jpeg) {
      ctx.fillStyle = "#fff";
      ctx.fillRect(0, 0, w, h);
    }
    ctx.drawImage(img, 0, 0, w, h);
    return jpeg ? canvas.toDataURL("image/jpeg", 0.85) : canvas.toDataURL("image/png");
  } finally {
    URL.revokeObjectURL(url);
  }
}
