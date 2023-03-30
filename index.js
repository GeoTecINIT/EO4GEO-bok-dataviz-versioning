import * as d3 from "d3";

var Relationtype = {
  SIMILAR: "similarTo",
  PREREQUISITE: "prerequisites",
  POSTREQUISITE: "postrequisites",
  BROADER: "broader",
  NARROWER: "narrower",
  DEMONSTRATES: "demonstrates",
  SUBCONCEPT: "is subconcept of",
  SIMILARTO: "is similar to",
  PREREQUISITEOF: "is prerequisite of"
};

const TEMPLATE_IdGraph = 'graph';
const TEMPLATE_IdText = 'textInfo';

export function parseBOKData(bokJSON) {
  // loop all nodes
  var allNodes = [];


  bokJSON.concepts.forEach((n, index) => {
    var node = {
      name: n.name,
      code: n.code,
      description: n.description,
      selfAssesment: n.selfAssesment,
      uri: n.uri,
      id: index,
      value: 1,
      children: [],
      parents: [],
      demonstrableSkills: [],
      contributors: [],
      sourceDocuments: []
    };
    allNodes.push(node);
  });

  // add children
  bokJSON.relations.forEach(r => {
    if (r.name === Relationtype.SUBCONCEPT) {
      if (!allNodes[r.target].children.includes(allNodes[r.source]))
        allNodes[r.target].children.push(allNodes[r.source]);
    }
  });

  // add skills
  bokJSON.skills.forEach(skill => {
    skill.concepts.forEach(skillconcept => {
      allNodes[skillconcept].demonstrableSkills.push(skill.name);
    });
  });

  // add contributors
  bokJSON.contributors.forEach(con => {
    con.concepts.forEach(c => {
      allNodes[c].contributors.push({
        name: con.name,
        description: con.description,
        url: con.url
      });
    });
  });

  // add source documents
  bokJSON.references.forEach(ref => {
    ref.concepts.forEach(c => {
      allNodes[c].sourceDocuments.push({
        name: ref.name,
        description: ref.description,
        url: ref.url
      });
    });
  });

  // TODO: Avoid circular dependencies - keep only 3 levels
  allNodes[0].children.forEach(ch => {
    ch.children.forEach(ch1 => {
      ch1.children.forEach(ch2 => {
        ch2.children = [];
      })
    })
  });

  // return clean root
  return allNodes[0];
}


export function browseToConcept(code) {

  var node = d3.select('#sc-' + code);
  displayConcept(node);
}

window.browseToConcept = browseToConcept;

