import requests
import sys
import json

#user search keyword
def narrower(path, scheme, uri):
    a = requests.get('https://www.begrippenxl.nl/rest/v1/' + scheme + '/narrower?uri=' + uri)
        
    if(a.status_code==200):
        data = json.dumps(a.json());
        f=open(path + "narrower.json", "w")
        f.write(data)
        f.close()
    return
        
narrower(sys.argv[1], sys.argv[2], sys.argv[3])