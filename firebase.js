const bokMap = new Map();
const versionsMap = new Map();
let currentVersion;
let yearCurrentVersion;
let URL_BASE;

exports.setURL = function(url) {
  URL_BASE = url;
}

exports.getCurrentVersion = async function() {
  if (currentVersion) return currentVersion;
  const currentVersionUrl = 'current/version.json';
  const response = await getDataFromFirebase(currentVersionUrl);
  currentVersion = response;
  return currentVersion;
}

exports.getYearCurrentVersion = async function() {
  if (yearCurrentVersion) return yearCurrentVersion;
  const yearCurrentVersionUrl = 'current/updateDate.json';
  yearCurrentVersion = await getDataFromFirebase(yearCurrentVersionUrl);
  return yearCurrentVersion;
}

exports.getBokVersion = async function(version) {
  const queryVersion = version === ("v" + currentVersion) ? 'current' : version;
  if (!bokMap.has(queryVersion)) {
    const bok = await getDataFromFirebase(queryVersion + '.json');
    bokMap.set(queryVersion, bok);
  }
  return bokMap.get(queryVersion);
}

exports.getOldVersionsData = async function() {
  if (versionsMap.size === 0) {
    const versionsUrl = '.json?shallow=true';
    const versionsObject = await getDataFromFirebase(versionsUrl);
    delete versionsObject["v" + currentVersion];
    delete versionsObject['current'];
    const versionsArray = Object.keys(versionsObject);
    for (let key of versionsArray) {
      const dateUrl = `${key}/creationYear.json`;
      versionsMap.set(key, await getDataFromFirebase(dateUrl));
    }
  }
  return versionsMap;
}

async function getDataFromFirebase(url) {
  try {
    const response = await fetch(URL_BASE + url);
    if (!response.ok) {
      throw new Error('Network response was not ok');
    }
    return await response.json();
  } catch (error) {
    console.error('There was a problem with the fetch operation:', error);
  }
}
