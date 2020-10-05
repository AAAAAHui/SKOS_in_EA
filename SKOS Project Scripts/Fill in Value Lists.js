!INC Local Scripts.EAConstants-JScript
!INC EAScriptLib.JScript-Dialog
!INC Others.Parameters
!INC Others.Json

//add value in the value list
function addAttributes(aClass, attribute, uri, attrSt){
	var attr as EA.Attribute;
	attr = aClass.Attributes.AddNew(attribute, 'CharacterString');
	attr.Stereotype = attrSt;
	
	Session.Output( "Added attribute: '" + attr.Name + "', and its Stereotype is: '" + attr.Stereotype + "'" );
	attr.Update();
	
	addAttrTags(attr, mimTagSKOSPref, attribute);
	var myDate = new Date();
	addAttrTags(attr, "Datum opname", myDate.toLocaleDateString());
	addAttrTags(attr, mimTagConceptUri, uri);
	addTags(attr, 'URI', uri);

	attr.Update();
	aClass.Update();
	aClass.Refresh();
	
	
}

function addMIMTags(aClass, tag, value){
	var label as EA.TaggedValue;
	label = aClass.TaggedValues.GetByName(tag);
	
	if(label != null){
		label.Value = value;
	
		label.Update();
		aClass.Update();
		aClass.Refresh();
	
		Session.Output( "Added tag: '" + label.Name + "', and its value: '" + label.Value + "'" );
		return;
	}
	else{
		return;
	}
	
}

function addTags(aClass, tag, value){
	var label as EA.TaggedValue;
	label = aClass.TaggedValues.AddNew(tag, value);
	label.Update();
	aClass.Update();
	
	Session.Output( "Added tag: '" + label.Name + "', and its value: '" + label.Value + "'" );
}

//Add the SKOS definition for Attributes 
function addAttrTags(attr, tag, value){
	var attrTag as EA.AttributeTag;
	attrTag = attr.TaggedValues.GetByName(tag);
//	Session.Output(label.Name);
//	if(attrTag.Name == tag){
	if(attrTag != null){
//		Session.Output(attrTag.Name);
		attrTag.Value = value;
	
		attrTag.Update();
		attr.Update();
	
		Session.Output( "Added Attribute tag: '" + attrTag.Name + "', and its value: '" + attrTag.Value + "'" );
		return;
	}
	else{
		return;
	}
	
}

//Add SKOS definition for the elements
function addNotes(aClass, concept, notes){
	aClass.Notes = aClass.Notes + "\r\n-- Naam --\r\n" + concept
		+ "\r\n-- Definitie --\r\n" + notes + "\r\n -- Toelichting -- \r\n";
//	aClass.Update();
	aClass.Refresh();
	
	Session.Output( "New notes: '" + aClass.Notes + "'" );
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
	else if(py == 'narrower.py')
		ws.Run(pyComm + ' ' + py_path + py + ' '  + store_path + ' ' + scheme + ' ' + uri, 0, true);
//	return result;
}

