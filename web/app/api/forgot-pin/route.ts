import { NextResponse, type NextRequest } from 'next/server';
import * as Sentry from "@sentry/nextjs";
import axios from "@/utils/axios";

// Login Route: facilitates login
export async function POST(request: NextRequest) {
    try {
        const requestHeaders = new Headers(request.headers)
        const participant_id = requestHeaders.get("participant_id");

        const res = await axios.post("/RequestPasswordResetCode", {}, { headers: { participant_id } });
        if (res.status === 200) {
            return NextResponse.json({ data: res.data }, { status: 200 });
        } else {
            console.error(res.data);
            return NextResponse.json({ data: res.data }, { status: res.status });
        }
    } catch (error: any) {
        console.error('FP Server Error:', error);
        Sentry.captureException(error);
        return NextResponse.json({ error: error }, { status: 500 });
    }
}