export class FirebaseService {

    URL_BASE;
    bokMap = new Map();
    versionsMap = new Map();

    setURL(url) {
      this.URL_BASE = url;
    }

    async getCurrentVersion() {
      const currentVersionUrl = 'current/version.json';
      this.getDataFromFirebase(currentVersionUrl).then((response) => {
        return 'v' + response;
      });
    }

    async getYearCurrentVersion() {
      const yearCurrentVersionUrl = 'current/version.json';
      this.getDataFromFirebase(yearCurrentVersionUrl).then((response) => {
        return 'v' + response;
      });
    }
  
    async getBokVersion(version) {
      const queryVersion = version === this.currentVersion ? 'current' : version;
      if (!this.bokMap.has(queryVersion)){
        const bok = await this.getDataFromFirebase(queryVersion + '.json');
        this.bokMap.set(queryVersion, bok);
      }
      return this.bokMap.get(queryVersion);
    }
  
    async getOldVersionsData() {
      if(this.versionsMap.size === 0) {
        const versionsUrl = '.json?shallow=true';
        const versionsObject = await this.getDataFromFirebase(versionsUrl);
        delete versionsObject[this.currentVersion];
        delete versionsObject['current'];
        const versionsArray = Object.keys(versionsObject);
        for(let key of versionsArray) {
          const dateUrl = `${key}/creationYear.json`;
          this.versionsMap.set(key, await this.getDataFromFirebase(dateUrl));
        }
      }
      return this.versionsMap;
    }
  
    async getDataFromFirebase(url) {
      try {
        const response = await fetch(this.URL_BASE + url);
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        return await response.json();
      } catch (error) {
        console.error('There was a problem with the fetch operation:', error);
      }
    }
  }