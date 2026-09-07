// isEmptyContent: HTML dianggap kosong kalau tidak ada teks DAN tidak ada
// gambar/rumus (konten berisi gambar doang tetap valid).
export function isEmptyContent(html: string): boolean {
  const doc = new DOMParser().parseFromString(html, "text/html")
  const text = (doc.body.textContent || "").trim()
  return text === "" && !doc.body.querySelector("img, [data-type='inline-math'], [data-type='block-math']")
}
