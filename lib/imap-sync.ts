import imaps from 'imap-simple';
import { simpleParser } from 'mailparser';
import prisma from './prisma';
import { fireWebhook } from './webhook';

export interface EmailParsedData {
  folder: string;
  subject: string;
  from: string;
  date: Date;
  amounts: number[];
  utrs: string[];
  rawSnippet: string;
}

export interface MatchedResult {
  orderId: string;
  amount: number;
  utr: string;
  folder: string;
  webhookDelivered: boolean;
  webhookError?: string;
}

export interface SyncResponse {
  success: boolean;
  foldersScanned: string[];
  totalEmailsInspected: number;
  matchedCount: number;
  matchedTransactions: MatchedResult[];
  errors: string[];
  log: string[];
}

export interface MockEmailInput {
  folder?: string;
  from: string;
  subject: string;
  body: string;
}

// Regex patterns for Indian UPI (OmniCard / FamPay / Banking)
// Matches keyword-prefixed IDs (10 to 24 chars, e.g. OmniCard 18-digit Transaction ID or 12-digit UTR)
const UTR_KEYWORD_REGEX = /(?:utr|rrn|upi\s*ref(?:erence)?|ref(?:\s*no\.?)?|txn(?:\s*id)?|transaction\s*id)[\s:#-]*([0-9a-zA-Z]{10,24})\b/gi;
const GENERAL_12_DIGIT_REGEX = /\b([0-9]{12})\b/g;

const AMOUNT_PATTERNS = [
  /(?:received|credited|added|amount(?: of)?|paid)\s*(?:of)?\s*(?:₹|rs\.?|inr)?\s*([0-9,]+(?:\.[0-9]{1,2})?)/gi,
  /(?:₹|rs\.?|inr)\s*([0-9,]+(?:\.[0-9]{1,2})?)/gi,
];

// Helper to extract transaction amounts from text (ignoring balance updates)
export function extractAmounts(text: string): number[] {
  // Strip out balance sentences like "Updated balance is Rs.0.00" so balance doesn't collide with transaction amount
  const cleanedText = text.replace(
    /(?:updated\s*balance|available\s*balance|balance\s*is|bal\b)[^0-9]*rs\.?\s*[0-9,]+(?:\.[0-9]{1,2})?/gi,
    ''
  );

  const found = new Set<number>();
  for (const pattern of AMOUNT_PATTERNS) {
    let match;
    while ((match = pattern.exec(cleanedText)) !== null) {
      const cleanNum = match[1].replace(/,/g, '');
      const parsed = parseFloat(cleanNum);
      if (!isNaN(parsed) && parsed > 0 && parsed < 10000000) {
        found.add(parsed);
      }
    }
  }
  return Array.from(found);
}

// Helper to extract UTRs or OmniCard Transaction IDs from text
export function extractUtrs(text: string): string[] {
  const utrs = new Set<string>();

  // 1. Try keyword-specific Transaction IDs / UTRs first
  let match;
  while ((match = UTR_KEYWORD_REGEX.exec(text)) !== null) {
    if (match[1] && match[1].length >= 10) {
      utrs.add(match[1]);
    }
  }

  // 2. Try general 12-digit sequences if none found
  if (utrs.size === 0) {
    while ((match = GENERAL_12_DIGIT_REGEX.exec(text)) !== null) {
      if (match[1] && match[1].length === 12) {
        utrs.add(match[1]);
      }
    }
  }

  return Array.from(utrs);
}

// Filter to check if email is from OmniCard, FamPay, or relevant UPI notifications
export function isRelevantSender(from: string, subject: string, body: string): boolean {
  const combined = `${from} ${subject} ${body}`.toLowerCase();
  const keywords = ['omnicard', 'omni', 'fampay', 'famapp', 'fam pay', 'triotech', 'upi', 'razorpay', 'paytm'];
  return keywords.some((k) => combined.includes(k));
}

// Core reconciliation matching engine
export async function processEmailData(
  parsedEmail: EmailParsedData,
  logs: string[]
): Promise<MatchedResult[]> {
  const results: MatchedResult[] = [];

  logs.push(
    `[Inspect] Folder: ${parsedEmail.folder} | Sender: ${parsedEmail.from} | Subject: "${parsedEmail.subject}" | Detected Amounts: [${parsedEmail.amounts.join(', ')}] | Detected UTRs: [${parsedEmail.utrs.join(', ')}]`
  );

  if (parsedEmail.amounts.length === 0 || parsedEmail.utrs.length === 0) {
    logs.push(`[Skip] Missing either valid amount or 12-digit UTR in email.`);
    return results;
  }

  const selectedUtr = parsedEmail.utrs[0];

  // Prevent replay attacks: ensure UTR hasn't already been credited
  const alreadyProcessed = await prisma.transaction.findFirst({
    where: { utr: selectedUtr, status: 'SUCCESS' },
  });

  if (alreadyProcessed) {
    logs.push(`[Ignored] UTR ${selectedUtr} has already been reconciled with Order ID: ${alreadyProcessed.orderId}.`);
    return results;
  }

  // Fetch all pending transactions (unexpired or within recent window)
  const pendingTransactions = await prisma.transaction.findMany({
    where: {
      status: 'PENDING',
    },
    orderBy: { createdAt: 'desc' },
  });

  if (pendingTransactions.length === 0) {
    logs.push(`[No Match] No PENDING transactions found in database.`);
    return results;
  }

  // Attempt to match by amount
  for (const emailAmount of parsedEmail.amounts) {
    const matchedTx = pendingTransactions.find(
      (tx) => Math.abs(tx.amount - emailAmount) < 0.01 && tx.status === 'PENDING'
    );

    if (matchedTx) {
      logs.push(
        `[MATCH FOUND] Matched Order ${matchedTx.orderId} for ₹${matchedTx.amount} with UTR ${selectedUtr}`
      );

      // Update Database
      await prisma.transaction.update({
        where: { id: matchedTx.id },
        data: {
          status: 'SUCCESS',
          utr: selectedUtr,
        },
      });

      // Fetch gateway configuration for webhookUrl
      const config = await prisma.gatewayConfig.findUnique({
        where: { id: 'default' },
      });

      let webhookDelivered = false;
      let webhookError: string | undefined;

      if (config?.webhookUrl) {
        logs.push(`[Webhook] Dispatching webhook to ${config.webhookUrl}...`);
        const hookRes = await fireWebhook(config.webhookUrl, {
          event: 'PAYMENT_SUCCESS',
          orderId: matchedTx.orderId,
          amount: matchedTx.amount,
          utr: selectedUtr,
          status: 'SUCCESS',
          timestamp: new Date().toISOString(),
        });

        webhookDelivered = hookRes.success;
        webhookError = hookRes.error;
        logs.push(
          hookRes.success
            ? `[Webhook] Successfully notified merchant webhook!`
            : `[Webhook Warning] Webhook failed: ${hookRes.error}`
        );
      } else {
        logs.push(`[Webhook] No webhook URL configured, skipping notification.`);
      }

      results.push({
        orderId: matchedTx.orderId,
        amount: matchedTx.amount,
        utr: selectedUtr,
        folder: parsedEmail.folder,
        webhookDelivered,
        webhookError,
      });

      // Mark matchedTx as non-pending for remaining amounts in this email
      matchedTx.status = 'SUCCESS';
      break; // Matched one transaction per email receipt
    }
  }

  return results;
}

/**
 * Triggers IMAP multi-folder synchronization.
 * Supports iterating across 'INBOX', '[Gmail]/Spam', and '[Gmail]/Trash' (or '[Gmail]/Bin').
 * Also supports mockEmails parameter for integration testing and sandbox runs.
 */
export async function triggerImapSync(options?: {
  mockEmails?: MockEmailInput[];
}): Promise<SyncResponse> {
  const logs: string[] = [];
  const errors: string[] = [];
  const matchedTransactions: MatchedResult[] = [];
  let totalEmailsInspected = 0;
  const foldersScanned: string[] = [];

  logs.push(`[Init] Starting IMAP Verification Sync engine at ${new Date().toISOString()}`);

  // Check for mock emails simulation mode
  if (options?.mockEmails && options.mockEmails.length > 0) {
    logs.push(`[Mode] Executing in Mock Simulation Mode with ${options.mockEmails.length} sample emails.`);
    for (const mock of options.mockEmails) {
      const folderName = mock.folder || 'INBOX';
      if (!foldersScanned.includes(folderName)) foldersScanned.push(folderName);
      totalEmailsInspected++;

      const isRelevant = isRelevantSender(mock.from, mock.subject, mock.body);
      if (!isRelevant) {
        logs.push(`[Skip] Mock email from ${mock.from} does not match OmniCard/FamPay/UPI criteria.`);
        continue;
      }

      const amounts = extractAmounts(`${mock.subject} ${mock.body}`);
      const utrs = extractUtrs(`${mock.subject} ${mock.body}`);

      const results = await processEmailData(
        {
          folder: folderName,
          subject: mock.subject,
          from: mock.from,
          date: new Date(),
          amounts,
          utrs,
          rawSnippet: mock.body.substring(0, 150),
        },
        logs
      );

      matchedTransactions.push(...results);
    }

    return {
      success: true,
      foldersScanned,
      totalEmailsInspected,
      matchedCount: matchedTransactions.length,
      matchedTransactions,
      errors,
      log: logs,
    };
  }

  // Live IMAP Mode
  const config = await prisma.gatewayConfig.findUnique({
    where: { id: 'default' },
  });

  if (!config || !config.imapEmail || !config.imapAppPassword) {
    const msg = 'IMAP credentials not configured. Please set imapEmail and imapAppPassword in Admin Settings.';
    errors.push(msg);
    logs.push(`[Error] ${msg}`);
    return {
      success: false,
      foldersScanned,
      totalEmailsInspected,
      matchedCount: 0,
      matchedTransactions,
      errors,
      log: logs,
    };
  }

  // Gmail IMAP Configuration
  const imapConfig: imaps.ImapSimpleOptions = {
    imap: {
      user: config.imapEmail.trim(),
      password: config.imapAppPassword.trim().replace(/\s+/g, ''), // Strip spaces from Google App Passwords
      host: 'imap.gmail.com',
      port: 993,
      tls: true,
      authTimeout: 10000,
      tlsOptions: { rejectUnauthorized: false },
    },
  };

  let connection: imaps.ImapSimple | null = null;

  try {
    logs.push(`[Connect] Connecting to imap.gmail.com:993 as ${config.imapEmail}...`);
    connection = await imaps.connect(imapConfig);
    logs.push(`[Connect] Authenticated successfully with Gmail IMAP server!`);

    // Target folders required by the specification:
    // INBOX, [Gmail]/Spam, and [Gmail]/Trash or [Gmail]/Bin
    const targetFolders = ['INBOX', '[Gmail]/Spam', '[Gmail]/Trash', '[Gmail]/Bin'];

    for (const folderName of targetFolders) {
      logs.push(`\n[Folder] Switching to folder: "${folderName}"...`);
      try {
        await connection.openBox(folderName);
        foldersScanned.push(folderName);
        logs.push(`[Folder] Opened "${folderName}" successfully.`);

        // Search for UNSEEN emails
        const searchCriteria = ['UNSEEN'];
        const fetchOptions = {
          bodies: ['HEADER', 'TEXT', ''],
          markSeen: false, // We will mark as seen only if successfully reconciled or after review
        };

        const messages = await connection.search(searchCriteria, fetchOptions);
        logs.push(`[Folder] Found ${messages.length} UNSEEN email(s) in "${folderName}".`);

        for (const message of messages) {
          totalEmailsInspected++;
          const allPart = message.parts.find((part) => part.which === '') || message.parts.find((part) => part.which === 'TEXT');
          const headerPart = message.parts.find((part) => part.which === 'HEADER');

          const rawBody = allPart?.body || '';
          const parsedMail = await simpleParser(rawBody);

          const from = parsedMail.from?.text || (headerPart?.body?.from ? String(headerPart.body.from[0]) : '');
          const subject = parsedMail.subject || (headerPart?.body?.subject ? String(headerPart.body.subject[0]) : '');
          const textBody = parsedMail.text || parsedMail.html || '';

          if (!isRelevantSender(from, subject, textBody)) {
            logs.push(`[Filtered] Email from "${from}" does not match OmniCard/FamPay/UPI keywords.`);
            continue;
          }

          const amounts = extractAmounts(`${subject} ${textBody}`);
          const utrs = extractUtrs(`${subject} ${textBody}`);

          const matches = await processEmailData(
            {
              folder: folderName,
              subject,
              from,
              date: parsedMail.date || new Date(),
              amounts,
              utrs,
              rawSnippet: textBody.substring(0, 150),
            },
            logs
          );

          if (matches.length > 0) {
            matchedTransactions.push(...matches);
            // Mark email as SEEN now that it has been reconciled
            try {
              await connection.addFlags(message.attributes.uid, ['\\Seen']);
              logs.push(`[IMAP] Marked message UID ${message.attributes.uid} as \\Seen.`);
            } catch (flagErr: any) {
              logs.push(`[Warning] Could not mark message as seen: ${flagErr.message}`);
            }
          }
        }
      } catch (boxError: any) {
        // Not all accounts have [Gmail]/Bin if they use [Gmail]/Trash, or Spam may be named differently
        logs.push(`[Folder Notice] Could not open or search "${folderName}": ${boxError.message}`);
      }
    }
  } catch (err: any) {
    const errorMsg = `IMAP Connection Error: ${err.message || 'Unknown error'}`;
    errors.push(errorMsg);
    logs.push(`[Fatal] ${errorMsg}`);
  } finally {
    if (connection) {
      try {
        await connection.end();
        logs.push(`[Disconnect] IMAP connection closed safely.`);
      } catch {
        // safe ignore
      }
    }
  }

  return {
    success: errors.length === 0,
    foldersScanned,
    totalEmailsInspected,
    matchedCount: matchedTransactions.length,
    matchedTransactions,
    errors,
    log: logs,
  };
}
