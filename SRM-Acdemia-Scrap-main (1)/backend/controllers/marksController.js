const cheerio = require("cheerio");
const logger = require("../utils/logger");
const { unescapeHtmlString } = require("../utils/htmlUtils");
const { SRM_DOMAIN, createSrmApiClient } = require("../utils/srmApi");
const { getSessionTokenFromHeaders } = require("../utils/sessionUtils");

const SRM_ATTENDANCE_URL = `${SRM_DOMAIN}/srm_university/academia-academic-services/page/My_Attendance`;

function parseInternalMarks($, courseTitleMap) {
    const internalMarks = [];
    const marksTable = $("table[border='1'][align='center']").eq(1);

    if (marksTable.length === 0) return internalMarks;

    marksTable
        .find("> tbody > tr, > tr")
        .slice(1)
        .each((_, row) => {
            const cells = $(row).find("> td");
            if (cells.length >= 3) {
                const courseCode = $(cells[0]).text().trim();
                const courseType = $(cells[1]).text().trim();

                if (!courseCode || !/^[A-Z0-9]+$/.test(courseCode.replace(/\s/g, ""))) return;

                const tests = [];
                const testTable = $(cells[2]).find("table");

                if (testTable.length > 0) {
                    testTable.find("td").each((_, testCell) => {
                        const $cell = $(testCell);
                        const strongText = $cell.find("strong").text().trim();
                        const headerMatch = strongText.match(/([\w\s-]+)\/([0-9.]+)/);

                        if (headerMatch) {
                            const testName = headerMatch[1].trim();
                            const maxMarks = parseFloat(headerMatch[2]);
                            const fullText = $cell.text().trim();
                            const obtainedText = fullText.replace(strongText, "").trim();
                            const obtainedMarks = obtainedText
                                ? parseFloat(obtainedText)
                                : null;

                            tests.push({ testName, maxMarks, obtainedMarks });
                        }
                    });
                }

                const totalMaxMarks = tests.reduce((sum, test) => sum + test.maxMarks, 0);
                const totalObtainedMarks = tests.reduce((sum, test) => sum + (test.obtainedMarks || 0), 0);
                const percentage = totalMaxMarks > 0 ? ((totalObtainedMarks / totalMaxMarks) * 100).toFixed(2) : null;

                internalMarks.push({
                    courseCode,
                    courseTitle: courseTitleMap[courseCode] || null,
                    courseType,
                    tests,
                    totalMaxMarks,
                    totalObtainedMarks,
                    percentage: percentage ? parseFloat(percentage) : null,
                });
            }
        });

    return internalMarks;
}

function createCourseTitleMap($) {
    const courseTitleMap = {};
    const attendanceTable = $("table[bgcolor='#FAFAD2']");

    if (attendanceTable.length > 0) {
        attendanceTable
            .find("tr")
            .slice(1)
            .each((_, row) => {
                const cells = $(row).find("td");
                if (cells.length >= 2) {
                    const $codeCell = $(cells[0]).clone();
                    $codeCell.find("font").remove();
                    const courseCode = $codeCell.text().trim();
                    const courseTitle = $(cells[1]).text().trim();

                    if (courseCode && courseTitle) {
                        courseTitleMap[courseCode] = courseTitle;
                    }
                }
            });
    }

    return courseTitleMap;
}

async function handleFetchInternalMarks(req, res) {
    const sessionToken = getSessionTokenFromHeaders(req);
    const apiClient = await createSrmApiClient(sessionToken);

    try {
        const srmAttendanceResponse = await apiClient.get(SRM_ATTENDANCE_URL, {
            headers: {
                Accept: "*/*",
                "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
                Referer: SRM_DOMAIN + "/",
                "X-Requested-With": "XMLHttpRequest",
            },
        });

        const fullPageHtml = srmAttendanceResponse.data;
        const match = fullPageHtml.match(/pageSanitizer\.sanitize\('([\s\S]*)'\);/);

        if (!match || !match[1]) {
            logger.error("Failed to parse internal marks response");
            return res.status(500).json({
                success: false,
                error: "Failed to parse internal marks response",
            });
        }

        const unescapedHtml = unescapeHtmlString(match[1]);
        const $ = cheerio.load(unescapedHtml);

        const courseTitleMap = createCourseTitleMap($);
        const internalMarks = parseInternalMarks($, courseTitleMap);

        res.status(200).json({
            success: true,
            data: { internalMarks },
            timestamp: new Date().toISOString(),
        });
    } catch (error) {
        logger.error({ err: error.message }, "Error fetching internal marks");

        res.status(500).json({
            success: false,
            error: "Failed to fetch internal marks",
        });
    }
}

module.exports = { handleFetchInternalMarks };
