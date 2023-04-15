import fs from "fs";
import dotenv from "dotenv";
dotenv.config();

import { Octokit } from "@octokit/rest";
import crypto from "crypto";
import https from "https";
import mime from "mime-types";
import path from "path";
import { google, youtube_v3 } from "googleapis";
import { OAuth2Client } from "google-auth-library";

// courses
import bucket0 from "./coursesToScrap/bucket0";
import bucket1 from "./coursesToScrap/bucket1";
import bucket2 from "./coursesToScrap/bucket2";
import bucket3 from "./coursesToScrap/bucket3";
import bucket4 from "./coursesToScrap/bucket4";
import bucket5 from "./coursesToScrap/bucket5";
import bucket6 from "./coursesToScrap/bucket6";
import bucket7 from "./coursesToScrap/bucket7";
import bucket8 from "./coursesToScrap/bucket8";
import bucket9 from "./coursesToScrap/bucket9";
import bucket10 from "./coursesToScrap/bucket10";
import bucket11 from "./coursesToScrap/bucket11";
import bucket12 from "./coursesToScrap/bucket12";

// GLOBAL VARIABLES
const gitUserName = "thayalangr-engineer";
const gitRepo = "cwm";

const courses = [
    ...bucket0,
    ...bucket1,
    ...bucket2,
    ...bucket3,
    ...bucket4,
    ...bucket5,
    ...bucket6,
    ...bucket7,
    ...bucket8,
    ...bucket9,
    ...bucket10,
    ...bucket11,
    ...bucket12,
];

const octokit = new Octokit({
    auth: process.env.GIT_TOKEN,
});

const SAMPLE_VIDEO_PATH = "./src/sample.mp4";
const OAUTH2_TOKENS_PATH = "./src/oauth2-tokens.json";
const YOUTUBE_CLIENT_SECRET_PATH = "./src/client-secret.json";

const bucketPath = "./bucket"; // acts as the persistent storage
const uploadCompletedCourses: string[] = [];
const bufferMapping = new Map<string, Buffer>(); // url vs buffer - used to fallback if upload fails somehow
let coursesToUpload: string[] = [];

type TMainType = "local" | "remote";

interface IUploadAssetTracker {
    name: string;
    releaseDetails: Record<string, string | number>;
    sections: {
        name: string;
        assets: Record<string, string>[];
    }[];
}

/**
 * layer - 1
 */
async function main(type: TMainType) {
    if (!type) throw new Error("type required - 'local' | 'remote'");

    let isAllUploadCompleted = false;

    while (!isAllUploadCompleted) {
        if (type === "local") {
            await uploadThroughFileSystem();
        } else {
            await uploadThroughRemote();
        }

        if (uploadCompletedCourses.length === coursesToUpload.length) {
            isAllUploadCompleted = true;
        }
    }
}

// layer - 2
async function uploadThroughFileSystem() {
    const courseRoot = "<--PATH TO LOOK FOR COURSES--->";
    coursesToUpload = [];

    for (let index = 0; index < coursesToUpload.length; index++) {
        const courseName = coursesToUpload[index];
        if (uploadCompletedCourses.includes(courseName)) {
            console.log("Course skipped (Alreay uploaded) -", courseName);
            continue;
        }

        console.log("Uploading Course -", courseName);

        const uploadedAssetsTracker: IUploadAssetTracker = {
            name: courseName,
            releaseDetails: <IUploadAssetTracker["releaseDetails"]>(
                (<unknown>null)
            ),
            sections: [],
        };

        try {
            // prefill asset tracker
            prefillAssetTracker(uploadedAssetsTracker);

            uploadedAssetsTracker.releaseDetails = await createRelease(
                courseName,
                uploadedAssetsTracker
            );

            persistUploadedAssetsData(uploadedAssetsTracker);

            await uploadLocalAssets(uploadedAssetsTracker, courseRoot);

            // marking as complete
            uploadCompletedCourses.push(courseName);
            persistUploadedAssetsData(uploadedAssetsTracker);
        } catch (error) {
            console.error("Something went wrong!", error);
            persistUploadedAssetsData(uploadedAssetsTracker);
            break;
        }
    }
}

