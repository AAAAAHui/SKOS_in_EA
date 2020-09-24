import requests
import sys
import json

#user search keyword
def search(path, scheme, concept):
    if(scheme == 'all_BegrippenXL_vocabularies'):
        a = requests.get('https://www.begrippenxl.nl/rest/v1/search?query=*' + concept + '*')   
    else:
        a = requests.get('https://www.begrippenxl.nl/rest/v1/' + scheme + '/search?query=*' + concept + '*')
        
    if(a.status_code==200):
        data = json.dumps(a.json());
        f=open(path + "search_result.json", "w")
        f.write(data)
        f.close()
    return

keyword = sys.argv[3]
if(len(sys.argv) > 4):
    for i in range(4, len(sys.argv)):
        keyword = keyword + ' ' + sys.argv[i]
        
search(sys.argv[1], sys.argv[2], keyword)
#search('mbo_kwalificaties', 'Aankomend onderofficier')