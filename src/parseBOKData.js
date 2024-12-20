const { CostumD3Node, CostumD3NodeCollection } = require('./d3Nodes.js');

exports.parseBOKData = function (bokJSON) {

  const Relationtype = {
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

  var allNodes = [];
  var namehash = {};

  const colorhash = {
    GI: "#40e0d0",
    IP: "#1f77b4",
    CF: "#aec7e8",
    CV: "#ff7f0e",
    DA: "#ffbb78",
    DM: "#2ca02c",
    DN: "#98df8a",
    PS: "#d62728",
    GD: "#cc5b59",
    GS: "#9467bd",
    AM: "#8c564b",
    MD: "#8c564b",
    OI: "#c49c94",
    GC: "#e377c2",
    PP: "#f7b6d2",
    SD: "#7f7f7f",
    SH: "#c7c7c7",
    TA: "#bcbd22",
    WB: "#07561e",
    GN: "#1ca8dd",
    SC: "#ffcc00",
    SA: "#ff9f4a",
    no: "#17becf"
  };

  // loop all nodes
  for (var n = 0; n < bokJSON.concepts.length; n++) {
    var newNode = new CostumD3Node();
    newNode.name = bokJSON.concepts[n].name;
    newNode.nameShort = bokJSON.concepts[n].code;
    newNode.description = bokJSON.concepts[n].description;
    newNode.selfAssesment = bokJSON.concepts[n].selfAssesment;
    newNode.uri = n;
    newNode.id = n;
    newNode.children = [];
    newNode.demonstrableSkills = [];
    newNode.sourceDocuments = [];
    newNode.contributors = [];
    newNode.parent = null;
    newNode.otherParents = [];
    newNode.similarConcepts = [];
    namehash[bokJSON.concepts[n].code] = newNode.name;
    allNodes.push(newNode);
  }

  for (var l = 0; l < bokJSON.relations.length; l++) {
    // children - parent relation
    if (bokJSON.relations[l].name == Relationtype.SUBCONCEPT) {
      if ( allNodes[bokJSON.relations[l].source].parent != null ) {
        allNodes[bokJSON.relations[l].source].otherParents.push(allNodes[bokJSON.relations[l].target]);
      } else {
        allNodes[bokJSON.relations[l].source].parent = allNodes[bokJSON.relations[l].target];
      }
      //push node into childre array
      allNodes[bokJSON.relations[l].target].children.push(allNodes[bokJSON.relations[l].source]);
      // add parent

    }
    if (bokJSON.relations[l].name == Relationtype.SIMILARTO) {
      //push node into childre array
      allNodes[bokJSON.relations[l].target].similarConcepts.push(allNodes[bokJSON.relations[l].source]);
      allNodes[bokJSON.relations[l].source].similarConcepts.push(allNodes[bokJSON.relations[l].target]);
    }
    if (bokJSON.relations[l].name == Relationtype.PREREQUISITEOF) {
      //push node into childre array
      allNodes[bokJSON.relations[l].target].prerequisites.push(allNodes[bokJSON.relations[l].source]);
      //allNodes[bokJSON.relations[l].source].prerequisites.push(allNodes[bokJSON.relations[l].target]);
    }
  }

  for (var o = 0; o < bokJSON.skills.length; o++) {
    for (var s = 0; s < bokJSON.skills[o].concepts.length; s++) {
      var node = bokJSON.skills[o].concepts[s];
      var skill = {};
      skill.description = bokJSON.skills[o].name;
      skill.nameShort = bokJSON.skills[o].name;
      skill.uri = bokJSON.skills[o].name;
      allNodes[node].demonstrableSkills.push(skill);
    }
  }

  for (var e = 0; e < bokJSON.references.length; e++) {
    for (var s = 0; s < bokJSON.references[e].concepts.length; s++) {
      var node = bokJSON.references[e].concepts[s];
      var sourceDoc = {};
      sourceDoc.description = bokJSON.references[e].description;
      sourceDoc.nameShort = bokJSON.references[e].name;
      sourceDoc.url = bokJSON.references[e].url;
      allNodes[node].sourceDocuments.push(sourceDoc);
    }
  }

  if ( typeof bokJSON.contributors != "undefined") {
    for (var e = 0; e < bokJSON.contributors.length; e++) {
      for (var s = 0; s < bokJSON.contributors[e].concepts.length; s++) {
        var node = bokJSON.contributors[e].concepts[s];
        var cont = {};
        cont.description = bokJSON.contributors[e].description;
        cont.nameShort = bokJSON.contributors[e].name;
        cont.url = bokJSON.contributors[e].url;
        allNodes[node].contributors.push(cont);
        allNodes[node].contributors.sort();
      }
    }
  }

  var cD3N = new CostumD3NodeCollection();
  for (var i in allNodes) {
    cD3N.add(allNodes[i]);
  }

  return {
    nodes: allNodes[0],
    relations: bokJSON.relations,
    namehash: namehash,
    conceptNodeCollection: cD3N,
    colors: colorhash
  };

};