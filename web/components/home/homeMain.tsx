"use client";

import dynamic from 'next/dynamic';

import { Loader } from '@/components';

const DynamicCameraIDCardDetection = dynamic(() => import('./homeMainWrap'), {
  loading: () => <Loader />,
  ssr: false,
})

export default DynamicCameraIDCardDetection;