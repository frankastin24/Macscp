import { defineStore } from "pinia";
import type { TransferItem } from "../../shared/transfers/TransferItem";

export const useTransferStore = defineStore("transfers", {
    state: () => ({
        items: [] as TransferItem[],
    }),

    getters: {
        activeCountForTab: state => (tabId: string) => state.items.filter(item =>
            item.tabId === tabId && (item.status === "queued" || item.status === "running")
        ).length,
        itemsForTab: state => (tabId: string) => state.items.filter(item => item.tabId === tabId),
    },

    actions: {
        upsert(item: TransferItem) {
            const existing = this.items.find((existing: TransferItem) => existing.id === item.id);

            if (existing) {
                Object.assign(existing, item);
            } else {
                this.items.unshift(item);
            }
        },
    },
});
