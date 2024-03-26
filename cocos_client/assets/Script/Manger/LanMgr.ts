import { EventName } from "../Const/ConstDefine";
import NotificationMgr from "../Basic/NotificationMgr";
import LanConfig from "../Config/LanConfig";

export default class LanMgr {
    private _language = "eng";
    private _localLanKey: string = "local_lan";

    public constructor() {}

    public async initData(): Promise<boolean> {
        this._language = localStorage.getItem(this._localLanKey) == null ? "eng" : localStorage.getItem(this._localLanKey);
        return true;
    }

    public getLang(): string {
        return this._language;
    }
    public changeLang(lang: string) {
        this._language = lang;
        localStorage.setItem(this._localLanKey, lang);
        NotificationMgr.triggerEvent(EventName.CHANGE_LANG);
    }

    public getLanById(id: string): string {
        let lanStr = LanConfig.getById(id);
        if (lanStr == null) {
            return "LanguageErr: id does not exist =>" + id;
        }
        if (lanStr[this._language] == null) {
            return "LanguageErr: language or text is missing =>" + id;
        }
        return lanStr[this._language];
    }
    public replaceLanById(id: string, args: any[]) {
        let lan = this.getLanById(id);
        for (let i = 0; i < args.length; i++) {
            lan = lan.replace("%s", args[i]);
        }
        return lan;
    }
}
