
import auth from 'configs/auth';
import * as spotifyAuth from './authSpotify';
import koice from 'koice';
import axios from 'axios';
import { SpotifyPlaybackSDK, } from './lib/spotifyPlaybackSDK'
import { Readable as ReadableStream } from 'stream'
import { BaseSession, Card } from 'kasumi.js';
import { bot } from 'init/client';
import delay from 'delay';
var spotify: SpotifyPlaybackSDK;
var player: Awaited<ReturnType<typeof spotify.createPlayer>>;
var voice: koice;
var stream: ReadableStream;
var deviceId: string;

export const card_error = (message: string) => {
    return new Card()
        .setSize(Card.Size.LARGE)
        .setTheme(Card.Theme.INFO)
        .addTitle('Error')
        .addDivider()
        .addText(message)
        .addContext("You may notice a latency of up to 10 seconds of every action")
}
export const card_success = (message: string) => {
    return new Card()
        .setSize(Card.Size.LARGE)
        .setTheme(Card.Theme.INFO)
        .addTitle('Success')
        .addDivider()
        .addText(message)
        .addContext("You may notice a latency of up to 10 seconds for every action");
}

export const card_queue = (current: { name: string, artists: string[], progress: number, duration: number }, next: { name: string, artists: string[] }[]) => {
    let ret = new Card()
        .addTitle("Now Playing:")
        .addText(current.name)
        .addContext(current.artists.join(', '))
        .addText((() => {
            const precentage = (Math.trunc(current.progress / current.duration * 20));
            const progressS = Math.trunc(current.progress / 1000);
            const durationS = Math.trunc(current.duration / 1000);
            return new Array(20).fill("█", 0, precentage).fill("▓", precentage, 20).join("") + ` ${Math.trunc(progressS / 60).toString().padStart(2, '0')}:${(progressS % 60).toString().padStart(2, '0')}/${Math.trunc(durationS / 60).toString().padStart(2, '0')}:${(durationS % 60).toString().padStart(2, '0')}`;
        })())
        .addDivider()
        .addText("**Next Up:**");
    for (let meta of next) {
        ret.addText(meta.name)
            .addContext(meta.artists.join(', '))
    }
    return ret;
}



export async function resume(session: BaseSession) {
    if (!player) {
        return session.reply(card_error("kook-ongaku-play did not start"));
    } else {
        await player.resume();
        return session.reply(card_success("Resumed player"))
    }
}

export async function pause(session: BaseSession) {
    if (!player) {
        return session.reply(card_error("kook-ongaku-play did not start"));
    } else {
        await player.pause();
        return session.reply(card_success("Paused player"))
    }
}

