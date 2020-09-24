import requests
import sys
import json

#get full concept description
def query(path, scheme, uri):
    if(scheme == 'all_BegrippenXL_vocabularies'):
        a = requests.get('https://www.begrippenxl.nl/rest/v1/data?uri=' + uri + '&format=application/ld%2Bjson')
    else:
        a = requests.get('https://www.begrippenxl.nl/rest/v1/' + scheme + '/data?uri=' + uri + '&format=application/ld%2Bjson')
#    print(concept)
    if(a.status_code==200):
        data = json.dumps(a.json());
#       f=open("D:/Project/Testing/" + concept + ".json", "w")
        f=open(path + "concept.json", "w")
        f.write(data)
        f.close()
    return

# keyword = sys.argv[3]
# if(len(sys.argv) > 4):
    # for i in range(4, len(sys.argv)):
        # keyword = keyword + ' ' + sys.argv[i]
        
query(sys.argv[1], sys.argv[2], sys.argv[3])
#retrieve("vensters", "http://purl.edustandaard.nl/concept/f5b84813-ba3f-463b-93f7-2b270cc88be8", "D:\\Project\\Testing\\")