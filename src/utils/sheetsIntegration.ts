import * as XLSX from 'xlsx';
import { PlayerScoreRecord } from '../types';

export function generateGoogleAppsScriptCode(sheetName: string = 'PlayerScores'): string {
  return `/**
 * ==============================================================================
 * AI TELL STUDIO - GOOGLE SHEETS AUTOMATION SCRIPT
 * Automatically records game player entries, names, emails, scores, and analytics.
 * ==============================================================================
 * 
 * INSTRUCTIONS TO DEPLOY:
 * 1. Open your Google Sheet (https://sheets.new)
 * 2. Click on "Extensions" > "Apps Script" in the top menu.
 * 3. Delete any existing code in the editor, and PASTE this entire script.
 * 4. Click the blue "Deploy" button (top right) > "New deployment".
 * 5. Select type: "Web app".
 * 6. Set "Description": AI Detective Score Collector
 * 7. Set "Execute as": Me (your Google account)
 * 8. Set "Who has access": Anyone (IMPORTANT so player submissions can write to the sheet).
 * 9. Click "Deploy", authorize permissions when prompted, and COPY the Web App URL.
 * 10. Paste the Web App URL into AI Tell Studio's Google Sheets settings!
 */

function doPost(e) {
  var lock = LockService.getScriptLock();
  try {
    lock.waitLock(10000); // 10 sec lock to handle concurrent player submissions safely
    
    var sheetName = "${sheetName || 'PlayerScores'}";
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName(sheetName);
    
    // Create sheet and header row if not already created
    if (!sheet) {
      sheet = ss.insertSheet(sheetName);
      var headers = [
        "Timestamp",
        "Player Name",
        "Player Email",
        "Game Title",
        "Score (PTS)",
        "Accuracy (%)",
        "Tells Found",
        "Hints Used",
        "Time Taken (sec)",
        "Flaws Identified Summary"
      ];
      var headerRange = sheet.getRange(1, 1, 1, headers.length);
      headerRange.setValues([headers]);
      headerRange.setBackground("#0d9488");
      headerRange.setFontColor("#ffffff");
      headerRange.setFontWeight("bold");
      headerRange.setFontFamily("Plus Jakarta Sans");
      sheet.setFrozenRows(1);
    }
    
    var data = {};
    if (e && e.postData && e.postData.contents) {
      data = JSON.parse(e.postData.contents);
    } else if (e && e.parameter) {
      data = e.parameter;
    }
    
    // Format timestamp nicely
    var formattedDate = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "yyyy-MM-dd HH:mm:ss");
    
    var row = [
      data.timestamp || formattedDate,
      data.playerName || "Anonymous Player",
      data.playerEmail || "N/A",
      data.gameTitle || "AI Artifact Detective",
      data.score !== undefined ? Number(data.score) : 0,
      data.accuracyPercent || (data.accuracy !== undefined ? data.accuracy + "%" : "100%"),
      data.foundTells || "Completed",
      data.hintsUsed !== undefined ? Number(data.hintsUsed) : 0,
      data.timeElapsedSec !== undefined ? Number(data.timeElapsedSec) : (data.timeElapsedSeconds || 0),
      data.detectedTells || ""
    ];
    
    sheet.appendRow(row);
    
    // Auto-fit column widths
    for (var i = 1; i <= 10; i++) {
      sheet.autoResizeColumn(i);
    }
    
    return ContentService.createTextOutput(JSON.stringify({
      status: "success",
      message: "Player score successfully logged to Google Sheets",
      playerName: data.playerName,
      rowNumber: sheet.getLastRow()
    })).setMimeType(ContentService.MimeType.JSON);
    
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      status: "error",
      message: error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  } finally {
    lock.releaseLock();
  }
}

function doGet(e) {
  return ContentService.createTextOutput(JSON.stringify({
    status: "online",
    message: "AI Tell Studio Sheets Webhook is active and listening for player scores."
  })).setMimeType(ContentService.MimeType.JSON);
}
`;
}

/**
 * Send player score data to both the local backend API and the Google Sheets Webhook URL
 */