export function visualizeBOKData(url) {

  d3.json(url + '.json ').then((bok, error) => {
    // Parse current version of BoK
    var bokData = parseBOKData(bok.current);
    if (error) throw error;

    var width = 932;
    var height = width;

    const COLOR_STROKE_SELECTED = 'grey';

    var pack = data => d3.pack()
      .size([width, height])
      .padding(3)
      (d3.hierarchy(bokData)
        .sum(d => d.value)
        .sort((a, b) => b.value - a.value));

    var color = d3.scaleLinear()
      .domain([0, 5])
      .range(["hsl(152,80%,80%)", "hsl(228,30%,40%)"])
      .interpolate(d3.interpolateHcl);

    var root = pack(bokData);

    let focus = root;
    let view;

    const svg = d3.select('#' + TEMPLATE_IdGraph)
      .append("svg")
      .attr("viewBox", `-${width / 2} -${height / 2} ${width} ${height}`)
      .style("display", "block")
      .style("margin", "0 -14px")
      .style("background", color(0))
      .style("cursor", "pointer")
      .on("click", (event) => zoom(event, root));

    const node = svg.append("g")
      .selectAll("circle")
      .data(root.descendants().slice(1))
      .join("circle")
      .attr("fill", d => d.children ? color(d.depth) : "white")
      .attr("stroke", "black")
      .attr("stroke-width", "0.2px")
      // .attr("pointer-events", d => !d.children ? "none" : null)
      .on("click", (event, d) => {
        if (focus !== d) {
          event.currentTarget.style.stroke = COLOR_STROKE_SELECTED;
          zoom(event, d);
          displayConcept(d);
        }
        event.stopPropagation();
      })
      .on("mouseover", function (d) {
        if (this.style.stroke != COLOR_STROKE_SELECTED) this.style.strokeWidth = 1
      })
      .on("mouseleave", function (d) {
        if (this.style.stroke != COLOR_STROKE_SELECTED) this.style.strokeWidth = 0.2
      });;

    const label = svg.append("g")
      .style("font", "12px sans-serif")
      .attr("pointer-events", "none")
      .attr("text-anchor", "middle")
      .selectAll("text")
      .data(root.descendants())
      .join("text")
      .style("fill-opacity", d => d.parent === root ? 1 : 0)
      .style("display", d => d.parent === root ? "inline" : "none")
      .each(function (d) { //This function inserts a label and adds linebreaks, avoiding lines > 13 characters
        var arr = d.data.name.split(' '),
          maxLabelLength = 13,
          final = [arr[0]];
        for (var i = 1, j = 0; i < arr.length; i++) {
          (final[j].length + arr[i].length < maxLabelLength) ? final[j] += ' ' + arr[i]: (j++, final[j] = arr[i]);
        }
        final.forEach((t, i) => d3.select(this).append('tspan').text(t).attr('dy', i ? '1em' : -0.5 * (j - 1) + 'em').attr('x', 0).attr('text-anchor', 'middle').attr('class', 'tspan' + i));
      })

    zoomTo([root.x, root.y, root.r * 2]);

    function zoomTo(v) {
      const k = width / v[2];
      view = v;

      label.attr("transform", d => `translate(${(d.x - v[0]) * k},${(d.y - v[1]) * k})`);
      node.attr("transform", d => `translate(${(d.x - v[0]) * k},${(d.y - v[1]) * k})`);
      node.attr("r", d => d.r * k);
    }

    function zoom(event, d) {
      const focus0 = focus;

      focus = d;

      const transition = svg.transition()
        .duration(event.altKey ? 7500 : 750)
        .tween("zoom", d => {
          const i = d3.interpolateZoom(view, [focus.x, focus.y, focus.r * 2]);
          return t => zoomTo(i(t));
        });

      label
        .filter(function (d) {
          return d.parent === focus || this.style.display === "inline";
        })
        .transition(transition)
        .style("fill-opacity", d => d.parent === focus ? 1 : 0)
        .on("start", function (d) {
          if (d.parent === focus) this.style.display = "inline";
        })
        .on("end", function (d) {
          if (d.parent !== focus) this.style.display = "none";
        });
    }
  });

  /*   function searchInBoK(string, searchCode, searchName, searchDes, searchSkills) {
      cleanSearchInBOK();

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

    function cleanSearchInBOK(d) {
      //clean search
      for (var i = 0; i < selectedNodes.length; i++) {
        var circle = document.getElementById(selectedNodes[i]);
        if (circle != null) {
          circle.style.stroke = "";
          circle.style.strokeWidth = "";
        }
      }
      selectedNodes = [];
    }

    function searchInBoKAndWriteResults(string) {
      var results = searchInBoK(string);

    } */
}

