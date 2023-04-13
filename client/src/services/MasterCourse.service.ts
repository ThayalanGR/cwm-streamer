import { ICourse } from "../typings/typings";
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

  constructor() {
    this.courses = [];
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

  private fetchCourses() {
    this.courses = masterCourses as ICourse[];
  }
}
