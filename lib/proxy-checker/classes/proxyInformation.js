class ProxyInformation {
    information = [
        'http://ip-api.com/json/',
        'http://geolocation-db.com/json/'
    ];
  
    /**
     * Get a random proxy information url
     * @returns {string} Url
     */
    getInformationUrl() {
      return this.information[Math.floor(Math.random() * this.information.length)];
    }
  }
  
  module.exports = new ProxyInformation()
  