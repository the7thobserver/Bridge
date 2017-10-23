const Discord = require("discord.js");
const fs = require('fs');
const Telegraf = require('telegraf');

/*
TODO: 
	- easier to setup
	- dont echo bridge messages ?
*/

const BOT_NAME = "Bridge";
var isConnected = false;

init();

function exitHandler(options, err) {
    if (options.cleanup) console.log('clean');
    if (err) console.log(err.stack);
    if (options.exit) process.exit();
}

function init() {

	//do something when app is closing
	process.on('exit', exitHandler.bind(null,{cleanup:true}));

	//catches ctrl+c event
	process.on('SIGINT', exitHandler.bind(null, {exit:true}));

	// catches "kill pid" (for example: nodemon restart)
	process.on('SIGUSR1', exitHandler.bind(null, {exit:true}));
	process.on('SIGUSR2', exitHandler.bind(null, {exit:true}));

	//catches uncaught exceptions
	process.on('uncaughtException', exitHandler.bind(null, {exit:true}));

	const DISCORD_TOKEN = read_token('tokens.config', 'discord');
	const TELEGRAM_TOKEN = read_token('tokens.config', 'telegram');
	const TELEGRAM_CHAT_ID = read_token('tokens.config', 'telegram_chat_id');
	const DISCORD_CHAT_ID = read_token('tokens.config', 'discord_chat_id');
	
	const telegram_client = new Telegraf(TELEGRAM_TOKEN);
	const discord_client = new Discord.Client();

	discord_client.login(DISCORD_TOKEN);
	
	telegram_client.command('reply', (ctx) => {
		var user = ctx.message.chat.first_name;
		var msg = ctx.message.text.split('/reply ')[1];
		console.log("Telegram -> Discord: " + user + ": " + msg);
		discord_client.channels.get(DISCORD_CHAT_ID).send(user + ": " + msg);
	});
	telegram_client.startPolling();
	
	discord_client.on("ready", () => {
	  console.log("Bot is running");
	});

	discord_client.on("message", (message) => {
		// '/connect
	 	if (message.content.startsWith('connect', 1) && !isConnected) {
			message.channel.send(BOT_NAME + " is establishing connection to Telegram");
			isConnected = true;
			console.log("Establishing connection to telegram chat " + TELEGRAM_CHAT_ID);
		} else if (message.content.startsWith('disconnect', 1) && isConnected) {
			message.channel.send(BOT_NAME + " is closing connection to Telegram");
			isConnected = false;
			console.log("Disconnecting connection to telegram chat " + TELEGRAM_CHAT_ID);
		} else if (isConnected) {
			// Push messages 
			console.log("Discord -> Telegram: " + message.author.username + ": \'" + message.content + "\'");
			telegram_client.telegram.sendMessage(TELEGRAM_CHAT_ID, message.author.username + ": " + message.content);
		}
	});
}

function read_token(file_name, program) {
	// config is 'program=token'
	// isolate token by splitting on 'program=' and the new line
	var lines = fs.readFileSync(file_name).toString().split(program + "=");
	return lines[1].split('\r\n')[0];
}