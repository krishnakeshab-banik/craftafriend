const cheerio = require("cheerio");
const logger = require("../utils/logger");
const { unescapeHtmlString } = require("../utils/htmlUtils");
const { SRM_DOMAIN, createSrmApiClient } = require("../utils/srmApi");
const { getSessionTokenFromHeaders } = require("../utils/sessionUtils");

const SRM_TIMETABLE_URL = `${SRM_DOMAIN}/srm_university/academia-academic-services/page/My_Time_Table_2023_24`;

function parseStudentDetails($) {
    const studentDetails = {};
    const infoTable = $(
        'div[style*="line-height:150%"] > table[border="0"][align="left"]'
    );
    infoTable.find("tr").each((_, row) => {
        const cells = $(row).find("td");
        if (cells.length === 4) {
            let key1 = $(cells[0]).text().replace(":", "").trim();
            let val1 = $(cells[1]).text().trim();
            let key2 = $(cells[2]).text().replace(":", "").trim();
            let val2 = $(cells[3]).text().trim();
            if (key1) studentDetails[key1] = val1;
            if (key2) studentDetails[key2] = val2;
        } else if (cells.length === 2) {
            let key1 = $(cells[0]).text().replace(":", "").trim();
            let val1 = $(cells[1]).text().trim();
            if (key1) studentDetails[key1] = val1;
        }
    });
    return studentDetails;
}

function parseCourses($) {
    const courses = [];
    const courseTable = $("table.course_tbl");
    const headers = [];
    courseTable
        .find("tr")
        .first()
        .find("td")
        .each((_, th) => {
            let headerText = $(th).text().trim().replace(".", "");
            switch (headerText) {
                case "SNo":
                    headerText = "sNo";
                    break;
                case "Course Code":
                    headerText = "courseCode";
                    break;
                case "Course Title":
                    headerText = "courseTitle";
                    break;
                case "Credit":
                    headerText = "credit";
                    break;
                case "Regn Type":
                    headerText = "regType";
                    break;
                case "Category":
                    headerText = "category";
                    break;
                case "Course Type":
                    headerText = "courseType";
                    break;
                case "Faculty Name":
                    headerText = "facultyName";
                    break;
                case "Slot":
                    headerText = "slot";
                    break;
                case "Room No":
                    headerText = "roomNo";
                    break;
                case "Academic Year":
                    headerText = "academicYear";
                    break;
                default:
                    headerText = headerText.toLowerCase().replace(/\s+/g, "_");
            }
            headers.push(headerText);
        });

    courseTable
        .find("tr")
        .slice(1)
        .each((_, row) => {
            const course = {};
            $(row)
                .find("td")
                .each((j, cell) => {
                    const key = headers[j];
                    if (key) course[key] = $(cell).text().trim();
                });
            if (Object.keys(course).length > 0 && course.sNo) courses.push(course);
        });
    return courses;
}

const slotTimes = [
    "08:00-08:50",
    "08:50-09:40",
    "09:45-10:35",
    "10:40-11:30",
    "11:35-12:25",
    "12:30-13:20",
    "13:25-14:15",
    "14:20-15:10",
    "15:10-16:00",
    "16:00-16:50",
];

const batch1 = {
    batch: "1",
    slots: [
        {
            day: 1,
            dayOrder: "Day 1",
            slots: ["A", "A", "F", "F", "G", "P6", "P7", "P8", "P9", "P10"],
            times: slotTimes,
        },
        {
            day: 2,
            dayOrder: "Day 2",
            slots: ["P11", "P12", "P13", "P14", "P15", "B", "B", "G", "G", "A"],
            times: slotTimes,
        },
        {
            day: 3,
            dayOrder: "Day 3",
            slots: ["C", "C", "A", "D", "B", "P26", "P27", "P28", "P29", "P30"],
            times: slotTimes,
        },
        {
            day: 4,
            dayOrder: "Day 4",
            slots: ["P31", "P32", "P33", "P34", "P35", "D", "D", "B", "E", "C"],
            times: slotTimes,
        },
        {
            day: 5,
            dayOrder: "Day 5",
            slots: ["E", "E", "C", "F", "D", "P46", "P47", "P48", "P49", "P50"],
            times: slotTimes,
        },
    ],
};

