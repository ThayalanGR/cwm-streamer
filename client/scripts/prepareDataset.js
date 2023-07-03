import fs from "fs";
// read all json from the bucket

const bucketDir = "../scrapper/bucket";
const masterDsPath = "./src/assets/masterCourses.json";

function process() {
    const courses = [];

    // read json
    const coursesInJson = fs.readdirSync(bucketDir);

    // push in an array
    // gather dataset
    coursesInJson.forEach((courseJson) => {
        const courseRaw = fs.readFileSync(bucketDir + "/" + courseJson);
        const course = JSON.parse(courseRaw);
        courses.push(course);
    });

    // form a new json using that array under the src directory
    // write dataset
    const stringifiedCourses = JSON.stringify(courses, null, 2);
    fs.writeFileSync(masterDsPath, stringifiedCourses);
}

process();
