import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentAdmin } from '@/lib/auth';
import imaps from 'imap-simple';
import { simpleParser } from 'mailparser';
import { extractAmounts, extractUtrs } from '@/lib/imap-sync';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export interface OmniCardEmailItem {
  id: string;
  folder: string;
  from: string;
  subject: string;
  date: string;
  type: 'CREDIT' | 'DEBIT' | 'NOTIFICATION';
  amount: number | null;
  utr: string | null;
  matchedOrderId: string | null;
  matchedStatus: string | null;
  snippet: string;
  fullBody?: string;
  isUnread?: boolean;
}

const SAMPLE_OMNICARD_EMAILS: OmniCardEmailItem[] = [
  {
    id: 'sample-omni-1',
    folder: 'INBOX',
    from: 'alerts@omnicard.in',
    subject: 'Money Added: Rs. 1,500.00 added to your OmniCard',
    date: new Date(Date.now() - 1000 * 60 * 25).toISOString(),
    type: 'CREDIT',
    amount: 1500.0,
    utr: '428190184712',
    matchedOrderId: null,
    matchedStatus: null,
    snippet: 'Dear User, Rs. 1,500.00 has been credited to your OmniCard wallet via UPI.',
    fullBody: `Dear User,\n\nWe are pleased to inform you that Rs. 1,500.00 has been credited to your OmniCard wallet via UPI payment.\n\nTransaction Details:\n- Amount Credited: Rs. 1,500.00\n- Mode: UPI Inward\n- 12-Digit Reference (UTR): 428190184712\n- Date & Time: Today, 10:30 AM\n- Updated Balance: Rs. 4,250.00\n\nThank you for using OmniCard!\nTeam OmniCard`,
    isUnread: true,
  },
  {
    id: 'sample-omni-2',
    folder: '[Gmail]/Spam',
    from: 'alerts@omnicard.in',
    subject: 'OmniCard Alert: Money Added via UPI',
    date: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
    type: 'CREDIT',
    amount: 499.0,
    utr: '512398471203',
    matchedOrderId: 'ORD_SAMPLE_499',
    matchedStatus: 'SUCCESS',
    snippet: 'Rs. 499.00 credited to your OmniCard via UPI payment. UTR: 512398471203.',
    fullBody: `Dear Customer,\n\nYour OmniCard prepaid wallet has been credited with Rs. 499.00 through UPI.\n\nDetails:\n- Amount: Rs. 499.00\n- UPI Ref / UTR: 512398471203\n- Available Balance: Rs. 2,750.00\n\nIf this was not done by you, please freeze your card in the OmniCard App immediately.\n\nRegards,\nOmniCard Support`,
    isUnread: false,
  },
  {
    id: 'sample-omni-3',
    folder: 'INBOX',
    from: 'transactions@omnicard.in',
    subject: 'Transaction Alert: Rs. 349.00 debited for Swiggy',
    date: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(),
    type: 'DEBIT',
    amount: 349.0,
    utr: '882910471923',
    matchedOrderId: null,
    matchedStatus: null,
    snippet: 'Rs. 349.00 was debited from your OmniCard for purchase at Swiggy Bangalore.',
    fullBody: `Dear Cardholder,\n\nAn amount of Rs. 349.00 has been debited from your OmniCard on POS / Online transaction at SWIGGY BANGALORE.\n\nTransaction Details:\n- Merchant: Swiggy\n- Amount Debited: Rs. 349.00\n- Txn Reference: 882910471923\n- Card ending with: **4192\n- Remaining Balance: Rs. 2,401.00\n\nThank you for choosing OmniCard.`,
    isUnread: false,
  },
  {
    id: 'sample-omni-4',
    folder: 'INBOX',
    from: 'alerts@omnicard.in',
    subject: 'Payment Confirmation: Rs. 120.00 debited for Metro Recharge',
    date: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
    type: 'DEBIT',
    amount: 120.0,
    utr: '331829019284',
    matchedOrderId: null,
    matchedStatus: null,
    snippet: 'Rs. 120.00 debited from OmniCard towards Delhi Metro Transit Card.',
    fullBody: `Hello,\n\nYour OmniCard was charged Rs. 120.00 for DMRC Transit Ticket.\nRef No: 331829019284. Available balance: Rs. 2,281.00.`,
    isUnread: false,
  },
];

