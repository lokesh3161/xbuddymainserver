const fs = require('fs')
const path = require('path')
const readline = require('readline')

const CONFIG_FILE = path.join(process.cwd(), 'shop-config.json')
const CREDS_FILE  = path.join(process.cwd(), 'credentials.json')

const rl = readline.createInterface({ input: process.stdin, output: process.stdout })
const ask = (q) => new Promise(res => rl.question(q, res))

async function setup() {
  console.log('\n  X Buddy — Shop Setup\n  ====================\n')

  if (!fs.existsSync(CREDS_FILE)) {
    console.log('  ERROR: credentials.json not found!')
    console.log('  Place your Google Service Account JSON file as credentials.json in this folder.\n')
    process.exit(1)
  }

  const shopName   = await ask('  Enter your shop name: ')
  const shopId     = await ask('  Enter your Shop ID (given by X Buddy team): ')
  const sheetId    = await ask('  Enter your Google Sheet ID: ')
  const gasUrl     = await ask('  Enter your GAS URL: ')
  const boothPin   = await ask('  Set a 4-digit booth PIN: ')

  const config = { shopName, shopId, sheetId, gasUrl, boothPin }
  fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2))

  console.log('\n  ✅ Setup complete! Run XBuddy-PrintAgent.exe to start.\n')
  rl.close()
}

setup()
