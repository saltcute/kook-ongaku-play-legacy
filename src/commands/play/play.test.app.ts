import auth from 'configs/auth';
import { AppCommand, AppFunc, BaseSession } from 'kbotify';
import koice from 'koice';
import * as fs from 'fs';
import upath from 'upath';
import { SpotifyPlaybackSDK } from 'spotify-playback-sdk-node'
import { bot } from 'init/client';
// const { SpotifyPlaybackSDK } = require("spotify-playback-sdk-node");

class PlayTest extends AppCommand {
    code = 'test'; // 只是用作标记
    trigger = 'test'; // 用于触发的文字
    help = ''; // 帮助文字
    intro = '';
    func: AppFunc<BaseSession> = async (session) => {
        if (!isNaN(parseInt(session.args[0]))) {
            const spotify = new SpotifyPlaybackSDK();
            await spotify.init();

            const player = await spotify.createPlayer({
                name: "kook-ongaku-play",
                getOAuthToken() {
                    // get your Access token here: https://developer.spotify.com/documentation/web-playback-sdk/quick-start/
                    return auth.spotifyAccessToken;
                },
            });
            player.on("player_state_changed", (data: any) => {
                if (!data.paused) {
                    console.log(`Now playing: ${data.track_window.current_track.name}`);
                    console.log(`At quality: ${data.playback_quality}`);
                    console.log("===============");
                }
                // console.log(data);
            });

            const stream = await player.getAudio();
            const connected = await player.connect();
            if (!connected) {
                // throw "couldn't connect";
                bot.logger.info('cant connect');
            }
            const voice = new koice(auth.khltoken);
            voice.connectWebSocket(session.args[0]);
            await voice.startServer();
            voice.startStream(stream);
        } else {
            return session.reply("Not a channel Id");
        }
    };
}

export const playTest = new PlayTest();