const batch2 = {
    batch: "2",
    slots: [
        {
            day: 1,
            dayOrder: "Day 1",
            slots: ["P1", "P2", "P3", "P4", "P5", "A", "A", "F", "F", "G"],
            times: slotTimes,
        },
        {
            day: 2,
            dayOrder: "Day 2",
            slots: ["B", "B", "G", "G", "A", "P16", "P17", "P18", "P19", "P20"],
            times: slotTimes,
        },
        {
            day: 3,
            dayOrder: "Day 3",
            slots: ["P21", "P22", "P23", "P24", "P25", "C", "C", "A", "D", "B"],
            times: slotTimes,
        },
        {
            day: 4,
            dayOrder: "Day 4",
            slots: ["D", "D", "B", "E", "C", "P36", "P37", "P38", "P39", "P40"],
            times: slotTimes,
        },
        {
            day: 5,
            dayOrder: "Day 5",
            slots: ["P41", "P42", "P43", "P44", "P45", "E", "E", "C", "F", "D"],
            times: slotTimes,
        },
    ],
};

function generateDetailedTimetable(batch, courses) {
    const slotToCourse = {};
    courses.forEach((course) => {
        if (course.slot) {
            course.slot
                .split(/,|\/|-/)
                .map((s) => s.trim())
                .forEach((slot) => {
                    if (slot) slotToCourse[slot] = course;
                });
        }
    });

    let batchSlots = null;
    if (batch === "1") batchSlots = batch1.slots;
    else if (batch === "2") batchSlots = batch2.slots;
    else return [];

    const timetable = [];
    batchSlots.forEach((dayObj) => {
        dayObj.slots.forEach((slot, idx) => {
            const course = slotToCourse[slot] || null;
            timetable.push({
                dayOrder: dayObj.dayOrder,
                time: dayObj.times[idx],
                slot,
                course: course
                    ? {
                        courseCode: course.courseCode,
                        courseTitle: course.courseTitle,
                        facultyName: course.facultyName,
                        roomNo: course.roomNo,
                        category: course.category,
                        regType: course.regType,
                    }
                    : null,
            });
        });
    });
    return timetable;
}

async function handleFetchTimetable(req, res) {
    const sessionToken = getSessionTokenFromHeaders(req);
    const apiClient = await createSrmApiClient(sessionToken);

    try {
        const srmTimetableResponse = await apiClient.get(SRM_TIMETABLE_URL, {
            headers: {
                Accept: "*/*",
                "Accept-Language": "en-GB,en;q=0.7",
                Referer: SRM_DOMAIN + "/",
                "Sec-Fetch-Dest": "empty",
                "Sec-Fetch-Mode": "cors",
                "Sec-Fetch-Site": "same-origin",
                "User-Agent":
                    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36",
                "X-Requested-With": "XMLHttpRequest",
            },
        });

        const fullPageHtml = srmTimetableResponse.data;
        const match = fullPageHtml.match(/pageSanitizer\.sanitize\('([\s\S]*)'\);/);
        if (!match || !match[1]) {
            logger.error("Could not find sanitized HTML string in the response.");

            if (typeof fullPageHtml === 'string') {
                if (fullPageHtml.includes('login') || fullPageHtml.includes('signin')) {
                    return res.status(401).json({
                        error: "Session expired. Please login again.",
                    });
                }
                if (fullPageHtml.includes('error') || fullPageHtml.includes('Error')) {
                    return res.status(502).json({
                        error: "SRM server returned an error response.",
                    });
                }
            }

            return res.status(500).json({
                error:
                    "Failed to parse timetable response. Page structure may have changed.",
            });
        }

        const unescapedHtml = unescapeHtmlString(match[1]);
        const $ = cheerio.load(unescapedHtml);

        const studentDetails = parseStudentDetails($);
        const courses = parseCourses($);

        let batchRaw =
            studentDetails["Combo / Batch"] || studentDetails["Batch"] || null;
        let batch = null;
        if (batchRaw) {
            const clean = batchRaw.replace(/<[^>]*>/g, "").trim();
            const match = clean.match(/(\d+)/);
            batch = match ? match[1] : clean;
        }

        const detailedTimetable = generateDetailedTimetable(batch, courses);

        const filteredTimetable = detailedTimetable.filter(
            (entry) => entry.course !== null
        );
        res.status(200).json(filteredTimetable);
    } catch (error) {
        logger.error(
            { err: error, msg: error.message },
            "Error during timetable fetch"
        );
        if (error.response) {
            logger.error(
                { data: error.response.data, status: error.response.status },
                "Error response from SRM"
            );
        }
        res.status(500).json({
            error: "An internal server error occurred.",
            details: error.message,
        });
    }
}

module.exports = { handleFetchTimetable };
