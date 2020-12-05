"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const Discord = require("discord.js");
const node_localstorage_1 = require("node-localstorage");
const wildcard = require("wildcard");
const config = require("./config.json");
const localStorage = new node_localstorage_1.LocalStorage(config.database);
const client = new Discord.Client();
client.on('ready', () => __awaiter(void 0, void 0, void 0, function* () {
    console.log(`I'm now online as @${client.user.tag}.`);
    console.log(`Invite link: ${yield client.generateInvite({ permissions: ['SEND_MESSAGES'] })}`);
}));
let channels = localStorage.getItem('channels') ? JSON.parse(localStorage.getItem('channels')) : [];
function saveChannels() { localStorage.setItem('channels', JSON.stringify(channels)); }
client.on('message', (msg) => __awaiter(void 0, void 0, void 0, function* () {
    if (msg.guild && !msg.author.bot) {
        if (msg.guild.member(msg.author).permissions.has(Discord.Permissions.FLAGS.ADMINISTRATOR)) {
            const split = msg.content.split(' ');
            const textChannel = msg.channel;
            if (split[0] === 'owo>') {
                if (split[1].toLowerCase() === 'loghere') {
                    const newChannels = split.length > 2 ? split.slice(2) : ['*'];
                    channels.push({
                        guildId: msg.guild.id,
                        channelId: msg.channel.id,
                        trackedVoiceChannels: newChannels
                    });
                    saveChannels();
                    msg.reply(`I will report anything I see in the following channels from now on: ${newChannels.join(', ')}`);
                }
                else if (split[1].toLowerCase() === 'stophere') {
                    console.log(`Stopped logging for #${textChannel.name} (${textChannel.id}).`);
                    channels = channels.filter(trackingEntry => trackingEntry.channelId !== msg.channel.id);
                    saveChannels();
                    msg.reply(`I will stop reporting in this channel from now on.`);
                }
                else if (split[1].toLowerCase() === 'stopall') {
                    console.log(`Stopped logging for guild #${textChannel.guild.name} (${textChannel.guild.id}).`);
                    channels = channels.filter(trackingEntry => trackingEntry.guildId !== msg.guild.id);
                    saveChannels();
                    msg.reply(`I will stop reporting anything from now on.`);
                }
                else if (split[1].toLowerCase() === 'leavepls') {
                    console.log(`Leaving guild #${textChannel.guild.name} (${textChannel.guild.id}).`);
                    channels = channels.filter(trackingEntry => trackingEntry.guildId !== msg.guild.id);
                    saveChannels();
                    yield msg.reply(`It's sad to say goodbye, but I'll remember the time we spent together fondly. Farewell!`);
                    msg.guild.leave();
                }
                else if (split[1].toLowerCase() === 'help') {
                    console.log(`Sending help to #${textChannel.name} (${textChannel.id}).`);
                    msg.reply(`\`\`\`
Things you can instruct me to do:
owo> loghere [channels...] | I can stare at the voice channels you tell me or all if you don't specify any further. I will then procede to tell you about everything I see. (space sperated, wildcards possible)
owo> stophere | I will stop reporting what I see in the text channel.
owo> stopall | I will stop reporting anything I see.
owo> leavepls | If you really want me to, I can leave... D:
owo> help | If you ever need help again, I'll give it my best! <3
\`\`\``);
                }
            }
        }
    }
}));
client.on('channelDelete', (channel) => __awaiter(void 0, void 0, void 0, function* () {
    if (!channel.isText())
        return;
    const textChannel = channel;
    console.log(`Removed channel #${textChannel.name} (${channel.id}).`);
    channels = channels.filter(trackingEntry => trackingEntry.channelId !== channel.id);
    saveChannels();
}));
client.on('guildDelete', (guild) => __awaiter(void 0, void 0, void 0, function* () {
    console.log(`Left guild ${guild.name} (${guild.id}).`);
    channels = channels.filter(trackingEntry => trackingEntry.guildId !== guild.id);
    saveChannels();
}));
client.on('guildCreate', (guild) => __awaiter(void 0, void 0, void 0, function* () {
    console.log(`Joined guild ${guild.name} (${guild.id}).`);
}));
client.on('voiceStateUpdate', (oldState, newState) => __awaiter(void 0, void 0, void 0, function* () {
    if (oldState.channel != newState.channel) {
        if (oldState.channel) {
            channels
                .filter(trackingEntry => trackingEntry.guildId == oldState.guild.id &&
                trackingEntry.trackedVoiceChannels.some(pattern => wildcard(pattern, oldState.channel.name)))
                .forEach(trackingEntry => client.channels.cache.get(trackingEntry.channelId)
                .send(`${oldState.member.displayName} (${oldState.member.user.tag}) left ${oldState.channel.name}.`));
        }
        if (newState.channel) {
            channels
                .filter(trackingEntry => trackingEntry.guildId == newState.guild.id &&
                trackingEntry.trackedVoiceChannels.some(pattern => wildcard(pattern, newState.channel.name)))
                .forEach(trackingEntry => client.channels.cache.get(trackingEntry.channelId)
                .send(`${newState.member.displayName} (${newState.member.user.tag}) joined ${newState.channel.name}.`));
        }
    }
}));
client.login(config.token);
//# sourceMappingURL=index.js.map