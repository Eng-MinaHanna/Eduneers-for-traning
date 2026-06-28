/**
 * EDUNEERS SYSTEM - COORDINATOR DIPLOMA SHEETS GENERATOR
 * Execute the `createCoordinatorDiplomaFile` function to generate the complete spreadsheet.
 */

function createCoordinatorDiplomaFile() {
  const groupName = "Group Name (e.g. Group A)";
  const spreadsheet = SpreadsheetApp.create(`Diploma Sheets - ${groupName}`);
  
  // Dummy data representing K1 to K60 students
  const students = [];
  for (let i = 1; i <= 60; i++) {
    students.push({
      name: `Student Name ${i}`,
      code: `K${i}EDUR9`
    });
  }

  // 1. Grade Sheet
  const gradeSheet = spreadsheet.getSheets()[0];
  gradeSheet.setName("Grade Sheet");
  gradeSheet.setRightToLeft(true);
  buildGradeSheet(gradeSheet, students);

  // 2. Excel
  const excelSheet = spreadsheet.insertSheet("Excel");
  excelSheet.setRightToLeft(true);
  buildExcelSheet(excelSheet, students);

  // 3. AutoCAD
  const autocadSheet = spreadsheet.insertSheet("AutoCAD");
  autocadSheet.setRightToLeft(true);
  buildAutoCADSheet(autocadSheet, students);

  // 4. EVO
  const evoSheet = spreadsheet.insertSheet("EVO");
  evoSheet.setRightToLeft(true);
  buildEVOSheet(evoSheet, students);

  // 5. Tasks Sheet
  const tasksSheet = spreadsheet.insertSheet("Tasks Sheet");
  tasksSheet.setRightToLeft(true);
  buildTasksSheet(tasksSheet, students);

  // 6. Attendance Sheet
  const attendanceSheet = spreadsheet.insertSheet("Attendance Sheet");
  attendanceSheet.setRightToLeft(true);
  buildAttendanceSheet(attendanceSheet, students);

  Logger.log(`Successfully created Coordinator File: ${spreadsheet.getUrl()}`);
}


// =======================================================
// 1. GRADE SHEET
// =======================================================
function buildGradeSheet(sheet, students) {
  // Row 1 & 2 Headers
  sheet.getRange("A1:A2").merge().setValue("NAME");
  sheet.getRange("B1:B2").merge().setValue("CODE");
  
  sheet.getRange("C1:E1").merge().setValue("pre diploma");
  sheet.getRange("C2").setValue("AutoCAD");
  sheet.getRange("D2").setValue("Dialux Evo");
  sheet.getRange("E2").setValue("Excel");

  sheet.getRange("F1:P1").merge().setValue("Design");
  sheet.getRange("F2").setValue("grade(100)");
  const designCols = ["Task 1", "Task 2", "اوائل الربع الاول", "TASK 3", "TASK 4", "اوائل الربع التاني", "TASK 5", "TASK 6", "اوائل الربع التالت", "TASK 7"];
  sheet.getRange(2, 7, 1, 10).setValues([designCols]);

  sheet.getRange("Q1:AB1").merge().setValue("tech office");
  const techCols = ["TASK 8", "TASK 9", "TASK 10", "اوائل الربع الاخير", "اوائل التراك", "TASK 11", "TASK 12", "اوائل النص الاول", "TASK 13", "TASK 14", "اوائل النص التاني", "اوائل التراك"];
  sheet.getRange(2, 17, 1, 12).setValues([techCols]);

  sheet.getRange("AC1:AE1").merge().setValue("light current");
  const lightCols = ["TASK 15", "TASK 16", "TASK 17"];
  sheet.getRange(2, 29, 1, 3).setValues([lightCols]);

  sheet.getRange("AF1:AF2").merge().setValue("اوائل الدبلومة");

  sheet.getRange("A1:AF2").setFontWeight("bold").setBackground("#d9ead3").setHorizontalAlignment("center");

  // Students (7 rows each)
  let startRow = 3;
  const gradeCriteria = ["Main task", "attendance .15", "feedback.5", "attitude .5", "online quize", "bonus", "sum"];
  
  students.forEach((student, index) => {
    // Identity Merges
    sheet.getRange(startRow, 1, 7, 1).merge().setValue(student.name).setHorizontalAlignment("center").setVerticalAlignment("middle");
    sheet.getRange(startRow, 2, 7, 1).merge().setValue(student.code).setHorizontalAlignment("center").setVerticalAlignment("middle");
    sheet.getRange(startRow, 32, 7, 1).merge().setValue(0).setHorizontalAlignment("center").setVerticalAlignment("middle"); // AF Col

    // Grade Criteria (Col F)
    for (let i = 0; i < 7; i++) {
        sheet.getRange(startRow + i, 6).setValue(gradeCriteria[i]).setFontWeight(i === 6 ? "bold" : "normal");
    }

    // Formulas for row 7 (sum row)
    const sumRow = startRow + 6;
    for (let c = 3; c <= 31; c++) {
      if (c === 6) continue; // Skip F
      const colLetter = String.fromCharCode(64 + c); // Simple col letter assuming A-Z. For AA+, logic needed.
      const colName = getColName(c);
      sheet.getRange(sumRow, c).setFormula(`=SUM(${colName}${startRow}:${colName}${sumRow - 1})`).setFontWeight("bold").setBackground("#cfe2f3");
    }

    startRow += 7;
  });
}

