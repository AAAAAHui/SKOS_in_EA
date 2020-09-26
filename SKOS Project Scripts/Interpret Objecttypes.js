!INC Local Scripts.EAConstants-JScript
!INC EAScriptLib.JScript-Dialog
!INC Others.Parameters
!INC Others.Json

//Add SKOS definition for the elements
function addNotes(aClass, concept, notes){
	aClass.Notes = aClass.Notes + "\n-- Naam --\n" + concept
		+ "\n-- Definitie --\n" + notes + "\n -- Toelichting -- \n";
//	aClass.Update();
	aClass.Refresh();
	
	Session.Output( "New notes: '" + aClass.Notes + "'" );
}

function addTags(aClass, tag, value){
	var label as EA.TaggedValue;
	label = aClass.TaggedValues.AddNew(tag, value);
	label.Update();
	aClass.Update();
	aClass.Refresh();
	
	Session.Output( "Added tag: '" + label.Name + "', and its value: '" + label.Value + "'" );
}

function addMIMTags(aClass, tag, value){
	var label as EA.TaggedValue;
	label = aClass.TaggedValues.GetByName(tag);
	if(label == null){
		Session.Prompt("MIM tag " + tag + " is not found", promptOK);
		return;
	}
	label.Value = value;
	
	label.Update();
	aClass.Update();
	aClass.Refresh();
	
	Session.Output( "Added MIM tag: '" + label.Name + "', and its value: '" + label.Value + "'");
}

//run the external python files
function runpy(py_path, store_path, py, scheme, uri, concept){
	var ws = new ActiveXObject("WScript.Shell");      
//	ws.Run('python3 D:\\Project\\Testing' + file + '.py ' + concept);
	if(py == 'search.py')
//		ws.Run('python3 D:\\Project\\Testing\\search.py vensters onderwijs', 0, true);
		ws.Run(pyComm + ' ' + py_path + py + ' ' +  store_path + ' ' + scheme + ' ' + concept, 0, true);
	else if(py == 'query.py')
		ws.Run(pyComm + ' ' + py_path + py + ' '  + store_path + ' ' + scheme + ' ' + uri, 0, true);
//	return result;
}

//Read the download json files
function readFile(path){
	var fso = new ActiveXObject("Scripting.FileSystemObject"); 
	var f = fso.OpenTextFile(path, 1, true);
	var jsonF = f.ReadAll(); 
	f.Close();
//	fso.DeleteFile(path, true);
//	var jsonStr = JSON.stringify(jsonF, null, 4);
//	var jsonObj = JSON.parse(jsonF);
	return jsonF;
}

//Add text on the local files
function writeFile(path, mode, content){
	var fso = new ActiveXObject("Scripting.FileSystemObject"); 
	var f = fso.OpenTextFile(path, mode, true);
//	f.WriteLine(content);
	f.Write(content);
	f.Close();
}

//To make sure the old same tags are gone
function deleteTags(aClass){
	var temp as EA.TaggedValue;
	for(var c = 0; c < aClass.TaggedValues.Count; c++){	
		temp = aClass.TaggedValues.GetAt(c);		
		if(temp.Name.indexOf("URI") != -1 || temp.Name.indexOf("prefLabel") != -1 || temp.Name.indexOf("altLabel") != -1 || temp.Name.indexOf("inScheme") != -1 || temp.Name.indexOf("related") != -1 || temp.Name.indexOf("broader") != -1 || temp.Name.indexOf("narrower") != -1){
			aClass.TaggedValues.DeleteAt(c, false);
//			Session.Output(c);
		}
	}
}

