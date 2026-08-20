import './loader.css';

interface MiniLoaderProps {
    size?: string;
    borderWidth?: string;
}

const MiniLoader = ({ size = '20px', borderWidth = '4px' }: MiniLoaderProps) => {
    return (
        <div className="mini-loader" style={{ width: size, height: size, borderWidth }}></div>
    )
}

export default MiniLoader