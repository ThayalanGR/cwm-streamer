async function scrap() {
  const courseTitle = document
    .getElementsByClassName("course-sidebar-head")[0]
    .children[0].textContent.trim();
  const courseInfo = { name: courseTitle, sections: [] };
  const sideBar =
    document.getElementsByClassName("lecture-sidebar")[0].children;
  for (let index = 0; index < sideBar.length; index++) {
    const currentSection = sideBar[index];
    const sectionName = currentSection.children[0].textContent.trim();
    console.log(sectionName);
    const section = {
      name: sectionName,
      assets: [],
    };
    courseInfo.sections.push(section);
    const sectionContents = currentSection.children[1].children;
    for (let j = 0; j < sectionContents.length; j++) {
      const sectionContentLink = sectionContents[j].children[0];
      const contentName = sectionContentLink.children[1].textContent.trim();
      console.log(contentName);
      sectionContentLink.click();
      // add delay later
      await (async () =>
        new Promise((resolve) => {
          setTimeout(resolve, 3000);
        }))();
      // get download link and url
      const downloadLink = document.getElementsByClassName("download")[0];
      if (downloadLink) {
        // get download title
        const url = downloadLink.getAttribute("href");
        const fileName = downloadLink.getAttribute(
          "data-x-origin-download-name"
        );
        const split = fileName.split(".");
        const type = split.at(-1);
        const title = split.slice(0, -1).join(".");
        // get extension from title
        section.assets.push({
          name: title,
          url,
          type,
        });
      }
    }
  }

  console.log(courseInfo);
}