function getColName(colNum) {
  let temp, letter = '';
  while (colNum > 0) {
    temp = (colNum - 1) % 26;
    letter = String.fromCharCode(temp + 65) + letter;
    colNum = (colNum - temp - 1) / 26;
  }
  return letter;
}


// =======================================================
// 2. EXCEL SHEET
// =======================================================
function buildExcelSheet(sheet, students) {
  sheet.getRange("A1:A2").merge().setValue("الاسم بالكامل");
  sheet.getRange("B1:B2").merge().setValue("الكود في الدبلومة");
  
  const headers = [
    ["مليء ال cells بالمعطيات", "التاكد من مليء الخلايا باستخدام ال auto fill", "عمل Borders للخلايا", "عمل Merge لبعض الخلايا كما هو موضح في الشيت", "استخدام الدوال مثل دالة sum لايجاد ال Total connected load", "التاكد من ان الفازات اذا كانت اقل من 10% تعطي Balanced وغير ذلك تعطي Unbalanced", "التاكد من ان Demand factor=0.65 وملاحظة التغير في ال Demand load", "طباعة الشيت واستخراجه في صورة pdf"],
    [15, 5, 5, 5, 10, 15, 10, 5]
  ];
  sheet.getRange("C1:J2").setValues(headers).setHorizontalAlignment("center").setWrap(true);
  sheet.getRange("K1:K2").merge().setValue("sum (70)");

  sheet.getRange("A1:K2").setFontWeight("bold").setBackground("#fff2cc");

  students.forEach((student, index) => {
    const row = index + 3;
    sheet.getRange(row, 1).setValue(student.name);
    sheet.getRange(row, 2).setValue(student.code);
    sheet.getRange(row, 11).setFormula(`=SUM(C${row}:J${row})`);
  });
}

// =======================================================
// 3. AUTOCAD SHEET
// =======================================================
function buildAutoCADSheet(sheet, students) {
  sheet.getRange("A1:A2").merge().setValue("الاسم بالكامل");
  sheet.getRange("B1:B2").merge().setValue("الكود في الدبلومة");
  
  const headers = [
    ["Drawing 1", "Drawing 2", "Drawing 3", "Drawing 4", "Drawing 5", "Drawing 6", "Drawing 7", "Drawing 8"],
    [6, 15, 5, 5, 5, 4, 10, 20]
  ];
  sheet.getRange("C1:J2").setValues(headers).setHorizontalAlignment("center").setWrap(true);
  sheet.getRange("K1:K2").merge().setValue("sum (70)");

  sheet.getRange("A1:K2").setFontWeight("bold").setBackground("#fce5cd");

  students.forEach((student, index) => {
    const row = index + 3;
    sheet.getRange(row, 1).setValue(student.name);
    sheet.getRange(row, 2).setValue(student.code);
    sheet.getRange(row, 11).setFormula(`=SUM(C${row}:J${row})`);
  });
}

