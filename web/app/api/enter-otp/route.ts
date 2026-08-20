import { NextResponse, type NextRequest } from 'next/server';
import * as Sentry from "@sentry/nextjs";
import axios from "@/utils/axios";

// Login Route: facilitates login
export async function POST(request: NextRequest) {
    try {
        const requestHeaders = new Headers(request.headers)
        const change_code = requestHeaders.get("change_code");

        const res = await axios.post("/RequestValidateChangePasswordCode", {}, { headers: { change_code } });
        if (res.status === 200) {
            return NextResponse.json({ data: res.data }, { status: 200 });
        } else {
            console.error(res.data);
            return NextResponse.json({ data: res.data }, { status: res.status });
        }
    } catch (error: any) {
        console.error('OTP Server Error:', error);
        Sentry.captureException(error);
        return NextResponse.json({ error: error }, { status: 500 });
    }
}