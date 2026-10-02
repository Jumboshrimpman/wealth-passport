import { useMemo } from "react";
import { EnrolledPin } from "../components/EnrolledPin";
import { StrategiesCatalog } from "../components/StrategiesCatalog";
import { useClient } from "../context/ClientContext";
import { useInstitutional } from "../context/InstitutionalContext";
import { postedCatalogProfile } from "../institution/desk";

/** Client strategies. Same catalog as the institutional desk, without listing controls. */
export function Strategies() {
  const { passport } = useClient();
  const { strategies } = useInstitutional();
  const posted = useMemo(
    () => strategies.map(postedCatalogProfile).filter((row) => row != null),
    [strategies],
  );
  return (
    <StrategiesCatalog
      investable={passport.household.investable}
      added={posted}
      pinned={<EnrolledPin />}
    />
  );
}
