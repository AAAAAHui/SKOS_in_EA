!INC Local Scripts.EAConstants-JScript
!INC EAScriptLib.JScript-Dialog
!INC Others.Parameters
!INC Others.Json

//For each connector in the diagram, to check if it has incorrect direction or type according to the Semantic Relations between Object types
function checkConnector(thePackage, theDiagram, theElement, tag, skosTag1, skosTag2){
	var j = 0;
	//Check the selected element has semantic relations
	if(tag.Name.indexOf(skosTag1) != -1 && tag.Name.indexOf(skosTag2) != -1){
//		while(j < thePackage.Elements.Count) {
		while(j < theDiagram.DiagramObjects.Count) {
			var tempElement as EA.Element;
			tempElement = Repository.GetElementByID(theDiagram.DiagramObjects.GetAt(j).ElementID);
			var tempTag as EA.TaggedValue;
//			tempTag = tempElement.TaggedValues.GetByName("Begrip");
			tempTag = tempElement.TaggedValues.GetByName(mimTagSKOSPref);
			
			//Locate a element has Semantic relationship with the selected element
			if(tempElement.Name == tag.Value || (tempTag != null && tempTag.Value == tag.Value) ){
				var con as EA.Connector;
				var n = 0;
				
				//Go through all connectors in the selected element to check have two elements connected or not
				while(n<theElement.Connectors.Count){
//					Session.Output(n);
					con = theElement.Connectors.GetAt(n);
					if(con.ClientID == tempElement.ElementID || con.SupplierID == tempElement.ElementID){
						checkConnectorType(con, theElement, tempElement, skosTag1);
//						Session.Output('first' + n);
						return;
					}
					else
						n++;
				}

				//Has went through all connectors and did not find that two elements have relation
				if(n == theElement.Connectors.Count){
					if(Session.Prompt("Possible missing connector between '" + theElement.Name + "' that can attach with Object type '" + tempElement.Name + "'", promptOKCANCEL)  == resultOK){
						addConnector(skosTag1, theElement, tempElement);
//						Session.Output('third' + n + theElement.Name + tempElement.Name);
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

function checkConnectorType(con, theElement, tempElement, skosTag){
	if(skosTag == 'related concept'){
		if(con.Type == 'Association')
			return;
		
		//if semantic relation is 'related' but the connector is not 'Association', system will help user to verify connector into 'Association'
		else{
			if(Session.Prompt("There is an inapproriate connector between '" + theElement.Name + "' and '" + tempElement.Name + "'.\n" +
			"Do you want to change connector into 'Association' ?", promptOKCANCEL) == resultOK){
				con.Type = 'Association';
				con.Direction = 'Unspecified';
				con.SupplierID = theElement.ElementID;
				con.ClientID = tempElement.ElementID;
//				con.SupplierID = tempElement.ElementID;
//				tempElement = con.SupplierEnd;
//				theElement = con.ClientEnd;
			}
		}
	}
	else if(skosTag == 'narrower concept'){
		if(con.Type == 'Generalization' || con.Type == 'Composition' || con.Type == 'Aggregation'){
			//If the type of connector is correct, then check the direction of connector
			if(con.SupplierID == theElement.ElementID && con.ClientID == tempElement.ElementID)
				return;
			else{
				if(Session.Prompt("The direction of connector between '" + theElement.Name + "' and '" + tempElement.Name + "' is inaccurate.\n" +
				"Do you want to change the direction of this connector?", promptOKCANCEL) == resultOK){
					con.SupplierID = theElement.ElementID;
					con.ClientID = tempElement.ElementID;
				}
			}
		}
		
		//If semantic relation is 'narrower' but the connector is not Generalization/Composition/Aggregation, system will notify user about it
		else{
			var vbe = new ActiveXObject("ScriptControl");
			var input = DLGInputBox("Which relationship connector do you want to add between '" + theElement.Name + "' and '" + tempElement.Name + "'? \" & vbNewLine & \" " +
				"1: Generalization; \" & vbNewLine & \" 2: Composition; \" & vbNewLine & \" 3: Aggregation; \" & vbNewLine & \"" + 
				"Please enter the number in in the text box below, and press OK.", "Choose a Connector", "");

			if(input != "1" && input != "2" && input != "3"){
				Session.Prompt("Please input a valid number",promptOK);
				addConnector(skosTag, theElement, newElement);
				return;
			}	
				
			if(input == "1"){
				con.Type = 'Generalization';	
			}
			else if(input == "2"){
				con.Type = 'Composition';
				con.SupplierEnd.Aggregation = 2;
			}
			else if(input == "3"){
				con.Type = 'Aggregation';
				con.SupplierEnd.Aggregation = 1;
			}
				
			con.SupplierID = theElement.ElementID;
			con.ClientID = tempElement.ElementID;
			
		}
	}
	else if(skosTag == 'broader concept'){
		//Check the type of connector, then check the direction of connector
		if(con.Type == 'Generalization' || con.Type == 'Composition' || con.Type == 'Aggregation'){
			if(con.ClientID == theElement.ElementID && con.SupplierID == tempElement.ElementID)
				return;
			else{
				if(Session.Prompt("The direction of connector between '" + theElement.Name + "' and '" + tempElement.Name + "' is inaccurate.\n" +
				"Do you want to change the direction of this connector?", promptOKCANCEL) == resultOK){
					con.ClientID = theElement.ElementID;
					con.SupplierID = tempElement.ElementID;
				}
			}
		}
		
		//If semantic relation is 'narrower' but the connector is not Generalization/Composition/Aggregation, system will notify user about it
		else{
			var vbe = new ActiveXObject("ScriptControl");
			var input = DLGInputBox("Which relationship connector do you want to add between '" + theElement.Name + "' and '" + newElement.Name + "'? \" & vbNewLine & \" " +
				"1: Generalization; \" & vbNewLine & \" 2: Composition; \" & vbNewLine & \" 3: Aggregation; \" & vbNewLine & \"" + 
				"Please enter the number in in the text box below, and press OK.", "Choose a Connector", "");
		
			if(input != "1" && input != "2" && input != "3"){
				Session.Prompt("Please input a valid number",promptOK);
				addConnector(skosTag, theElement, newElement);
				return;
			}
				
			if(input == "1"){
				con.Type = 'Generalization';	
			}
			else if(input == "2"){
				con.Type = 'Composition';
				con.SupplierEnd.Aggregation = 2;
			}
			else if(input == "3"){
				con.Type = 'Aggregation';
				con.SupplierEnd.Aggregation = 1;
			}
				
			con.ClientID = theElement.ElementID;
			con.SupplierID = tempElement.ElementID;
			
		}
	}
	
	con.Update();
	tempElement.Update();
	theElement.Update();
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
	
	// Get the currently selected package in the tree to work on
	var thePackage as EA.Package;
	thePackage = Repository.GetTreeSelectedPackage();
	
	// Get the currently selected diagram in the tree to work on
	var theDiagram as EA.Diagram;
	theDiagram = Repository.GetTreeSelectedObject();
	if(Repository.GetTreeSelectedItemType() != 8){
		Session.Prompt('Please select a Diagram', promptOK);
		return;
	}
	
	var elements as EA.Collection;
//	elements = thePackage.Elements;
	elements = theDiagram.DiagramObjects;
	var currentElement as EA.Element;
	var tags as EA.TaggedValue;
	
	//Go through all the elements in the diagram to check any relevent 
	for (var i = 0 ; i < elements.Count ; i++) {
		currentElement = Repository.GetElementByID(elements.GetAt(i).ElementID);
		Session.Output(currentElement.Name);
		for(var n = 0; n<currentElement.TaggedValues.Count; n++){
			tag = currentElement.TaggedValues.GetAt(n);
			checkConnector(thePackage, theDiagram, currentElement, tag, 'related concept', 'name');
			checkConnector(thePackage, theDiagram, currentElement, tag, 'narrower concept', 'name');
			checkConnector(thePackage, theDiagram, currentElement, tag, 'broader concept', 'name');
		}
	}
	
	if(thePackage.Update())
		Repository.RefreshOpenDiagrams(true);
	Session.Output('End');
}

main();