// =======================================================
// 4. EVO SHEET
// =======================================================
function buildEVOSheet(sheet, students) {
  sheet.getRange("A1:A2").merge().setValue("الاسم بالكامل");
  sheet.getRange("B1:B2").merge().setValue("الكود في الدبلومة");
  
  const headers = [
    ["ادخال ال plan وتحديد الى البرنامج x,y والوحدات", "عمل الحدود الخارجية", "عمل الفراغات الداخليه", "تسمية الغرف وتحديد نوع الغرفه وارتفاعها", "فرش الغرف", "تنزيل الكتالوج وادخاله للبرنامج", "توزيع الكشافات في الغرف والتحقق من ال lux", "استخراج شيت الحسابات ونقل الكشافات الى ملف الكاد"],
    [4, 6, 15, 10, 10, 5, 10, 10]
  ];
  sheet.getRange("C1:J2").setValues(headers).setHorizontalAlignment("center").setWrap(true);
  sheet.getRange("K1:K2").merge().setValue("sum (70)");

  sheet.getRange("A1:K2").setFontWeight("bold").setBackground("#d9d2e9");

  students.forEach((student, index) => {
    const row = index + 3;
    sheet.getRange(row, 1).setValue(student.name);
    sheet.getRange(row, 2).setValue(student.code);
    sheet.getRange(row, 11).setFormula(`=SUM(C${row}:J${row})`);
  });
}

// =======================================================
// 5. TASKS SHEET
// =======================================================
function buildTasksSheet(sheet, students) {
  sheet.getRange("A1:Y1").merge().setValue("Tasks Sheet").setFontWeight("bold").setHorizontalAlignment("center");
  
  sheet.getRange("A2").setValue("name").setBackground("#ea9999");
  sheet.getRange("B2").setValue("code").setBackground("#ea9999");
  sheet.getRange("C2").setValue("drive").setBackground("#ea9999");
  
  sheet.getRange("D2:F2").merge().setValue("pre").setBackground("#fce5cd");
  sheet.getRange(3, 4, 1, 3).setValues([["excel", "autocad", "dialux"]]);

  // Handle Design Track - include task 2 but don't count it towards the metric
  sheet.getRange("G2:P2").merge().setValue("design track").setBackground("#fff2cc");
  const designTasks = ["task 1", "task 2", "task 3", "task 4", "task 5", "task 6", "task 7", "task 8", "task 9", "task 10"];
  sheet.getRange(3, 7, 1, 10).setValues([designTasks]);

  sheet.getRange("Q2:T2").merge().setValue("Technical office Track").setBackground("#d0e0e3");
  sheet.getRange(3, 17, 1, 4).setValues([["task 1", "task 2", "task 3", "task 4"]]);

  sheet.getRange("U2:W2").merge().setValue("low current Track").setBackground("#ead1dc");
  sheet.getRange(3, 21, 1, 3).setValues([["task 1", "task 2", "task 3"]]);

  sheet.getRange("X2").setValue("%").setBackground("#9fc5e8");
  sheet.getRange("Y2").setValue("Count").setBackground("#9fc5e8");
  sheet.getRange("Z2").setValue("PROJECT").setBackground("#9fc5e8");

  sheet.getRange("A2:Z3").setFontWeight("bold").setHorizontalAlignment("center");

  // Add checkboxes (excluding Task 2 which is at Column H = 8)
  const checkboxRule = SpreadsheetApp.newDataValidation().requireCheckbox().build();
  // Columns D to G (4 to 7)
  sheet.getRange(4, 4, students.length, 4).setDataValidation(checkboxRule);
  // Column H is skipped from formatting/checkboxing (Task 2) as implied by the logic, 
  // but if the user wants the checkbox visually without counting it, we'll give it a checkbox.
  // We'll give everything D to W checkboxes.
  sheet.getRange(4, 4, students.length, 20).setDataValidation(checkboxRule); // D to W
  sheet.getRange(4, 26, students.length, 1).setDataValidation(checkboxRule); // Z Project

  students.forEach((student, index) => {
    const row = index + 4;
    sheet.getRange(row, 1).setValue(student.name);
    sheet.getRange(row, 2).setValue(student.code);
    
    // Formula for % (assuming exactly 11 tasks required)
    // To only count specific ones, or count all except H: `= (COUNTIF(D${row}:G${row}, TRUE) + COUNTIF(I${row}:W${row}, TRUE)) / 11`
    // However, if the user mentioned the denominator is exactly 11, then we can use the sum over 11.
    sheet.getRange(row, 24).setFormula(`=(COUNTIF(D${row}:G${row}, TRUE) + COUNTIF(I${row}:W${row}, TRUE))/11`).setNumberFormat("0.00%");
    
    // Formula for Count
    sheet.getRange(row, 25).setFormula(`=COUNTIF(D${row}:G${row}, TRUE) + COUNTIF(I${row}:W${row}, TRUE)`);
  });

  // Conditional Formatting for < 11 tasks (~100%) - user implied `< 11 tasks`
  const conditions = SpreadsheetApp.newConditionalFormatRule()
    .whenFormulaSatisfied(`=$Y4<11`)
    .setBackground("#f4cccc")
    .setFontColor("#cc0000")
    .setRanges([sheet.getRange(4, 24, students.length, 2)])
    .build();
  sheet.setConditionalFormatRules([conditions]);
}

