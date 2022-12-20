import { Card, MenuCommand } from 'kbotify';
import { playSpotify } from './play.spotify';

class Play extends MenuCommand {
    code = 'play';
    trigger = 'play';
    help = '';

    intro = '复读菜单';
    menu = new Card().addText('一些卡片里需要展示的东西').toString();
    useCardMenu = true; // 使用卡片菜单
}

export const playMenu = new Play(playSpotify)
