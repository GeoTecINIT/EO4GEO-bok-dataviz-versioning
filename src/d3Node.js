// d3-compliant JavaScript object node with default values
class CostumD3Node {
  constructor() {
    this.name = null;
    this.nameShort = "";
    this.description = "";
    this.size = 100;
    this.parent = null;
    this.otherParents = [];
    this.additionalParents = [];
    this.children = [];
    this.prerequisites = [];
    this.postrequisites = [];
    this.similarConcepts = [];
    this.demonstrableSkills = [];
    this.sourceDocuments = [];
    this.contributors = [];
    this.uri = "";
    this.timestamp = "";
  }
}

class CostumD3NodeCollection {
  constructor() {
    this.nodes = [];
  }

  add(node) {
    this.nodes.push(node);
  }

  pop() {
    this.nodes.pop();
  }

  getNodeByURI(uri) {
    return this.nodes.find(node => node.id.split("_rev")[0] === uri) || null;
  }

  getNodeByNameShort(nameShort) {
    return this.nodes.find(node => node.nameShort === nameShort) || null;
  }

  getNodesByKeyword(keyword, searchCode = true, searchName = true, searchDes = true, searchSkills = true) {
    const result = [];
    const upperKeyword = keyword.toUpperCase();

    if (searchCode) {
      this.nodes.forEach(node => {
        if (node.nameShort.toUpperCase().includes(upperKeyword) && !result.includes(node)) {
          result.push(node);
        }
      });
    }

    if (searchName) {
      this.nodes.forEach(node => {
        if (node.name && node.name.toUpperCase().includes(upperKeyword) && !result.includes(node)) {
          result.push(node);
        }
      });
    }

    if (searchSkills) {
      this.nodes.forEach(node => {
        if (Array.isArray(node.demonstrableSkills)) {
          node.demonstrableSkills.forEach(skill => {
            if (skill.description.toUpperCase().includes(upperKeyword) && !result.includes(node)) {
              result.push(node);
            }
          });
        }
      });
    }

    if (searchDes) {
      this.nodes.forEach(node => {
        if (node.description && node.description.toUpperCase().includes(upperKeyword) && !result.includes(node)) {
          result.push(node);
        }
      });
    }

    return result;
  }

  getNodesIdByKeyword(keyword, searchCode = true, searchName = true, searchDes = true, searchSkills = true) {
    const result = [];
    const upperKeyword = keyword.toUpperCase();

    if (searchCode) {
      this.nodes.forEach(node => {
        if (node.nameShort.toUpperCase().includes(upperKeyword) && !result.includes(node.id)) {
          result.push(node.id);
        }
      });
    }

    if (searchName) {
      this.nodes.forEach(node => {
        if (node.name && node.name.toUpperCase().includes(upperKeyword) && !result.includes(node.id)) {
          result.push(node.id);
        }
      });
    }

    if (searchSkills) {
      this.nodes.forEach(node => {
        if (Array.isArray(node.demonstrableSkills)) {
          node.demonstrableSkills.forEach(skill => {
            if (skill.description.toUpperCase().includes(upperKeyword) && !result.includes(node.id)) {
              result.push(node.id);
            }
          });
        }
      });
    }

    if (searchDes) {
      this.nodes.forEach(node => {
        if (node.description && node.description.toUpperCase().includes(upperKeyword) && !result.includes(node.id)) {
          result.push(node.id);
        }
      });
    }

    return result;
  }
}

module.exports = { CostumD3Node, CostumD3NodeCollection };