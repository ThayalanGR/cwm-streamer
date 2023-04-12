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
    const courseName = this.getCourseURI(name, true);
    return this.courses.find((course) => course.name === courseName);
  }

  public getCourseURI(courseString: string, decode = false) {
    try {
      return decode ? decodeURI(courseString) : encodeURI(courseString);
    } catch (error) {
      console.error("Malformed URI", error, courseString);
      return courseString;
    }
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

  private fetchCourses() {
    this.courses = masterCourses as ICourse[];
  }
}