async function uploadThroughRemote() {
    try {
        coursesToUpload = courses.map((course) => course.name);
        for (let i = 0; i < courses.length; i++) {
            const { name: courseName, sections } = courses[i];

            if (uploadCompletedCourses.includes(courseName)) {
                console.log("Course skipped (Alreay uploaded) -", courseName);
                continue;
            }

            console.log(
                "***********************Uploading Course -",
                courseName,
                "**************************"
            );

            const uploadedAssetsTracker: IUploadAssetTracker = {
                name: courseName,
                releaseDetails: <IUploadAssetTracker["releaseDetails"]>(
                    (<unknown>null)
                ),
                sections: [],
            };

            try {
                // prefill asset tracker
                prefillAssetTracker(uploadedAssetsTracker);

                uploadedAssetsTracker.releaseDetails = await createRelease(
                    courseName,
                    uploadedAssetsTracker
                );

                persistUploadedAssetsData(uploadedAssetsTracker);

                await uploadRemoteAssets(uploadedAssetsTracker, sections);

                // marking as complete
                uploadCompletedCourses.push(courseName);
                persistUploadedAssetsData(uploadedAssetsTracker);
            } catch (error) {
                console.error("Something went wrong!", error);
                persistUploadedAssetsData(uploadedAssetsTracker);
                break;
            }
        }
    } catch (error) {
        console.error("Something went wrong!", error);
    }
}

// layer - 3

async function prefillAssetTracker(uploadedAssetsTracker: IUploadAssetTracker) {
    try {
        const { name: courseName } = uploadedAssetsTracker;
        console.log("Checking and prefilling from bucket");
        const jsonPath = [bucketPath, courseName].join("/").concat(".json");
        console.log("Checking for", jsonPath);
        const file = fs.readFileSync(jsonPath, "utf-8");
        const jsonData = JSON.parse(file);
        if (jsonData && jsonData.name === courseName) {
            console.log("Found prefill data", jsonPath);
            Object.assign(uploadedAssetsTracker, jsonData);
            console.log("Prefilling done!");
        }
    } catch (error) {
        console.log("No Prefilling data found, starting fresh!");
    }
}

function getRequiredAssetsBucket(
    uploadedAssetsTracker: IUploadAssetTracker,
    sectionName: string
) {
    const prefilledSection = uploadedAssetsTracker.sections.find((section) => {
        return (
            getSanitizedString(section.name) === getSanitizedString(sectionName)
        );
    });
    let assets: IUploadAssetTracker["sections"][0]["assets"] = [];
    if (prefilledSection && prefilledSection.assets) {
        assets = prefilledSection.assets;
    } else {
        uploadedAssetsTracker.sections.push({
            name: getSanitizedString(sectionName, true),
            assets,
        });
    }

    return assets;
}

