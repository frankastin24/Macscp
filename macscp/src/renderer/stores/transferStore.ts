import { defineStore } from "pinia";
import type { TransferItem } from "../../shared/transfers/TransferItem";

export const useTransferStore = defineStore("transfers", {
    state: () => ({
        items: [] as TransferItem[],
    }),

    getters: {
        queuedCount: state => state.items.filter(item => item.status === "queued").length,
        runningCount: state => state.items.filter(item => item.status === "running").length,
        completedCount: state => state.items.filter(item => item.status === "completed").length,
    },

    actions: {
        add(item: TransferItem) {
            this.items.unshift(item);
        },

        update(id: string, patch: Partial<TransferItem>) {
            const item = this.items.find(item => item.id === id);
            if (item) Object.assign(item, patch);
        },

        clearCompleted() {
            this.items = this.items.filter(item => item.status !== "completed");
        },
        upsert(item: TransferItem) {
            const existing = this.items.find(existing => existing.id === item.id);

            if (existing) {
                Object.assign(existing, item);
            } else {
                this.items.unshift(item);
            }
        },
    },
});