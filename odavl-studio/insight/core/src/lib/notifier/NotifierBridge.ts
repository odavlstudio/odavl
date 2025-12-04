import type { InsightNotification } from "./LiveNotifier";

export class NotifierBridge {
    private readonly subscribers: Array<(notif: InsightNotification) => void> = [];

    subscribe(callback: (notif: InsightNotification) => void): void {
        this.subscribers.push(callback);
    }

    emit(event: string, payload: InsightNotification): void {
        if (event === "insight_notification") {
            for (const subscriber of this.subscribers) {
                subscriber(payload);
            }
        }
    }

    getSubscriberCount(): number {
        return this.subscribers.length;
    }
}
