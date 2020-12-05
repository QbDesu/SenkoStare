import * as Discord from 'discord.js';
import {LocalStorage} from 'node-localstorage';
import * as wildcard from 'wildcard';

const config = require("./config.json");
const localStorage = new LocalStorage(config.dataDirectory)

const client = new Discord.Client()

client.on('ready', async () => {
    console.log(`I'm now online as @${client.user.tag}.`);
    console.log(`Invite link: ${ await client.generateInvite({permissions: ['SEND_MESSAGES']}) }`);
});

type TrackingChannelEntry = {
    guildId: string,
    channelId: string,
    trackedVoiceChannels: string[]
}

let channels: TrackingChannelEntry[] = localStorage.getItem('channels') ? JSON.parse(localStorage.getItem('channels')) : [];
function saveChannels(){ localStorage.setItem('channels', JSON.stringify(channels)); }

client.on('message', async (msg: Discord.Message) => {

    if(msg.guild && !msg.author.bot){
        if(msg.guild.member(msg.author).permissions.has(Discord.Permissions.FLAGS.ADMINISTRATOR)){
            const split = msg.content.split(' ');
            const textChannel = msg.channel as Discord.TextChannel;

            if(split[0] === 'owo>'){
                if(split[1].toLowerCase() === 'loghere'){
                    const newChannels = split.length>2 ? split.slice(2) : ['*'];

                    channels.push({
                        guildId: msg.guild.id,
                        channelId: msg.channel.id,
                        trackedVoiceChannels: newChannels
                    });
                    saveChannels();
                    msg.reply(`I will report anything I see in the following channels from now on: ${newChannels.join(', ')}`);
                } else if(split[1].toLowerCase() === 'stophere'){
                    console.log(`Stopped logging for #${textChannel.name} (${textChannel.id}).`);

                    channels = channels.filter(trackingEntry => trackingEntry.channelId !== msg.channel.id);
                    saveChannels();
                    msg.reply(`I will stop reporting in this channel from now on.`);
                } else if(split[1].toLowerCase() === 'stopall'){
                    console.log(`Stopped logging for guild #${textChannel.guild.name} (${textChannel.guild.id}).`);

                    channels = channels.filter(trackingEntry => trackingEntry.guildId !== msg.guild.id);
                    saveChannels();
                    msg.reply(`I will stop reporting anything from now on.`);
                } else if(split[1].toLowerCase() === 'leavepls'){
                    console.log(`Leaving guild #${textChannel.guild.name} (${textChannel.guild.id}).`);

                    channels = channels.filter(trackingEntry => trackingEntry.guildId !== msg.guild.id);
                    saveChannels();
                    await msg.reply(`It's sad to say goodbye, but I'll remember the time we spent together fondly. Farewell!`);
                    msg.guild.leave();
                } else if(split[1].toLowerCase() === 'help'){
                    console.log(`Sending help to #${textChannel.name} (${textChannel.id}).`);

                    msg.reply(`\`\`\`
Things you can instruct me to do:
owo> loghere [channels...] | I can stare at the voice channels you tell me or all if you don't specify any further. I will then procede to tell you about everything I see. (space sperated, wildcards possible)
owo> stophere | I will stop reporting what I see in the text channel.
owo> stopall | I will stop reporting anything I see.
owo> leavepls | If you really want me to, I can leave... D:
owo> help | If you ever need help again, I'll give it my best! <3
\`\`\``)
                }
            }
        }
    }
});

client.on('channelDelete', async (channel: Discord.Channel) => {
    if(!channel.isText()) return;
    const textChannel = channel as Discord.TextChannel;
    console.log(`Removed channel #${textChannel.name} (${channel.id}).`)

    channels = channels.filter(trackingEntry => trackingEntry.channelId !== channel.id);
    saveChannels();
});

client.on('guildDelete', async (guild: Discord.Guild) => {
    console.log(`Left guild ${guild.name} (${guild.id}).`)
    channels = channels.filter(trackingEntry => trackingEntry.guildId !== guild.id);
    saveChannels();
});

client.on('guildCreate', async (guild: Discord.Guild) => {
    console.log(`Joined guild ${guild.name} (${guild.id}).`)
});

client.on('voiceStateUpdate', async (oldState: Discord.VoiceState, newState: Discord.VoiceState) => {
    if(oldState.channel != newState.channel){
        if(oldState.channel){
            channels
                .filter(trackingEntry =>
                    trackingEntry.guildId == oldState.guild.id &&
                    trackingEntry.trackedVoiceChannels.some(pattern => wildcard(pattern, oldState.channel.name)))
                .forEach(trackingEntry => 
                    (client.channels.cache.get(trackingEntry.channelId) as Discord.TextChannel)
                        .send(`${oldState.member.displayName} (${oldState.member.user.tag}) left ${oldState.channel.name}.`))
        }
        if(newState.channel){
            channels
                .filter(trackingEntry =>
                    trackingEntry.guildId == newState.guild.id &&
                    trackingEntry.trackedVoiceChannels.some(pattern => wildcard(pattern, newState.channel.name)))
                .forEach(trackingEntry => 
                    (client.channels.cache.get(trackingEntry.channelId) as Discord.TextChannel)
                        .send(`${newState.member.displayName} (${newState.member.user.tag}) joined ${newState.channel.name}.`))
        }
    }
});

client.login(config.token);
