import { useCallback, useRef, useState } from "react";
import { useDispatch } from "react-redux";
import { toast } from "react-toastify";
import { GetObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { fromCognitoIdentityPool } from "@aws-sdk/credential-provider-cognito-identity";
import { CognitoIdentityClient } from "@aws-sdk/client-cognito-identity";
import { saveTestClip, clearParts } from "@/redux/slices/drugTest";
import { trimSpecialCharacters } from "@/utils/stringUtils";
import { completeMultipartUpload } from "../app/test-collection/[slug]/action";
import { sendLogs } from "@/utils/sendAnalytics.utils";

const identityPoolId = process.env
  .NEXT_PUBLIC_COGNITO_IDENTITY_POOL_ID as string;
const region = process.env.NEXT_PUBLIC_AWS_S3_REGION as string;
const BUCKET_NAME = process.env.NEXT_PUBLIC_AWS_S3_BUCKET_NAME_VIDEOS as string;

const credentials = fromCognitoIdentityPool({
  client: new CognitoIdentityClient({ region }),
  identityPoolId
});

const s3Client = new S3Client({
  region,
  credentials
});

interface UseMultipartUploadProps {
  filename: string;
  uploadId: string;
  partNumber: number;
  completedParts: Array<{ ETag: string; PartNumber: number }>;
}

interface UseMultipartUploadReturn {
  completeMultipart: () => Promise<void>;
  signedUrl: string | null;
  partsCompleted: boolean;
}

export const useMultipartUpload = ({
  filename,
  uploadId,
  partNumber,
  completedParts
}: UseMultipartUploadProps): UseMultipartUploadReturn => {
  const dispatch = useDispatch();
  const [signedUrl, setSignedUrl] = useState<string | null>(null);
  const [partsCompleted, setPartsCompleted] = useState<boolean>(false);
  const isCompletingRef = useRef(false);

  const completeMultipart = useCallback(async () => {
    if (isCompletingRef.current || partsCompleted) {
      sendLogs("completeMultipart skipped: already in progress or completed");
      return;
    }
    isCompletingRef.current = true;

    const keyFilename = trimSpecialCharacters(filename);

    try {
      // Sort parts to ensure correct order
      const sortedParts = [...completedParts].sort(
        (a, b) => a.PartNumber - b.PartNumber
      );

      // Now proceed with completing the multipart upload
      console.log(
        "All chunks verified, proceeding with multipart upload completion"
      );

      // Verify we have all parts in sequence
      for (let i = 1; i <= partNumber; i++) {
        if (!sortedParts.find((part) => part.PartNumber === i)) {
          toast.error(`Missing part ${i} in sequence`);
          sendLogs(`Missing part ${i} in sequence`);
          isCompletingRef.current = false;
          return;
        }
      }

      const response = await completeMultipartUpload(
        uploadId,
        keyFilename,
        sortedParts
      );

      if (response.$metadata.httpStatusCode === 200) {
        const command = new GetObjectCommand({
          Bucket: BUCKET_NAME,
          Key: keyFilename
        });
        const url = await getSignedUrl(s3Client, command, { expiresIn: 36000 });
        console.log(
          "Video has been uploaded to S3 successfully: ",
          keyFilename
        );

        dispatch(saveTestClip(url));
        setSignedUrl(url);
        dispatch(clearParts());
        setPartsCompleted(true);
      } else {
        sendLogs(
          `Failed to complete multipart upload: ${JSON.stringify(response)}`
        );
        isCompletingRef.current = false;
      }
    } catch (error) {
      isCompletingRef.current = false;
      console.error("Error completing S3 upload:", error);
      toast.error("Upload completion failed. Please try again.");
      throw error;
    }
  }, [
    filename,
    uploadId,
    partNumber,
    completedParts,
    dispatch,
    partsCompleted
  ]);

  return {
    completeMultipart,
    signedUrl,
    partsCompleted
  };
};
