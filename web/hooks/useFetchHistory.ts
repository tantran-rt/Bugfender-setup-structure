"use client";

import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { setHistoryData } from "@/redux/slices/appConfig";
import { authToken } from "@/redux/slices/auth";
import { sendLogs } from "@/utils/sendAnalytics.utils";

async function fetchHistoryApi(participant_id: string, pin: string) {
  const response = await fetch("/api/history", {
    method: "POST",
    headers: {
      participant_id,
      pin
    }
  });

  return response.json();
}

export function useFetchHistory(enabled: boolean) {
  const dispatch = useDispatch();
  const { participant_id, pin } = useSelector(authToken);
  const [isLoading, setIsLoading] = useState(false);
  const [isError, setIsError] = useState(false);

  const canFetch = enabled && Boolean(participant_id && pin);

  useEffect(() => {
    if (!canFetch) {
      return;
    }

    const loadHistory = async () => {
      setIsLoading(true);
      setIsError(false);

      try {
        sendLogs(`Fetching history for participant_id: ${participant_id}`);
        const result = await fetchHistoryApi(
          participant_id as string,
          pin as string
        );

        if (result.data?.status === "Success") {
          dispatch(setHistoryData({ ...result.data }));
        } else {
          console.error(
            `Fetch history failed ${result.data?.statusCode}: ${result.data?.message}`
          );
          setIsError(true);
        }
      } catch (error) {
        sendLogs(
          `Error fetching history for participant_id: ${participant_id}`
        );
        console.error(error);
        setIsError(true);
      } finally {
        setIsLoading(false);
      }
    };

    loadHistory();
  }, [canFetch, dispatch, participant_id, pin]);

  return {
    isLoading: canFetch && isLoading,
    isError
  };
}
