//Data shown at the landing page
export const welcomeData = [
  {
    imgUri: "/icons/pr-logo.svg",
    title: "Success with PROOF",
    // texts: [
    //   "1. PROOF Supplies: DO NOT open your supplies until instructed.",
    //   "2. Smartphones / Tablet Users: Please set your device to \'DO NOT Disturb\' and turn off any alarms.",
    //   "3. While Testing: Please DO NOT answer phone calls, text messages, or close the app until instructed.",
    // ],
    texts: [
      {
        label: "1. PROOF Supplies:",
        body: " DO NOT open your supplies until instructed."
      },
      {
        label: "2. Smartphones / Tablet Users:",
        body: " Please set your device to 'DO NOT Disturb' and turn off any alarms."
      },
      {
        label: "3. While Testing:",
        body: " Please DO NOT answer phone calls or text messages or close the app until instructed."
      }
    ]
  },
  // {
  //   imgUri: "/icons/pr-kit-icons.svg",
  //   title: "Caution",
  //   texts: [
  //     "DO NOT open any PROOF supplies until you are specifically instructed to do so by the application.",
  //     "Set your phone to DO NOT Disturb and turn off any alarms.",
  //     "While using the PROOF app, DO NOT answer phone calls, text messages or close the app until instructed.",
  //   ],
  // },
  {
    imgUri: "/icons/laptop-icon.svg",
    title: "Upload Important Data",
    texts: ["Vaccine records.", "Test results (conducted outside PROOF)."]
  },
  {
    imgUri: "/icons/specime-icons.svg",
    title: "Specimen Collections",
    texts: [
      "Drug and Alcohol Testing (Saliva, Nail, Blood, Urine, Breath).",
      "COVID-19 Testing (Nasal, Saliva).",
      "Wellness / Diagnostics."
    ]
  }
];

export const proofPassFilter = [
  {
    id: 1,
    value: "Drug Test Results",
    label: "Drug Test Results"
  },
  {
    id: 2,
    value: "OralTox Kit Test",
    label: "OralTox Kit Test"
  },
  {
    id: 3,
    value: "PROOF Collection",
    label: "PROOF Collection"
  }
];

export const typeOfServices = [
  {
    id: 1,
    value: "Drug Test Results",
    label: "Drug Test Results"
  },
  {
    id: 2,
    value: "OralTox Kit Test",
    label: "OralTox Kit Test"
  },
  {
    id: 3,
    value: "PROOF Collection",
    label: "PROOF Collection"
  }
];

export const proofPassResult = [
  {
    id: 1,
    value: "Negative",
    label: "Negative"
  },
  {
    id: 2,
    value: "Positive",
    label: "Positive"
  },
  {
    id: 3,
    value: "Pending",
    label: "Pending"
  },
  {
    id: 4,
    value: "Inconclusive",
    label: "Inconclusive"
  }
];

// Object mapping of test kits and their respective IDs
interface TestKitMapping {
  [key: string]: string;
}

export const testMapping: TestKitMapping = {
  a0qPI000003Ud8gYAC: "DEMO Pr Blood Kit",
  a0q2J00000BM9IDQA1: "DEMO Pr Saliva Kit (Intercept)",
  a0q2J00000BMfozQAD: "Pr Nail Kit",
  a0qPI000003EYZcYAO: "DEMO Pr Dual Rapid Saliva Kit (OralTox/ALCO)",
  a0q2J00000BMNJoQAP: "CRL Saliva Kit",
  a0qPI000003BM8OYAW: "Pr Dual Rapid Saliva Kit (OralTox/ALCO)",
  a0qHt00000C8ETwIAN: "2SAN Home Drug Test Collection & Result Recording",
  a0q2J00000Ciy3bQAB: "Pr Saliva Kit (DOCTox Quantisal)",
  a0q2J00000A07UpQAJ: "DOCTox-Quantisal-Spanish",
  a0q2J00000ANlwbQAD: "DOCtox-Quantisal-Caregiver Assisted",
  a0q2J00000Cj7WGQAZ: "CRL Saliva & Blood Kit",
  a0qPI000004WV6PYAW: "FRENCH Pr Dual Rapid Saliva Kit (OralTox/ALCO)",
  a0qHt00000C8KsdIAF: "Laboratory Confirmation (Optional)",
  a0qHt00000C8B8gIAF: "NO ID Pr Blood Kit",
  a0qHt00000C8NptIAF: "Pr Urine Kit",
  a0qPI000003GXkgYAG: "Pr Whole Blood Kit",
  a0qHt00000AiRGcIAN: "INACTIVE-Pr Rapid Saliva Kit (Honor)",
  a0qPI0000040W7GYAU: "DEMO PR Nail Kit"
};
