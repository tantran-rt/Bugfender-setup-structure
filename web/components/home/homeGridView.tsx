import React from "react";
import Image from "next/image";

interface GridViewProps {
  imgUrl: string;
  title: string;
  className?: string;
}

const GridView = ({
  imgUrl,
  title,
  className,
}: GridViewProps) => {
  return (
    <div className={"home-grid-card"}>
      <div className={"home-grid-card-img"}>
        <Image src={imgUrl} alt="proof image" width={3000} height={3000} loading='lazy' />
      </div>
      <p>{title}</p>
    </div>
  );
};

export default GridView;
