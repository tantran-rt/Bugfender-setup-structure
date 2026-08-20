import { NextRequest, NextResponse } from "next/server";
import axios from "@/utils/axios";
import * as Sentry from "@sentry/nextjs";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const participant_id = body.participant_id;
    const pin = body.pin;
    const photo_id = body.photo_id;
    const res = await axios.post(
      "/ProofPassImage2",
      {},
      { headers: { participant_id, pin, photo_id } }
    );
    if (res.status === 200) {
      return NextResponse.json({ data: res.data }, { status: 200 });
    } else {
      console.error(res.data.message);
    }
  } catch (error: any) {
    console.error(error.response?.data?.msg);
    Sentry.captureException(error.response?.data?.msg);

    return NextResponse.error();
  }
}
