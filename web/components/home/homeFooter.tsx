import { appData } from "@/redux/slices/appConfig";
import { hasPermission } from "@/utils/utils";
import { useSelector } from "react-redux";
import Button from "../button";

const HomeFooter = () => {
  const userPermissions = useSelector(appData);
  const permissions = userPermissions?.permissions;
  return (
    <div className="new-feature">
      {hasPermission("PROOFPass", permissions) && (
        <Button blue link={"/proof-pass"}>
          PROOFpass
        </Button>
      )}
    </div>
  );
};
export default HomeFooter;
