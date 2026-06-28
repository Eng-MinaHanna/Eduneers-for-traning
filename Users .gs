function generateSessionToken() {
  return Utilities.getUuid();
}

function updateSessionForUser(sheet, email) {
  var data = sheet.getDataRange().getValues();
  var token = generateSessionToken();
  for (var i = 1; i < data.length; i++) {
    if (data[i][1].toString().trim().toLowerCase() === email.toLowerCase()) {
       sheet.getRange(i + 1, 6).setValue(token); // حفظ التوكن في العمود F
       return token;
    }
  }
  return null;
}

function validateSession(sheet, email, token) {
  if(!email || !token) return false;
  var data = sheet.getDataRange().getValues();
  for (var i = 1; i < data.length; i++) {
    if (data[i][1].toString().trim().toLowerCase() === email.toLowerCase() && data[i][5] === token) {
       return true; 
    }
  }
  return false;
}

function doGet(e) {
  var action = e.parameter.action;
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  var data = sheet.getDataRange().getValues();

  // 1️⃣ تسجيل الدخول (لا يحتاج توكن مسبق)
  if (action === "login") {
    var loginEmail = e.parameter.email;
    var password = e.parameter.password;
    if (!loginEmail || !password) return ContentService.createTextOutput(JSON.stringify({"status": "error", "message": "❌ بيانات مفقودة"})).setMimeType(ContentService.MimeType.JSON);

    for (var i = 1; i < data.length; i++) {
      if (data[i][1].toString().trim().toLowerCase() === loginEmail.toLowerCase() && data[i][2].toString().trim() === password) {
        var newToken = updateSessionForUser(sheet, loginEmail);
        return ContentService.createTextOutput(JSON.stringify({
          "status": "success", "userName": data[i][0].toString(), "role": data[i][3] ? data[i][3].toString().trim() : "User", "group": data[i][4] ? data[i][4].toString().trim() : "Group A", "sessionToken": newToken
        })).setMimeType(ContentService.MimeType.JSON);
      }
    }
    return ContentService.createTextOutput(JSON.stringify({"status": "error", "message": "❌ الإيميل أو كلمة المرور خطأ"})).setMimeType(ContentService.MimeType.JSON);
  }

  if (action === "googleLogin") {
    var googleEmail = e.parameter.email;
    if (!googleEmail) return ContentService.createTextOutput(JSON.stringify({"status": "error", "message": "❌ بريد مفقود"})).setMimeType(ContentService.MimeType.JSON);

    for (var j = 1; j < data.length; j++) {
      if (data[j][1].toString().trim().toLowerCase() === googleEmail.toLowerCase()) {
        var newGToken = updateSessionForUser(sheet, googleEmail);
        return ContentService.createTextOutput(JSON.stringify({
          "status": "success", "userName": data[j][0].toString(), "role": data[j][3] ? data[j][3].toString().trim() : "User", "group": data[j][4] ? data[j][4].toString().trim() : "Group A", "sessionToken": newGToken
        })).setMimeType(ContentService.MimeType.JSON);
      }
    }
    return ContentService.createTextOutput(JSON.stringify({"status": "error", "message": "❌ هذا الحساب غير مصرح له بالدخول"})).setMimeType(ContentService.MimeType.JSON);
  }

  // 2️⃣ حماية باقي العمليات بالتوكن الديناميكي
  var reqEmail = e.parameter.email;
  var reqToken = e.parameter.token;
  if (!validateSession(sheet, reqEmail, reqToken)) {
    return ContentService.createTextOutput(JSON.stringify({"status": "unauthorized", "message": "❌ غير مصرح بالوصول أو الجلسة منتهية"})).setMimeType(ContentService.MimeType.JSON);
  }

  // 3️⃣ باقي العمليات
  if (action === "getUsers") {
    var users = [];
    for (var k = 1; k < data.length; k++) {
      if (data[k][1]) {
        users.push({ name: data[k][0], email: data[k][1], role: data[k][3], group: data[k][4] ? data[k][4].toString().trim() : "Group A" });
      }
    }
    return ContentService.createTextOutput(JSON.stringify({"status": "success", "users": users})).setMimeType(ContentService.MimeType.JSON);
  }

  if (action === "addUser") {
    sheet.appendRow([e.parameter.name, e.parameter.targetEmail, e.parameter.pass, e.parameter.role, e.parameter.group, ""]);
    return ContentService.createTextOutput(JSON.stringify({"status": "success", "message": "✅ تم الإضافة بنجاح"})).setMimeType(ContentService.MimeType.JSON);
  }

  if (action === "deleteUser") {
    for (var l = 1; l < data.length; l++) {
      if (data[l][1].toString().trim() === e.parameter.targetEmail) {
        sheet.deleteRow(l + 1);
        return ContentService.createTextOutput(JSON.stringify({"status": "success", "message": "✅ تم الحذف"})).setMimeType(ContentService.MimeType.JSON);
      }
    }
  }

  if (action === "updateRole") {
    for (var m = 1; m < data.length; m++) {
      if (data[m][1].toString().trim() === e.parameter.targetEmail) {
        sheet.getRange(m + 1, 4).setValue(e.parameter.role); 
        return ContentService.createTextOutput(JSON.stringify({"status": "success", "message": "✅ تم التعديل"})).setMimeType(ContentService.MimeType.JSON);
      }
    }
  }
  
  if (action === "updateGroup") {
    for (var n = 1; n < data.length; n++) {
      if (data[n][1].toString().trim() === e.parameter.targetEmail) {
        sheet.getRange(n + 1, 5).setValue(e.parameter.group); 
        return ContentService.createTextOutput(JSON.stringify({"status": "success", "message": "✅ تم التعديل"})).setMimeType(ContentService.MimeType.JSON);
      }
    }
  }

  if (action === "checkMyRole") {
    for (var p = 1; p < data.length; p++) {
      if (data[p][1].toString().trim() === reqEmail) {
        return ContentService.createTextOutput(JSON.stringify({
          "status": "success", "role": data[p][3] ? data[p][3].toString().trim() : "User", "group": data[p][4] ? data[p][4].toString().trim() : "Group A"
        })).setMimeType(ContentService.MimeType.JSON);
      }
    }
    return ContentService.createTextOutput(JSON.stringify({"status": "deleted"})).setMimeType(ContentService.MimeType.JSON);
  }

  return ContentService.createTextOutput(JSON.stringify({"status": "error", "message": "Unknown action"})).setMimeType(ContentService.MimeType.JSON);
}