// =======================================================
// 6. ATTENDANCE SHEET
// =======================================================
function buildAttendanceSheet(sheet, students) {
  sheet.getRange("A1:U1").merge().setValue("Attendance Sheet (Group)").setFontWeight("bold").setHorizontalAlignment("center");
  
  sheet.getRange("A3").setValue("NAME");
  sheet.getRange("B3").setValue("CODE");

  sheet.getRange("C2:L2").merge().setValue("Design Track").setBackground("#fff2cc");
  const dDates = ["25/6 (wed)", "29/6 (sun)", "2/7 (wed)", "6/7 (sun)", "9/7 (wed)", "13/7 (sun)", "16/7 (wed)", "20/7 (sun)", "23/7 (wed)", "27/7 (sun)"];
  sheet.getRange(3, 3, 1, 10).setValues([dDates]);

  sheet.getRange("M2:P2").merge().setValue("Technical office Track").setBackground("#d0e0e3");
  const tDates = ["3/8 (sun)", "6/8 (wed)", "10/8 (sun)", "13/8 (wed)"];
  sheet.getRange(3, 13, 1, 4).setValues([tDates]);

  sheet.getRange("Q2:S2").merge().setValue("Implementation Track").setBackground("#ead1dc");
  const iDates = ["3/9 (sun)", "7/9 (sun)", "10/9 (wed)"];
  sheet.getRange(3, 17, 1, 3).setValues([iDates]);

  sheet.getRange("T2").setValue("%").setBackground("#9fc5e8");
  sheet.getRange("U2").setValue("Count").setBackground("#9fc5e8");

  sheet.getRange("A2:U3").setFontWeight("bold").setHorizontalAlignment("center");
  
  sheet.getRange("V4").setValue("نسبة الحضور 80%").setBackground("#d9ead3").setFontWeight("bold");
  sheet.getRange("W4").setValue("13 محاضرة").setBackground("#d9ead3").setFontWeight("bold");

  // Checkboxes
  const checkboxRule = SpreadsheetApp.newDataValidation().requireCheckbox().build();
  sheet.getRange(5, 3, students.length, 17).setDataValidation(checkboxRule); // C to S

  students.forEach((student, index) => {
    const row = index + 5;
    sheet.getRange(row, 1).setValue(student.name);
    sheet.getRange(row, 2).setValue(student.code);
    
    // col U (Count)
    sheet.getRange(row, 21).setFormula(`=COUNTIF(C${row}:S${row}, TRUE)`);
    // col T (%)
    sheet.getRange(row, 20).setFormula(`=U${row}/17`).setNumberFormat("0.00%");
  });

  // Conditional format for < 13
  const rule = SpreadsheetApp.newConditionalFormatRule()
    .whenFormulaSatisfied(`=$U5<13`)
    .setBackground("#f4cccc")
    .setFontColor("#cc0000")
    .setRanges([sheet.getRange(5, 20, students.length, 2)])
    .build();
  sheet.setConditionalFormatRules([rule]);
}
// =======================================================
// 7. API HANDLER (doGet)
// =======================================================

/**
 * Handle incoming requests from the Frontend
 */
