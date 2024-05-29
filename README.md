# EO4GEO-bok-dataviz-v3

EO4GEO-bok-dataviz-v3 is an script to parse a json-ld file and visualize it in a circle packing d3 layout.

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

Create an object with the necessary fields. Below is an example of how to structure this object:

```javascript
const inputObject = {
  svgId: '#bubbles',            // The ID of the SVG element where the visualization will be rendered
  textId: '#textInfo',          // The ID of the text element where information will be displayed
  urls: environment.URL_ARRAY,  // An array of URLs containing the data to be visualized
  conceptId: id,                // The ID of the concept to visualize (optional)
  versions: true,               // A boolean indicating whether to include versions in the visualization (optional)
  updateUrl: true               // A boolean indicating if url should be updated with the concept id (optional)
};
```

In Javascript call the function visualizeBOKData(paramsObject).


```javascript
import * as bok from '@eo4geo/find-in-bok-dataviz';
[...]

const inputObject = {
  svgId: '#bubbles',
  textId: '#textInfo',
  urls: environment.URL_ARRAY,
  conceptId: id,
  versions: true,
  updateUrl: true
};

// will render the graphical view and the textual view from the current version in database
bok.visualizeBOKData(inputObject);

```

### Other functions

```javascript
import * as bok from '@eo4geo/find-in-bok-dataviz';
[...]

selectedNodes = bok.searchInBoK(searchText); // returns an array of concepts matching the searchText string

bok.browseToConcept(conceptShortName); // navigates to the concept specified

bok.cleanSearchInBOK(); // clean search highlighting

// Examples
selectedNodes = bok.searchInBoK('Analytics');
bok.browseToConcept('GIST'); // navigates to root concept
bok.browseToConcept('AM'); // navigates to Analytical Methods concept
bok.cleanSearchInBOK();

```