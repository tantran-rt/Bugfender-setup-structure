"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Loader_ } from "@/components";

function NewToProof() {
  const [loading, setLoading] = useState(true);

  const handleLoad = () => {
    setLoading(false);
  };

  return (
    <div className="container">
      <div className="back">
        <Link href="/auth/sign-in/">
          <Image
            src="/images/arrow-back.png"
            alt="Back"
            width={20}
            height={20}
            loading="lazy"
          />
        </Link>
      </div>

      {loading && <Loader_ />}

      <div style={{ width: "100%", height: "100vh" }}>
        <iframe
          src=""
          style={{
            width: "100%",
            height: "100%",
            border: "none",
            display: loading ? "none" : "block"
          }}
          title="Contact Us Page"
          onLoad={handleLoad}
        />
      </div>
    </div>
  );
}

export default NewToProof;