function doGet(e) {
  const p = e.parameter;
  const action = p.action;
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  
  try {
    if (action === "scan") {
      return handleAttendance(ss, p);
    } 
    else if (action === "saveGrade") {
      return handleGradeUpdate(ss, p, "Main task");
    }
    else if (action === "saveQuiz") {
      return handleGradeUpdate(ss, p, "online quize");
    }
    else if (action === "saveExtra") {
      return handleExtraUpdate(ss, p);
    }
    else if (action === "getTop" || action === "getDashboard") {
      return handleGetTop(ss, p);
    }
    else if (action === "deleteAttendance") {
      return handleDeleteAttendance(ss, p);
    }
    
    return createJsonResponse({ status: "error", message: "Unknown action" });
  } catch (err) {
    return createJsonResponse({ status: "error", message: err.toString() });
  }
}

function handleAttendance(ss, p) {
  const code = p.qrCode;
  const lec = parseInt(p.lectureNum);
  const auth = { email: p.email, token: p.token, group: p.group };
  
  // 1. Update Attendance Sheet
  const attendSheet = ss.getSheetByName("Attendance Sheet");
  const studentRowAttend = findStudentRow(attendSheet, code);
  if (studentRowAttend) {
    const col = 2 + lec; // C is 3
    attendSheet.getRange(studentRowAttend, col).setValue(true);
  }
  
  // 2. Update Grade Sheet (Auto-fill the 15 points)
  const gradeSheet = ss.getSheetByName("Grade Sheet");
  const studentRowGrade = findStudentRow(gradeSheet, code);
  if (studentRowGrade) {
    const targetRow = studentRowGrade + 1; // "attendance .15" is Row 2 of 7
    const colGrade = getGradeColumn(lec);
    gradeSheet.getRange(targetRow, colGrade).setValue(15);
  }
  
  const studentName = attendSheet.getRange(studentRowAttend || 3, 1).getValue();
  return createJsonResponse({ status: "success", name: studentName, message: "Attendance & Grade synced" });
}

function handleGradeUpdate(ss, p, category) {
  const sheet = ss.getSheetByName("Grade Sheet");
  const code = p.qrCode;
  const lec = parseInt(p.taskNum || p.quizNum || p.lectureNum);
  const val = parseFloat(p.val);
  
  const studentRow = findStudentRow(sheet, code);
  if (!studentRow) return createJsonResponse({ status: "error", message: "Student not found" });
  
  // Standardized Categories Array
  const categories = ["Main task", "attendance .15", "feedback.5", "attitude .5", "online quize", "bonus", "sum"];
  const categoryOffset = categories.indexOf(category);
  if (categoryOffset === -1) return createJsonResponse({ status: "error", message: "Category label mismatch" });
  
  const targetRow = studentRow + categoryOffset;
  const col = getGradeColumn(lec);
  sheet.getRange(targetRow, col).setValue(val);
  
  return createJsonResponse({ status: "success", message: `Saved ${category} for Task ${lec}` });
}

function handleExtraUpdate(ss, p) {
  const sheet = ss.getSheetByName("Grade Sheet");
  const code = p.qrCode;
  const lec = parseInt(p.lectureNum);
  const studentRow = findStudentRow(sheet, code);
  if (!studentRow) return createJsonResponse({ status: "error", message: "Student not found" });

  const col = getGradeColumn(lec);
  
  if (p.attitude) sheet.getRange(studentRow + 3, col).setValue(parseFloat(p.attitude));
  if (p.bonus) sheet.getRange(studentRow + 5, col).setValue(parseFloat(p.bonus));
  if (p.feedback == "1") sheet.getRange(studentRow + 2, col).setValue(5); // Fixed 5 points for feedback

  return createJsonResponse({ status: "success", message: "Extra points saved" });
}

