import { NextRequest, NextResponse } from "next/server";
import redis from "@/utils/redis";
import { parseAamvaData } from "@/utils/utils";

interface ScanRequestBody {
  participantId: string;
  data?: object | string;
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as ScanRequestBody;
    const { participantId, data } = body;

    if (!participantId || !data) {
      return NextResponse.json(
        { error: "Invalid request payload" },
        { status: 400 }
      );
    }

    if (typeof data === "object" && "capturedImage" in data) {
      await saveToRedis(participantId, data);
    } else if (typeof data === "object") {
      await saveToRedis(participantId, data);
    } else {
      return NextResponse.json(
        { error: "Invalid data format" },
        { status: 400 }
      );
    }

    return NextResponse.json({ message: "Scanned data received successfully" });
  } catch (error) {
    console.error("Error processing request:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// Helper function to save data to Redis
const saveToRedis = async (key: string, value: unknown) => {
  await redis.set(key, JSON.stringify(value));
};

// Helper function to parse driver license data
const parseDriverLicense = (barcodeData: string) => {
  const extractField = (data: string, key: string) => {
    const regex = new RegExp(`${key}([^\n\r]+)`);
    const match = data.match(regex);
    return match ? match[1].trim() : null;
  };

  const result = {
    last_name: extractField(barcodeData, "DCS"), // Last name
    first_name: extractField(barcodeData, "DAC"), // First name
    date_of_birth: extractField(barcodeData, "DBB"), // Birthdate
    gender: extractField(barcodeData, "DBC"), // Gender (1 = Male, 2 = Female)
    eye_color: extractField(barcodeData, "DAY"), // Eye color
    height: extractField(barcodeData, "DAU"), // Height
    address: extractField(barcodeData, "DAG"), // Street address
    city: extractField(barcodeData, "DAI"), // City
    state: extractField(barcodeData, "DAJ"), // State
    zipcode: extractField(barcodeData, "DAK"), // ZIP Code
  };
  console.log("parseDriverLicense", result);
  return result;
};