export async function getQueue(session: BaseSession) {
    if (!player) {
        return session.reply(card_error("kook-ongaku-play did not start"));
    } else {
        await axios.get(
            `https://api.spotify.com/v1/me/player/queue`,
            {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${(await spotifyAuth.getToken())}`
                }
            }
        ).then(async (res) => {
            const data = res.data;
            var now_playing = {
                name: data.currently_playing.name,
                artists: (<any[]>data.currently_playing.artists).map(val => val.name),
                progress: 0,
                duration: data.currently_playing.duration_ms
            }
            var next_up: { name: string, artists: string[] }[] = [];
            for (let queue of data.queue) {
                next_up.push({
                    name: queue.name,
                    artists: (<any[]>queue.artists).map(val => val.name)
                });
            }
            await axios.get("https://api.spotify.com/v1/me/player", {
                headers: {
                    'Authorization': `Bearer ${(await spotifyAuth.getToken())}`
                }
            }).then((res) => {
                now_playing.progress = res.data.progress_ms || 0;
                return session.reply(card_queue(now_playing, next_up))
            }).catch((err) => { console.log(err) });
        });
    }
}

export async function skip(session: BaseSession) {
    if (!player) {
        return session.reply(card_error("kook-ongaku-play did not start"));
    } else {
        await player.nextTrack();
        await delay(500);
        await axios.get("https://api.spotify.com/v1/me/player", {
            headers: {
                'Authorization': `Bearer ${(await spotifyAuth.getToken())}`
            }
        }).then((res) => {
            const music_name = res.data.item.name;
            return session.reply(card_success(`Skipped current song\n---\n**Now playing:**\n${music_name}`));
        }).catch((err) => { console.log(err) });
    }
}

export async function switchDevice() {
    return axios.put(`https://api.spotify.com/v1/me/player/`, {
        device_ids: [deviceId],
        play: true
    }, {
        headers: {
            'Authorization': `Bearer ${(await spotifyAuth.getToken())}`
        }
    }).catch(e => console.dir(e, { depth: null }));
}

export async function getJoinedChannel(guildId: string, authorId: string) {
    let joinedChannel;
    for await (const { err, data } of bot.API.channel.user.joinedChannel(guildId, authorId)) {
        if (err) {
            throw { err: 'network_failure', msg: '获取频道失败' };
        }
        for (const channel of data.items) {
            joinedChannel = channel;
            break;
        }
        if (joinedChannel) break;
    }
    return joinedChannel?.id;
}

export async function addToQueue(session: BaseSession, song: string) {
    if (!player) {
        return session.reply(card_error("kook-ongaku-play did not start"));
    } else {
        if (!voice || !voice.isServer) {
            if (!session.guildId) return await session.reply("guild only");
            // return session.reply(card_error("Send `.play spotify start` first"));
            const res = await getJoinedChannel(session.guildId, session.authorId);
            if (!res) return session.reply(card_error("You are not in a voice channel"))
            await streamSpotifyToChannel(res);
        }
        await axios.post(
            `https://api.spotify.com/v1/me/player/queue?device_id=${deviceId}&uri=${song}`,
            {},
            {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${(await spotifyAuth.getToken())}`
                }
            }
        ).then(async () => {
            await delay(500);
            await axios.get("https://api.spotify.com/v1/me/player", {
                headers: {
                    'Authorization': `Bearer ${(await spotifyAuth.getToken())}`
                }
            }).then((res) => {
                const music_name = res.data.item.name;
                return session.reply(card_success(`Added ${music_name} to the end of queue\nSend \`.play spotify queue\` to see the full queue`));
            }).catch((err) => { console.log(err) });
        }).catch((e) => {
            console.log(e.response.data);
            session.reply(card_error("Failed to play song! Did you use the correct Spotify URI? (looks like `spotify:track:1nXsyiTXXGAnkqCF7xDv6S`)\nYou can copy Spotify song URI by holding Alt/Option while copying the song link"));
        })
    }
}

export async function connectSpotify() {
    if (!spotify) {
        spotify = new SpotifyPlaybackSDK();
        await spotify.init({
            executablePath: "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe"
        }).catch((e) => {
            bot.logger.error(e);
        })
    }
    if (!player) {
        await spotifyAuth.loginSpotify();
        console.log(await spotifyAuth.getToken());
        var accToken = await spotifyAuth.getToken()
        player = await spotify.createPlayer({
            name: "kook-ongaku-play",
            volume: 0.05,
            getOAuthToken() {
                return accToken;
            }
        });
        await player.connect();
        player.on('ready', ({ device_id }) => {
            console.log("Connected to Spotify with device ID " + device_id);
            deviceId = device_id;
        })
        player.on("player_state_changed", (data: any) => {
            if (!data.paused) {
                // console.log(data);
                // return
                bot.API.game.startMusicActivity('kook-ongaku-play', data.track_window.current_track.name);
                console.log(`Now playing: ${data.track_window.current_track.name}`);
                console.log(`At quality: ${data.playback_quality}`);
                console.log("===============");
            }
            // console.log(data);
        });
    }
}

export async function streamSpotifyToChannel(channelId: string): Promise<void> {
    if (!spotify || !player) {
        await connectSpotify();
    }
    if (!stream) {
        stream = await player.getAudio();
        stream.on('data', (chunk) => {
            console.log(chunk);
        })
    }
    if (voice && voice.isStreaming) {
        await voice.disconnectWebSocket();
        await voice.closeServer();
        voice.connectWebSocket(channelId);
        await voice.startServer();
    } else {
        voice = new koice(auth.khltoken);
        voice.connectWebSocket(channelId);
        await voice.startServer();
        voice.startStream(stream);
    }
    await switchDevice();
    await player.resume();
}
export async function stopStreaming() {
    await player.pause();
    await voice.disconnectWebSocket();
    await voice.closeServer();
}