class ProxyJudge {
  judge = [
    'http://www.knowops.com/cgi-bin/textenv.pl',
    'http://birdingonthe.net/cgi-bin/env.pl'
  ];

  /**
   * Get a random proxy judge
   * @returns {string} Url
   */
  getJudge() {
    return this.judge[Math.floor(Math.random() * this.judge.length)];
  }
}

module.exports = new ProxyJudge()
