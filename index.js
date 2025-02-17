const d3 = require("d3");
const firebase = require("./src/firebase.js");
const { parseBOKData } = require("./src/parseBOKData.js");

var svgId;
var textId;
var renderVersions;
var updateUrl;
var currentVersion;
var yearCurrentVersion;
var oldVersionMap;
var bok;
var codSelected;
var found;
const dataAndFunctions = function () {
  this.conceptNodeCollection = null;
  this.zoom = null;
  this.namehash = null;
  this.colorhash = null;
  this.nodes = null;
};
var isAnOldVersion;
var isAnObsoleteId;
// Array to store selected nodes
var selectedNodes = [];
var COLOR_STROKE_SELECTED = "black";

// Function for visualizing BoK data, taking URL and code as parameters
exports.visualizeBOKData = async function (inputObject) {

  // Setting Firebase URL
  await firebase.checkUrls(inputObject.urls);

  // IDs for SVG and text elements
  svgId = inputObject.svgId || '#bubbles';
  textId = inputObject.textId;

  // Variable to check if versions should be displayed
  renderVersions = inputObject.versions;

  // Variable to check if url should be updated with the concept id
  updateUrl = inputObject.updateUrl;

  // Fetching current version from Firebase
  currentVersion = await firebase.getCurrentVersion();

  // Fetching map with old versions (key) and their release year (value)
  if (renderVersions) {
    [yearCurrentVersion, oldVersionMap] = await Promise.all([
      firebase.getYearCurrentVersion(),
      firebase.getOldVersionsData()
    ]);
  }

  // Fetching BoK data for the current version
  bok = await firebase.getBokVersion("v" + currentVersion);

  // Variable to track the current concept code
  codSelected = inputObject.conceptId;

  // Variable to track if the code is found
  found = false;

  // Initial check if code is provided
  if (codSelected != null) {
    // Iterating through concepts in the current version to find the specified code
    Object.keys(bok['concepts']).forEach(currentBok => {
      if (bok['concepts'][currentBok].code === codSelected && !found) {
        // Displaying BoK data for the found concept
        exports.getBOKData(svgId, textId, bok, oldVersionMap, currentVersion, currentVersion, yearCurrentVersion, false, false);
        setTimeout(() => {
          // Browsing to the concept after displaying
          if (codSelected !== "" && codSelected !== "GIST") browseToConcept(codSelected);
        }, 1000);
        found = true;
      }
    });
    // If not found in the current version, search in older versions
    if (!found) {
      await searchInOldBok(currentVersion);
    }
  } else {
    // If no code provided, display BoK data for the current version
    exports.getBOKData(svgId, textId, bok, oldVersionMap, currentVersion, currentVersion, yearCurrentVersion, false, false);
  }
}

