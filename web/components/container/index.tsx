import "./appContainer.css";
interface IContainerItems {
  header: React.ReactNode;
  body: React.ReactNode;
  footer?: React.ReactNode;
}

const AppContainer = ({ header, body, footer }: IContainerItems) => {
  return (
    <div className="appContainer">
      <div className="appContainerHead">{header}</div>
      <div className="appContainerBody">
        <div className="wrapContainer what-new-scroller">{body}</div>
      </div>
      {footer && <div className="appContainerFooter">{footer}</div>}
    </div>
  );
};

export default AppContainer;
