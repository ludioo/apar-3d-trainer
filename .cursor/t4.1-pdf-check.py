import hashlib
import json
from pathlib import Path

import pdfplumber
from pypdf import PdfReader
from PIL import Image

root = Path(__file__).resolve().parent
checks = []
for file in sorted(root.glob('t4.1-*-spec.pdf')):
    reader = PdfReader(file)
    assert len(reader.pages) == 2
    text = ' '.join(' '.join(page.extract_text() for page in reader.pages).split())
    assert all(token in text for token in ['USD 41', '6 kg', 'Red', 'With bracket', '113', '112', 'Not a substitute'])
    image = reader.pages[0].images[0].image
    assert image.size == (1200, 900)
    with pdfplumber.open(file) as pdf:
        margins = []
        for page in pdf.pages:
            assert all(45 < c['x0'] < c['x1'] < page.width - 35 and 20 < c['top'] < c['bottom'] < page.height - 15 for c in page.chars)
            margins.append(min(c['top'] for c in page.chars))
    second = root / 't4.1-pdf-render' / (file.stem + '-2.png')
    checks.append({'file': file.name, 'pages': 2, 'image': list(image.size), 'min_text_top_pt': margins,
                   'page2_pixel_hash': hashlib.sha256(Image.open(second).tobytes()).hexdigest()})
assert len(checks) == 4
assert len({check['page2_pixel_hash'] for check in checks}) == 1
(root / 't4.1-pdf-qa.json').write_text(json.dumps({'checks': checks}, indent=2), encoding='utf-8')
print(json.dumps(checks, indent=2))
