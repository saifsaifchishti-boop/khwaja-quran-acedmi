import { NextResponse } from 'next/server';
import { retryFailed } from '@/lib/email';
import { sendFeeReminders } from '@/lib/reminders';
// Daily cron (vercel.json): retries failed emails and sends fee reminders. Vercel sends "Authorization: Bearer $CRON_SECRET".
export async function GET(req: Request) {
  if (!process.env.CRON_SECRET || req.headers.get('authorization') !== `Bearer ${process.env.CRON_SECRET}`) return new NextResponse('Unauthorized', { status: 401 });
  return NextResponse.json({ retried: await retryFailed(), reminders: await sendFeeReminders() });
}
