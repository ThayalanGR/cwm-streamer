import fs from "fs";
// read all json from the bucket

const bucketDir = "../scrapper/bucket";
const masterDsPath = "./src/assets/masterCourses.json";

function process() {
  // read json
  const coursesInJson = fs.readdirSync(bucketDir);

  let totalSizeInBytes = 0;

  // push in an array
  // gather datasetu
  coursesInJson.forEach((courseJson) => {
    const courseRaw = fs.readFileSync(bucketDir + "/" + courseJson);
    const course = JSON.parse(courseRaw);
    course.sections.forEach((section) => {
      section.assets.forEach((asset) => {
        const size = asset.assetData.size || 0;
        totalSizeInBytes += size;
      });
    });
  });

  const totalSizeInGB = bytesToGB(totalSizeInBytes);
  console.log({ totalSizeInBytes, totalSizeInGB });

  // form a new json using that array under the src directory
  // write dataset
  // const stringifiedCourses = JSON.stringify(courses, null, 2);
  // fs.writeFileSync(masterDsPath, stringifiedCourses);
}

function bytesToGB(bytes) {
  const GB = Math.pow(1024, 3);
  return (bytes / GB).toFixed(2);
}

process();
