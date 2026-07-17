import fs from "node:fs/promises";
import path from "node:path";
import type { SavedSession } from "../../shared/sessions/Session";
import { app, safeStorage } from "electron";

export class SessionService {
  private filePath = path.join(app.getPath("userData"), "sessions.json");

  async list(): Promise<SavedSession[]> {
    try {
      const raw = await fs.readFile(this.filePath, "utf8");
      return JSON.parse(raw) as SavedSession[];
    } catch {
      return [];
    }
  }

  async save(session: SavedSession): Promise<SavedSession> {
    const sessions = await this.list();
    const index = sessions.findIndex(item => item.id === session.id);

    if (index >= 0) {
      sessions[index] = { ...session, updatedAt: Date.now() };
    } else {
      sessions.push(session);
    }

    await fs.mkdir(path.dirname(this.filePath), { recursive: true });
    await fs.writeFile(this.filePath, JSON.stringify(sessions, null, 2));

    return session;
  }

  async delete(id: string): Promise<void> {
    const sessions = await this.list();

    await fs.writeFile(
      this.filePath,
      JSON.stringify(sessions.filter(item => item.id !== id), null, 2)
    );

    await this.deletePassword(id);
  }
  encryptPassword(password: string): string | undefined {
    if (!password) return undefined;

    if (!safeStorage.isEncryptionAvailable()) {
      throw new Error("Password encryption is not available on this system");
    }

    return safeStorage.encryptString(password).toString("base64");
  }

  decryptPassword(encryptedPassword?: string): string {
    if (!encryptedPassword) return "";

    return safeStorage.decryptString(Buffer.from(encryptedPassword, "base64"));
  }
}

export const sessionService = new SessionService();