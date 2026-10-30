import json
import re
import subprocess
from pathlib import Path

import pdfplumber
from pypdf import PdfReader
from PIL import Image

root = Path(__file__).resolve().parent.parent
folder = root / '.cursor' / 't4.17'
render = folder / 'pdf-render'
render.mkdir(exist_ok=True)
normalize = lambda text: re.sub(r'\s+', ' ', text).strip()
checks = []
files = sorted(folder.glob('desktop-*.pdf'))
assert len(files) == 4
for file in files:
    language = file.stem.split('-')[1]
    copy = json.loads((root / 'src/i18n' / f'{language}.json').read_text(encoding='utf-8'))
    reader = PdfReader(file)
    text = normalize(' '.join(page.extract_text() for page in reader.pages))
    assert '\ufffd' not in text
    for token in [copy['disclaimer'], copy['emergency.source'], '113', '112', 'USFA', 'PER.04/MEN/1980']:
        assert normalize(token) in text, (file.name, token)
    if language == 'id':
        assert not re.search(r'\b(bracket|nozzle|gauge|source|checklist)\b|Class C', text, re.I), file.name
    if 'spec' in file.stem:
        assert normalize(copy['config.illustrativeNote']) in text
        images = [obj.get_object() for page in reader.pages for obj in page.get('/Resources', {}).get('/XObject', {}).values()]
        assert any(obj.get('/Width') == 1200 and obj.get('/Height') == 900 for obj in images)
    else:
        assert '7/8' in text
        assert ('Selang & nozel' if language == 'id' else 'Hose & nozzle') in text
        questions = json.loads((root / 'src/data/quiz.json').read_text(encoding='utf-8'))
        for question in questions:
            assert normalize(question['question'][language]) in text
    with pdfplumber.open(file) as pdf:
        for page in pdf.pages:
            assert all(45 < c['x0'] < c['x1'] < page.width - 35 and 20 < c['top'] < c['bottom'] < page.height - 15 for c in page.chars), (file.name, 'text outside margins')
    subprocess.run(['pdftoppm', '-scale-to', '1200', '-png', str(file), str(render / file.stem)], check=True, capture_output=True)
    pages = [Image.open(image).convert('RGB') for image in sorted(render.glob(f'{file.stem}-*.png')) if image.stem.rsplit('-', 1)[-1].isdigit()]
    assert len(pages) == len(reader.pages)
    contact = Image.new('RGB', (sum(page.width for page in pages), max(page.height for page in pages)), 'white')
    x = 0
    for page in pages:
        contact.paste(page, (x, 0))
        x += page.width
    contact.save(render / f'{file.stem}-review.png')
    checks.append({'file': file.name, 'language': language, 'pages': len(reader.pages), 'bytes': file.stat().st_size, 'text': text})
(folder / 'pdf-qa.json').write_text(json.dumps(checks, indent=2, ensure_ascii=False), encoding='utf-8')
print(json.dumps([dict(file=c['file'], pages=c['pages'], bytes=c['bytes']) for c in checks], indent=2))