//Analyse external json file to fill the tags of elements
function interpret(aClass, json, scheme, uri, concept){

	//add URI of concept
	addTags(aClass, 'URI', uri);
	//add prefLabels of concept
//	addTags(aClass, 'prefLabel', concept);
	
	var i = 0;
	while(i<json.graph.length){
//		Session.Output(i);
		if(json.graph[i].hasOwnProperty('prefLabel') && json.graph[i].prefLabel.value == concept){
			
			//add related, narrower, broader concepts in tags
			analyseLabel(aClass, json, i, 'related', json.graph[i].related);
			analyseLabel(aClass, json, i, 'narrower', json.graph[i].narrower);
			analyseLabel(aClass, json, i, 'broader', json.graph[i].broader);
			
			//add definition of concept in Notes
			if(json.graph[i].hasOwnProperty("skos:definition")){
				if(json.graph[i]["skos:definition"].length == null){
					addNotes(aClass, concept, json.graph[i]["skos:definition"].value);
					addMIMTags(aClass, mimTagSKOSdefinition, json.graph[i]["skos:definition"].value);
				}
				else{
					addNotes(aClass, concept, json.graph[i]["skos:definition"][0].value);
					addMIMTags(aClass, mimTagSKOSdefinition, json.graph[i]["skos:definition"][0].value);
				}
			}
			
			//add altLabel of concept in tags
			if(json.graph[i].hasOwnProperty("altLabel")){
				if(json.graph[i].altLabel.length == null){
					addTags(aClass, 'altLabel ', json.graph[i].altLabel.value);
					aClass.Alias = json.graph[i].altLabel.value;
				}
				else{
					for(var j=0; j<json.graph[i].altLabel.length; j++){
						addTags(aClass, 'altLabel' + (j+1), json.graph[i].altLabel[j].value);
						if(j = 0)
							aClass.Alias = json.graph[i].altLabel[j].value;
						else
							aClass.Alias = aClass.Alias + '; ' + json.graph[i].altLabel[j].value;
					}	
				}
			}
			
			//add inScheme of concept in tags
			if(json.graph[i].hasOwnProperty("inScheme")){
				if(json.graph[i].inScheme.length == null){
					addTags(aClass, 'inScheme', json.graph[i].inScheme.uri);
					addMIMTags(aClass, mimTagSKOSinScheme, json.graph[i].inScheme.uri);
				}
				else{
					for(var j=0; j<json.graph[i].inScheme.length; j++){
						addTags(aClass, 'inScheme ' + (j+1), json.graph[i].inScheme[j].uri);
						if(j = 0)
							addMIMTags(aClass, mimTagSKOSinScheme, json.graph[i].inScheme[j].uri);
						else{
							var label as EA.TaggedValue;
							label = aClass.TaggedValues.GetByName(mimtTagSKOSinScheme);
							label.Value = label.Value + ';' + json.graph[i].inScheme[j].uri;
						}
					}	
				}
			}
			
			break;
		}
		i++;
	}
}

function selectSKOS(){
	var scheme;
	var vbe = new ActiveXObject("ScriptControl");
	var n = DLGInputBox("SKOS vocabularies:\" & vbNewLine & \" 1 = DUO thesaurus; \" & vbNewLine & \" 2 = Kennisnet - KOI thesaurus; \" & vbNewLine & \" " +
		"3 = Kennisnet - MBO kwalificaties thesaurus; \" & vbNewLine & \" 4 = Kennisnet - MBO thesaurus; \" & vbNewLine & \" 5 = Kennisnet - ROSA gegevenssoorten thesaurus; \" & vbNewLine & \" " + 
		"6 = Kennisnet - ROSA thesaurus; \" & vbNewLine & \" 7 = Kennisnet - Vensters thesaurus; \" & vbNewLine & \" 0 = All BegrippenXL thesaurus \" & vbNewLine & \" " + 
		"Please enter the number of thesaurus in the text box below", "Choose SKOS Thesaurus", "");
//	Session.Prompt("The possible SKOS vocabularies: \n 1 = DUO thesaurus; \n 2 = Kennisnet - KOI thesaurus; \n " +
//		"3 = Kennisnet - MBO kwalificaties thesaurus; \n 4 = Kennisnet - MBO thesaurus; \n 5 = Kennisnet - ROSA gegevenssoorten thesaurus; \n " + 
//		"6 = Kennisnet - ROSA thesaurus; \n 7 = Kennisnet - Vensters thesaurus; \n 0 = All BegrippenXL thesaurus \n " + 
//		"Please press OK and then enter the number of thesaurus in the next pop-up window", promptOKCANCEL);
//	var n = Session.Input('Please enter the number of SKOS Thesaurus');
//	if(n == 0 || n == 1 || n == 2 || n == 3 || n == 4 || n == 5 || n != 6 || n != 7){
//		Session.Output(n);
//		Session.Prompt('Please select one vocabulary', promptOK);
//		return;
//	}
	
	switch(n){
		case '0':
			scheme='all_BegrippenXL_vocabularies';
			break;
		case '1':
			scheme='duo';
			break;
		case '2':
			scheme='koi';
			break;
		case '3':
			scheme='mbo_kwalificaties';
			break;
		case '4':
			scheme='mbo';
			break;
		case '5':
			scheme='rosa_gegevenssoorten';
			break;
		case '6':
			scheme='rosa';
			break;
		case '7':
			scheme='vensters';
			break;
		default:
			Session.Prompt('Please select one vocabulary', promptOK);
	}
	return scheme;
}

