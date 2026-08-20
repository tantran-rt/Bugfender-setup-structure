import Image from "next/image";

import { AppHeader } from "@/components";
import { GoMute } from "react-icons/go";
import { RxSpeakerLoud } from "react-icons/rx";
import styles from "./appHeader.module.css"
interface AgreementHeaderProps {
  title: string;
  onClickMute?: () => void;
  muted?: boolean;
  hasMute?: boolean;
}

const AgreementHeader = ({
  title,
  onClickMute,
  muted = true,
  hasMute = true,
}: AgreementHeaderProps) => {
  return (
    <div className={styles.testCollectionHeaderWrap}>
      <div className={styles.routeHome}>
        <div className="wrap-home-icon">
          <Image className="btn-desktop-img" src="/icons/home-icon.svg" width={5000} height={5000} alt="List view icon" loading="lazy" />
          <h3 style={{ fontSize: "14px", fontWeight: "400px", lineHeight: "14px", textWrap: "nowrap" }}>Go back to home</h3>
        </div>
        <Image className="btn-desktop-img" src="/icons/pr-home-icon.svg" width={5000} height={5000} alt="List view icon" loading="lazy" />
      </div>
      <div className={styles.wrapAppHeader}>
        <AppHeader title={title} hasMute={false} />
      <div className="icon-container" onClick={onClickMute}>
        {
          muted ? (
            <GoMute color="#adadad" style={{ cursor: "pointer" }} size={18} />
          ) : (
            <RxSpeakerLoud
              color="#009cf9"
              style={{ cursor: "pointer" }}
              size={18}
            />
          )
        }
      </div>
      </div>

    </div>
  );
};

export default AgreementHeader;
