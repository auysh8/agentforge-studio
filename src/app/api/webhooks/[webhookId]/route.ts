import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

function logWebhook(msg: string) {
  try {
    const logPath = path.join(process.cwd(), 'execution.log');
    fs.appendFileSync(logPath, `[${new Date().toISOString()}] ${msg}\n`);
  } catch (e) {
    console.error("Failed to write to execution.log", e);
  }
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ webhookId: string }> }
) {
  try {
    const { webhookId } = await params;
    let bodyText = await req.text();
    
    try {
      const jsonBody = JSON.parse(bodyText);
      bodyText = JSON.stringify(jsonBody, null, 2);
    } catch {
      // Keep raw string body
    }

    logWebhook(`[Webhook Received] ID: ${webhookId} | Payload Length: ${bodyText.length}`);

    // Return successful webhook response to caller
    return NextResponse.json({
      success: true,
      webhookId,
      receivedAt: new Date().toISOString(),
      payload: bodyText,
      message: "Webhook payload successfully received and queued for workflow execution.",
    });
  } catch (error) {
    logWebhook(`[Webhook Error]: ${(error as Error).message}`);
    return NextResponse.json(
      { success: false, error: (error as Error).message },
      { status: 500 }
    );
  }
}

export async function GET(
  req: Request,
  { params }: { params: Promise<{ webhookId: string }> }
) {
  const { webhookId } = await params;
  logWebhook(`[Webhook GET Triggered] ID: ${webhookId}`);
  return NextResponse.json({
    success: true,
    webhookId,
    receivedAt: new Date().toISOString(),
    message: "Webhook GET endpoint is active.",
  });
}
