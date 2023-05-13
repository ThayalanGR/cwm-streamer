import { ReactNode, useLayoutEffect, useMemo, useState } from "react";
import MasterCourseService from "../../services/MasterCourse.service";

export default function BufferedPdfViewer(props: {
  assetUrl: string;
  noContentRenderer: ReactNode;
}) {
  // props
  const { assetUrl, noContentRenderer } = props;

  // state
  const [bufferedUrl, setBufferedUrl] = useState("");

  // refs
  const masterCourseService = useMemo(
    () => MasterCourseService.getInstance(),
    []
  );

  // effects
  useLayoutEffect(() => {
    (async () => {
      setBufferedUrl("");
      const processedUrl = await masterCourseService.getBufferedUrl(
        masterCourseService.getProxiedUrl(assetUrl),
        "application/pdf"
      );
      setBufferedUrl(processedUrl);
    })();
  }, [assetUrl, setBufferedUrl]);

  // paint
  if (bufferedUrl.length === 0) return <div>Loading PDF...</div>;

  return (
    <object data={bufferedUrl} type="application/pdf">
      {noContentRenderer}
    </object>
  );
}
