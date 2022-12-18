import auth from 'configs/auth';
import { AppCommand, AppFunc, BaseSession } from 'kbotify';
import koice from 'koice';
import { SpotifyPlaybackSDK } from './lib/spotify'
import * as fs from 'fs';
import delay from 'delay';

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
                    return "";
                },
            });
            player.on("player_state_changed", console.log);

            const stream = await player.getAudio();
            const connected = await player.connect();
            if (!connected) throw "couldn't connect";
            console.log("connected", stream);
            // const voice = new koice(auth.khltoken);
            // const spotify = new SpotifyPlaybackSDK();
            // await spotify.init();
            // const player = await spotify.createPlayer({
            //     name: "kook-ongaku-play",
            //     getOAuthToken: () => {
            //         return 'BQCRj69SR8Pt5GsDlMkgMWrcsgl6ONkcxa9NCbHTCEzD_gdRwl0R6lJLUFQvkhRuckr5VrHBdtCEO-LVZ3akiW3Rt5RuARq7gDCHPJsnez9Ua_jj6yDF4uVaeIAdR0-5s13maJCEFu3I0fyrHxVnT432soZnsATjv5RAo2bhKbyasCjI5jskBqAMfXCRul8m_BSCaZUwTGMrp9Fu5HF2CNhM_oo';
            //     }
            // })
            // await player.connect();
            // await delay(1000);
            // console.log(await player.getCurrentState());
            // voice.connectWebSocket(session.args[0]);
            // voice.startStream(await player.getAudio());
            // const stream = fs.createWriteStream('./test.webm');
            // (await player.getAudio()).pipe(stream);

        } else {
            return session.reply("Not a channel Id");
        }
    };
}

export const echoKmd = new EchoKmd();