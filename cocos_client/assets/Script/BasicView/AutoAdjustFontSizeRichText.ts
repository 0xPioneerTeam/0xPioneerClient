import { CCInteger, RichText, UITransform, _decorator } from "cc";
const { ccclass, property } = _decorator;

@ccclass
export default class AutoAdjustFontSizeRichText extends RichText {
    @property(CCInteger)
    private maxFontSize: number = 24;

    @property(CCInteger)
    private minFontSize: number = 10;

    private _orginalHeight: number = 0;
    private _lastString: string = "";

    onLoad() {
        this._orginalHeight = this.node.getComponent(UITransform).height;
    }

    adjustFontSize() {
        let containerHeight = this._orginalHeight;
        let fontSize = this.maxFontSize;

        const richText = this.node.getComponent(RichText);
        richText.fontSize = fontSize;
        richText.string = richText.string; // redraw
        let contentHeight = this.node.getComponent(UITransform).height;

        while (contentHeight > containerHeight && fontSize > this.minFontSize) {
            fontSize--;
            richText.fontSize = fontSize;
            richText.string = richText.string; // redraw
            contentHeight = this.node.getComponent(UITransform).height;
        }
    }
    
    protected update(dt: number): void {
        if (this._lastString != this.node.getComponent(RichText).string) {
            this._lastString = this.node.getComponent(RichText).string;
            this.adjustFontSize();
        }
    }
}
