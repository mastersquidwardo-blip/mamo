import pathlib,json,sys,importlib.util
root=pathlib.Path(__file__).resolve().parents[1]
spec=importlib.util.spec_from_file_location('build',root/'tools'/'build_public.py');b=importlib.util.module_from_spec(spec);spec.loader.exec_module(b)
original={'boxes':50,'packs':150,'gmr':0,'of':2,'sl':7,'pool':'Americas','reporter':'PRIVATE_NAME','source_url':'https://example.com/private'}
r={'country':'Canada','pool':'Unknown','boxes':50,'packs':150,'gmr':None,'reviewed':False,'original':original}
a=b.project({'updated':'2026-09-06','entries':[]},{'entries':[r]})['openings'][0]
assert a['gmr'] is None and a['prior']['gmr']==0 and a['prior']['packs']==150
assert 'PRIVATE_NAME' not in str(a) and 'source_url' not in str(a)
data=json.loads((root/'data.js').read_text(encoding='utf-8').removeprefix('window.MAMO_DATA = ').strip().removesuffix(';'))
assert len(data['serials'])==40 and len(data['openings'])==33
large=next(r for r in data['openings'] if r['id']=='O025');assert large['cases']==100 and large['gmr']==1 and large['packs'] is None
assert large['prior']['packs']==12000
assert sum(bool(r['prior']) for r in data['openings'])==28
app=(root/'app.js').read_text(encoding='utf-8');html=(root/'index.html').read_text(encoding='utf-8')
assert 'includeWinners' not in app+html and 'omitLargest' not in app+html and 'Observed average:' not in app
assert 'stats.interval(' not in app and 'value="600000"' not in html
assert 'O025' in app and 'Earlier recorded values' in app
print('Correction checks passed: original28records preserved, large case evidence retained, misleading controls and default inferred-looking odds absent, private identifiers excluded.')
