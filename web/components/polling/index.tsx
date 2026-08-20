"use client"
import { useSelector } from 'react-redux';
import { usePolling } from '@/hooks/usePolling';
import React, { useEffect, useState } from 'react';
import { selectUserSessionId } from '@/redux/slices/appConfig';
import IDCard from '../IDCard';
import { Loader_ } from '..';
import Link from 'next/link';


interface PollForScanDataProps {
    sessionId: string;
}

type IDDetails = {
    first_name: string;
    last_name: string;
    date_of_birth: string;
    address: string;
    city: string;
    state: string;
    zipcode: string;
}
const PollingComponent = ({ sessionId }: PollForScanDataProps) => {
    const [data, setData] = useState<object>({});
    const [idData, setIdData] = useState<object>();
    const [loading, setLoading] = useState(true);
    const [scan, setScan] = useState(false);
    const userSessionId = useSelector(selectUserSessionId);
    useEffect(() => {
        console.log("User Session ID from Redux: ", userSessionId);
    }, [userSessionId]);

    const fetchData = async () => {
        setLoading(true); // Start loading
        try {
            const response = await fetch(`/api/scan-barcode-mobile/check-scan?participantId=${sessionId}`);
            if (!response.ok) {
                const errorMessage = await response.text();
                console.error('Error fetching data:', errorMessage);
                setData({});
                return;
            }

            const result = await response.json();
            console.log(JSON.parse(result.value))
            setData(JSON.parse(result?.value));
            setScan(true)
        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setLoading(false); // Stop loading
        }
    };

    // Use the polling hook, polling every 5 seconds (5000ms)
    usePolling(fetchData, 5000);
    useEffect(() => {
        if (scan) {
            setIdData(data)
        }
    }, [data, scan]);
    return (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "50px", width: "100%" }}>
            {loading ? <Loader_ /> : ""}
            {scan && <IDCard idDetails={idData} />}
            <Link href={""}></Link>
        </div>
    );
};

export default PollingComponent;