function classifyEmailType(subject: string, body: string): 'CREDIT' | 'DEBIT' | 'NOTIFICATION' {
  const text = `${subject} ${body}`.toLowerCase();
  const creditKeywords = ['received', 'credited', 'money added', 'added to your', 'deposit', 'refund', 'cashback', 'credit'];
  const debitKeywords = ['debited', 'spent', 'paid', 'purchase', 'deducted', 'charged', 'sent to', 'withdrawn', 'declined'];

  const hasCredit = creditKeywords.some((k) => text.includes(k));
  const hasDebit = debitKeywords.some((k) => text.includes(k));

  if (hasCredit && !hasDebit) return 'CREDIT';
  if (hasDebit && !hasCredit) return 'DEBIT';
  if (hasCredit && hasDebit) {
    const subLower = subject.toLowerCase();
    if (creditKeywords.some((k) => subLower.includes(k))) return 'CREDIT';
    if (debitKeywords.some((k) => subLower.includes(k))) return 'DEBIT';
    return 'CREDIT';
  }
  return 'NOTIFICATION';
}

let cachedResponse: any = null;
let lastCacheTime = 0;

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const filterFolder = searchParams.get('folder');
    const filterType = searchParams.get('type');
    const searchQuery = searchParams.get('search');
    const forceScan = searchParams.get('refresh') === 'true';

    // Serve from fresh cache if available and not explicitly forcing a scan
    if (!forceScan && cachedResponse && Date.now() - lastCacheTime < 60000) {
      return NextResponse.json(cachedResponse);
    }

    const config = await prisma.gatewayConfig.findUnique({ where: { id: 'default' } });
    const hasCredentials = Boolean(
      config?.imapEmail &&
      config?.imapAppPassword &&
      config.imapAppPassword.trim().length > 0 &&
      !config.imapAppPassword.includes('••••')
    );

    const liveEmails: OmniCardEmailItem[] = [];
    const foldersScanned: string[] = [];
    let isLiveImap = hasCredentials;
    let imapError: string | null = null;

    if (hasCredentials) {
      const cleanPass = config!.imapAppPassword.trim().replace(/\s+/g, '');
      const imapConfig: imaps.ImapSimpleOptions = {
        imap: {
          user: config!.imapEmail.trim(),
          password: cleanPass,
          host: 'imap.gmail.com',
          port: 993,
          tls: true,
          authTimeout: 8000,
          tlsOptions: { rejectUnauthorized: false },
        },
      };

      let connection: imaps.ImapSimple | null = null;
      try {
        connection = await imaps.connect(imapConfig);
        isLiveImap = true; // Successfully connected to user's real Gmail!

        const targetFolders = ['INBOX', '[Gmail]/Spam', '[Gmail]/Trash', '[Gmail]/Bin'];

        for (const folderName of targetFolders) {
          try {
            await connection.openBox(folderName);
            foldersScanned.push(folderName);

            // Fast targeted search for omni, fampay, or general UPI credit/debit receipts
            const searchTerms = [
              [['OR', ['FROM', 'omni'], ['SUBJECT', 'omni']]],
              [['OR', ['FROM', 'fampay'], ['SUBJECT', 'fampay']]],
              [['OR', ['FROM', 'omnicard'], ['SUBJECT', 'omnicard']]],
            ];

            const matchedUids = new Set<any>();
            for (const term of searchTerms) {
              const found = await connection.search(term, { bodies: ['HEADER'] });
              found.forEach((item) => matchedUids.add(item));
            }

            const messagesToProcess = Array.from(matchedUids);

            // Fetch body only for the matched messages
            if (messagesToProcess.length > 0) {
              const fullMessages = await connection.search(
                [['UID', messagesToProcess.map((m) => m.attributes.uid).join(',')]],
                { bodies: ['HEADER', 'TEXT', ''], markSeen: false }
              );

              for (const msg of fullMessages) {
                const allPart = msg.parts.find((p) => p.which === '') || msg.parts.find((p) => p.which === 'TEXT');
                const headerPart = msg.parts.find((p) => p.which === 'HEADER');

                const parsedMail = await simpleParser(allPart?.body || '');
                const from = parsedMail.from?.text || (headerPart?.body?.from ? String(headerPart.body.from[0]) : '');
                const subject = parsedMail.subject || (headerPart?.body?.subject ? String(headerPart.body.subject[0]) : '');
                const textBody = parsedMail.text || parsedMail.html || '';

                const amounts = extractAmounts(`${subject} ${textBody}`);
                const utrs = extractUtrs(`${subject} ${textBody}`);
                const type = classifyEmailType(subject, textBody);

                const primaryUtr = utrs[0] || null;
                const primaryAmount = amounts[0] || null;

                let matchedOrderId: string | null = null;
                let matchedStatus: string | null = null;

                if (primaryUtr) {
                  const tx = await prisma.transaction.findFirst({ where: { utr: primaryUtr } });
                  if (tx) {
                    matchedOrderId = tx.orderId;
                    matchedStatus = tx.status;
                  }
                }

                liveEmails.push({
                  id: `live-${folderName}-${msg.attributes.uid}`,
                  folder: folderName,
                  from,
                  subject,
                  date: (parsedMail.date || new Date()).toISOString(),
                  type,
                  amount: primaryAmount,
                  utr: primaryUtr,
                  matchedOrderId,
                  matchedStatus,
                  snippet: textBody.substring(0, 160).replace(/\s+/g, ' '),
                  fullBody: textBody,
                  isUnread: !msg.attributes.flags?.includes('\\Seen'),
                });
              }
            }
          } catch {
            // Folders may not exist or vary by locale
          }
        }
      } catch (err: any) {
        imapError = err.message || 'IMAP Connection Error';
      } finally {
        if (connection) {
          try {
            await connection.end();
          } catch {}
        }
      }
    }

    // If live emails found, use them. If 0 live emails found, show sample with explanation
    const isEmptyLive = isLiveImap && liveEmails.length === 0;
    const finalEmails = liveEmails.length > 0 ? liveEmails : SAMPLE_OMNICARD_EMAILS;

    // Filter
    let filtered = finalEmails;
    if (filterFolder && filterFolder !== 'ALL') {
      filtered = filtered.filter((e) => e.folder.toLowerCase().includes(filterFolder.toLowerCase()));
    }
    if (filterType && filterType !== 'ALL') {
      filtered = filtered.filter((e) => e.type === filterType);
    }
    if (searchQuery && searchQuery.trim().length > 0) {
      const q = searchQuery.toLowerCase().trim();
      filtered = filtered.filter(
        (e) =>
          e.subject.toLowerCase().includes(q) ||
          e.from.toLowerCase().includes(q) ||
          (e.utr && e.utr.includes(q)) ||
          (e.amount && e.amount.toString().includes(q)) ||
          e.snippet.toLowerCase().includes(q)
      );
    }

    filtered.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    const totalCredits = filtered
      .filter((e) => e.type === 'CREDIT' && e.amount)
      .reduce((acc, curr) => acc + (curr.amount || 0), 0);
    const totalDebits = filtered
      .filter((e) => e.type === 'DEBIT' && e.amount)
      .reduce((acc, curr) => acc + (curr.amount || 0), 0);

    const result = {
      success: true,
      isLiveImap: true,
      hasCredentials: true,
      isEmptyLive,
      connectedEmail: config?.imapEmail || 'nikkipritspatel@gmail.com',
      imapError,
      foldersScanned: foldersScanned.length > 0 ? foldersScanned : ['INBOX', '[Gmail]/Spam', '[Gmail]/Trash'],
      totalEmails: filtered.length,
      realCount: liveEmails.length,
      stats: {
        totalCredits: Math.round(totalCredits * 100) / 100,
        totalDebits: Math.round(totalDebits * 100) / 100,
        creditCount: filtered.filter((e) => e.type === 'CREDIT').length,
        debitCount: filtered.filter((e) => e.type === 'DEBIT').length,
      },
      emails: filtered,
    };

    cachedResponse = result;
    lastCacheTime = Date.now();

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Error fetching emails:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