//displays all available content for the currently focussed concept in the description box:
export function displayConcept(d) {

  var mainNode = document.getElementById(TEMPLATE_IdText)
  mainNode.innerHTML = "";

  var titleNode = document.createElement("h1");
  titleNode.id = "boktitle";
  // titleNode.attributes = "#boktitle";
  titleNode.innerHTML = "[" + d.data.code + "] " + d.data.name; //display Name and shortcode of concept:
  // titleNode.style = "margin-bottom: 0px;";

  //   window.history.pushState({}, "Find In Bok", "/" + d.data.code);

  // var pNode = document.createElement("p");
  //  pNode.innerHTML = "Permalink: <a href= 'https://bok.eo4geo.eu/" + d.code + "'> https://bok.eo4geo.eu/" + d.code + "</a>";
  //  mainNode.appendChild(pNode);

  mainNode.appendChild(titleNode);
  if (d.data.selfAssesment) {
    var statusNode = document.createElement("div");
    statusNode.innerHTML = d.data.selfAssesment;
    let statusText = document.createElement("div");
    statusText.innerHTML = 'Status: ' + statusNode.innerText;
    statusText.style = "margin-bottom: 10px;";
    mainNode.appendChild(statusText);
  }

  //display description of concept
  var descriptionNode = document.createElement("div");
  if (d.data.description != null) {
    var headline = "<h2>Description:</h2>";
    var currentTxt = "<div id='bokCurrentDescription'>" + d.data.description + "</div><br>";
    descriptionNode.innerHTML = headline + currentTxt;
  } else
    descriptionNode.innerHTML = "";

  mainNode.appendChild(descriptionNode);

  if (d.parent != null) {
    var parentNode = document.createElement("div");
    parentNode.innerHTML = `<h2>Superconcept:</h2><div id='bokParentNode'><a style='color: #007bff; font-weight: 400; cursor: pointer;' class='concept-name' id='sc-${d.data.code}' onclick='browseToConcept(\"${d.data.code}\")'>[${d.data.code}] ${d.data.name}</a> </div><br>`;
    mainNode.appendChild(parentNode);
  }

  var infoNode = document.createElement("div");

  //display subconcepts (if any):
  d.children && d.children.length > 0 ? displayChildren(d.children, infoNode, "Subconcepts") : null;

  d.data.demonstrableSkills && d.data.demonstrableSkills.length > 0 ? displayTextList(d.data.demonstrableSkills, infoNode, "Skills") : null;

  d.data.contributors && d.data.contributors.length > 0 ? displayLinksList(d.data.contributors, infoNode, "Contributors") : null;
  d.data.sourceDocuments && d.data.sourceDocuments.length > 0 ? displayLinksList(d.data.sourceDocuments, infoNode, "Source Documents") : null;

  //  displayVersions(d.nameShort, infoNode, numVersion, yearVersion);

  mainNode.appendChild(infoNode);

};

//displays a list of nodes such as children
export function displayChildren(array, domElement, headline) {

  array.sort((a, b) => a.data.code.localeCompare(b.data.code));

  var text = "<h2>" + headline + " [" + array.length + "] </h2><div><ul>";
  array.forEach(c => {
    text += "<a style='color: #007bff; font-weight: 400; cursor: pointer;' class='concept-name' id='sc-" + c.data.code + "' onclick='browseToConcept(\"" + c.data.code + "\")'>[" + c.data.code + '] ' + c.data.name + "</a> <br>";
  });

  text += "</ul></div>";
  domElement.innerHTML += text;
};

// displays links such as contributors and sourceDocuments
export function displayLinksList(array, domElement, headline) {

  var text = "<h2>" + headline + " [" + array.length + "] </h2><div><ul>";
  array.forEach(l => {
    text += "<a style='color: #007bff; font-weight: 400; cursor: pointer;' class='concept-name' href='" + l.url + "' target='_blank' >" + l.name + "</a> <br>";
  });

  text += "</ul></div>";
  domElement.innerHTML += text;
};

// displays list such as skills
export function displayTextList(array, domElement, headline) {

  var text = "<h2>" + headline + " [" + array.length + "] </h2><div><ul>";
  array.forEach(l => {
    text += "<li>" + l + "</li>";
  });

  text += "</ul></div>";
  domElement.innerHTML += text;
};

/* export function browseToConcept(code) {

  var node = d3.select('#sc-' + code);
  displayConcept(node);

var node = null;
   codSelected = code;
   dataAndFunctions.nodes.forEach(n => {
     if (n.data.code == code) {
       node = n;
       return;
     }
   });
   if (node != null) {
     var nodeData = dataAndFunctions.conceptNodeCollection.getNodeByNameShort(code);
     displayConcept(nodeData);
     dataAndFunctions.zoom(node);
   }
   if (isAnOldVersion) {
     isAnObsoleteId = true;
     isAnOldVersion = false;
   

     
} */