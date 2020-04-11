const HttpsProxyAgent = require("https-proxy-agent");
const request = require("request");
const net = require("net");

const proxyAnonymous = require("../enums/proxyAnonymous");
const proxyStatus = require("../enums/proxyStatus");

const proxyJudge = require("./proxyJudge");
const proxyInformation = require("./proxyInformation");

class Proxy {
  constructor(address, port, myIP) {
    this.address = address;
    this.port = port;

    this.status = undefined;
    this.country = "Unknwow";
    this.anonymous = undefined;
    this.myIP = myIP;
  }

  checkProxy() {
    return new Promise(async (resolve, reject) => {
      await this.pingProxy();

      if (this.status != proxyStatus.Dead) {
        var proxy = `http://${this.address}:${this.port}`;
        var agent = new HttpsProxyAgent(proxy);

        request(
          {
            uri: proxyJudge.getJudge(),
            method: "GET",
            headers: {
              "Accept":
                "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9",
              "Accept-Encoding": "gzip, deflate",
              "User-Agent":
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/80.0.3987.163 Safari/537.36",
            },
            agent: agent,
            timeout: 10000,
            followRedirect: true,
            maxRedirects: 10,
          },
          async function (error, response, body) {
            if (error || response.statusCode != 200) {
              this.status = proxyStatus.Dead;
              // return reject(error)
            } else {
              this.status = proxyStatus.Ok;
              var obj = this.parseProxyJudge(body);

              if (obj["REMOTE_ADDR"]) {
                if (obj["REMOTE_ADDR"].includes(this.address)) {
                  this.anonymous = proxyAnonymous.Medium;
                } else if (obj["REMOTE_ADDR"].includes(this.myIP)) {
                  this.anonymous = proxyAnonymous.Low;
                } else {
                  this.anonymous = proxyAnonymous.Unknwow;
                }
              } else {
                this.anonymous = proxyAnonymous.Hight;
              }
              await this.getProxyInformation();
            }
            resolve();
          }.bind(this)
        );
      } else {
        resolve();
      }
    });
  }

  pingProxy() {
    return new Promise((resolve, reject) => {
      var sock = new net.Socket();
      sock.setTimeout(5000);
      sock
        .on("connect", function () {
          this.status = proxyStatus.Ok;
          sock.destroy();
          resolve();
        }.bind(this))
        .on("error", function (e) {
          this.status = proxyStatus.Dead;
          resolve();
        }.bind(this))
        .on("timeout", function (e) {
          this.status = proxyStatus.Dead;
          resolve();
        }.bind(this))
        .connect(this.port, this.address);
    });
  }
  /**
   * Send request for get proxy information like the country
   */
  getProxyInformation() {
    return new Promise((resolve, reject) => {
      var proxy = `http://${this.address}:${this.port}`;
      var agent = new HttpsProxyAgent(proxy);
      request(
        {
          uri: proxyInformation.getInformationUrl(),
          method: "GET",
          headers: {
            "Accept":
              "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9",
            "Accept-Encoding": "gzip, deflate",
            "User-Agent":
              "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/80.0.3987.163 Safari/537.36",
          },
          agent: agent,
          timeout: 10000,
          followRedirect: true,
          maxRedirects: 10,
        },
        function (error, response, body) {
          if (error || response.statusCode != 200) {
          } else {
            try {
              var b = JSON.parse(body);
              if (b.country) {
                this.country = b.country;
              } else {
                this.country = b.country_name;
              }
            } catch (error) {}
          }
          resolve();
        }.bind(this)
      );
    });
  }

  /**
   * Parse data of proxy judege to object with key:value
   * @param {string} content proxy judge response
   * @returns {object}
   */
  parseProxyJudge(content) {
    var values = {};

    var lines = content.split("\n");
    for (var i = 0; i < lines.length; i++) {
      var line = lines[i].split("=");
      try {
        values[line[0].trim()] = line[1].trim();
      } catch (error) {}
    }
    return values;
  }
}

module.exports = Proxy;