//Seperate the retrieved searching results as several lists, because the inputbox of JScript can only show 1024 character
function writeConceptsList(store_path, json){
	//if the concepts are less than 15, then there is only one page to show
	if(parseInt(json.results.length/15) == 0){
		writeFile(store_path + "list.txt", 2, '1: ' + json.results[0].prefLabel + '; ' + json.results[0].vocab);
		for(var i = 1; i<(json.results.length%15); i++){
			writeFile(store_path + "list.txt", 8, "\" & vbNewLine & \"" +
			(i+1) + ': ' + json.results[i].prefLabel + '; ' + json.results[i].vocab);
		}
	}
	//if the concepts are more than 15, then there are many pages to show
	else{
		for(var t = 0; t <= parseInt(json.results.length/15); t++){
			if(t == 0){
				writeFile(store_path + "list" + t + ".txt", 2, '1: ' + json.results[0].prefLabel + '; ' + json.results[0].vocab);
				for(var i = 1; i<15; i++){
					writeFile(store_path + "list" + t + ".txt", 8, "\" & vbNewLine & \"" +
					(i+1) + ': ' + json.results[i].prefLabel + '; ' + json.results[i].vocab);
				}
				if(i==15){
					writeFile(store_path + "list" + t + ".txt", 8,  "\" & vbNewLine & \"16: Next Page");
				}
				
			}
			else if (t == parseInt(json.results.length/15) ){
				writeFile(store_path + "list" + t + ".txt", 2, '0: Last Page');
				for(var i = 0; i<(json.results.length%15); i++){
					writeFile(store_path + "list" + t + ".txt", 8, "\" & vbNewLine & \"" +
					(i+1) + ': ' + json.results[(t*15)+i].prefLabel + '; ' + json.results[(t*15)+i].vocab);
				}
			}
			else{
				writeFile(store_path + "list" + t + ".txt", 2, '0: Last Page');
				for(var i = 0; i<15; i++){
					writeFile(store_path + "list" + t + ".txt", 8, "\" & vbNewLine & \"" +
					(i+1) + ': ' + json.results[(t*15)+i].prefLabel + '; ' + json.results[(t*15)+i].vocab);
				}
				if(i==15){
					writeFile(store_path + "list" + t + ".txt", 8,  "\" & vbNewLine & \"16: Next Page");
				}
			}
		}
	}
}

//The system will react in different way according to the user input
function selectConcept(store_path, json){
	var t = 0;
	var vbe = new ActiveXObject("ScriptControl");
	
	if(parseInt(json.results.length/15) == 0){
		var text = readFile(store_path + "list.txt");
		var input = DLGInputBox(text,"Select a concept","");
		if(input < 0 ||input > (json.results.length%15) || input == null){
			Session.Prompt('Please input a valid number', promptOK);
//			selectConcept(store_path, json);
			return;
		}
		else
			return input;
	}
	else{
		while(1){
			var text = readFile(store_path + "list" + t + ".txt");
			var input = DLGInputBox(text,"Select a concept","");

			if(input == '16' && t != parseInt(json.results.length/15))
				t++;
			else if(input == '0' && t != '0')
				t--;
			else if( (t == parseInt(json.results.length/15) && input > (json.results.length%15))
				|| (t != parseInt(json.results.length/15) && input>15)
				|| input == null){
				Session.Prompt('Please input a valid number', promptOK);
//				selectConcept(store_path, json);
				return;
			}
			else{
				return input;
				break;
			}
		}
	}
}

