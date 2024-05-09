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
<div id="textBoK"></div>
```

In Javascript call the function visualizeBOKData(url, code).


- url : is the location BD
- code : concept code to navigate to (optional)


```javascript
import * as bok from '@eo4geo/find-in-bok-dataviz';
[...]

// will render the graphical view and the textual view from the current version in database
bok.visualizeBOKData('https://eo4geo-uji.firebaseio.com/', null); 

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