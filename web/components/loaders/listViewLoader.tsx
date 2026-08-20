import { ShimmerThumbnail } from "react-shimmer-effects";

const listViewLoader = () => {
    return (
        <>
            <ShimmerThumbnail
                width={500}
                height={60}
                style={{ margin: "28px 0px, 10px, 0px", borderRadius: "10px", background: "#009CF9" }}
            />
        </>
    )
}

export default listViewLoader