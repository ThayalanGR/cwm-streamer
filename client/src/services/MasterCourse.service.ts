import {
  IAssetData,
  ICourse,
  ICourseAsset,
  ICourseSection,
} from "../typings/typings";
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
  }): {
    courseIndex: number;
    sectionIndex: number;
    assetIndex: number;
    asset: ICourseAsset | undefined;
  } {
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

      const nextAsset = this.getAsset({
        courseIndex,
        sectionIndex,
        assetIndex,
        direction: "forward",
        options: {
          allowOnlyVideos: true,
        },
      });
      this.preFetchAssetInBackground(nextAsset?.asset);

      return { courseIndex, sectionIndex, assetIndex, asset: currentAsset };
    } catch (error) {
      console.error(error);
    }

    return { asset: undefined, assetIndex: 0, courseIndex: 0, sectionIndex: 0 };
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

  public getRequiredAssetData(asset?: ICourseAsset) {
    return asset?.compressedAssetData ?? asset?.assetData;
  }

  public getAssetNavigationLinks(
    courseIndex: number,
    sectionIndex: number,
    assetIndex: number
  ): { next: string | undefined; previous: string | undefined } {
    let next: string | undefined;
    let previous: string | undefined;

    const nextAsset = this.getAsset({
      courseIndex,
      sectionIndex,
      assetIndex,
      direction: "forward",
    });
    if (nextAsset) {
      next = this.getContentPath(
        nextAsset.course.name,
        nextAsset.section.name,
        nextAsset.asset.name
      );
    }

    const previousAsset = this.getAsset({
      courseIndex,
      sectionIndex,
      assetIndex,
      direction: "backward",
    });
    if (previousAsset) {
      previous = this.getContentPath(
        previousAsset.course.name,
        previousAsset.section.name,
        previousAsset.asset.name
      );
    }

    return { next, previous };
  }

  private getAsset(props: {
    direction: "forward" | "backward";
    courseIndex: number;
    sectionIndex: number;
    assetIndex: number;
    options?: {
      allowOnlyVideos?: boolean;
    };
  }):
    | { course: ICourse; section: ICourseSection; asset: ICourseAsset }
    | undefined {
    const { assetIndex, courseIndex, direction, sectionIndex, options } = props;

    const course = this.courses[courseIndex];

    if (!course) {
      return;
    }

    const section = course.sections[sectionIndex];
    if (!section) {
      return;
    }

    let nextAssetIndex =
      direction === "forward" ? assetIndex + 1 : assetIndex - 1;
    const asset = section.assets[nextAssetIndex];

    if (!asset) {
      // skip section

      return direction === "forward"
        ? this.getAsset({
            ...props,
            courseIndex,
            sectionIndex: sectionIndex + 1,
            assetIndex: -1,
          })
        : this.getAsset({
            ...props,
            courseIndex,
            sectionIndex: sectionIndex - 1,
            assetIndex: 1,
          });
    }

    if (
      options?.allowOnlyVideos &&
      !asset?.assetData?.content_type?.includes("video")
    ) {
      return this.getAsset({
        ...props,
        assetIndex: nextAssetIndex,
      });
    }

    return { course, section, asset };
  }

  private preFetchAssetInBackground(asset?: ICourseAsset) {
    // maintain only n number of cache content
    const cacheThreshold = 5;

    if (this.blobBufferUrlMapping.size + 1 > cacheThreshold) {
      const itemsToRemove = this.blobBufferUrlMapping.size + 1 - cacheThreshold;
      this.blobBufferUrlMapping = new Map(
        [...this.blobBufferUrlMapping.entries()].slice(itemsToRemove)
      );
    }

    if (!asset) return;

    const requiredAssetData = asset.compressedAssetData ?? asset.assetData;
    const requiredUrl = requiredAssetData.browser_download_url;
    if (this.getCachedContentBlobUrl(requiredUrl, true)) return;

    setTimeout(() => {
      console.log("pre fetching started", requiredUrl);
      const nextUrl = this.getRequiredUrl(requiredUrl);

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
