"use client";

import { Provider } from "react-redux";
import { store } from "@/redux/store";
import { QueryClient, QueryClientProvider } from "react-query";
import { ReactQueryDevtools } from "react-query/devtools";
import Toastify from "@/components/toastify";
import { usePathname } from "next/navigation";
import { useMemo } from "react";
import { WebVitals } from "@/components/web-vitals";

const environment = process.env.NODE_ENV;

export default function LayoutProvider({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const queryClient = new QueryClient();
  const pathname = usePathname();

  const isTestCollectionPage = /^\/test-collection\/[^/]+$/.test(pathname);

  const toastifyPosition = isTestCollectionPage ? "top-center" : "top-right";

  const isLoggedOut = store.getState().auth.loggedOut;
  const participant_id_memoized = useMemo(
    () => store.getState().auth.participant_id,
    [store.getState().auth.participant_id]
  );

  return (
    <>
      {!isLoggedOut && <Toastify toastifyPosition={toastifyPosition} />}
      {/* @ts-ignore */}
      <WebVitals participant_id={participant_id_memoized as string} />
      <Provider store={store}>
        <QueryClientProvider client={queryClient}>
          <>{children}</>
          {environment === "development" ? (
            <ReactQueryDevtools initialIsOpen={false} position="bottom-right" />
          ) : null}
        </QueryClientProvider>
      </Provider>
    </>
  );
}
