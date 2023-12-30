import { Card, BaseMenu } from 'kasumi.js';
import { playSpotify } from './play.spotify';

class Play extends BaseMenu {
    name = "play"

}

export const playMenu = new Play(playSpotify)