async function uploadLocalAssets(
    uploadedAssetsTracker: IUploadAssetTracker,
    courseRoot: string
) {
    const { name: courseName } = uploadedAssetsTracker;
    const coursepath = [courseRoot, courseName].join("/");
    const sections = fs
        .readdirSync(coursepath)
        .filter((sectionName) =>
            fs.statSync([coursepath, sectionName].join("/")).isDirectory()
        )
        .sort((a, b) => {
            const numA = parseInt(a.split("- ")[0]);
            const numB = parseInt(b.split("- ")[0]);
            return numA - numB;
        });

    for (let i = 0; i < sections.length; i++) {
        const sectionName = sections[i];
        const courseSectionPath = [coursepath, sectionName].join("/");
        console.log(
            `Uploading ${i + 1} out of ${
                sections.length
            } sections - ${sectionName}`
        );

        const assets = getRequiredAssetsBucket(
            uploadedAssetsTracker,
            sectionName
        );

        const sectionContents = fs
            .readdirSync(courseSectionPath)
            .filter((fileName) =>
                fs.statSync([courseSectionPath, fileName].join("/")).isFile()
            )
            .sort((a, b) => {
                const numA = parseInt(a.split("- ")[0]);
                const numB = parseInt(b.split("- ")[0]);
                return numA - numB;
            });

        for (let j = 0; j < sectionContents.length; j++) {
            const fileName = sectionContents[j];
            const filePath = [courseSectionPath, fileName].join("/");
            const contentType = mime.lookup(filePath);
            const fileDetailedName = [sectionName, fileName].join(" -> ");

            if (checkIsAssetAlreadyUploaded(assets, fileDetailedName)) {
                console.log(
                    `skipping uploading ${j + 1} out of ${
                        sectionContents.length
                    } files - ${fileDetailedName} - Asset already uploaded!`
                );
                continue;
            }

            const fileStats = fs.statSync(filePath);
            const fileSizeInBytes = fileStats.size;
            const fileSizeInMegabytes = getFileSizeInMB(fileSizeInBytes); // Convert bytes to megabytes
            console.log(
                `Uploading ${j + 1} out of ${
                    sectionContents.length
                } files - ${fileDetailedName} (${fileSizeInMegabytes} MB)`
            );

            // Read the video file into a buffer
            const fileData = fs.readFileSync(filePath);
            await uploadAsset(
                uploadedAssetsTracker,
                fileDetailedName,
                fileData,
                <string>contentType,
                assets,
                ""
            );
        }

        persistUploadedAssetsData(uploadedAssetsTracker);
    }
}

async function uploadRemoteAssets(
    uploadedAssetsTracker: IUploadAssetTracker,
    sections: IUploadAssetTracker["sections"]
) {
    for (let i = 0; i < sections.length; i++) {
        const { name: sectionName, assets: sectionContents } = sections[i];

        console.log(
            `@@@@@@@@@@@@@@@@@@@ Uploading ${i + 1} out of ${
                sections.length
            } sections - ${sectionName} @@@@@@@@@@@@@@@@@@@@@@@@`
        );

        const assets = getRequiredAssetsBucket(
            uploadedAssetsTracker,
            sectionName
        );
        // console.log("******************", sectionName);
        for (let j = 0; j < sectionContents.length; j++) {
            const { name: assetName, url, type } = sectionContents[j];
            const fileName = [assetName, type].join(".");
            const contentType = mime.lookup(type);
            const fileDetailedName = [sectionName, fileName].join(" -> ");

            if (checkIsAssetAlreadyUploaded(assets, fileDetailedName, url)) {
                console.log(
                    `skipping uploading ${j + 1} out of ${
                        sectionContents.length
                    } files - ${fileDetailedName} - Asset already uploaded!`
                );
                continue;
            }

            console.log(
                `Downloading ${j + 1} out of ${
                    sectionContents.length
                } files - ${fileDetailedName}`
            );

            // Read the video file into a buffer

            const fileData = bufferMapping.has(url)
                ? bufferMapping.get(url)
                : await downloadFileAsBuffer(url);

            if (!fileData)
                throw new Error(
                    "Something went wrong, downloading file as buffer"
                );
            bufferMapping.set(url, fileData);

            const fileSizeInMegabytes = getFileSizeInMB(fileData.byteLength); // Convert bytes to megabytes
            console.log(
                `Uploading ${j + 1} out of ${
                    sectionContents.length
                } files - ${fileDetailedName} (${fileSizeInMegabytes} MB)`
            );
            await uploadAsset(
                uploadedAssetsTracker,
                fileDetailedName,
                fileData,
                <string>contentType,
                assets,
                url
            );

            bufferMapping.delete(url);
        }

        persistUploadedAssetsData(uploadedAssetsTracker);
    }
}

function getFileSizeInMB(fileSizeInBytes: number) {
    return (fileSizeInBytes / 1000000).toFixed(2);
}

function checkIsAssetAlreadyUploaded(
    assets: IUploadAssetTracker["sections"][0]["assets"],
    fileDetailedName: string,
    url = ""
) {
    const foundAsset = assets.find((asset) => {
        const strA = getSanitizedString(asset.name);
        const strB = getSanitizedString(fileDetailedName);
        // console.log("###########>>>>>>", { a: strA, b: strB, c: strA === strB });
        return strA === strB;
    });

    if (foundAsset) {
        foundAsset["originUrl"] = url;
    }

    return foundAsset;
}