//read the download json files
function readFile(path){
	var fso = new ActiveXObject("Scripting.FileSystemObject"); 
	var f = fso.OpenTextFile(path, 1, true);
	var jsonF = f.ReadLine(); 
//	f.close();
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

function selectSKOS(){
	var scheme;
	var vbe = new ActiveXObject("ScriptControl");
	var n = DLGInputBox("SKOS vocabularies:\" & vbNewLine & \" 1 = DUO thesaurus; \" & vbNewLine & \" 2 = Kennisnet - KOI thesaurus; \" & vbNewLine & \" " +
		"3 = Kennisnet - MBO kwalificaties thesaurus; \" & vbNewLine & \" 4 = Kennisnet - MBO thesaurus; \" & vbNewLine & \" 5 = Kennisnet - ROSA gegevenssoorten thesaurus; \" & vbNewLine & \" " + 
		"6 = Kennisnet - ROSA thesaurus; \" & vbNewLine & \" 7 = Kennisnet - Vensters thesaurus; \" & vbNewLine & \" 0 = All BegrippenXL thesaurus \" & vbNewLine & \" " + 
		"Please enter the number of thesaurus in the text box below", "Choose SKOS Thesaurus", "");
//	Session.Output(n);
	switch(n){
		case '0':
			scheme='all_seven_vocabularies';
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
			
			//add definition of concept in Notes
			if(json.graph[i].hasOwnProperty("skos:definition")){
				if(json.graph[i]["skos:definition"].length == null){
					addNotes(aClass, json.graph[i]["skos:definition"].value);
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

function fillValueList(dataType, json, scheme, concept){
	var attrSt = classifyStereotype(dataType);
	if(attrSt != null){
		if(json.narrower.length == 0)
			Session.Output("This concept has no narrower concepts.");
		else{
			for(var i = 0; i<json.narrower.length; i++){
//				Session.Output(json.narrower[i].prefLabel);
				addAttributes(dataType, json.narrower[i].prefLabel, json.narrower[i].uri, attrSt);
			}
		}
	}
	else
		return;
	return;
}

function classifyStereotype(dataType){
	var attrSt;
	if(dataType.Stereotype.indexOf("Referentielijst") != -1){
//		attrSt = 'Referentie element';
		return;
	}
	else if(dataType.Stereotype.indexOf("Codelijst") != -1){
		return;
	}
	else if(dataType.Stereotype.indexOf("Gestructureerd datatype") != -1){
		attrSt = 'Data element';
	}
	else if(dataType.Stereotype.indexOf("Enumeratie") != -1){
		attrSt = 'Enumeratiewaarde';
	}
	return attrSt;
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


function main(){
	Repository.EnsureOutputVisible( "Script" );
	ClearOutput ("Script");
	Session.Output('Start');
	
	//the path where user put the python files
	var py_path = pythonPath;
	
	//the path where user want to store the retrieved files
	var store_path = storePath;
	
	var dataType as EA.Element;
	dataType = Repository.GetTreeSelectedObject ();
	
	if (dataType.Type == 'Enumeration' || dataType.Type == 'DataType'){
		
		//find the concept of this class based on the value that user put in "Keywords"
		var keyword = dataType.Tag;
//		Session.Output(keyword);
		if(keyword == null || keyword == ''){
			Session.Prompt("Please input SKOS concept you are looking for in tag 'Keywords'", promptOK);
			return;
		}
		
		//based on the user selection of SKOS thesaurus to fill in the tag value
		var source = selectSKOS();
		if(source == null){
			source = selectSKOS();
			return;
		}
		
		//search.py presents possible SKOS concepts with regatds to the user's keyword
		runpy(py_path, store_path, 'search.py', source, '', keyword);
		
		//the path where downloaded json files will be put
		var result_path = store_path + "search_result.json";
		var text = readFile(result_path);
		var json = JSON.parse(text);
		if(json.results[0] == null){
			Session.Prompt("No results found with the keyword '" + keyword + "' in SKOS vocabulary '" + source + "'.", promptOK);
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
		runpy(py_path, store_path, 'narrower.py', source, uri);
		
		//add information based on the MIM tags
		addMIMTags(dataType, mimTagSKOSPref, concept);
		var myDate = new Date();
		addMIMTags(dataType, "Datum opname", myDate.toLocaleDateString());
		addMIMTags(dataType, mimTagSKOSVocab, source);
		addMIMTags(dataType, mimTagConceptUri, uri);
		addTags(dataType, "URI", uri);
		
		//the path of json description of SKOS concept
		result_path = store_path + 'narrower.json';
//	Session.Output(readFile(result_path));
		text = readFile(result_path);
		json = JSON.parse(text);
//		interpret(enumeration, json, source, uri, concept);
		fillValueList(dataType, json, source, concept);
		
	}else{
		Session.Prompt("Please select a Enumeration or Data Type", promptOK);
		return;
	}
	
	if(dataType.Update())
		Repository.RefreshOpenDiagrams(true);
	
	Session.Output('End');
}

main();