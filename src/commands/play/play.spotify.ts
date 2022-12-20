import { bot } from 'init/client';
import { AppCommand, AppFunc, BaseSession } from 'kbotify';
import * as spotify from './getSpotify';
// const { SpotifyPlaybackSDK } = require("spotify-playback-sdk-node");



class PlaySpotify extends AppCommand {
    code = 'spotify'; // 只是用作标记
    trigger = 'spotify'; // 用于触发的文字
    help = ''; // 帮助文字
    intro = '';
    func: AppFunc<BaseSession> = async (session) => {
        switch (session.args[0]) {
            case 'start':
                const res = await bot.axios({
                    url: '/v3/channel-user/get-joined-channel',
                    params: {
                        guild_id: session.guildId,
                        user_id: session.userId
                    }
                });
                if (res.data.data.items.length == 0) {
                    return session.replyCard(spotify.card_error("You are not in a voice channel"))
                }
                await spotify.streamSpotifyToChannel(res.data.data.items[0].id);
                break;
            case 'stop':
                return await spotify.stopStreaming();
            case 'resume':
                return await spotify.resume(session);
            case 'pause':
                return await spotify.pause(session);
            case 'song':
                if (session.args[1]) {
                    await spotify.addToQueue(session, session.args[1]);
                } else {
                    return session.replyCard(spotify.card_error("Please provide a Spotify song URI"))
                }
                break;
            case 'queue':
                return await spotify.getQueue(session);
            case 'skip':
                return await spotify.skip(session);
            default:
                return session.replyCard(spotify.card_error("Unknown action"))
        }
    }
}
export const playSpotify = new PlaySpotify();