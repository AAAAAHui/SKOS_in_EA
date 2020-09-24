# SKOS_in_EA

## Introduction
These are Sparx System Enterprise Architect (EA) JScript Scripting. The propose of the project is to create connections between SKOS vocabularies and the EA application. Then the elements in information models that are developed by EA can be defined by SKOS thesaurus.

## About Scripts
The language of Scripting is JScript. If you cannot run the scripting (the Console/Debugger showed “Microsoft Process Debug Manager creation Failed: 0x80040154”), then please install the package called “scd10en” in the file.

## Import Scripts
Please open the EA, go with “Configure -> Transfer -> Import Reference Data -> Select File”. Then select the “SKOS+MIM_Project.xml” file, and click “Automation Scripts”, and click “Import”.

## Run Functions

### 1. Interpret Objecttypes
> * Have an Object type in the diagram
> * Input the keyword of the SKOS concept you are looking for in the “Properties -> Element -> Keywords” of that Object type
> * Select the **Object type ** from the “Browser -> Project”
> * Right click the **Object type**, and go to “Specialize -> Scripts -> Interpret Objecttypes”

### 2. Fill in Value Lists
> * Have an Enumeratie/Referentielijst/Codelijst in the diagram
> * Input the keyword of the SKOS concept you are looking for in the “Properties -> Element -> Keywords” of that Enumeratie/Referentielijst/Codelijst
> * Select the **Enumeratie/Referentielijst/Codelijst** from the “Browser -> Project”
> * Right click the **Enumeratie/Referentielijst/Codelijst**, and go to “Specilize -> Scripts -> Fill in Value Lists”

### 3. Recommend Missing Connectors
> * Have some Object types that have been through function 1 “Interpret Objecttypes”
> * Select the **Object type** from the “Browser -> Project”, which you want to check about any missing connectors that might attach with
> * Right click the **Object type**, and go to “Specialize -> Scripts -> Recommend Missing Connectors”

### 4. Check Missing Objecttypes
> * Have some Object types that have been through function 1 “Interpret Objecttypes”
> * Select the **Diagram** from the “Browser -> Project”, where you want to check any missing Object types happened
> * Right click the **Diagram**, and go to “Specialize -> Scripts -> Check Missing Objecttypes"

### 5. Check Inappropriate Connectors
> * Have some Object types that have been through function 1 “Interpret Objecttypes”, and connectors between them
> * Select the **Diagram** from the “Browser -> Project”, where you want to check any inappropriate happened
> * Right click the **Diagram**, and go to “Specialize -> Scripts -> Check Inappropriate Connectors"

## Change Parameters
Please go to the “Scripting -> Scripts -> Others -> Parameters”, and verify the parameters according to the comments in that script.