function handleGetTop(ss, p) {
  const fromLec = parseInt(p.fromLec || p.fromTask || p.fromQuiz || 1);
  const toLec   = parseInt(p.toLec   || p.toTask  || p.toQuiz  || 20);

  // ===== 1. ATTENDANCE =====
  // Triggered when toLec is present WITHOUT toTask and WITHOUT toQuiz
  if (p.toLec && !p.toTask && !p.toQuiz && !p.extraOnly) {
    const sheet = ss.getSheetByName("Attendance Sheet");
    const data = sheet.getDataRange().getValues();
    const scores = [];
    const weight = parseFloat(p.weight) || 1;

    for (let i = 4; i < data.length; i++) {
      if (!data[i][1]) continue;
      let count = 0;
      for (let l = parseInt(p.fromLec); l <= parseInt(p.toLec); l++) {
        if (data[i][1 + l] === true) count++;
      }
      scores.push({ name: data[i][0], id: data[i][1], total: count * weight });
    }
    return createJsonResponse({ status: "success", scores: scores });
  }

  // ===== 2. GRADES SHEET QUERIES =====
  const gradeSheet = ss.getSheetByName("Grade Sheet");
  const data = gradeSheet.getDataRange().getValues();
  const scores = [];

  // Determine row offset within the 7-row block:
  // toTask only   → Main Task (offset 0)
  // toQuiz only   → Online Quiz (offset 4)
  // extraOnly=1   → Extra: sum of Feedback(+2) + Attitude(+3) + Bonus(+5)
  let offset = -1;
  let isExtra = false;

  if (p.toTask && !p.toQuiz && !p.extraOnly) {
    offset = 0; // Main Task row
  } else if (p.toQuiz && !p.toTask && !p.extraOnly) {
    offset = 4; // Online Quiz row
  } else {
    isExtra = true; // Extra = feedback + attitude + bonus
  }

  for (let i = 2; i < data.length; i += 7) {
    const studentName = data[i][0];
    const studentId   = data[i][1];
    if (!studentId) continue;

    let studentTotal = 0;
    for (let l = fromLec; l <= toLec; l++) {
      const colIdx = getGradeColumn(l) - 1;
      if (colIdx < data[i].length) {
        if (!isExtra) {
          studentTotal += (parseFloat(data[i + offset][colIdx]) || 0);
        } else {
          // Extra = Feedback (i+2) + Attitude (i+3) + Bonus (i+5)
          studentTotal += (parseFloat(data[i + 2][colIdx]) || 0);
          studentTotal += (parseFloat(data[i + 3][colIdx]) || 0);
          studentTotal += (parseFloat(data[i + 5][colIdx]) || 0);
        }
      }
    }
    scores.push({ name: studentName, id: studentId, total: studentTotal });
  }

  return createJsonResponse({ status: "success", scores: scores });
}
// ==========================================
// Eduneers Central Links API Backend
// ==========================================

function doPost(e) {
  // Allow cross-origin POST
  return handleRequest(e);
}

function doGet(e) {
  return handleRequest(e);
}

function handleRequest(e) {
  try {
    const p = e.parameter;
    const action = p.action;
    
    // Enable CORS manually (Return content as JSON text)
    if (!action) {
      return createResponse({ status: 'error', message: 'No action specified' });
    }

    const ss = SpreadsheetApp.getActiveSpreadsheet();

    if (action === "getAllLinks") {
      return getAllLinks(ss);
    } 
    else if (action === "saveGroup") {
      return saveGroupLink(ss, p.group, p.url);
    }
    else if (action === "removeGroup") {
      return saveGroupLink(ss, p.group, "");
    }
    else if (action === "saveIndividual") {
      return saveIndividualLink(ss, p.code, p.url, p.group);
    }
    else if (action === "removeIndividual") {
      return removeIndividualLink(ss, p.code);
    }

    return createResponse({ status: "error", message: "Unknown action" });
  } catch (err) {
    return createResponse({ status: "error", message: err.toString() });
  }
}

