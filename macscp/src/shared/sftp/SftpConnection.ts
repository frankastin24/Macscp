export interface SftpConnectionConfig {
  host: string;
  port: number;
  username: string;
  password?: string;
  privateKey?: string;
}