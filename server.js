require('events').EventEmitter.prototype._maxListeners = 100
const puppeteer = require('puppeteer') 
const crypto = require('crypto')
const axios = require('axios')
const fs = require('fs')


const COUNTRY = 'BD'
const SAVE_SIZE = 10


let signIn = 'https://accounts.google.com/v3/signin/identifier?dsh=S940062189%3A1665260575698599&continue=https%3A%2F%2Faccounts.google.com%2F&followup=https%3A%2F%2Faccounts.google.com%2F&passive=1209600&flowName=GlifWebSignIn&flowEntry=ServiceLogin&ifkv=AQDHYWp7Xws8OWDo__8vSPkkEImpDwna2RbBmEUp7Wfl7GpYaoWHAtWPfHfSSX-zonF0xYJnZ7HWlw&hl=en-US'

let SERVER = null
let SIZE = 0
let mList = []
let mCaptcha = false
let mReject = 0
let mCaptchaList = {}

let mTime = 0

let page = null


fs.readFile('id.txt', { encoding: 'utf-8' }, function(err,data){
    if(!err) {
        try {
            process.argv.slice(2).forEach(function (val, index) {
                if (index == 0) {
                    SERVER = 'server-'+data+'/child-'+val
                    if (mList.length == 0) {
                        // phoneNumber(false)
                        console.log('Start')
                    }
                }
            })
        } catch (e) {}
    }
})

try {
    mCaptchaList = JSON.parse(fs.readFileSync('captcha.json'))
} catch (error) {}

fs.watchFile('captcha.json', function(curr, prev) {
    try {
        mCaptchaList = JSON.parse(fs.readFileSync('captcha.json'))
    } catch (error) {}
})




async function browser() {
    let browser = await puppeteer.launch({
        headless: true,
        args: [ '--no-sandbox', '--disable-setuid-sandbox' ]
    })

    let page = await browser.newPage()

    await page.setUserAgent('Mozilla/5.0 (Linux; Android 7.0; SM-G930V Build/NRD90M) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/59.0.3071.125 Mobile Safari/537.36')

    await page.goto('https://accounts.google.com/v3/signin/identifier?dsh=S940062189%3A1665260575698599&continue=https%3A%2F%2Faccounts.google.com%2F&followup=https%3A%2F%2Faccounts.google.com%2F&passive=1209600&flowName=GlifWebSignIn&flowEntry=ServiceLogin&ifkv=AQDHYWp7Xws8OWDo__8vSPkkEImpDwna2RbBmEUp7Wfl7GpYaoWHAtWPfHfSSX-zonF0xYJnZ7HWlw&hl=en-US')
    await page.evaluate((gmail) => document.querySelector('input#identifierId').value = gmail, 'toslimkhan007@gmail.com')
    await page.evaluate(() => document.querySelector('#identifierNext').click())

    setTimeout(async () => {
        await page.screenshot({path: 'screenshot.png'})
        await browser.close()
        console.log('Close')
    }, 5000)
}

browser()
