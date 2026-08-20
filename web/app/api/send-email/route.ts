import { NextRequest, NextResponse } from "next/server";
import { emailTestResults } from "@/mail/email-templates";
import sendEmail from "@/mail/mailer";
import * as Sentry from "@sentry/nextjs";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const html = emailTestResults(
      body.participant_id,
      body.date,
      body.kit,
      body.confirmation_no,
      body.videoLink,
      body.face_scan_score,
      body.detections,
      body.config
    );

    const res = await sendEmail(
      "joshuaeseigbe@punch.agency",
      "Test Results",
      html
    );
    const mail1 = await sendEmail(
      "oluwatomisin@punch.agency",
      "Test Results",
      html
    );
    const mail2 = await sendEmail(
      "techsupport@recoverytrek.com",
      "Test Results",
      html
    );

    // console.log(res);

    return NextResponse.json({ data: [res, mail1, mail2] }, { status: 200 });
  } catch (error: any) {
    console.error("Send Mail Error:", error);
    Sentry.captureException(error);
    return NextResponse.error();
  }
}