async function uploadAsset(
    uploadedAssetsTracker: IUploadAssetTracker,
    fileDetailedName: string,
    fileData: Buffer,
    contentType: string,
    assets: IUploadAssetTracker["sections"][0]["assets"],
    originUrl = ""
) {
    const asset = await octokit.repos.uploadReleaseAsset({
        owner: gitUserName,
        repo: gitRepo,
        release_id: <number>(<unknown>uploadedAssetsTracker.releaseDetails.id),
        name: fileDetailedName,
        data: <string>(<unknown>fileData),
        headers: {
            "content-type": contentType,
            "content-length": fileData.length,
        },
    });
    console.log(`Uploaded ${fileDetailedName}`);

    assets.push({
        name: fileDetailedName,
        originUrl,
        assetData: <string>(<unknown>asset.data),
    });
}

function getSanitizedString(str: string, reverse = false) {
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
    result = process(result);

    return result.replace("Project.-.", "Project-.");
}

async function createRelease(
    name: string,
    uploadedAssetsTracker: IUploadAssetTracker,
    body = ""
): Promise<IUploadAssetTracker["releaseDetails"]> {
    if (
        uploadedAssetsTracker.releaseDetails &&
        uploadedAssetsTracker.releaseDetails.id
    ) {
        const release = await octokit.repos.getRelease({
            release_id: <number>(
                (<unknown>uploadedAssetsTracker.releaseDetails.id)
            ),
            owner: gitUserName,
            repo: gitRepo,
        });
        release.data.assets.forEach((asset) => {
            const assetName = asset.name.replace("Project.-.", "Project-.");
            const splitDelimitter = ".-.";
            const splitedNames = assetName.split(splitDelimitter);
            const sectionName = splitedNames[0];
            let foundSection = uploadedAssetsTracker.sections.find(
                (section) => {
                    const validSectionName = getSanitizedString(
                        section.name
                    ).replace("Project.-.", "Project-.");
                    return validSectionName === sectionName;
                }
            );

            if (!foundSection) {
                foundSection = {
                    name: getSanitizedString(sectionName, true),
                    assets: [],
                };
                uploadedAssetsTracker.sections.push(foundSection);
            }

            if (foundSection) {
                const foundAsset = foundSection.assets.find((currentAsset) => {
                    const validFileName = getSanitizedString(currentAsset.name);
                    return validFileName === asset.name;
                });

                if (!foundAsset) {
                    foundSection.assets.push({
                        name: getSanitizedString(assetName, true),
                        assetData: <string>(<unknown>asset),
                    });
                }
            }
        });
        return uploadedAssetsTracker.releaseDetails;
    }

    const tagName = `v${crypto.randomBytes(8).toString("hex")}`;

    const release = await octokit.repos.createRelease({
        owner: gitUserName,
        repo: gitRepo,
        tag_name: tagName,
        name,
        body,
        draft: false,
        prerelease: false,
    });

    return <Record<string, string>>(<unknown>release.data);
}

function persistUploadedAssetsData(uploadedAssetsTracker: IUploadAssetTracker) {
    // Write the assetData array to the JSON file
    try {
        fs.mkdirSync(bucketPath);
    } catch (error) {}
    fs.writeFileSync(
        [bucketPath, uploadedAssetsTracker.name].join("/").concat(".json"),
        JSON.stringify(uploadedAssetsTracker, null, 2)
    );
}

async function downloadFileAsBuffer(url: string): Promise<Buffer> {
    return new Promise((resolve, reject) => {
        https.get(url, (response) => {
            if (response.statusCode === 200) {
                let chunks: Uint8Array[] = [];
                response.on("data", (chunk) => {
                    chunks.push(chunk);
                });
                response.on("end", () => {
                    const buffer = Buffer.concat(chunks);
                    resolve(buffer);
                });
            } else {
                reject(
                    new Error(`Failed to download file: ${response.statusCode}`)
                );
            }
        });
    });
}