// Exported function to visualize BoK data
exports.getBOKData = function (svgId, textId, bok, oldVersionMap, version, currentVersion, yearCurrentVersion, isAnOldVersion_param, isAnObsoleteId_param) {
  isAnObsoleteId = isAnObsoleteId_param;
  isAnOldVersion = isAnOldVersion_param;
  // Handling data visualization using D3.js
  var svg = d3.select("div" + svgId)
    .append("svg")
    .attr("preserveAspectRatio", "xMinYMin meet")
    .attr("viewBox", "0 0 300 300")
    .classed("svg-content", true);

  var margin = 5,
    diameter = svg.node().getAttribute('viewBox').split(" ")[2],
    g = svg.append("g").attr("transform", "translate(" + diameter / 2 + "," + diameter / 2 + ")");

  var color = d3.scaleLinear()
    .domain([-1, 5])
    .range(["hsl(152,80%,80%)", "hsl(228,30%,40%)"])
    .interpolate(d3.interpolateHcl);

  var pack = d3.pack()
    .size([diameter - margin, diameter - margin])
    .padding(2);
  
  var bokData = parseBOKData(bok);

  dataAndFunctions.conceptNodeCollection = bokData.conceptNodeCollection;
  dataAndFunctions.namehash = bokData.namehash;
  dataAndFunctions.colorhash = bokData.colors;

  var root = d3.hierarchy(bokData.nodes)
    .sum(function (d) {
      return d.size;
    })
    .sort(function (a, b) {
      return b.value - a.value;
    });

  var focus = root,
    nodes = pack(root).descendants(),
    view;

  dataAndFunctions.nodes = nodes;

  var colorPalette = d3.scaleOrdinal(d3.schemeCategory10);

  var circle = g.selectAll("circle")
    .data(nodes)
    .enter().append("circle")
    .attr("r", function (d) {
      return d.r;
    })
    .attr("x", function (d) {
      return d.x;
    })
    .attr("y", function (d) {
      return d.y;
    })
    .attr("id", function (d) {
      return d.data.id;
    })
    .attr("class", function (d) {
      return d.parent ? d.children ? "node" : "node node--leaf" : "node node--root";
    })
    .style("fill", function (d) {
      if (d.depth == 1) {
        return dataAndFunctions.colorhash[d.data.nameShort.substring(0, 2)] ? dataAndFunctions.colorhash[d.data.nameShort.substring(0, 2)] : dataAndFunctions.colorhash['no'];
      } else if (d.depth == 2) {
        return dataAndFunctions.colorhash[d.parent.data.nameShort.substring(0, 2)] ? dataAndFunctions.colorhash[d.parent.data.nameShort.substring(0, 2)] : dataAndFunctions.colorhash['no'];
      } else if (d.depth == 3) {
        return dataAndFunctions.colorhash[d.parent.data.nameShort.substring(0, 2)] ? dataAndFunctions.colorhash[d.parent.data.nameShort.substring(0, 2)] : dataAndFunctions.colorhash['no'];
      } else if (d.depth >= 4) {
        return dataAndFunctions.colorhash[d.parent.parent.parent.data.nameShort.substring(0, 2)] ? dataAndFunctions.colorhash[d.parent.parent.parent.data.nameShort.substring(0, 2)] : dataAndFunctions.colorhash['no'];
      } else {
        return "turquoise";
      }
    }).style("fill-opacity", function (d) {
      if (d.depth >= 1) {
        return "0.5";
      } else {
        return "1";
      }
    }).attr("stroke", "black")
    .attr("stroke-width", "0.2px")
    .on("click", function (d) {
      if (focus !== d) {
        dataAndFunctions.zoom(d);
        codSelected = d.data.nameShort;
        exports.displayConcept(d);
      }
      d3.event.stopPropagation();
    })
    .on("mouseover", function (d) {
      if (this.style.stroke != COLOR_STROKE_SELECTED) this.style.strokeWidth = 1
    })
    .on("mouseleave", function (d) {
      if (this.style.stroke != COLOR_STROKE_SELECTED) this.style.strokeWidth = 0.2
    });

  var text = g.selectAll("text").data(nodes).enter().append("text").attr("class", "label").style("pointer-events", "none").style("fill-opacity", function (d) {
    return d.parent === root || (d === root && d.children == null) ? 1 : 0;
  })
    .style("display", function (d) {
      return d.parent === root || (d === root && d.children == null) ? "inline" : "none";
    })
    .style("font", '500 7px "Helvetica Neue", Helvetica, Arial, sans-serif')
    .style("font-size", function (d) {
      var textLengthFactor = Math.min(1, 30 / d.data.name.length);
      return (7 * textLengthFactor) + "px";
    })
    .each(function (d) { //This function inserts a label and adds linebreaks, avoiding lines > 13 characters
      var arr = d.data.name.split(" ");
      var arr2 = [];
      arr2[0] = arr[0];
      var maxLabelLength = 13;
      for (var i = 1, j = 0; i < arr.length; i++) {
        if (arr2[j].length + arr[i].length < maxLabelLength)
          arr2[j] += " " + arr[i];
        else {
          j++;
          arr2[j] = arr[i];
        }
      }
      for (var i = 0; i < arr2.length; i++) {
        d3.select(this).append("tspan").text(arr2[i]).attr("dy", i ? "1em" : (-0.5 * (j - 1)) + "em").attr("x", 0).attr("text-anchor", "middle").attr("class", "tspan" + i);
      }
    });


  var node = g.selectAll("circle,text");

  svg
    .style("background", "transparent")
    .on("click", function () {
      dataAndFunctions.zoom(root);
    });

  zoomTo([root.x, root.y, root.r * 2 + margin]);

  dataAndFunctions.zoom = function zoom(d) {
    var focus0 = focus;
    focus = d;

    var transition = d3.transition()
      .duration(d3.event && d3.event.altKey ? 7500 : 750)
      .tween("zoom", function (d) {
        var i = d3.interpolateZoom(view, [focus.x, focus.y, focus.r * 2 + margin]);
        return function (t) {
          zoomTo(i(t));
        };
      });

    transition.selectAll("text")
      .filter(function (d) {
        return d.parent === focus || this.style.display === "inline" || (d === focus && (d.children == null || d.children == []));
      })
      .style("fill-opacity", function (d) {
        return d.parent === focus || (d === focus && (d.children == null || d.children == [])) ? 1 : 0;
      })
      .on("start", function (d) {
        if (d.parent === focus || (d === focus && (d.children == null || d.children == [])))
          this.style.display = "inline";
      })
      .on("end", function (d) {
        if (d.parent !== focus && (d !== focus && (d.children == null || d.children == [])))
          this.style.display = "none";
      });
  }

  function zoomTo(v) {
    var k = diameter / v[2];
    view = v;
    node.attr("transform", function (d) {
      return "translate(" + (d.x - v[0]) * k + "," + (d.y - v[1]) * k + ")";
    });
    circle.attr("r", function (d) {
      return d.r * k;
    });

  }

  var nodeData = dataAndFunctions.conceptNodeCollection.getNodeByNameShort("GIST");

  //displays a list of textelements in HTML
  displayUnorderedList = function (array, propertyname, headline, domElement, idNode) {
    if (array != null && array.length != 0) {
      var text = "";
      text += "";
      text += "<h5>" + headline + " [" + array.length + "] </h5><div #" + idNode + " id=" + idNode + "><ul>";
      for (var i = 0, j = array.length; i < j; i++) {
        var nameShort;
        var value;
        if (propertyname != null) { //For Subconcepts and Demonstrable Skills and Source Documents
          value = array[i][propertyname];
          nameShort = array[i]['nameShort'];
        } else { //For Similar, Postrequisites and Prerequisites
          value = array[i];
          nameShort = array[i];
        }

        /* We attach the browseToConcept function to each subconcept of the list */
        if (headline == "Subconcepts") {
          text += "<a style='color: #007bff; font-weight: 400; cursor: pointer;' class='concept-name' id='sc-" + nameShort + "' onclick='browseToConcept(\"" + nameShort + "\")'>" + "[" + nameShort + "] " + value + "</a> <br>";
        } else if (headline == "Similar concepts" || headline == "Postrequisites" || headline == "Prequisites") {
          text += "<a style='color: #007bff; font-weight: 400; cursor: pointer;' class='concept-name' onclick='browseToConcept(\"" + nameShort + "\")'>" + value + "</a> <br>";
        } else if (headline == "Source documents") {
          if (value.length > 1) {
            text += "<li><a style='color: #007bff; font-weight: 400; cursor: pointer;' target='_blank' href='" + value + "'>" + nameShort + "</a></li>";
          } else {
            text += "<li><a>" + nameShort + "</a></li>";
          }
        } else if (headline == "Contributors") {
          if ( i == j-1 ) {
            text += "<a style='color: #007bff; font-weight: 400; cursor: pointer;' target='_blank' href='" + value + "'>" + nameShort + "</a> ";
          } else if (value.length > 1) {
            text += "<a style='color: #007bff; font-weight: 400; cursor: pointer;' target='_blank' href='" + value + "'>" + nameShort + "</a>, ";
          }  else{
            text += "<p>" + nameShort + "</p>, ";
          }
        } else if (headline == "Skills") {
          text += "<li>" + value + "</li>";
        } else {
          text += "<a>" + value + "</a> <br> ";
        }
      };
      text += "</ul></div>";
      domElement.innerHTML += text;
    }
  };

  //displays a list of textelements in HTML
  displayOrderedList = function (array, propertyname, headline, domElement, namehash, node) {
    if (array != null && array.length != 0) {
      // if children, sort them
      if (array[0].nameShort != null) {
        array.sort(function (a, b) {
          if (a.nameShort > b.nameShort) {
            return 1;
          }
          if (a.nameShort < b.nameShort) {
            return -1;
          }
          // a must be equal to b
          return 0;
        });
      }
      var text = "";
      text += "";
      text += "<h5>" + headline + " [" + array.length + "] </h5><div><ul>";
      for (var i = 0, j = array.length; i < j; i++) {
        var nameShort;
        var value;
        if (propertyname != null) { //For Subconcepts and Demonstrable Skills
          value = array[i][propertyname];
          nameShort = array[i]['nameShort'];
        } else { //For Similar, Postrequisites and Prerequisites
          value = array[i];
          nameShort = array[i]['nameShort'];
        }
        if (namehash != null) {
          value = namehash[value];
        }

        /* We attach the browseToConcept function to each subconcept of the list */
        if (headline == "Subconcepts") {
          text += "<a style='color: #007bff; font-weight: 400; cursor: pointer;' class='concept-name' id='sc-" + nameShort + "' onclick='browseToConcept(\"" + nameShort + "\")'>[" + nameShort + '] ' + array[i][propertyname] + "</a> <br>";
        } else if (headline == "Similar concepts" || headline == "Postrequisites" || headline == "Prequisites") {
          text += "<a style='color: #007bff; font-weight: 400; cursor: pointer;' class='concept-name' id='sc-" + nameShort + "' onclick='browseToConcept(\"" + nameShort + "\")'>[" + nameShort + '] ' + array[i].name + "</a> <br>";
        } else {
          text += "<a>" + value + "</a> <br>";
        }
      };
      text += "</ul></div>";
      domElement.innerHTML += text;
    } //else
    //	domElement.innerHTML = "";
  };

  // Function to load data for an older version of the BoK
  loadOldBokEvent = async function (version, code) {
    const mainNode = document.getElementById('bubbles');
    mainNode.innerHTML = "";
    const data = await firebase.getBokVersion("v" + version);
    const versionsData = await firebase.getOldVersionsData();
    // Display data for the older version
    let oldVersionFlag = true;
    if (version == currentVersion) oldVersionFlag = false;
    exports.getBOKData(svgId, textId, data, versionsData, version, currentVersion, yearCurrentVersion, false, oldVersionFlag);
    setTimeout(() => {
      // Browsing to the concept after displaying
      if (code !== "" && code !== "GIST") browseToConcept(code);
    }, 1000);
  }

  // Function to search and display older versions
  searchOldVersions = function (domElement) {
    // Sorting the keys of oldVersionMap
    let orderedKeys = Array.from(oldVersionMap.keys()).sort((a, b) => {
      return parseInt(b.slice(1)) - parseInt(a.slice(1)); 
    });

    orderedKeys.forEach(clave => {
      var vers = parseInt(clave.charAt(clave.length - 1));
      if (version < vers) {
        // Adding link for older versions before the current version
        let lastChild = domElement.querySelector('#oldVersions p');
        let nodeToAdd = domElement.querySelector('#oldVersions');
        let newNode = document.createElement("li");
        newNode.style = 'list-style-type:none; text-indent: 2em;';
        newNode.innerHTML = "<a style='color: #007bff; font-weight: 400; cursor: pointer; text-indent: 2em;' id='oldVersionLink' onClick='loadOldBokEvent(" + vers +", \"" + codSelected  +"\")'> - version " + vers + ".0 (" + oldVersionMap.get(clave) + ")</a>";
        nodeToAdd.insertBefore(newNode, lastChild);
      } else if (version > vers) {
        // Adding link for older versions after the current version
        domElement.innerHTML += "<li style='list-style-type:none; text-indent: 2em;'><a style='color: #007bff; font-weight: 400; cursor: pointer; text-indent: 2em;' id='oldVersionLink' onClick='loadOldBokEvent(" + vers +", \"" + codSelected  +"\")''> - version " + vers + ".0 (" + oldVersionMap.get(clave) + ")</a></li>";
      }
    });
  }

  // Function to display versions and handle warnings for current version, old versions, and obsolete concepts
  displayVersions = function (code, domElement, cVersion, year) {
    let textCurrent = "";
    let currentLink = "";
    let yearToshow = year;
    if (cVersion == currentVersion) {
      textCurrent = '(Current Bok Version)';
      yearToshow = yearCurrentVersion;
    } else if (isAnOldVersion) {
      // Displaying warning for an obsolete concept
      currentLink = "<a style='color: red; font-weight: normal; cursor: pointer; text-decoration: underline;' onClick='loadOldBokEvent(" + currentVersion +", \"\")' > the current version of the BoK </a>"
      textCurrent = '- <span style="color: red; font-weight: normal;">warning: this is an obsolete BoK concept - this concept is no longer present in ' + currentLink + '</span>';
    } else {
      // Displaying warning for an old version
      textCurrent = '- <span style="color: orange; font-weight: normal;">warning: this is old version of this BoK concept; more recent versions are listed above</span>';;
    }
    let currentCod = document.getElementById('boktitle').textContent.split(']')[0].replace('[', '');

    // Generating HTML for displaying version information
    var text = "";
    text += "";
    text += '<h5>Versioning </h5><div id="oldVersions" style="text-indent: 2em;">';
    if (currentCod == 'GIST') currentCod = '';
    if (isAnObsoleteId) text += "- <a style='color: #007bff; font-weight: 400; cursor: pointer; text-indent: 2em;' onClick='loadOldBokEvent(" + currentVersion +", \"" + currentCod  +"\")'>version " + currentVersion + ".0 (" + yearCurrentVersion + ") (Current Bok Version)</a>";
    text += '<p style="font-weight: bold;" >&rarr; You are viewing: version ' + cVersion + '.0 (' + yearToshow + ') ' + textCurrent + ' </p>';
    text += '</div>';
    domElement.innerHTML += text;
    searchOldVersions(domElement);
  }

  //displays all available content for the currently focussed concept in the description box:
  exports.displayConcept = function (d) {
    if (textId != null) {

      if (textId[0] == "#")
        textId = textId.split("#")[1];

      var oldD = d;
      if (d && d.data)
        d = d.data;

      var mainNode = document.getElementById(textId)
      mainNode.innerHTML = "";

      // Creating title node
      var titleNode = document.createElement("h4");
      titleNode.id = "boktitle";
      titleNode.innerHTML = "[" + d.nameShort + "] " + d.name; //display Name and shortcode of concept:
      titleNode.style="margin-bottom: 0px;";
      var pNode = document.createElement("p");
      pNode.innerHTML = "Permalink: <a href= 'https://bok.eo4geo.eu/" + d.nameShort + "'> https://bok.eo4geo.eu/" + d.nameShort + "</a>";
      mainNode.appendChild(pNode);
      mainNode.appendChild(titleNode);

      // Displaying status
      if ( d.selfAssesment ){
        var statusNode = document.createElement("div");
        statusNode.innerHTML=d.selfAssesment;
        let statusText = document.createElement("div");
        statusText.innerHTML= 'Status: ' + statusNode.innerText;
        statusText.style="margin-bottom: 10px;";
        mainNode.appendChild(statusText);
      }
      
      // Displaying warning for obsolete concepts or old versions
      if (isAnOldVersion) {
        const obsNode = document.createElement('p');
        let textObs = '';
        let currentLink = "<a style='color: red; font-weight: normal; cursor: pointer; text-decoration: underline;' onClick='loadOldBokEvent(" + currentVersion +", \"\")'> the current version of the BoK </a>"
        textObs += '<span style="color: red; font-weight: normal;">warning: this is an obsolete BoK concept - this concept is no longer present in ' + currentLink + '</span>';
        obsNode.innerHTML = textObs;
        mainNode.appendChild(obsNode);

      } else if (isAnObsoleteId) {
        const obsNode = document.createElement('p');
        let textObs = '';
        textObs += '<span style="color: orange; font-weight: normal;">warning: this is old version of this BoK concept; see “\Versioning”\ below for more recent version(s)</span>';
        obsNode.innerHTML = textObs;
        mainNode.appendChild(obsNode);
      }
      //display description of concept.
      var descriptionNode = document.createElement("div");
      if (d.description != null) {
        var timeFormat = "";
        if (d.timestamp != null && d.timestamp != "")
          timeFormat = "<small> Last Updated: " + new Date(d.timestamp).toUTCString() + " </small><br>";
        var headline = "<h5>Description:</h5>";
        var currentTxt = "<div id='currentDescription' class='hideContent'>" + d.description + "</div><br>";
        descriptionNode.innerHTML = timeFormat + headline + currentTxt;
      } else
        descriptionNode.innerHTML = "";

      mainNode.appendChild(descriptionNode);
      var infoNode = document.createElement("div");

      // Display hierarchy of parent concepts in a definition list:
      if (d.parent != null) {
        parents = [];
        let cont = 1;
        //trace all parents upwards from the hierarchy
        for (var p = d.parent; p != null; p = p.parent) {
          parents.push(p);
        }
        if ( d.otherParents.length > 0) cont = cont + d.otherParents.length;
        var tab = "";
        var text = "<h5>Superconcepts [" + cont + "] </h5><div><dl>";
        var parent = parents.pop();
        /* We attach the browseToConcept function in order to be able to browse to SuperConcepts
        from the concept's list browser of the right */
        text += "<a class='concept-name' style='color: #007bff; font-weight: 400; cursor: pointer;' onclick='browseToConcept(\"" + parent.nameShort + "\")'><b>-</b> " + parent.name + "</a>";
        tab += "";
        while (parents.length > 0) {
          parent = parents.pop();
          text += "<dd style='margin: 0 0 1.5em 0.8em'><dl><dt style='color: #007bff; font-weight: 400; cursor: pointer;' class='concept-name' onclick='browseToConcept(\"" + parent.nameShort + "\")'><b>-</b> " + "[" + parent.nameShort + "] " + parent.name + "</dt>";
          tab += "</dl></dd>";
        }
        text += tab + "</dl></div>";

        infoNode.innerHTML = text;
      } else
        infoNode.innerHTML = "";

      if ( d.otherParents.length > 0  ) {
        for ( let i = 0; i < d.otherParents.length ; i++ ){
          let otherPar = [];
          let op = d.otherParents[i];
          while ( op != null ) {
            otherPar.push(op);
            op = op.parent
          }
          var other = otherPar.pop();
          var text = "<div><dl>";
          /* We attach the browseToConcept function in order to be able to browse to SuperConcepts
          from the concept's list browser of the right */
          text += "<a class='concept-name' style='color: #007bff; font-weight: 400; cursor: pointer;' onclick='browseToConcept(" + other.nameShort + ")'><b>-</b> " + other.name + "</a>";
          tab += "";
          while (otherPar.length > 0) {
            other = otherPar.pop();
            text += "<dd style='margin: 0 0 1.5em 0.8em'><dl><dt style='color: #007bff; font-weight: 400; cursor: pointer;' class='concept-name' onclick='browseToConcept(\"" + other.nameShort + "\")'><b>-</b> " + "[" + other.nameShort + "] " + other.name + "</dt>";
            tab += "</dl></dd>";
          }
          text += tab + "</dl></div>";
          infoNode.innerHTML += text;
        }
      }

      //display concept in url
      if (updateUrl) window.history.pushState("object or string", "Find In Bok", "/" + d.nameShort);

      //display description of subconcepts (if any):
      displayOrderedList(d.children, "name", "Subconcepts", infoNode, "boksubconcepts");

      //display description of prerequisites (if any):
      displayOrderedList(d.prerequisites, null, "Prequisites", infoNode, "bokprequisites");

      //display description of postrequisites (if any):
      displayOrderedList(d.postrequisites, null, "Postrequisites", infoNode, "bokpostrequisites");

      //display description of similar concepts (if any):
      displayOrderedList(d.similarConcepts, null, "Similar concepts", infoNode, "boksimilar");

      //display description of demonstrable skills (if any):
      displayUnorderedList(d.demonstrableSkills, "description", "Skills", infoNode, "bokskills");

      //display contributors of concept (if any):
      displayUnorderedList(d.contributors, "url", "Contributors", infoNode, "bokcontributors");

      //display source documents of concept (if any):
      displayUnorderedList(d.sourceDocuments, "url", "Source documents", infoNode, "boksource");

      if(renderVersions) displayVersions(d.nameShort, infoNode, version, bok.creationYear);

      mainNode.appendChild(infoNode);

    }
  };

  exports.displayConcept(nodeData);

  browseToConcept = function (nameShort) {
    exports.browseToConcept(nameShort)
  }
}

