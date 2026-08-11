package material

import "testing"

// sanitizeContentImages harus menormalkan URL (public maupun presigned) ke
// objectName, dan membiarkan objectName yang sudah bersih tetap utuh.
func TestSanitizeContentImages(t *testing.T) {
	cases := []struct{ in, want string }{
		// objectName baru prefix public/materials
		{`<img src="public/materials/123e4567-e89b-12d3-a456-426614174000.jpg">`,
			`<img src="public/materials/123e4567-e89b-12d3-a456-426614174000.jpg">`},
		// public URL penuh → strip balik ke objectName
		{`<img src="http://rustfs.test/bimbel2-dev/public/materials/123e4567-e89b-12d3-a456-426614174000.jpg">`,
			`<img src="public/materials/123e4567-e89b-12d3-a456-426614174000.jpg">`},
		// legacy forum objectName → utuh (presigned di serve)
		{`<img src="forum/123e4567-e89b-12d3-a456-426614174000.png">`,
			`<img src="forum/123e4567-e89b-12d3-a456-426614174000.png">`},
		// presigned URL lama → strip balik ke forum objectName
		{`<img src="http://rustfs.test/bimbel2-dev/forum/123e4567-e89b-12d3-a456-426614174000.png?X-Amz-Signature=abc">`,
			`<img src="forum/123e4567-e89b-12d3-a456-426614174000.png">`},
		// bukan gambar storage → tidak tersentuh
		{`<img src="https://external.example/x.png">`,
			`<img src="https://external.example/x.png">`},
	}
	for _, c := range cases {
		if got := sanitizeContentImages(c.in); got != c.want {
			t.Errorf("sanitizeContentImages(%q)\n got: %q\nwant: %q", c.in, got, c.want)
		}
	}
}
