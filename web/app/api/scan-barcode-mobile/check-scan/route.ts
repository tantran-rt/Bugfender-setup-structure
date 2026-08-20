import redis from '@/utils/redis';
import { RedisKey } from 'ioredis';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
    // Extract searchParams from the URL
    const { searchParams } = new URL(req.url);
    const key: RedisKey = searchParams.get('participantId') as RedisKey;
    try {
        // Fetch value from Redis using the key
        const value = await redis.get(key);

        if (value) {
            return NextResponse.json({ key, value });
        } else {
            return NextResponse.json({ message: 'Key not found' }, { status: 404 });
        }
    } catch (error) {
        console.error('Error fetching data from Redis:', error);
        return NextResponse.json({ message: 'Error fetching data' }, { status: 500 });
    }
}