function createResponse(data) {
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

// ----------------------------------------
// Get All Links
// ----------------------------------------
function getAllLinks(ss) {
  let responseStr = { status: "success", groups: {}, individuals: {} };

  // 1. Fetch Groups
  const groupSheet = ss.getSheetByName("DiplomaLinks");
  if (groupSheet) {
    const data = groupSheet.getDataRange().getValues();
    for (let i = 1; i < data.length; i++) { // Skip header
      if (data[i][0] && data[i][1]) {
        let gName = data[i][0].toString().trim();
        if (!gName.toLowerCase().startsWith("group")) {
            gName = "Group " + gName;
        }
        responseStr.groups[gName] = data[i][1].toString().trim();
      }
    }
  }

  // 2. Fetch Individuals
  const indSheet = ss.getSheetByName("IndividualLinks");
  if (indSheet) {
    const data = indSheet.getDataRange().getValues();
    for (let i = 1; i < data.length; i++) { // Skip header
      if (data[i][1] && data[i][2]) {
        responseStr.individuals[data[i][1].toString().trim()] = data[i][2].toString().trim();
      }
    }
  }

  return createResponse(responseStr);
}

// ----------------------------------------
// Save / Edit Group Link
// ----------------------------------------
function saveGroupLink(ss, groupName, url) {
  const sheet = ss.getSheetByName("DiplomaLinks");
  if (!sheet) return createResponse({ status: "error", message: "Sheet DiplomaLinks not found" });

  const data = sheet.getDataRange().getValues();
  // frontend sends "Group A", sheet might have "A"
  const searchName = groupName.replace(/group\s+/i, "").trim(); 
  
  for (let i = 1; i < data.length; i++) {
    if (data[i][0].toString().trim() == searchName || data[i][0].toString().trim() == groupName) {
      sheet.getRange(i + 1, 2).setValue(url);
      return createResponse({ status: "success", message: `Updated Group ${groupName}` });
    }
  }

  // Not found, find first empty row
  const row = findEmptyRow(sheet, 1);
  sheet.getRange(row, 1).setValue(searchName); // Save "A"
  sheet.getRange(row, 2).setValue(url);
  return createResponse({ status: "success", message: `Added new Group ${groupName}` });
}

// ----------------------------------------
// Save / Edit Individual Link
// ----------------------------------------
function saveIndividualLink(ss, studentCode, url, groupName) {
  const sheet = ss.getSheetByName("IndividualLinks");
  if (!sheet) return createResponse({ status: "error", message: "Sheet IndividualLinks not found" });

  const data = sheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (data[i][1] && data[i][1].toString().trim() == studentCode) {
      sheet.getRange(i + 1, 3).setValue(url);
      // Update group if provided
      if (groupName) sheet.getRange(i + 1, 1).setValue(groupName);
      return createResponse({ status: "success", message: `Updated Individual ${studentCode}` });
    }
  }

  // If student not found, find empty row
  const row = findEmptyRow(sheet, 2);
  sheet.getRange(row, 1).setValue(groupName || "");
  sheet.getRange(row, 2).setValue(studentCode);
  sheet.getRange(row, 3).setValue(url);
  return createResponse({ status: "success", message: `Added Individual ${studentCode}` });
}

// Helper to avoid appendRow() going to Row 1000 due to formatting
function findEmptyRow(sheet, colIndex) {
  const values = sheet.getRange(1, colIndex, sheet.getMaxRows(), 1).getValues();
  for (let i = 0; i < values.length; i++) {
    if (!values[i][0]) return i + 1;
  }
  return sheet.getMaxRows() + 1;
}

// ----------------------------------------
// Remove Individual Link
// ----------------------------------------
function removeIndividualLink(ss, studentCode) {
  const sheet = ss.getSheetByName("IndividualLinks");
  if (!sheet) return createResponse({ status: "error", message: "Sheet IndividualLinks not found" });

  const data = sheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (data[i][1] == studentCode) {
      sheet.deleteRow(i + 1);
      return createResponse({ status: "success", message: `Removed Individual ${studentCode}` });
    }
  }
  
  return createResponse({ status: "success", message: "Student not found, nothing to remove" });
}

// Helpers
function findStudentRow(sheet, code) {
  const data = sheet.getRange("B1:B").getValues();
  for (let i = 0; i < data.length; i++) {
    if (data[i][0].toString().trim().toUpperCase() === code.trim().toUpperCase()) {
      return i + 1;
    }
  }
  return null;
}

function getGradeColumn(lec) {
  // Simplified mapping:
  // Lec 1-10 -> Tech/Design (G to P) with some offsets for headers
  // For now, let's use a linear mapping logic:
  if (lec <= 2) return 6 + lec; // Task 1=7, Task 2=8
  if (lec <= 4) return 7 + lec; // Task 3=10, Task 4=11 (skipping 'اوائل الربع الاول')
  if (lec <= 6) return 8 + lec; // Task 5=14, Task 6=15
  if (lec <= 7) return 9 + lec; // Task 7=16
  // Continue mapping for tech office...
  return 6 + lec; // Fallback
}

function createJsonResponse(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
