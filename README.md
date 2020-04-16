# NodeJS-Proxy-Checker
It's simple Proxy Checker, get proxy status, anonymous level, type, time, country

- [x] Proxy anonymous level 
- [X] Proxy country
- [ ] Type 
- [ ] Proxy Time 

## Install

```bash
npm i proxy-checkerjs
```

# How to use ?

````javascript
  const proxy_checker = require('proxy-checkerjs')
  await proxy_checker.getMyIP() //Important
````
### Load proxys with file

One proxy per line and in this format: address: port

````javascript
 await proxy_checker.setProxiesListFromFile('./proxies.txt')
 await proxy_checker.checkProxies()
````

### Load proxys with string array

One proxy per line and in this format: address: port

````javascript
const proxies = [
    "103.4.112.18:80",
    "103.4.164.205:8080",
    "103.43.42.85:30477",
    "103.43.7.93:30004",
]
await proxy_checker.setProxiesListFromArray(proxies)
await proxy_checker.checkProxies()
````

### Load only one proxy

Format: address: port

````javascript
await proxy_checker.checkOneProxy('103.4.112.18:80')
//return
//{
//      result:true or false,
//      anonymous: anonymouslevel or '',
//      country:country or ''
//}
````

## Options

You can use options for checkProxies (), it's a object:

````javascript
await proxy_checker.checkProxies({
        goodProxiesPath: './good.txt', //Create file on stream, add one per line functional proxies (address:port)
        badProxiesPath: './bad.txt', //Create file on stream, add one per line bad proxies (address:port)
        showAnonymous:true, //Only for goodProxiesPath, add anonymous value  (address:port:anonymous)
        showCountry:true, //Only for goodProxiesPath, add country value  (address:port:country)
        output: true, //Show in console, it's simple console.log() with color (dead proxy = red / good proxy = green) and proxy information
       deleteFileIfExist:true //Only if goodProxiesPath and/or badProxiesPath is used, 
    })
````

## Node js use in top-level code

````javascript

var main = async function() {
    await proxy_checker.getMyIP()
    await proxy_checker.setProxiesListFromFile('./test.txt')
    await proxy_checker.checkProxies({
        goodProxiesPath: './good.txt',
        badProxiesPath: './bad.txt',
        showAnonymous:true,
        showCountry:true
    })
}

main()
````



