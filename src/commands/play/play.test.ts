import auth from 'configs/auth';
import { AppCommand, AppFunc, BaseSession } from 'kbotify';
import koice from 'koice';

class EchoKmd extends AppCommand {
    code = 'test'; // 只是用作标记
    trigger = 'test'; // 用于触发的文字
    help = ''; // 帮助文字
    intro = '';
    func: AppFunc<BaseSession> = async (session) => {
        if (!isNaN(parseInt(session.args[0]))) {
            const voice = new koice(auth.khltoken);
            voice.connectWebSocket(session.args[0]);
            voice.startStream("/Users/xuanjiap/Music/Private/にっこり調査隊のテーマ.mp3");
        } else {
            return session.reply("Not a channel Id");
        }
    };
}

export const echoKmd = new EchoKmd();