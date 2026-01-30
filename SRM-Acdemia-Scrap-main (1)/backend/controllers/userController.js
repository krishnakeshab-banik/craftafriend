const cheerio = require("cheerio");
const logger = require("../utils/logger");
const { unescapeHtmlString } = require("../utils/htmlUtils");
const { SRM_DOMAIN, createSrmApiClient } = require("../utils/srmApi");
const { getSessionTokenFromHeaders } = require("../utils/sessionUtils");
const User = require("../models/user");

async function handleFetchUserDetails(req, res) {
    const sessionToken = getSessionTokenFromHeaders(req);
    const apiClient = await createSrmApiClient(sessionToken);

    try {
        const srmTimetableUrl =
            `${SRM_DOMAIN}/srm_university/academia-academic-services/page/My_Time_Table_2023_24`;
        const srmTimetableResponse = await apiClient.get(srmTimetableUrl, {
            headers: {
                Accept: "*/*",
                "Accept-Language": "en-GB,en;q=0.7",
                Referer: `${SRM_DOMAIN}/`,
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

            return res
                .status(500)
                .json({
                    error: "Failed to parse response. Page structure may have changed.",
                });
        }

        const unescapedHtml = unescapeHtmlString(match[1]);
        const $ = cheerio.load(unescapedHtml);

        const studentDetails = {};
        const infoTable = $(
            'div[style*="line-height:150%"] > table[border="0"][align="left"]'
        );
        infoTable.find("tr").each((i, row) => {
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

        const advisors = {};
        $('td[align="center"]').each((i, el) => {
            const strongEl = $(el).find("strong");
            if (strongEl.length) {
                const strongText = strongEl.html();
                if (strongText && strongText.includes("Faculty Advisor")) {
                    advisors.facultyAdvisor = {
                        name: strongEl.contents().first().text().trim(),
                        email: $(el).find('font[color="blue"]').text().trim(),
                        phone: $(el).find('font[color="green"]').text().trim(),
                    };
                } else if (strongText && strongText.includes("Academic Advisor")) {
                    advisors.academicAdvisor = {
                        name: strongEl.contents().first().text().trim(),
                        email: $(el).find('font[color="blue"]').text().trim(),
                        phone: $(el).find('font[color="green"]').text().trim(),
                    };
                }
            }
        });

        // Save additional user details to MongoDB and get user email
        let userEmail = studentDetails["Email Id"] || studentDetails["Email"];
        try {
            const regNumber = studentDetails["Registration Number"] || studentDetails["Reg. No."];

            // Try to find user by registration number first, then by email
            let user;
            if (regNumber) {
                user = await User.findOne({ registrationNumber: regNumber });
            }

            if (!user && userEmail) {
                user = await User.findOne({ email: userEmail.toLowerCase() });
            }

            // If user found, update their details and get their email
            if (user) {
                user.name = studentDetails["Name"] || studentDetails["Student Name"];
                user.registrationNumber = regNumber;
                user.department = studentDetails["Department"];
                user.batch = studentDetails["Batch"];
                user.semester = studentDetails["Semester"] || studentDetails["Current Semester"];
                user.section = studentDetails["Section"];
                await user.save();
                userEmail = user.email; // Use email from database
                logger.info(`Updated user details for ${user.email} in database`);
            } else if (userEmail) {
                // Create new user if email exists in scraped data
                user = await User.create({
                    email: userEmail.toLowerCase(),
                    name: studentDetails["Name"] || studentDetails["Student Name"],
                    registrationNumber: regNumber,
                    department: studentDetails["Department"],
                    batch: studentDetails["Batch"],
                    semester: studentDetails["Semester"] || studentDetails["Current Semester"],
                    section: studentDetails["Section"]
                });
                logger.info(`Created user ${user.email} in database`);
            }
        } catch (dbError) {
            logger.error("Failed to update user details in database: " + dbError.message);
            // Continue even if DB update fails
        }

        res.status(200).json({
            name: studentDetails["Name"] || studentDetails["Student Name"],
            email: userEmail,
            registrationNumber: studentDetails["Registration Number"] || studentDetails["Reg. No."],
            department: studentDetails["Department"],
            batch: studentDetails["Batch"],
            semester: studentDetails["Semester"] || studentDetails["Current Semester"],
            section: studentDetails["Section"],
            studentDetails,
            advisors,
        });
    } catch (error) {
        logger.error(
            "An error occurred while fetching user details: " + error.message
        );
        if (error.response) {
            logger.error("Error data: " + JSON.stringify(error.response.data));
            logger.error("Error status: " + error.response.status);
        }
        res
            .status(500)
            .json({
                error: "An internal server error occurred.",
                details: error.message,
            });
    }
}

// Update user profile
async function handleUpdateUserProfile(req, res) {
    try {
        const sessionToken = getSessionTokenFromHeaders(req);
        if (!sessionToken) {
            return res.status(401).json({
                success: false,
                message: 'Authentication required'
            });
        }

        const user = await User.findOne({ sessionToken });
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        const {
            name,
            phoneNumber,
            bio,
            linkedin,
            github,
            instagram,
            portfolio
        } = req.body;

        // Update only provided fields
        if (name !== undefined) user.name = name;
        if (phoneNumber !== undefined) user.phoneNumber = phoneNumber;
        if (bio !== undefined) user.bio = bio;
        if (linkedin !== undefined) user.linkedin = linkedin;
        if (github !== undefined) user.github = github;
        if (instagram !== undefined) user.instagram = instagram;
        if (portfolio !== undefined) user.portfolio = portfolio;

        await user.save();

        logger.info(`User profile updated: ${user.email}`);

        res.status(200).json({
            success: true,
            message: 'Profile updated successfully',
            user: {
                _id: user._id,
                email: user.email,
                name: user.name,
                registrationNumber: user.registrationNumber,
                department: user.department,
                batch: user.batch,
                semester: user.semester,
                section: user.section,
                phoneNumber: user.phoneNumber,
                bio: user.bio,
                linkedin: user.linkedin,
                github: user.github,
                instagram: user.instagram,
                portfolio: user.portfolio
            }
        });
    } catch (error) {
        logger.error('Error updating user profile: ' + error.message);
        res.status(500).json({
            success: false,
            message: 'Error updating profile',
            error: error.message
        });
    }
}

// Get public profile - accessible without authentication
async function getPublicProfile(req, res) {
    try {
        const userId = req.params.userId;

        // Find user by ID and select only public fields
        const user = await User.findById(userId).select('-sessionToken -password');

        if (!user) {
            return res.status(404).json({
                success: false,
                error: 'User not found'
            });
        }

        // Get projects created by this user
        const Project = require('../models/project');
        const projects = await Project.find({ createdBy: userId })
            .select('title desc category members github createdAt')
            .sort({ createdAt: -1 })
            .limit(20);

        // Return public profile data
        res.status(200).json({
            success: true,
            user: {
                _id: user._id,
                name: user.name,
                email: user.email,
                registrationNumber: user.registrationNumber,
                department: user.department,
                batch: user.batch,
                bio: user.bio,
                linkedin: user.linkedin,
                github: user.github,
                instagram: user.instagram,
                portfolio: user.portfolio,
                createdAt: user.createdAt
            },
            projects: projects,
            projectCount: projects.length
        });
    } catch (error) {
        logger.error('Error fetching public profile: ' + error.message);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch user profile',
            details: error.message
        });
    }
}

module.exports = { handleFetchUserDetails, handleUpdateUserProfile, getPublicProfile };
