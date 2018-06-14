const cheerio = require('cheerio')
const request = require('request')
const async = require('async')
const fs = require('fs')
const child_process = require('child_process')
const config = require('./config.js')

// if (!config.ss_folder) {
//   console.error('please set shadowsocks directory on "config.js"');
//   return;
// }

request('https://doub.io/sszhfx/', (error, response, body) => {
  const $ = cheerio.load(body)
  const regex = /ss\:\/\//i
  let gui_config = config.default_ss_config

  const funList = $('table .dl1')
    .toArray()
    .filter(item => regex.test(item.attribs.href))
    .map(item => {
      return (callback) => {
        request(item.attribs.href, (error, response, body) => callback(error, body))
      }
    })

  async.parallel(funList, (error, domList) => {
    domList.forEach(dom => {
      const $ = cheerio.load(dom)
      gui_config.configs.push($('a')
        .toArray()
        .filter(item => regex.test(item.attribs.href))
        .map(item => {
          let href = item.attribs.href
          let ss = href.replace(/^.*ss\:\/\/(.*)$/i, (match, p1) => p1) // 获取ss原串
          let ssDecode = Buffer.from(ss, 'base64').toString()
          return ssDecode
        })
        .map(item => {
          const res = item.match(/((\w|\-)*)\:(.*)@(.*):(\d+)$/i)
          return {
            "server": res[4],
            "server_port": res[5],
            "password": res[3],
            "method": res[1],
            "plugin": "",
            "plugin_opts": "",
            "plugin_args": "",
            "remarks": res[4],
            "timeout": 5
          }
        })[0])
    })

    fs.writeFile('gui-config.json', JSON.stringify(gui_config, null, 4), error => {
      if (error) {
        console.error(error)
      }

      // child_process.exec(config.ss_folder + 'Shadowsocks.exe');
    })

  })
})
