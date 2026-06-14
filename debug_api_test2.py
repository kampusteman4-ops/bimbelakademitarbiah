import urllib.request, urllib.parse, sys

base = 'https://script.google.com/macros/s/AKfycbyIT14I5mxnZQ_7HN3GXGBj_yi7fpd6PkruqGPAelvP2BkwIvp9IyW8i32hM5U5avJt/exec'
endpoints = [
    ('search', {'action':'search','keyword':'andre'}),
    ('detail', {'action':'detail','id':'A001A'})
]

for name, params in endpoints:
    try:
        url = base + '?' + urllib.parse.urlencode(params)
        req = urllib.request.Request(url, headers={'User-Agent':'DebugClient/1.0'})
        with urllib.request.urlopen(req, timeout=15) as r:
            body = r.read().decode('utf-8', errors='replace')
            print('---', name, '---')
            print('URL:', url)
            print('STATUS:', r.status)
            print('HEADERS:', dict(r.getheaders()))
            print('BODY (first 2000 chars):')
            print(body[:2000])
    except Exception as e:
        print('ERROR', name, e)
        sys.exit(1)