async function downloadFile(
    url: string,
    folder: string,
    title: string,
    extension: string
) {
    const buffer = await downloadFileAsBuffer(url);

    const filePath = path.join(folder, `${title}.${extension}`);
    fs.writeFile(filePath, buffer, (err) => {
        if (err) throw err;
        console.log(`File saved as ${filePath}`);
    });
}

async function createPlaylist() {
    // Load client secrets from a local file
    const clientSecret = JSON.parse(
        fs.readFileSync(YOUTUBE_CLIENT_SECRET_PATH, "utf-8")
    );

    // Authorize the client with the YouTube Data API
    const oAuth2Client = new OAuth2Client(
        clientSecret.installed.client_id,
        clientSecret.installed.client_secret,
        clientSecret.installed.redirect_uris[0]
    );

    // Check if we have previously stored a token.
    if (fs.existsSync(OAUTH2_TOKENS_PATH)) {
        const token = JSON.parse(fs.readFileSync(OAUTH2_TOKENS_PATH, "utf-8"));
        oAuth2Client.setCredentials(token);
        console.log("Access token:", oAuth2Client.credentials.access_token);
        console.log("Refresh token:", oAuth2Client.credentials.refresh_token);
    } else {
        // If we don't have a token, get one by opening an authorization URL in the browser.
        const authorizeUrl = oAuth2Client.generateAuthUrl({
            access_type: "offline",
            scope: ["https://www.googleapis.com/auth/youtube"],
        });
        console.log("Authorize this app by visiting this url:", authorizeUrl);
        const code =
            "4/0AVHEtk5KkjkYzltQ9FSlIbU4uiEU1_qLkCmAYVytzWkmktNxkzhqejlfPBLTHK0NqvSTuw";
        const { tokens } = await oAuth2Client.getToken(code);
        oAuth2Client.setCredentials(tokens);
        fs.writeFileSync(OAUTH2_TOKENS_PATH, JSON.stringify(tokens));
        console.log("Access token:", tokens.access_token);
        console.log("Refresh token:", tokens.refresh_token);
    }

    // Set the playlist metadata
    const playlistMetadata = {
        snippet: {
            title: "My Playlist Title",
            description: "This is my playlist description",
        },
        status: {
            privacyStatus: "private", // set the privacy status (e.g. private, public)
        },
    };

    // Create the playlist on YouTube
    const youtube = google.youtube({ version: "v3", auth: oAuth2Client });
    const res = await youtube.playlists.insert({
        part: ["snippet", "status"],
        requestBody: playlistMetadata,
    });

    console.log(`Playlist created successfully: ${res.data.id}`, res);

    // Upload a video to the playlist
    const videoMetadata: youtube_v3.Schema$Video = {
        snippet: {
            title: "My Video Title",
            description: "This is my video description",
            tags: ["tag1", "tag2"], // set some tags for the video (optional)
        },
        status: {
            privacyStatus: "unlisted", // set the privacy status (e.g. private, public)
            madeForKids: false,
            embeddable: true,
        },
    };
    const videoStream = fs.createReadStream(SAMPLE_VIDEO_PATH);
    const videoInsertResponse = await youtube.videos.insert({
        part: ["snippet", "status"],
        requestBody: videoMetadata,
        media: {
            body: videoStream,
        },
        notifySubscribers: false,
        uploadType: "resumable",
    });
    const videoId = videoInsertResponse.data.id;

    console.log(`Video uploaded successfully: ${videoId}`, videoInsertResponse);

    // Add the video to the playlist
    const playlistItemId = await youtube.playlistItems.insert({
        part: ["snippet"],
        requestBody: {
            snippet: {
                playlistId: res.data.id,
                resourceId: {
                    kind: "youtube#video",
                    videoId,
                },
            },
        },
    });

    console.log(
        `Video added to playlist successfully: ${playlistItemId.data.id}`
    );
}

createPlaylist().catch(console.error);

// main("remote");
