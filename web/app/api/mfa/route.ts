import { NextResponse, type NextRequest } from "next/server";
import Twilio from "twilio";
import * as Sentry from "@sentry/nextjs";

export async function POST(request: NextRequest) {
  const client = Twilio(
    process.env.NEXT_TWILIO_ACCOUNTSID as string,
    process.env.NEXT_TWILIO_AUTHTOKEN as string
  );

  const VERIFY_SERVICE_SID = process.env.NEXT_VERIFY_SERVICE_SID;

  try {
    const { phoneNumber } = await request.json();
    if (!phoneNumber) {
      return NextResponse.json(
        { error: "Phone number is required" },
        { status: 400 }
      );
    }

    // Send verification code
    const response = await client.verify.v2
      .services(VERIFY_SERVICE_SID as string)
      .verifications.create({
        to: phoneNumber,
        channel: "sms",
      });

    // console.log("Verification response:", response);
    return NextResponse.json({ data: response }, { status: 200 });
  } catch (error: any) {
    console.error("Error in sending SMS:", error);
    Sentry.captureException(error);

    return NextResponse.json(
      { error: error.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}
