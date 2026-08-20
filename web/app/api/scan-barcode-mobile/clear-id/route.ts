import redis from "@/utils/redis";
import { RedisKey } from "ioredis";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  // Extract searchParams from the URL
  const { searchParams } = new URL(req.url);
  const key: RedisKey = searchParams.get("participantId") as RedisKey;
  try {
    // // Parse the request body as JSON
    // const { key } = await req.json();
    // console.log("Key", key)

    // // await redis.set(key, value);
    // const delRes3 = await redis.del([key]);

    return NextResponse.json({ message: "Data saved successfully!" });
  } catch (error) {
    console.error("Error saving data to Redis:", error);
    return NextResponse.json({ message: "Error saving data" }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  // Extract searchParams from the URL
  const { searchParams } = new URL(req.url);
  const key: RedisKey = searchParams.get("participantId") as RedisKey;
  try {
    const delId = await redis.del([key]);

    if (delId) {
      console.log("Participant ID deletion success");
      return NextResponse.json({ message: "participant Id deletion success" });
    } else {
      return NextResponse.json({ message: "Key not found" }, { status: 404 });
    }
  } catch (error) {
    console.error("Error fetching data from Redis:", error);
    return NextResponse.json(
      { message: "Error fetching data" },
      { status: 500 }
    );
  }
}
