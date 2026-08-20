import './headerText.css'

interface HeaderTextProps {
    title: string;
    text: string;
}

function HeaderText({ title, text }: HeaderTextProps) {
    return (
        <div className="header-text">
            <h1 className="title">{title}</h1>
            <p className="text">{text}</p>
        </div>
    )
};

export default HeaderText;