// Function to browse to a concept
exports.browseToConcept = function (nameShort) {
  var node = null;
  codSelected = nameShort;
  dataAndFunctions.nodes.forEach(n => {
    if (n.data.nameShort == nameShort) {
      node = n;
      return;
    }
  });
  if (node != null) {
    var nodeData = dataAndFunctions.conceptNodeCollection.getNodeByNameShort(nameShort);
    exports.displayConcept(nodeData);
    dataAndFunctions.zoom(node);
  }
  if (isAnOldVersion) {
    isAnObsoleteId = true;
    isAnOldVersion = false;
  }
}

// Function to search for a concept in the BoK and highlight it
exports.searchInBoK = function (string, searchCode, searchName, searchDes, searchSkills) {
  exports.cleanSearchInBOK();

  searchInputFieldDoc = string.trim();

  if (searchInputFieldDoc != "" && searchInputFieldDoc != " ") {
    selectedNodes = dataAndFunctions.conceptNodeCollection.getNodesIdByKeyword(searchInputFieldDoc, searchCode, searchName, searchDes, searchSkills);
    //highlight search
    for (var i = 0; i < selectedNodes.length; i++) {
      var circle = document.getElementById(selectedNodes[i]);
      if (circle != null) {
        circle.style.stroke = COLOR_STROKE_SELECTED;
        circle.style.strokeWidth = "2px";
      }
    }
  }
  return dataAndFunctions.conceptNodeCollection.getNodesByKeyword(searchInputFieldDoc, searchCode, searchName, searchDes, searchSkills);
}