export async function submitScoreToIntegrations(payload: {
  playerName: string;
  playerEmail: string;
  gameTitle: string;
  score: number;
  accuracy: number;
  totalTells: number;
  foundTells: number;
  hintsUsed: number;
  timeElapsedSeconds: number;
  foundDetails: Array<{ title: string; category: string; points: number }>;
  sheetsWebhookUrl?: string;
}): Promise<{ backendSuccess: boolean; sheetsSuccess: boolean; message: string }> {
  let backendSuccess = false;
  let sheetsSuccess = false;
  let message = '';

  // 1. Submit to Backend endpoint
  try {
    const res = await fetch('/api/record-score', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (res.ok) {
      backendSuccess = true;
    }
  } catch (err) {
    console.warn('Backend logging skipped or offline:', err);
  }

  // 2. Submit to Google Sheets Webhook if URL provided
  if (payload.sheetsWebhookUrl && payload.sheetsWebhookUrl.trim().startsWith('http')) {
    try {
      const sheetsBody = {
        timestamp: new Date().toISOString(),
        playerName: payload.playerName,
        playerEmail: payload.playerEmail,
        gameTitle: payload.gameTitle,
        score: payload.score,
        accuracyPercent: `${payload.accuracy}%`,
        foundTells: `${payload.foundTells}/${payload.totalTells}`,
        hintsUsed: payload.hintsUsed,
        timeElapsedSec: payload.timeElapsedSeconds,
        detectedTells: payload.foundDetails.map(d => d.title).join('; ')
      };

      // Direct POST to Google Sheets Apps Script endpoint (no-cors mode is standard for web browser clients sending to Apps Script)
      await fetch(payload.sheetsWebhookUrl.trim(), {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(sheetsBody)
      });

      sheetsSuccess = true;
      message = 'Results synchronized with Google Sheets successfully!';
    } catch (err) {
      console.error('Error submitting directly to Google Sheets:', err);
      message = 'Recorded locally (Google Sheets sync encountered a network delay)';
    }
  } else {
    message = backendSuccess ? 'Score recorded locally.' : 'Completed!';
  }

  return { backendSuccess, sheetsSuccess, message };
}

/**
 * Export scores to an Excel (.xlsx) file
 */
export function exportScoresToExcel(scores: PlayerScoreRecord[], filename = 'AI_Detective_Player_Scores.xlsx') {
  const rows = scores.map((s, idx) => ({
    '#': idx + 1,
    'Timestamp': new Date(s.completedAt).toLocaleString(),
    'Player Name': s.playerName,
    'Player Email': s.playerEmail,
    'Game Title': s.gameTitle,
    'Score (PTS)': s.score,
    'Accuracy (%)': `${s.accuracy}%`,
    'Tells Found': `${s.foundTells} / ${s.totalTells}`,
    'Hints Used': s.hintsUsed,
    'Time Taken (s)': s.timeElapsedSeconds,
    'Detected Tells': s.foundDetails.map(f => f.title).join(', ')
  }));

  const worksheet = XLSX.utils.json_to_sheet(rows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Player Scores');

  // Auto column widths
  const colWidths = [
    { wch: 5 },
    { wch: 20 },
    { wch: 22 },
    { wch: 26 },
    { wch: 28 },
    { wch: 14 },
    { wch: 14 },
    { wch: 14 },
    { wch: 12 },
    { wch: 15 },
    { wch: 40 }
  ];
  worksheet['!cols'] = colWidths;

  XLSX.writeFile(workbook, filename);
}

/**
 * Export scores to a CSV file
 */
export function exportScoresToCSV(scores: PlayerScoreRecord[], filename = 'AI_Detective_Player_Scores.csv') {
  const headers = [
    'Timestamp',
    'Player Name',
    'Player Email',
    'Game Title',
    'Score',
    'Accuracy',
    'Found Tells',
    'Hints Used',
    'Time Elapsed (sec)',
    'Detected Flaws'
  ];

  const escapeCSV = (val: any) => `"${String(val ?? '').replace(/"/g, '""')}"`;

  const rows = scores.map(s => [
    escapeCSV(new Date(s.completedAt).toISOString()),
    escapeCSV(s.playerName),
    escapeCSV(s.playerEmail),
    escapeCSV(s.gameTitle),
    escapeCSV(s.score),
    escapeCSV(`${s.accuracy}%`),
    escapeCSV(`${s.foundTells}/${s.totalTells}`),
    escapeCSV(s.hintsUsed),
    escapeCSV(s.timeElapsedSeconds),
    escapeCSV(s.foundDetails.map(f => f.title).join('; '))
  ]);

  const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
