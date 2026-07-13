const footerLinks = {
  Produk: ["Mata Pelajaran", "Fitur", "Harga", "FAQ"],
  Perusahaan: ["Tentang", "Blog", "Karir", "Kontak"],
  Bantuan: ["Pusat Bantuan", "Panduan", "Kebijakan Privasi", "Syarat & Ketentuan"],
}

export default function Footer() {
  return (
    <footer className="border-t bg-card py-12">
      <div className="container mx-auto max-w-7xl px-4">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-sm font-bold text-primary-foreground">
                B
              </div>
              <span className="text-lg font-bold">Bimbel</span>
            </div>
            <p className="mt-4 text-sm text-muted-foreground">
              Platform bimbingan belajar online untuk membantu siswa meraih prestasi terbaik.
            </p>
          </div>
          {Object.entries(footerLinks).map(([group, links]) => (
            <div key={group}>
              <h4 className="mb-4 text-sm font-semibold">{group}</h4>
              <ul className="space-y-2">
                {links.map((link) => (
                  <li key={link}>
                    <a
                      href="#"
                      className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                    >
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="mt-12 border-t pt-8 text-center text-sm text-muted-foreground">
          &copy; {new Date().getFullYear()} Bimbel. All rights reserved.
        </div>
      </div>
    </footer>
  )
}
