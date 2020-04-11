"use strict";

const fs = require("fs");
const request = require("request");
const proxy = require("./proxy-checker/classes/proxy");

class ProxyChecker {
  constructor() {
    this.filePath = undefined;
    this.proxies = [];
    this.myIP = undefined;
  }

  /**
   * To recover proxies from a file
   * @param {string} filePath file path
   */
  setProxiesListFromFile(filePath) {
    this.filePath = filePath;
    return new Promise((resolve, reject) => {
      fs.readFile(
        filePath,
        "utf8",
        function (err, contents) {
          if (err) throw err;
          let values = contents.toString().split("\r\n");
          this.setProxies(values);
          resolve();
        }.bind(this)
      );
    });
  }

  /**
   * To recover proxies from a string []
   * @param {string[]} proxies
   */
  setProxiesListFromArray(proxies) {
    this.setProxies(proxies);
  }

  setProxies(values) {
    if (values.length != 1) {
      for (var i in values) {
        this.proxies.push(
          new proxy(values[i].split(":")[0], values[i].split(":")[1], this.myIP)
        );
      }
    } else {
      this.proxies.push(
        new proxy(values[0].split(":")[0], values[0].split(":")[1], this.myIP)
      );
    }
  }

  /**
   * Check all proxies in file, it's promise methods.
   * @param {Object} options -  (optionnal) It's an object {
   *                        goodProxiesPath: If you want to create a file containing the correct proxies, put the path here ,
   *                        badProxiesPath: If you want to create a file containing the correct proxies, put the path here,
   *                        showAnonymous: Display anonymous value in the good proxies file,
   *                        showCountry: Display showCountry value in the good proxies file,
   *                      }
   */
  async checkProxies(options = {}) {
    var goodProxiesFileStream = null
    var badProxiesFileStream = null
    if (options != null && options != {}){
      if (options.goodProxiesPath){
         goodProxiesFileStream = fs.createWriteStream(options.goodProxiesPath)
      }
      if (options.badProxiesPath){
        badProxiesFileStream = fs.createWriteStream(options.badProxiesPath)
     }
   }

    await Promise.all(
      this.proxies.map(async (proxy) => {
        await proxy.checkProxy();
        if (proxy.status == "Dead") {
          if (badProxiesFileStream !=null){
            badProxiesFileStream.write(`${proxy.address}:${proxy.port}\r\n`)
          }
          console.log(
            "\x1b[31m",
            `Proxy: ${proxy.address}:${proxy.port} is ${proxy.status}`
          );
        } else {
          if (goodProxiesFileStream !=null){
            var text = `${proxy.address}:${proxy.port}`
            if (options.showAnonymous){
              text += `:${proxy.anonymous}`
            }
            if (options.showCountry){
              text += `:${proxy.country}`
            }
            text+= '\r\n'
            goodProxiesFileStream.write(text)
          }
          console.log(
            "\x1b[32m",
            `Proxy: ${proxy.address}:${proxy.port} is ${proxy.status} - Anonymous level: ${proxy.anonymous} - Country: ${proxy.country}`
          );
        }
      })
    );

    if (goodProxiesFileStream !=null){
      goodProxiesFileStream.close()
    }

    if (badProxiesFileStream !=null){
      badProxiesFileStream.close()
    }
  }

  getMyIP() {
    return new Promise((resolve, reject) => {
      request(
        "http://checkip.dyndns.org/",
        function (error, response, body) {
          if (error) {
            return reject(error);
          }
          var r = /\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/;
          this.myIP = body.match(r)[0];
          resolve(this.myIP);
        }.bind(this)
      );
    });
  }
}

module.exports = new ProxyChecker();