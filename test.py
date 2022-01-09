import requests

url = 'http://localhost/transfer-data'
myobj = {'eid': 'GTkd', 'username': 'Aniruddh Mishra'}
headers = {'Content-type': 'application/json', 'Accept': 'text/plain'}
x = requests.post(url, json=myobj, headers=headers)

print(x.text)