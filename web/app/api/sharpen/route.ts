// import { Jimp } from "jimp";
import { type NextRequest, NextResponse } from "next/server";
// import sharp from "sharp";

export async function POST(req: NextRequest) {
  // const { imageBuffer } = await req.json();
  // console.log(imageBuffer, "buffer");
  // const base64Data = imageBuffer.split(",")[1] || imageBuffer;
  // //   console.log(uint8Array, "unit8array console");
  // // Convert the base64 image back to a buffer
  // const buffer = Buffer.from(imageBuffer, "base64");
  // console.log(buffer, "buffer out");
  // try {
  //   // Use sharp to sharpen the image
  //   // const sharpenedImage = await sharp(buffer)
  //   //   .sharpen() // You can also pass parameters to sharpen()
  //   //   .toBuffer();
  //   const image = await Jimp.read(buffer);
  //   image.getBase64("image/jpeg", {
  //     quality: 50,
  //   });
  //   // Convert the sharpened image back to base64 for response
  //   // const base64SharpenedImage = sharpenedImage.toString("base64");
  //   // return NextResponse.json({ sharpenedImage: base64SharpenedImage });
  // } catch (error) {
  //   console.error("Error processing image:", error);
  //   return NextResponse.error();
  // }
}
