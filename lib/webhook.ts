export interface WebhookPayload {
  event: 'PAYMENT_SUCCESS';
  orderId: string;
  amount: number;
  utr: string | null;
  status: string;
  timestamp: string;
}

export async function fireWebhook(webhookUrl: string, payload: WebhookPayload): Promise<{ success: boolean; status?: number; error?: string }> {
  if (!webhookUrl || !webhookUrl.startsWith('http')) {
    return { success: false, error: 'No valid webhook URL configured' };
  }

  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Unofficial-UPI-Gateway-Webhooks/1.0',
        'X-Gateway-Event': payload.event,
      },
      body: JSON.stringify(payload),
    });

    return {
      success: response.ok,
      status: response.status,
      error: response.ok ? undefined : `HTTP error: ${response.status} ${response.statusText}`,
    };
  } catch (err: any) {
    console.error(`Failed to dispatch webhook to ${webhookUrl}:`, err);
    return {
      success: false,
      error: err.message || 'Unknown network error during webhook dispatch',
    };
  }
}
