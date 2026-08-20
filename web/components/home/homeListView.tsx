import Image from "next/image";

interface ListProps {
  imgUrl: string;
  title: string;
}

const ListView = ({ imgUrl, title }: ListProps) => {
  return (
    <div className="home-list-card">
      <div className="home-card-img">
        <Image src={imgUrl} alt="image" width={3000} height={3000} loading='lazy' />
      </div>
      <p>{title}</p>
    </div>
  );
};

export default ListView;
