const { exec } = require('child_process')
const fs = require('fs')


let process01 = null
let process02 = null
let process03 = null
let process04 = null
let process05 = null


let update = 0
let server = 'server-000'

fs.readFile('id.txt', { encoding: 'utf-8' }, function(err,data){
    if(!err) {
        try {
            server = 'server-'+data
        } catch (e) {}
    }
})

const mainDir = require.resolve('puppeteer')

let path = mainDir.substring(0, mainDir.lastIndexOf('\\')+1)+'lib\\FrameManager.js'

fs.copyFile('FrameManager.js', path, (err) => {
    if (err) {
        console.log(err)
    } else {
        console.log('File Change Success')
    }
})

setInterval(() => {
    update++
    let status = 'Status: Runing --- Runtime: '+update+'m. --- User: ' + server
    console.log(status)
    if (update%5 == 0) {
        let dash = ''
        for (let i = 0; i < status.length; i++) {
            dash += '-'
        }
        console.log('+'+dash+'+')
    }
}, 60000)


connect01()

setTimeout(() => {
    connect02()
}, 1 * 5000)

setTimeout(() => {
    connect03()
}, 2 * 5000)

setTimeout(() => {
    connect04()
}, 3 * 5000)

setTimeout(() => {
    connect05()
}, 4 * 5000)


async function connect01() {
    process01 = exec('node server.js 01')

    process01.stdout.on('data', (data) => {
        console.log(data.toString().substring(0, data.toString().length -1))
        if(data.toString().includes('---Restart Browser---')) {
            connect01()
        }
    })
}

async function connect02() {
    process02 = exec('node server.js 02')

    process02.stdout.on('data', (data) => {
        console.log(data.toString().substring(0, data.toString().length -1))
        if(data.toString().includes('---Restart Browser---')) {
            connect02()
        }
    })
}

async function connect03() {
    process03 = exec('node server.js 03')

    process03.stdout.on('data', (data) => {
        console.log(data.toString().substring(0, data.toString().length -1))
        if(data.toString().includes('---Restart Browser---')) {
            connect03()
        }
    })
}

async function connect04() {
    process04 = exec('node server.js 04')

    process04.stdout.on('data', (data) => {
        console.log(data.toString().substring(0, data.toString().length -1))
        if(data.toString().includes('---Restart Browser---')) {
            connect04()
        }
    })
}

async function connect05() {
    process05 = exec('node server.js 05')

    process05.stdout.on('data', (data) => {
        console.log(data.toString().substring(0, data.toString().length -1))
        if(data.toString().includes('---Restart Browser---')) {
            connect05()
        }
    })
}