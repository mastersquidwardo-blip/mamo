"""Project private ledgers onto a strict public allowlist. Standard library only."""
import csv, io, json, pathlib, re
ROOT=pathlib.Path(__file__).resolve().parents[1]
COUNTRIES={'United States','Mexico','Canada','Germany','United Kingdom','Spain','Switzerland','South Africa','Australia','Bulgaria','Peru'}
LEVELS={'Previously recorded','Source text checked','Prior OCR record','Needs serial review'}
FIELDS=('gmr','ur_of','sl_of','main_sl','bonus_sl','unclassified_sl')
def identity(e):
    s=re.sub(r'\s+','',e.get('serial','')).upper()
    m=re.fullmatch(r'(\d{1,3})/100(E?)',s)
    if not m or not 1<=int(m[1])<=100 or not re.fullmatch(r'MAMO-EN0(?:0[1-9]|1[0-8])',e['set']): return None
    return e['set']+'|'+str(int(m[1])).zfill(3)+'/100'+m[2]
def country(e):
    value=e.get('country_public')
    if value and value not in COUNTRIES: raise ValueError('Country must be reviewed: '+value)
    return value or 'Unknown'
def project(ledger,openings):
    grouped={}; unresolved=[]
    for e in ledger['entries']:
        key=identity(e)
        if key: grouped.setdefault(key,[]).append(e)
        else: unresolved.append(e)
    serials=[]
    for key,group in sorted(grouped.items()):
        codes={country(e) for e in group if country(e)!='Unknown'}
        e=next((e for e in group if e.get('review_level')=='Source text checked'),group[0])
        serial=key.split('|')[1]
        serials.append(dict(card=e['card'],set=e['set'],serial=serial,pool='E-distributed' if serial.endswith('E') else 'Americas',country=next(iter(codes)) if len(codes)==1 else 'Unknown',countryBasis=e.get('country_basis','Reported country') if len(codes)<2 else 'Conflicting reports',review=e.get('review_level','Previously recorded'),checked=e.get('checked_at'),reports=len(group)))
    pending=[]
    for i,e in enumerate(unresolved):
        pending.append(dict(id='P'+str(i+1).zfill(3),card=e['card'],set=e['set'],country=country(e),serial='Unresolved',pool='Unknown',review='Needs serial review'))
    public_open=[]
    for i,e in enumerate(openings['entries']):
        if not e.get('active',True): continue
        c=e.get('country') or 'Unknown'
        if c!='Unknown' and c not in COUNTRIES: raise ValueError('Invalid opening country')
        p={k:e.get(k) for k in ('boxes','packs','cases','pool','reason','reviewed','selected_outcome','origin','collection')+FIELDS}
        p.update(id='O'+str(i+1).zfill(3),country=c)
        original=e.get('original')
        if original:
            p['prior']={k:original.get(k) for k in ('boxes','packs','gmr','of','sl','pool')}
        else:
            p['prior']=None
        for f in FIELDS:
            if p[f] is not None and (not isinstance(p[f],int) or p[f]<0): raise ValueError('Invalid hit count')
        if p['packs'] is not None and (not isinstance(p['packs'],int) or p['packs']<1): raise ValueError('Invalid pack exposure')
        public_open.append(p)
    return dict(updated=ledger['updated'],serials=serials,pending=pending,openings=public_open)
def render(data):
    # Public projection is the only content serialized: never dump raw ledgers.
    raw=json.dumps(data,ensure_ascii=False,indent=2)
    if re.search(r'https?://|@[\w]|_private|reporter|source_url|ebay\.com|x\.com|reddit\.com|US West|US Northeast|Antarctica',raw,re.I): raise ValueError('Public privacy scan failed')
    (ROOT/'data.js').write_text('window.MAMO_DATA = '+raw.replace('<','\\u003c')+';\n',encoding='utf-8')
    stream=io.StringIO(newline='')
    writer=csv.DictWriter(stream,lineterminator='\n',fieldnames=['card','set','serial','pool','country','countryBasis','review','checked','reports'])
    writer.writeheader(); writer.writerows(data['serials'])
    (ROOT/'serials.csv').write_text(stream.getvalue(),encoding='utf-8')
    (ROOT/'openings.json').write_text(json.dumps(data['openings'],indent=2)+'\n',encoding='utf-8')
if __name__=='__main__':
    data=project(json.loads((ROOT/'_private'/'serial-ledger.json').read_text(encoding='utf-8-sig')),json.loads((ROOT/'_private'/'opening-ledger.json').read_text(encoding='utf-8-sig')))
    render(data)
    print(json.dumps(dict(serials=len(data['serials']),unresolved=len(data['pending']),openings=len(data['openings']))))