//Based on the Json file to fill in with the tags of elements
function analyseLabel(aClass, json, i, label, dic){
	if(json.graph[i].hasOwnProperty(label)){
		if(dic.length == null){
			addTags(aClass, label + ' concept uri', dic.uri);
			for(var k=0; k<json.graph.length; k++){
				if(json.graph[k].uri == dic.uri && json.graph[k].hasOwnProperty('prefLabel')){
					addTags(aClass, label + ' concept name', json.graph[k].prefLabel.value);
					break;
				}
			}
		}
					
		else{
			for(var j=0; j<dic.length; j++){
				addTags(aClass, label + ' concept ' + (j+1) + ' uri', dic[j].uri);
				for(var k=0; k<json.graph.length; k++){
					if(json.graph[k].uri == dic[j].uri && json.graph[k].hasOwnProperty('prefLabel'))
						addTags(aClass, label + ' concept ' + (j+1) + ' name', json.graph[k].prefLabel.value);
				}
			}
		}
	}	
}

function main(){
	Repository.EnsureOutputVisible( "Script" );
	ClearOutput ("Script");
	Session.Output('Start');
	
	//the path where user put the python files
	var py_path = pythonPath;
	
	//the path where user want to store the retrieved files
	var store_path = storePath;
	
	var ForReading = 1;
	var ForWriting = 2;
	var ForAppending = 8;

	//user selects a class
	var aClass as EA.Element;
	aClass = Repository.GetTreeSelectedObject ();
	if(aClass.FQStereotype != "MIM::Objecttype"){
		Session.Prompt("Please select a Object Type", promptOK);
		return;
	}
	
	//find the concept of this class based on the value that user put in "Keywords"
	var keyword = aClass.Tag;
	if(keyword == null || keyword == ''){
		Session.Prompt("Please input SKOS concept you are looking for in tag 'Keywords'", promptOK);
		return;
	}
//	Session.Output(keyword+ '123');
	
	//based on the user selection of SKOS thesaurus to fill in the tag value
	var source = selectSKOS();
	if(source == null){
		source = selectSKOS();
		return;
	}
//	Session.Output(source);
	
	//search.py presents possible SKOS concepts with regatds to the user's keyword
	runpy(py_path, store_path, 'search.py', source, '', keyword);
	
	//Store the searching results
	var result_path = store_path + "search_result.json";
	var text = readFile(result_path);
	var json = JSON.parse(text);
	if(json.results[0] == null){
		Session.Prompt("No results found by searching the keyword '" + keyword + "' in SKOS vocabulary '" + source + "'.", promptOK);
		return;
	}
	writeConceptsList(store_path, json);

	//user chooses a SKOS concept from output and type into the blank
	var n = selectConcept(store_path, json);
	if(n==null){
		n = selectConcept(store_path, json);
		return;
	}

	var concept = json.results[n-1].prefLabel;
	var uri = json.results[n-1].uri;
	var source = json.results[n-1].vocab;
	//query.py gets the description of SKOS concept
	runpy(py_path, store_path, 'query.py', source, uri, concept);
	
	//run the external python files
	deleteTags(aClass);
	
	addMIMTags(aClass, mimTagSKOSPref, concept);
	var myDate = new Date();
	addMIMTags(aClass, "Datum opname", myDate.toLocaleDateString());
//	addMIMTags(aClass, "Herkomst", source);
//	addMIMTags(aClass, "Herkomst definitie", uri);
	addMIMTags(aClass, mimTagSKOSVocab, source);
	addMIMTags(aClass, mimTagConceptUri, uri);
	
	//the path of json description of SKOS concept
	result_path = store_path + 'concept.json';
//	Session.Output(readFile(result_path));
	text = readFile(result_path);
	json = JSON.parse(text);
	interpret(aClass, json, source, uri, concept);
	
	if(aClass.Update())
		Repository.RefreshOpenDiagrams(true);
	
	Session.Output('End');
}


main();