import json
import re
import subprocess
from pathlib import Path

import pdfplumber
from pypdf import PdfReader
from PIL import Image

root = Path(__file__).resolve().parent
folder = root / 't2.5-pdfs'
render = root / 't2.5-pdf-render'
render.mkdir(exist_ok=True)
normalize = lambda value: re.sub(r'\s+', ' ', value).strip()
checks = []
for file in sorted(folder.glob('t2.5-*.pdf')):
    if file.name.startswith('t2.5-dev-'):
        continue
    reader = PdfReader(file)
    text = normalize(' '.join(page.extract_text() for page in reader.pages))
    assert '\ufffd' not in text, (file.name, 'unreadable glyph')
    assert all(token in text for token in ['113', '112', 'Komdigi', 'PER.04/MEN/1980', 'USFA',
        'https://trainer.barkahmauludi.com', 'https://layanan112.komdigi.go.id/tentang'])
    lang = 'id' if 'Laporan latihan' in text or 'Spesifikasi konfigurasi' in text else 'en'
    dictionary = json.loads((root.parent / 'src/i18n' / f'{lang}.json').read_text(encoding='utf-8'))
    assert normalize(dictionary['disclaimer']) in text, file.name
    assert text.index(dictionary['emergency.title']) > text.index(normalize(dictionary['disclaimer']))
    if 'report' in file.name or 'name-' in file.name:
        assert len(reader.pages) >= 2
        for question in json.loads((root.parent / 'src/data/quiz.json').read_text(encoding='utf-8')):
            assert normalize(question['question'][lang]) in text, (file.name, question['id'])
    if 'report-id' in file.name or 'report-en' in file.name:
        assert '5/8' in text and ('62,5%' in text if lang == 'id' else '62.5%' in text)
        assert dictionary['quiz.failed'] in text and 'Barkah Mauludi' in text
    if 'name-latin' in file.name:
        assert 'José D’Angelo' in text
    if 'name-long' in file.name:
        assert 'B' * 60 in text
    if 'name-empty' in file.name:
        assert 'Participant name (optional): -' in text
    if 'name-draft' in file.name:
        assert 'Draft gagal simpan' in text
    if 'snapshot-report' in file.name:
        assert lang == 'id' and 'Changed after click' not in text and '6/8' in text
    if 'snapshot-spec' in file.name:
        assert lang == 'id' and '6 kg' in text and '600.000' in text
    if 'spec-id' in file.name or 'spec-en' in file.name:
        assert 'CO2' in text and '9 kg' in text
        assert ('1.100.000' in text if lang == 'id' else '71' in text)
    images = []
    for page in reader.pages:
        for obj in page.get('/Resources', {}).get('/XObject', {}).values():
            image = obj.get_object()
            if image.get('/Subtype') == '/Image':
                images.append([image['/Width'], image['/Height']])
        links = [a.get_object().get('/A', {}).get('/URI') for a in page.get('/Annots', [])]
        assert 'https://trainer.barkahmauludi.com' in links
    if 'spec' in file.name:
        assert [1200, 900] in images
    with pdfplumber.open(file) as pdf:
        for page in pdf.pages:
            assert all(45 < c['x0'] < c['x1'] < page.width - 35 and 20 < c['top'] < c['bottom'] < page.height - 15
                for c in page.chars), (file.name, 'text outside page margins')
    output = render / file.stem
    result = subprocess.run(['pdftoppm', '-scale-to', '1200', '-png', str(file), str(output)], capture_output=True)
    assert result.returncode == 0, result.stderr
    pages = [Image.open(image).convert('RGB') for image in sorted(render.glob(f'{file.stem}-*.png'))
        if image.stem.rsplit('-', 1)[-1].isdigit()]
    assert len(pages) == len(reader.pages)
    contact = Image.new('RGB', (sum(p.width for p in pages), max(p.height for p in pages)), 'white')
    x = 0
    for page in pages:
        contact.paste(page, (x, 0)); x += page.width
    contact.save(render / f'{file.stem}-review.png')
    checks.append({'file': file.name, 'lang': lang, 'pages': len(reader.pages), 'bytes': file.stat().st_size, 'images': images})
(root / 't2.5-pdf-qa.json').write_text(json.dumps({'checks': checks}, indent=2), encoding='utf-8')
print(json.dumps(checks, indent=2))
