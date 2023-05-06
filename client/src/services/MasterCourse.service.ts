import { ICourse, ICourseAsset } from "../typings/typings";
import masterCourses from "../assets/masterCourses.json";

export default class MasterCourseService {
  static instance: MasterCourseService;

  static getInstance(): MasterCourseService {
    if (!MasterCourseService.instance) {
      MasterCourseService.instance = new MasterCourseService();
    }
    return MasterCourseService.instance;
  }

  private courses: ICourse[];

  private blobBufferUrlMapping: Map<string, string>;

  constructor() {
    this.courses = [];
    this.blobBufferUrlMapping = new Map();
    this.fetchCourses();
  }

  public getAllCourses(): ICourse[] {
    return this.courses;
  }

  public getCourse(name: string): ICourse | undefined {
    const courseName = this.getEncodedString(name, true);
    return this.courses.find((course) => course.name === courseName);
  }

  public getEncodedString(
    inputString: string | null | undefined,
    decode = false
  ) {
    try {
      if (!inputString) return "";
      return decode ? decodeURI(inputString) : encodeURI(inputString);
    } catch (error) {
      console.error("Malformed URI", error, inputString);
      return inputString;
    }
  }

  public getContentPath(
    courseName: string,
    sectionName: string,
    contentName: string
  ) {
    return `/course/${this.getEncodedString(
      courseName
    )}?section=${this.getEncodedString(
      sectionName
    )}&content=${this.getEncodedString(contentName)}`;
  }

  public getSanitizedString(str: string, reverse = false) {
    const process = (inputStr: string, innerReverse = false) => {
      if (innerReverse) {
        return inputStr.replace(/\./g, " ").trim();
      }

      return inputStr.replace(/[ >\<(\)^:'"]/g, ".").replace(/\.{2,}/g, ".");
    };

    if (reverse) {
      let result = process(str);
      return process(result, reverse);
    }
    let result = process(str);
    result = process(result, true);
    return process(result);
  }

  public getDefaultContentPath(courseDetails?: ICourse) {
    if (!courseDetails) return "/";

    return this.getContentPath(
      courseDetails.name,
      courseDetails.sections[0].name,
      courseDetails.sections[0].assets[0].name
    );
  }

  public getAssetDisplayName(assetName?: string) {
    if (!assetName) return assetName;
    const sectionAssetSplitDelimitter = " -> ";
    return assetName
      .split(sectionAssetSplitDelimitter)
      .at(-1)
      ?.replace(/\d+-/g, "")
      ?.replace(/_/g, " ")
      ?.replace(".mp4", "")
      ?.replace(".pdf", "")
      ?.replace(".zip", "");
  }

  public getContent(props: {
    course: string;
    section: string;
    content: string;
  }): ICourse["sections"][0]["assets"][0] | undefined {
    try {
      const [course, section, content] = [
        this.getEncodedString(props.course, true),
        this.getEncodedString(props.section, true),
        this.getEncodedString(props.content, true),
      ];
      const courseIndex = this.courses.findIndex((key) => key.name === course);
      const sectionIndex = this.courses[courseIndex]?.sections?.findIndex(
        (key) => key.name === section
      );
      const assetIndex = this.courses[courseIndex]?.sections[
        sectionIndex
      ]?.assets.findIndex((key) => key.name === content);

      const currentAsset =
        this.courses[courseIndex].sections[sectionIndex].assets[assetIndex];

      try {
        const nextAsset =
          this.courses[courseIndex].sections[sectionIndex].assets[
            assetIndex + 1
          ];
        this.preFetchAssetInBackground(nextAsset);
      } catch (error) {}

      return currentAsset;
    } catch (error) {
      console.error(error);
    }

    return undefined;
  }

  public getCachedContentBlobUrl(
    bufferUrl: string | undefined,
    strict = false
  ) {
    const requiredUrl = this.getRequiredUrl(bufferUrl ?? "");
    return (
      this.blobBufferUrlMapping.get(requiredUrl) ??
      (strict ? undefined : bufferUrl)
    );
  }

  public getRequiredUrl(sourceUrl: string) {
    const nextUrl = "https://api.yoyoironing.com/freecors?url=" + sourceUrl;

    return nextUrl;
  }

  private preFetchAssetInBackground(asset?: ICourseAsset) {
    if (!asset) return;

    if (
      this.getCachedContentBlobUrl(asset.assetData.browser_download_url, true)
    )
      return;

    setTimeout(() => {
      const currentUrl = asset.assetData.browser_download_url;
      console.log("pre fetching started", currentUrl);
      const nextUrl = this.getRequiredUrl(currentUrl);

      fetch(nextUrl)
        .then((data) => {
          return data.blob();
        })
        .then((blob) => {
          console.log("Data downloaded successfully!", blob);
          console.log("Generating blob url...");
          const blobUrl = URL.createObjectURL(blob);
          console.log("Adding blob to buffer mapping.", blobUrl);
          this.blobBufferUrlMapping.set(nextUrl, blobUrl);
        });
    }, 1000);
  }

  private fetchCourses() {
    this.courses = masterCourses as ICourse[];
  }
}
