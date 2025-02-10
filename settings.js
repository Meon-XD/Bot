const fs = require('fs')
const chalk = require('chalk')

module.exports = {
    botName: 'Meon Bot',
    ownerName: 'R.D.T',
    ownerNumber: 'wa.me/6287744811004',
    botNumber: 'wa.me/6285180782066',
    prefix: '.',
    wagc: 'https://whatsapp.com/channel/0029VajUoDV9mrGmUXtZy91a',
};


let file = require.resolve(__filename)
fs.watchFile(file, () => {
	fs.unwatchFile(file)
	console.log(chalk.redBright(`Update'${__filename}'`))
	delete require.cache[file]
	require(file)
})