// Function to clean search highlighting
exports.cleanSearchInBOK = function (d) {
  for (var i = 0; i < selectedNodes.length; i++) {
    var circle = document.getElementById(selectedNodes[i]);
    if (circle != null) {
      circle.style.stroke = "";
      circle.style.strokeWidth = "";
    }
  }
  selectedNodes = [];
}

// Function to recursively search for concept in older versions of BoK
searchInOldBok = async function (version) {
  let foundInOld = false;
  const oldVersion = version - 1;
  const svgId = '#bubbles';
  const textId = '#textInfo';
  const bok = await firebase.getBokVersion("v" + version);
  const oldVersionMap = await firebase.getOldVersionsData();
  const currentVersion = await firebase.getCurrentVersion();
  const yearCurrentVersion = await firebase.getYearCurrentVersion();

  // Recursive call to search in older version if not found in current version
  if (bok) {
    Object.keys(bok['concepts']).forEach(oldBokKey => {
      if (bok['concepts'][oldBokKey].code === codSelected) {
        // Displaying BoK data for the found concept
        exports.getBOKData(svgId, textId, bok, oldVersionMap, version, currentVersion, yearCurrentVersion, true, true);
        setTimeout(() => {
          // Browsing to the concept after displaying
          if (codSelected !== "" && codSelected !== "GIST") browseToConcept(codSelected);
        }, 1000);
        foundInOld = true;
      }
    });
    if (!foundInOld) {
      // If not found in the current version, search in older versions recursively
      await searchInOldBok(oldVersion);
    }
  }
}