export function cropToDataUrl(file: File, width: number, height: number, quality = 0.84): Promise<string> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      if (!ctx) return reject(new Error("Canvas unavailable"));
      const scale = Math.max(width / img.width, height / img.height);
      const w = img.width * scale;
      const h = img.height * scale;
      ctx.fillStyle = "#fff";
      ctx.fillRect(0, 0, width, height);
      ctx.drawImage(img, (width - w) / 2, (height - h) / 2, w, h);
      resolve(canvas.toDataURL("image/jpeg", quality));
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("This file could not be read as an image."));
    };
    img.src = url;
  });
}
