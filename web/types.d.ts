declare module "react-shimmer-effects";

declare module "react-media-capture";

declare module "@aws-sdk/client-rekognition";

declare module "@aws-sdk/client-s3";

declare module "@aws-sdk/client-cognito-identity";

declare module "@aws-sdk/credential-provider-cognito-identity";

declare module "crypto-js";

declare module "react-signature-canvas";

declare module "*.module.css";

declare module "*.css";

interface BluetoothDevice {
  gatt?: BluetoothRemoteGATTServer;
}

interface BluetoothRemoteGATTServer {
  connect(): Promise<BluetoothRemoteGATTServer>;
  getPrimaryService(
    service: BluetoothServiceUUID
  ): Promise<BluetoothRemoteGATTService>;
}

interface BluetoothRemoteGATTService {
  getCharacteristic(
    characteristic: BluetoothCharacteristicUUID
  ): Promise<BluetoothRemoteGATTCharacteristic>;
}

interface BluetoothRemoteGATTCharacteristic extends EventTarget {
  startNotifications(): Promise<void>;
  stopNotifications(): Promise<void>;
  value?: DataView;
}

type BluetoothServiceUUID = number | string;
type BluetoothCharacteristicUUID = number | string;

declare module "p5" {
  export = p5;

  class p5 {
    setup: () => void;
    draw: () => void;
    mousePressed: () => void;
    frameCount: number;
    constructor(sketch: (p: p5) => void, node?: HTMLElement | string);
    createCanvas(width: number, height: number): p5.Renderer;
    createCapture(type: string): p5.Element;
    VIDEO: string;
    image(
      img: p5.Image,
      x: number,
      y: number,
      width?: number,
      height?: number
    ): void;
    get(x?: number, y?: number, w?: number, h?: number): p5.Image;
    noFill(): void;
    stroke(r: number, g: number, b: number): void;
    rect(x: number, y: number, w: number, h: number): void;
  }

  namespace p5 {
    interface Image {
      canvas: any;
      loadPixels(): void;
      pixels: number[];
      width: number;
      height: number;
    }
    interface Renderer {
      elt: HTMLCanvasElement;
      parent(arg0: HTMLDivElement): Renderer | null;
    }
    interface Element {
      size(width: number, height: number): void;
      hide(): void;
      elt: HTMLVideoElement;
    }
  }
}

/* APP TYPES */
interface TestUploadType {
  participant_id: string;
  url: string;
  photo_url: string;
  start_time: string;
  end_time: string;
  submitted: string;
  barcode_string: string;
  internet_connection: string;
  app_version: string;
  os_version: string;
  phone_model: string;
  device_name: string;
  device_storage: string;
  look_away_time: string;
  hand_out_of_frame: string;
  drugkitname: string;
  tracking_number: string;
  shippinglabelURL: string;
  scan_barcode_kit_value: string;
  detect_kit_value: string;
  signature_screenshot: string;
  proof_id: string;
  face_compare_url: string;
  face_scan1_url: string;
  face_scan2_url: string;
  face_scan3_url: string;
  face_scan1_percentage: string;
  face_scan2_percentagstring: string;
  face_scan3_percentage: string;
  image_capture1_url: string;
  image_capture2_url: string;
  passport_photo_url: string;
  government_photo_url: string;
  first_name: string;
  last_name: string;
  date_of_birth: string;
  address: string;
  city: string;
  state: string;
  zipcode: string;
}

// Type for a single screen object
type ScreenData = {
  [`Screen_${number}_Title`]: string;
  [`Screen_${number}_Image_URL`]: string;
  [`Screen_${number}_Content`]: string;
  [`Screen_${number}_Audio_URL`]: string;
  [key: string]: string;
};

// Type for the currentScreen prop
type CurrentScreen = ScreenData | undefined;

// Type for currentScreenIndex_ (transformed index)
type CurrentScreenIndex_ = number | undefined;

// Type for currentScreenIndex (index state)
type CurrentScreenIndex = number;

// Type for screensData (array of screens)
type ScreensData = ScreenData[];

// Type for handlePrev and handleNext functions
type HandleNavigation = () => void;

// Type for pathLink function
type PathLink = () => string;

// Type for muted state
type Muted = boolean;

// Type for muteAudio function
type MuteAudio = () => void;

// Type for audioRef (ref for HTMLAudioElement)
type AudioRef = React.RefObject<HTMLAudioElement | null>;

// Props Type for the DesktopView and MobileView components
type PreTestScreensProps = {
  currentScreen: CurrentScreen;
  currentScreenIndex_: CurrentScreenIndex_;
  currentScreenIndex: CurrentScreenIndex;
  handlePrev: HandleNavigation;
  handleNext: HandleNavigation;
  muted: Muted;
  muteAudio: MuteAudio;
  audioRef: AudioRef;
};

// Extend the NodeJS ProcessEnv interface if you need to declare your environment variables
declare namespace NodeJS {
  interface ProcessEnv {
    SENTRY_DSN: string;
    // Add other environment variables if needed
  }
}

// Declare the Sentry module
declare module "@sentry/nextjs";

type ExtendedPermissionName = "camera" | PermissionName;

interface PermissionDescriptor {
  name: ExtendedPermissionName;
}
