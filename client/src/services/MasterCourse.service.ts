import {
    IAssetData,
    ICourse,
    ICourseAsset,
    ICourseSection,
} from "../typings/typings";
import masterCourses from "../assets/masterCourses.json";
import { ICourseActiveContent } from "../components/Course/Course";

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

    public checkIsValidContent({
        courseName,
        content,
        section,
    }: ICourseActiveContent) {
        const contentDetails = this.getContent({
            course: courseName,
            section,
            content,
            preFetch: false,
        });
        return contentDetails.asset !== undefined;
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

            return inputStr
                .replace(/[ >\<(\)^:'"]/g, ".")
                .replace(/\.{2,}/g, ".");
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
            ?.replace(".zip", "")
            ?.replace(".mov", "")
            ?.replace(".m4v", "");
    }

    public getContent(props: {
        course: string;
        section: string;
        content: string;
        preFetch?: boolean;
    }): {
        courseIndex: number;
        sectionIndex: number;
        assetIndex: number;
        asset: ICourseAsset | undefined;
    } {
        const { preFetch = true } = props;
        try {
            const [course, section, content] = [
                this.getEncodedString(props.course, true),
                this.getEncodedString(props.section, true),
                this.getEncodedString(props.content, true),
            ];
            const courseIndex = this.courses.findIndex(
                (key) => key.name === course
            );
            const sectionIndex = this.courses[courseIndex]?.sections?.findIndex(
                (key) => key.name === section
            );
            const assetIndex = this.courses[courseIndex]?.sections[
                sectionIndex
            ]?.assets.findIndex((key) => key.name === content);

            const currentAsset =
                this.courses[courseIndex].sections[sectionIndex].assets[
                    assetIndex
                ];

            const nextAsset = this.getAsset({
                courseIndex,
                sectionIndex,
                assetIndex,
                direction: "forward",
                options: {
                    allowOnlyVideos: true,
                },
            });

            if (preFetch) this.preFetchAssetInBackground(nextAsset?.asset);
            return {
                courseIndex,
                sectionIndex,
                assetIndex,
                asset: currentAsset,
            };
        } catch (error) {
            // console.error("caught error", error);
            return {
                courseIndex: -1,
                sectionIndex: -1,
                assetIndex: -1,
                asset: undefined,
            };
        }

        return {
            asset: undefined,
            assetIndex: 0,
            courseIndex: 0,
            sectionIndex: 0,
        };
    }

    public getCachedContentBlobUrl(
        bufferUrl: string | undefined,
        strict = false
    ) {
        const requiredUrl = this.getProxiedUrl(bufferUrl ?? "");
        return (
            this.blobBufferUrlMapping.get(requiredUrl) ??
            (strict ? undefined : bufferUrl)
        );
    }

    public getProxiedUrl(sourceUrl: string) {
        const nextUrl = "https://api.yoyoironing.com/freecors?url=" + sourceUrl;

        return nextUrl;
    }

    public getRequiredAssetData(asset?: ICourseAsset) {
        return asset?.compressedAssetData ?? asset?.assetData;
    }

    public getAssetNavigationLinks(props: {
        courseIndex: number;
        sectionIndex: number;
        assetIndex: number;
        options?: {
            allowOnlyVideos?: boolean;
        };
    }): { next: string | undefined; previous: string | undefined } {
        const { courseIndex, sectionIndex, assetIndex, options } = props;
        let next: string | undefined;
        let previous: string | undefined;

        const nextAsset = this.getAsset({
            courseIndex,
            sectionIndex,
            assetIndex,
            direction: "forward",
            options,
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
            options,
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

    public getAsset(props: {
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
        const { assetIndex, courseIndex, direction, sectionIndex, options } =
            props;

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
                      assetIndex:
                          course.sections[sectionIndex - 1]?.assets?.length ??
                          1,
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

    public getBufferedUrl = (
        downloadUrl: string,
        type?: string
    ): Promise<string> => {
        return new Promise((resolve, reject) => {
            fetch(downloadUrl)
                .then((data) => {
                    return data.blob();
                })
                .then((blob) => {
                    console.log("Data downloaded successfully!", blob);
                    console.log("Generating blob url...");
                    const blobUrl = URL.createObjectURL(
                        new Blob([blob], type ? { type } : undefined)
                    );
                    console.log("Generated blob url", blobUrl);
                    resolve(blobUrl);
                })
                .catch((err) => reject(err));
        });
    };

    private preFetchAssetInBackground(asset?: ICourseAsset) {
        // maintain only n number of cache content
        const cacheThreshold = 3;

        if (this.blobBufferUrlMapping.size + 1 > cacheThreshold) {
            const itemsToRemove =
                this.blobBufferUrlMapping.size + 1 - cacheThreshold;
            for (let index = 0; index < itemsToRemove; index++) {
                const blobUrl = this.blobBufferUrlMapping
                    .values()
                    .next()?.value;
                console.log("revoking old cached blob", blobUrl);
                if (blobUrl) URL.revokeObjectURL(blobUrl);
            }
            this.blobBufferUrlMapping = new Map(
                [...this.blobBufferUrlMapping.entries()].slice(itemsToRemove)
            );
        }

        if (!asset) return;

        const requiredAssetData = asset.compressedAssetData ?? asset.assetData;
        const requiredUrl = requiredAssetData.browser_download_url;
        if (this.getCachedContentBlobUrl(requiredUrl, true)) return;

        setTimeout(async () => {
            console.log("pre fetching started", requiredUrl);
            const nextUrl = this.getProxiedUrl(requiredUrl);
            const blobUrl = await this.getBufferedUrl(nextUrl);
            console.log("Adding blob url to buffer mapping", blobUrl);
            this.blobBufferUrlMapping.set(nextUrl, blobUrl);
        }, 1000);
    }

    private fetchCourses() {
        this.courses = masterCourses as ICourse[];
    }
}
