!INC Local Scripts.EAConstants-JScript
!INC EAScriptLib.JScript-Dialog
!INC Others.Parameters
!INC Others.Json

//For each Object types in the diagram, to compare if there is any other object types in the diagram should be connected with but still not
function compare(thePackage, theDiagram, currentElement, tag, skosTag1, skosTag2){
	var j = 0;
	if(tag.Name.indexOf(skosTag1) != -1 && tag.Name.indexOf(skosTag2) != -1){
		while(j < theDiagram.DiagramObjects.Count) {
			var tempElement as EA.Element;
			tempElement = Repository.GetElementByID(theDiagram.DiagramObjects.GetAt(j).ElementID);
			var tempTag as EA.TaggedValue;
			tempTag = tempElement.TaggedValues.GetByName(mimTagSKOSPref);
			if(tempElement.Name == tag.Value || (tempTag != null && tempTag.Value == tag.Value) )
				break;
			else
				j++; 
		}
		if(j == theDiagram.DiagramObjects.Count){
			if(Session.Prompt("Possible missing Object type '" + tag.Value + "' that can attach with Object type '" + currentElement.Name + "'", promptOKCANCEL)  == resultOK){
				addElement(thePackage, theDiagram, tag, skosTag1, currentElement);
				return;
			}
		}	
	}
}

//Add Object types in the diagram
function addElement(thePackage, theDiagram, tag, skosTag, currentElement){
	// Create an element (which will be added to the diagram later on)
	var newElement as EA.Element;
	newElement = thePackage.Elements.AddNew(tag.Value, "Class");
	newElement.Stereotype = "MIM::Objecttype";
	newElement.Tag = newElement.Name;
	newElement.Update();
//	Session.Output(newElement.FQStereotype);
//	Session.Output(newElement.SynchConstraints("MIM", "Objecttype"));
//	Session.Output(newElement.SynchTaggedValues("MIM", "Objecttype"));
	var newTag as EA.TaggedValue;
	newTag = newElement.TaggedValues.GetAt(0);	//This is a small bug, that the element cannot get the tag "Begrip" by its name, only can be located by index.
//	newTag = newElement.TaggedValues.GetByName(mimTagSKOSPref);
//	newTag = newElement.TaggedValues.GetByName("Begrip");
	newTag.Value = tag.Value;
	newTag.Update();
	newElement.Update();
	
	// Get the elements of the diagram
	var diagramObjects as EA.Collection;
	diagramObjects = theDiagram.DiagramObjects;
	
	// Add the diagram element to the diagram, and 
	var newDiagramObject as EA.DiagramObject;
//	newDiagramObject = diagramObjects.AddNew("l=200;r=250" + r + ";t=200;b=250" + r + ";", "" );
	newDiagramObject = diagramObjects.AddNew("l=200;r=200;t=200;b=200;", "" );
	newDiagramObject.ElementID = newElement.ElementID;
	newDiagramObject.Update();
//	r = r + 50;
//	Session.Output(r);
	
	Session.Output( "Added element '" + newElement.Name + "' to diagram '" + theDiagram.Name + "'" );
	
	addConnector(skosTag, currentElement, newElement);
	
	if(theDiagram.Update())
		Repository.RefreshOpenDiagrams(true);
}

//Add connectors to the diagram
//The type and direction depend on the Semantic Relation between two Object types
function addConnector(skosTag, currentElement, newElement){
	var con as EA.Connector;
	if(skosTag == 'related concept'){
//		if(Session.Prompt("Which relationship connector do you want to add between '" + currentElement.Name + "' and '" + newElement.Name + "'?\n" +
//			"1: Association; \n Please press OK and then the 'Association' connector will be added.", promptOKCANCEL) == resultOK){
				
//			if(Session.Input("Enter the number of connector:") == "1"){
				con = currentElement.Connectors.AddNew('','Association');
				con.Direction = 'Unspecified';
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
	for ( var i = 0 ; i < elements.Count ; i++ ) {
		currentElement = Repository.GetElementByID(elements.GetAt(i).ElementID);
		Session.Output(currentElement.Name);
		for(var n = 0; n<currentElement.TaggedValues.Count; n++){
			tags = currentElement.TaggedValues.GetAt(n);
			compare(thePackage, theDiagram, currentElement, tags, 'related concept', 'name');
			compare(thePackage, theDiagram, currentElement, tags, 'narrower concept', 'name');
			compare(thePackage, theDiagram, currentElement, tags, 'broader concept', 'name');
		}
	}
	
	if(theDiagram.Update())
		Repository.RefreshOpenDiagrams(true);
	Session.Output('End');
}

main();