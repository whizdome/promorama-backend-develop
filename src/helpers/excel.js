/* eslint-disable no-param-reassign */
const fs = require('fs').promises;
const path = require('path');
const json2xls = require('json2xls');
const ExcelJS = require('exceljs');
const { EXCEL_ROW_LIMIT, MODEL_NAME } = require('./constants');

const createExcelFilePathWithJson2xls = async (excelData, fileName) => {
  const xls = json2xls(excelData);

  // Define the directory and file path relative to the root directory
  const tempDir = path.resolve('temp');
  const filePath = path.join(tempDir, fileName);

  // Ensure the temp directory exists
  await fs.mkdir(tempDir, { recursive: true });

  // Write to file
  await fs.writeFile(filePath, xls, 'binary');

  return filePath;
};

// Not working for direct email attachments - File won't open
const createExcelFileBufferWithJson2xls = (excelData) => {
  const xls = json2xls(excelData);
  return xls;
};

const createExcelFileBufferWithExcelJS = async (excelData, options = { resourceType: '' }) => {
  const workbook = new ExcelJS.Workbook();

  // This was added incase the excel data is more than the excel row limit, a new page would be created.
  for (let i = 0; i < excelData.length; i += EXCEL_ROW_LIMIT) {
    const chunk = excelData.slice(i, i + EXCEL_ROW_LIMIT);
    const worksheet = workbook.addWorksheet(`Messages ${i / EXCEL_ROW_LIMIT + 1}`);

    if (chunk.length > 0) {
      // Set up headers
      worksheet.columns = Object.keys(chunk[0]).map((key) => ({
        header: key,
        key,
        width: 30, // Adjust the width as needed
      }));

      // Style the header row (row 1)
      const headerRow = worksheet.getRow(1);
      headerRow.eachCell((cell) => {
        cell.font = { bold: true }; // Make the header bold
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFD2D2D2' }, // background for the header
        };
        cell.alignment = { wrapText: true }; // Auto-wrap text in header
        cell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' },
        };
      });

      // Add rows to the worksheet
      chunk.forEach((data) => {
        let argb;

        if (options.resourceType === MODEL_NAME.MESSAGE) {
          argb = data.Status === 'Resolved' ? 'FF32A852' : 'FFFFDE21';
        }

        const row = worksheet.addRow(data);

        row.eachCell({ includeEmpty: true }, (cell) => {
          cell.alignment = { wrapText: true }; // Auto-wrap text in content cells
          cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb },
          };
          cell.border = {
            top: { style: 'thin' },
            left: { style: 'thin' },
            bottom: { style: 'thin' },
            right: { style: 'thin' },
          };
        });
      });
    }
  }

  const buffer = await workbook.xlsx.writeBuffer();

  return buffer;
};

const setExcelHeader = (responseObject, fileName = 'file.xlsx') => {
  responseObject.setHeader('Content-Disposition', `attachment; filename=${fileName}`);
  responseObject.setHeader(
    'Content-Type',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  );
};

const sendExcelFile = async (
  responseObject,
  excelData,
  options = { resourceType: '', fileName: 'file.xlsx' },
) => {
  const excelBuffer = await createExcelFileBufferWithExcelJS(excelData, {
    resourceType: options.resourceType,
  });

  responseObject.setHeader('Content-Disposition', `attachment; filename=${options.fileName}`);
  responseObject.setHeader(
    'Content-Type',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  );

  return responseObject.status(200).send(excelBuffer);
};

module.exports = {
  createExcelFilePathWithJson2xls,
  createExcelFileBufferWithJson2xls,
  createExcelFileBufferWithExcelJS,
  setExcelHeader,
  sendExcelFile,
};
