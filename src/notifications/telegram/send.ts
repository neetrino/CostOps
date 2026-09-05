import { logger } from '@/shared/logger';

export type SendTelegramParams = {
  botToken: string;
  chatId: string;
  text: string;
  parseMode?: 'HTML';
};

/**
 * Sends a Telegram message via Bot API (plain text or HTML).
 */
export async function sendTelegramMessage(params: SendTelegramParams): Promise<void> {
  const url = `https://api.telegram.org/bot${params.botToken}/sendMessage`;
  const body: Record<string, string | boolean> = {
    chat_id: params.chatId,
    text: params.text,
    disable_web_page_preview: true,
  };
  if (params.parseMode) {
    body.parse_mode = params.parseMode;
  }
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const responseBody = await res.text();
    throw new Error(`Telegram API ${res.status}: ${responseBody.slice(0, 200)}`);
  }

  const json: unknown = await res.json();
  if (
    typeof json !== 'object' ||
    json === null ||
    !('ok' in json) ||
    (json as { ok?: unknown }).ok !== true
  ) {
    const description =
      typeof json === 'object' && json !== null && 'description' in json
        ? String((json as { description?: unknown }).description)
        : 'Telegram sendMessage failed';
    logger.error({ description }, 'Telegram sendMessage returned ok=false');
    throw new Error(description);
  }
}

export type NotificationChannel = {
  sendHtml(text: string): Promise<void>;
};

export function createTelegramChannel(params: {
  botToken: string;
  chatId: string;
}): NotificationChannel {
  return {
    sendHtml(text: string): Promise<void> {
      return sendTelegramMessage({
        botToken: params.botToken,
        chatId: params.chatId,
        text,
        parseMode: 'HTML',
      });
    },
  };
}
