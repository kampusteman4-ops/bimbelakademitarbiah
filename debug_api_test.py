import requests

base = 'https://script.google.com/macros/s/AKfycbyIT14I5mxnZQ_7HN3GXGBj_yi7fpd6PkruqGPAelvP2BkwIvp9IyW8i32hM5U5avJt/exec'
endpoints = [
    ('search', {'action':'search','keyword':'andre'}),
    ('detail', {'action':'detail','id':'A001A'})
]

for name, params in endpoints:
    try:
        r = requests.get(base, params=params, timeout=15)
        print('---', name, '---')
        print('URL:', r.url)
        print('STATUS:', r.status_code)
        print('HEADERS:', dict(r.headers))
        text = r.text
        print('BODY (first 1000 chars):')
        print(text[:1000])
    except Exception as e:
        print('ERROR', name, e)
