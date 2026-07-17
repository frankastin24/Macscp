// src/renderer/stores/connectionStore.ts
import { defineStore } from "pinia";

export const useConnectionStore = defineStore("connection", {
    state: () => ({
        host: "",
        port: 22,
        username: "",
        password: "",
        connected: false,
    }),

    actions: {
        setConnectionDetails(details: {
            host: string;
            port: number;
            username: string;
            password: string;
        }) {
            this.host = details.host;
            this.port = details.port;
            this.username = details.username;
            this.password = details.password || "";
        },

        setConnected(value: boolean) {
            this.connected = value;
        },
    },
});  