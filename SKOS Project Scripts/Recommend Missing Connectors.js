!INC Local Scripts.EAConstants-JScript
!INC EAScriptLib.JScript-Dialog
!INC Others.Parameters
!INC Others.Json

//Check the types/directions of connectors in the diagram are correct or not
function checkConnector(thePackage, theDiagram, theElement, tag, skosTag1, skosTag2){
	var j = 0;
	//Check the selected element has semantic relations
	if(tag.Name.indexOf(skosTag1) != -1 && tag.Name.indexOf(skosTag2) != -1){
//		while(j < thePackage.Elements.Count) {
		while(j < theDiagram.DiagramObjects.Count) {
			var tempElement as EA.Element;
//			tempElement = thePackage.Elements.GetAt(j);
			tempElement = Repository.GetElementByID(theDiagram.DiagramObjects.GetAt(j).ElementID);
			var tempTag as EA.TaggedValue;
			tempTag = tempElement.TaggedValues.GetByName(mimTagSKOSPref);
			
			//Locate a element has Semantic relationship with the selected element
			if(tempElement.Name == tag.Value || (tempTag != null && tempTag.Value == tag.Value) ){
				var con as EA.Connector;
				var n = 0;
				
				//Go through all connectors in the selected element to check have two elements connected or not
				while(n<theElement.Connectors.Count){
//					Session.Output(n);
					con = theElement.Connectors.GetAt(n);
					if(con.ClientID == tempElement.ElementID || con.SupplierID == tempElement.ElementID)
						return;
					else
						n++;
				}
				
				//Has went through all connectors and did not find that two elements have relation
				if(n == theElement.Connectors.Count){
					if(Session.Prompt("Possible missing connector between '" + theElement.Name + "' that can attach with Object type '" + tempElement.Name + "'", promptOKCANCEL)  == resultOK){
						addConnector(skosTag1, theElement, tempElement);
						return;
					}
				}
//				Session.Output(j);
			}
			else
				j++;
		}
	}
	else
		return;
}

//Add connectors to the diagram
//The type and direction depend on the Semantic Relation between two Object types
function addConnector(skosTag, currentElement, newElement){
	var con as EA.Connector;
	if(skosTag == 'related concept'){
//		if(Session.Prompt("Which relationship connector do you want to add between '" + currentElement.Name + "' and '" + newElement.Name + "'?\n" +
//			"1: Association; \n Please press OK and enter the number in next window.", promptOKCANCEL) == resultOK){
				
//			if(Session.Input("Enter the number of connector:") == "1"){
				con = currentElement.Connectors.AddNew('','Association');
				con.SupplierID = newElement.ElementID;
				newElement = con.SupplierEnd;
				currentElement = con.ClientEnd;
//			}
//		}
	}
	else if(skosTag == 'narrower concept'){
		var vbe = new ActiveXObject("ScriptControl");
		var input = DLGInputBox("Which relationship connector do you want to add between '" + currentElement.Name + "' and '" + newElement.Name + "'? \" & vbNewLine & \" " +
			"1: Generalization; \" & vbNewLine & \" 2: Composition; \" & vbNewLine & \" 3: Aggregation; \" & vbNewLine & \"" + 
			"Please enter the number in in the text box below, and press OK.", "Choose a Connector", "");

		if(input != "1" && input != "2" && input != "3"){
			Session.Prompt("Please input a valid number",promptOK);
			addConnector(skosTag, currentElement, newElement);
			return;
		}		
		
		if(input == "1"){
			con = currentElement.Connectors.AddNew('','Generalization');	
		}
		else if(input == "2"){
			con = currentElement.Connectors.AddNew('','Composition');
			con.SupplierEnd.Aggregation = 2;
		}
		else if(input == "3"){
			con = currentElement.Connectors.AddNew('','Aggregation');
			con.SupplierEnd.Aggregation = 1;
		}
			
		con.SupplierID = currentElement.ElementID;
		con.ClientID = newElement.ElementID;
//		currentElement = con.SupplierEnd;
//		newElement = con.ClientEnd;
	}
	else if(skosTag == 'broader concept'){
		var vbe = new ActiveXObject("ScriptControl");
		var input = DLGInputBox("Which relationship connector do you want to add between '" + currentElement.Name + "' and '" + newElement.Name + "'? \" & vbNewLine & \" " +
			"1: Generalization; \" & vbNewLine & \" 2: Composition; \" & vbNewLine & \" 3: Aggregation; \" & vbNewLine & \"" + 
			"Please enter the number in in the text box below, and press OK.", "Choose a Connector", "");
		Session.Output(typeof(input));
		Session.Output(input);
		if(input != "1" && input != "2" && input != "3"){
			Session.Prompt("Please input a valid number",promptOK);
			addConnector(skosTag, currentElement, newElement);
			return;
		}
				
		if(input == "1"){
			con = currentElement.Connectors.AddNew('','Generalization');	
		}
		else if(input == "2"){
			con = currentElement.Connectors.AddNew('','Composition');
			con.SupplierEnd.Aggregation = 2;
		}
		else if(input == "3"){
			con = currentElement.Connectors.AddNew('','Aggregation');
			con.SupplierEnd.Aggregation = 1;
		}
			
		con.SupplierID = newElement.ElementID;
		con.ClientID = currentElement.ElementID;
//		currentElement = con.SupplierEnd;
//		newElement = con.ClientEnd;
		
	}
	
	con.Update();
	newElement.Update();
	currentElement.Update();
}

function main(){
	Repository.EnsureOutputVisible( "Script" );
	ClearOutput ("Script");
	Session.Output('Start');
	
	var selectedType = Repository.GetTreeSelectedItemType();
	if(selectedType != '4'){
		Session.Prompt( "Please select a Object type.", promptOK );
		return;
	}

	// Get the currently selected element and package in the tree to work on
	var thePackage as EA.Package;
	thePackage = Repository.GetTreeSelectedPackage();
	var theElement as EA.Element;
	theElement = Repository.GetTreeSelectedObject();
	var theDiagram as EA.Diagram;
	flag: for(var i = 0; i<thePackage.Diagrams.Count; i++){
		theDiagram = thePackage.Diagrams.GetAt(i);
		for(var j = 0; j<theDiagram.DiagramObjects.Count; j++){
			if(theDiagram.DiagramObjects.GetAt(j) == theElement)
				break flag;
		}
	}
	
	var tag as EA.TaggedValue;
	
	//Go through SKOS tags of selected element to check relevant connectors and object types are described in correct way
	for(var i = 0; i<theElement.TaggedValues.Count; i++){
		tag = theElement.TaggedValues.GetAt(i);
		checkConnector(thePackage, theDiagram, theElement, tag, 'related concept', 'name');
		checkConnector(thePackage, theDiagram, theElement, tag, 'narrower concept', 'name');
		checkConnector(thePackage, theDiagram, theElement, tag, 'broader concept', 'name');
	}
	
	if(theDiagram.Update())
		Repository.RefreshOpenDiagrams(true);
	Session.Output('End');
}

main();

