export interface SavedSession {
  id: string;
  name: string;
  host: string;
  port: number;
  username: string;
  remotePath: string;
  localPath: string;
  encryptedPassword?: string;
  hasPassword?: boolean;
  createdAt: number;
  updatedAt: number;
}