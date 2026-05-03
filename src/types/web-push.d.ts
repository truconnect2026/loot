/**
 * Local ambient stub for the `web-push` package. The real
 * @types/web-push is in package.json devDependencies and will
 * supersede this once `npm install` runs. Until then, this stub
 * lets tsc pass on machines that haven't yet pulled the dep.
 *
 * Only the surface we actually call is declared.
 */

declare module "web-push" {
  export interface PushSubscription {
    endpoint: string;
    keys: { p256dh: string; auth: string };
  }

  export interface RequestOptions {
    TTL?: number;
    headers?: Record<string, string>;
    contentEncoding?: "aes128gcm" | "aesgcm";
    topic?: string;
    urgency?: "very-low" | "low" | "normal" | "high";
  }

  export interface SendResult {
    statusCode: number;
    body: string;
    headers: Record<string, string>;
  }

  export class WebPushError extends Error {
    statusCode: number;
    body: string;
    headers: Record<string, string>;
    endpoint: string;
  }

  export function setVapidDetails(
    subject: string,
    publicKey: string,
    privateKey: string,
  ): void;

  export function sendNotification(
    subscription: PushSubscription,
    payload?: string | Buffer | null,
    options?: RequestOptions,
  ): Promise<SendResult>;

  export function generateVAPIDKeys(): { publicKey: string; privateKey: string };

  const _default: {
    setVapidDetails: typeof setVapidDetails;
    sendNotification: typeof sendNotification;
    generateVAPIDKeys: typeof generateVAPIDKeys;
    WebPushError: typeof WebPushError;
  };
  export default _default;
}
