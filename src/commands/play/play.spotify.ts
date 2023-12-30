import { bot } from 'init/client';
import { BaseCommand, BaseSession, CommandFunction } from 'kasumi.js';

import * as spotify from './getSpotify';
// const { SpotifyPlaybackSDK } = require("spotify-playback-sdk-node");



class PlaySpotify extends BaseCommand {
    code = 'spotify'; // 只是用作标记
    trigger = 'spotify'; // 用于触发的文字
    help = ''; // 帮助文字
    intro = '';

    func: CommandFunction<BaseSession, any> = async (session) => {
        if (!session.guildId) return await session.reply("guild only");
        switch (session.args[0]) {
            case 'start':
                const res = await spotify.getJoinedChannel(session.guildId, session.authorId);
                if (!res) return session.reply(spotify.card_error("You are not in a voice channel"))
                await spotify.streamSpotifyToChannel(res.id);
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
                    return session.reply(spotify.card_error("Please provide a Spotify song URI"))
                }
                break;
            case 'queue':
                return await spotify.getQueue(session);
            case 'skip':
                return await spotify.skip(session);
            default:
                return session.reply(spotify.card_error("Unknown action"))
        }
    }
}
export const playSpotify = new PlaySpotify();