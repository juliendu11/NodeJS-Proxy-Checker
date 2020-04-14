const axios = require("axios");
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

  async checkProxy() {
    await this.pingProxy();
      if (this.status != proxyStatus.Dead) {
        try {
          let sendRequest = await axios({
            method: 'get',
            url: proxyJudge.getJudge(),
            proxy: {
              host: this.address,
              port: this.port,
            },
          });
          if (sendRequest.status != 200){
            this.status = proxyStatus.Dead;
          }
          else{
            this.status = proxyStatus.Ok;
            var obj = this.parseProxyJudge(sendRequest.data);

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
        } catch (error) {
          this.status = proxyStatus.Dead;
        }
      }
  }

  async pingProxy() {
    var sock = new net.Socket();
    sock.setTimeout(5000);
    sock
      .on("connect", function () {
        this.status = proxyStatus.Ok;
        sock.destroy();
      }.bind(this))
      .on("error", function (e) {
        this.status = proxyStatus.Dead;
      }.bind(this))
      .on("timeout", function (e) {
        this.status = proxyStatus.Dead;
      }.bind(this))
      .connect(this.port, this.address);
  }
  /**
   * Send request for get proxy information like the country
   */
  async getProxyInformation() {
    try {
      let sendRequest = await axios({
        method: 'get',
        url: proxyInformation.getInformationUrl(),
        proxy: {
          host: this.address,
          port: this.port,
        },
      });
      if(sendRequest.status == 200){
        let b =null
        try {
          b = JSON.parse(sendRequest.data);
        } catch (error) {
          b = sendRequest.data
        }
        if (b.country) {
          this.country = b.country;
        } else {
          this.country = b.country_name;
        }
      }
    } catch (error) {
      
    }
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
