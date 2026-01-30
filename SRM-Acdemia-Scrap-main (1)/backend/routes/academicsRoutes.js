const express = require('express');
const router = express.Router();
const { handleFetchTimetable } = require('../controllers/timetableController');
const { handleFetchAttendance } = require('../controllers/attendanceController');
const { handleFetchInternalMarks } = require('../controllers/marksController');
const { fetchAcademicCalendarData } = require('../controllers/calendarController');

router.get('/timetable', handleFetchTimetable);
router.get('/attendance', handleFetchAttendance);
router.get('/marks', handleFetchInternalMarks);
router.get('/calendar', fetchAcademicCalendarData);

module.exports = router;
