import auth from 'configs/auth';
import { AppCommand, AppFunc, BaseSession } from 'kbotify';
import koice from 'koice';
import * as fs from 'fs';
import delay from 'delay';
import { SpotifyPlaybackSDK } from './lib/spotify'
// const { SpotifyPlaybackSDK } = require("spotify-playback-sdk-node");

class EchoKmd extends AppCommand {
    code = 'test'; // 只是用作标记
    trigger = 'test'; // 用于触发的文字
    help = ''; // 帮助文字
    intro = '';
    func: AppFunc<BaseSession> = async (session) => {
        if (!isNaN(parseInt(session.args[0]))) {
            const spotify = new SpotifyPlaybackSDK();
            await spotify.init();

            const player = await spotify.createPlayer({
                name: "Web",
                getOAuthToken() {
                    // get your Access token here: https://developer.spotify.com/documentation/web-playback-sdk/quick-start/
                    return "BQDyLQ59HP_uzo4GkYoJzl3kYCt6JcuGSKpQ_GksOJYPWhh3DfclZFiWuU_cQ4XXE81Zhu329ExK4tp9y5R4UqAFDPtDb1-eljN2ls26SGnk31Fu_zrBvdXFqGho24iFwRz1CQNLwR1uNf4TqdxginJ2NLKQyqWANcs5xqjm8IjW5LQLAmbnE8wDb-4u0NdlNDwvKZNAYI5ykDldY7CwXsg7u4A";
                },
            });
            player.on("player_state_changed", console.log);

            const stream = await player.getAudio();
            const connected = await player.connect();
            if (!connected) throw "couldn't connect";
            const voice = new koice(auth.khltoken);
            voice.connectWebSocket(session.args[0]);
            voice.startStream(stream);
        } else {
            return session.reply("Not a channel Id");
        }
    };
}

export const echoKmd = new EchoKmd();