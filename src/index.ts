import { connectSpotify } from 'commands/play/getSpotify';
import { bot } from 'init/client';
import { playMenu } from './commands/play/play.menu';
require('./spotify_oauth');


(async () => {
    await connectSpotify();
    console.log("Starting bot...");
    bot.plugin.load(playMenu);
    bot.logger.debug('system init success');
    bot.connect();
})()


