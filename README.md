# EO4GEO-bok-dataviz-v2

EO4GEO-bok-dataviz-v2 is an script to parse a json-ld file and visualize it in a circle packing d3 layout.

## Installation

Using npm: 

```bash
npm i @eo4geo/find-in-bok-dataviz
```

## Usage

Place a div and give it an id.
If you want to show also the textual information, place a div and give it an id.

```html
<div id="bubbles"> </div>
<div id="textInfo"></div>
```

In Javascript call the function visualizeBOKData(svgId, textId, bok, oldVersionMap, version, currentVersion, yearCurrentVersion, isAnOldVersion, isAnObsoleteId).


- svgID : is the id you gave to the element in the HTML you want to display the graph.
- textID : is the id you gave to the div for the textual information.
- bok :
- version : the number of the version you want to display.
- currentVersion : the number of the current version from database.
- yearCurrentVersion : the date on which the last version was created.
- isAnOldVersion : boolean indicating if the concept to be visited is deprecated (this is no longer found in the new versions).
- isAnObsoleteId : boolean indicating that you are visiting a concept in an older version of bok.


```javascript
import * as bok from '@eo4geo/find-in-bok-dataviz';
[...]

// will render the graphical view and the textual view from the version 1 in database
bok.visualizeBOKData('#bubbles', '#textBoK', data, versionsData, 1, this.currentVersion, this.currentYear, false, true); 

```

### Other functions

```javascript
import * as bok from '@eo4geo/find-in-bok-dataviz';
[...]

selectedNodes = bok.searchInBoK(searchText); // returns an array of concepts matching the searchText string

bok.browseToConcept(conceptShortName); // navigates to the concept specified

// Examples
selectedNodes = bok.searchInBoK('Analytics');
bok.browseToConcept('GIST'); // navigates to root concept
bok.browseToConcept('AM'); // navigates to Analytical Methods concept

```

In addition to the previous features, to allow loading previous versions of the BOK by clicking on the versioning links the library emits an event called "loadOldBokEvent”.
This event should be caught by a Listener to trigger the desired actions.

The event "loadOldBokEvent" is of the CustomEvent type and provides the following information:

- version : the number of the version you want to display
- code : The concept code

```json
{
      detail: {
        version: version,
        code: code
      }
    }
```


