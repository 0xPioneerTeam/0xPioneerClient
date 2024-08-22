import { Component, Node, tween, v3 } from "cc";

export default class ViewController extends Component {
    protected viewDidLoad() {}
    protected viewDidStart() {}
    protected viewDidAppear() {}
    protected viewDidDisAppear() {}
    protected viewUpdate(dt: number) {}
    protected viewLateUpdate(dt: number) {}
    protected viewDidDestroy() {}
    protected viewPopAnimation(): boolean {
        return false;
    }
    protected contentView(): Node | null {
        return null;
    }
    protected async playExitAnimation(): Promise<void> {
        return new Promise((resolve) => {
            if (this.viewPopAnimation() && this.contentView() != null) {
                const contentView: Node = this.contentView();
                tween()
                    .target(contentView)
                    .to(0.5, { scale: v3(0, 0, 0) }, { easing: "bounceIn" })
                    .call(() => {
                        resolve();
                    })
                    .start();
            } else {
                resolve();
            }
        });
    }

    private _started: boolean = false;
    protected onLoad(): void {
        this.viewDidLoad();
    }

    protected onEnable(): void {
        if (!this._started) {
            return;
        }
        this.viewDidAppear();
    }

    protected start(): void {
        this.viewDidStart();

        if (this.viewPopAnimation() && this.contentView() != null) {
            const contentView: Node = this.contentView();
            contentView.active = true;
            contentView.setScale(0, 0, 0);
            tween()
                .target(contentView)
                .to(0.5, { scale: v3(1.0, 1.0, 1.0) }, { easing: "elasticOut" })
                .call(() => {
                    this.viewDidAppear();
                    this._started = true;
                })
                .start();
        } else {
            this.viewDidAppear();
            this._started = true;
        }
    }

    protected update(dt: number): void {
        this.viewUpdate(dt);
    }

    protected lateUpdate(dt: number): void {
        this.viewLateUpdate(dt);
    }

    protected onDisable(): void {
        this.viewDidDisAppear();
    }

    protected onDestroy(): void {
        this.viewDidDestroy();
    }
}
