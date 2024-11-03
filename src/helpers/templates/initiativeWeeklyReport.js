const generateInitiativeWeeklyReportHtml = (reportData) => {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Your week with PromoRama</title>
    <style>
        body {
            margin: 0;
            padding: 0;
            font-family: 'Lucida Sans', Geneva, Verdana, sans-serif;
            background-color: #eff3f7;
        }
        .container {
            width: 100%;
            background-color: #eff3f7;
            padding: 20px 0;
        }
        .content {
            width: 600px;
            margin: 0 auto;
            background-color: #fff;
            border-radius: 10px;
            overflow: hidden;
            padding: 20px;
            box-sizing: border-box;
        }
        .header {
            background-color: #10043d;
            padding: 20px;
            text-align: center;
            color: #fff;
            border-radius: 10px 10px 0 0;
        }
        .header h1 {
            margin: 0;
            font-size: 24px;
        }
        .header p {
            margin: 5px 0 0;
            font-size: 16px;
            color: #bebebe;
        }
        .section-title {
            font-size: 18px;
            font-weight: bold;
            margin: 20px 0 10px;
            text-align: center;
        }
        .table {
            width: 100%;
            border-spacing: 10px;
        }
        .table td {
            width: 50%;
            padding: 10px;
            background-color: #f4f4f4;
            text-align: center;
            border-radius: 10px;
        }
        .table .icon-container {
            background-color: #95ffb5;
            padding: 20px;
            margin-bottom: 10px;
        }
        .table .icon-container img {
            width: 20px;
        }
        .table .value {
            font-size: 24px;
            font-weight: bold;
            color: #333;
            margin: 10px 0;
        }
        .table .label {
            font-size: 16px;
            color: #a3a3a4;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="content">
            <div class="header">
                <h1>Your week with PromoRama</h1>
                <p>Report for ${reportData.initiativeName}</p>
                <p>Reporting Period: ${reportData.startDate} - ${reportData.currentDate}</p>
            </div>

            ${
              reportData.topSalesBrandsByTotalCase?.length
                ? `<div class="section-title">Top brands vs least brands by cases sold</div>
            <table class="table">
                <tr>
                    ${reportData.topSalesBrandsByTotalCase
                      .map(
                        (brand) => `
                    <td>
                        <div class="icon-container">
                            <img src="https://res.cloudinary.com/declutters/image/upload/v1723113336/trophy_1_kfnt0z.png" alt="Trophy">
                        </div>
                        <div class="value">${brand.total}</div>
                       <div class="label">${brand.brandName} - ${brand.sku}</div>
                    </td>
                    `,
                      )
                      .join('')}
                </tr>
                <tr>
                    ${reportData.bottomSalesBrandsByTotalCase
                      .map(
                        (brand) => `
                    <td>
                        <div class="icon-container" style="background-color: #ffc5f1;">
                            <img src="https://res.cloudinary.com/declutters/image/upload/v1723113594/decrease_c9venp.png" alt="Decrease">
                        </div>
                        <div class="value">${brand.total}</div>
                        <div class="label">${brand.brandName} - ${brand.sku}</div>
                    </td>
                    `,
                      )
                      .join('')}
                </tr>
            </table>

            <div class="section-title">Top brands vs least brands by value in Naira (₦)</div>
            <table class="table">
                <tr>
                    ${reportData.topSalesBrandsByTotalValue
                      .map(
                        (brand) => `
                    <td>
                        <div class="icon-container">
                            <img src="https://res.cloudinary.com/declutters/image/upload/v1723113336/trophy_1_kfnt0z.png" alt="Trophy">
                        </div>
                        <div class="value">₦${brand.total?.toLocaleString()}</div>
                        <div class="label">${brand.brandName} - ${brand.sku}</div>
                    </td>
                    `,
                      )
                      .join('')}
                </tr>
                <tr>
                    ${reportData.bottomSalesBrandsByTotalValue
                      .map(
                        (brand) => `
                    <td>
                        <div class="icon-container" style="background-color: #ffc5f1;">
                            <img src="https://res.cloudinary.com/declutters/image/upload/v1723113594/decrease_c9venp.png" alt="Decrease">
                        </div>
                        <div class="value">₦${brand.total?.toLocaleString()}</div>
                        <div class="label">${brand.brandName} - ${brand.sku}</div>
                    </td>
                    `,
                      )
                      .join('')}
                </tr>
            </table>

            <div class="section-title">Top stores vs least stores by cases sold</div>
            <table class="table">
                <tr>
                    ${reportData.topSalesStoresByTotalCase
                      .map(
                        (doc) => `
                    <td>
                        <div class="icon-container">
                            <img src="https://res.cloudinary.com/declutters/image/upload/v1723113336/trophy_1_kfnt0z.png" alt="Trophy">
                        </div>
                        <div class="value">${doc.total}</div>
                        <div class="label">${doc.store?.name}</div>
                        <div class="label">${doc.store?.area}, ${doc.store?.town}, ${doc.store?.state}</div>
                    </td>
                    `,
                      )
                      .join('')}
                </tr>
                <tr>
                    ${reportData.bottomSalesStoresByTotalCase
                      .map(
                        (doc) => `
                    <td>
                        <div class="icon-container" style="background-color: #ffc5f1;">
                            <img src="https://res.cloudinary.com/declutters/image/upload/v1723113594/decrease_c9venp.png" alt="Decrease">
                        </div>
                        <div class="value">${doc.total}</div>
                        <div class="label">${doc.store?.name}</div>
                        <div class="label">${doc.store?.area}, ${doc.store?.town}, ${doc.store?.state}</div>
                    </td>
                    `,
                      )
                      .join('')}
                </tr>
            </table>

            <div class="section-title">Top stores vs least stores by value in Naira (₦)</div>
            <table class="table">
                <tr>
                    ${reportData.topSalesStoresByTotalValue
                      .map(
                        (doc) => `
                    <td>
                        <div class="icon-container">
                            <img src="https://res.cloudinary.com/declutters/image/upload/v1723113336/trophy_1_kfnt0z.png" alt="Trophy">
                        </div>
                        <div class="value">₦${doc.total?.toLocaleString()}</div>
                        <div class="label">${doc.store?.name}</div>
                        <div class="label">${doc.store?.area}, ${doc.store?.town}, ${
                          doc.store?.state
                        }</div>
                    </td>
                    `,
                      )
                      .join('')}
                </tr>
                <tr>
                    ${reportData.bottomSalesStoresByTotalValue
                      .map(
                        (doc) => `
                    <td>
                        <div class="icon-container" style="background-color: #ffc5f1;">
                            <img src="https://res.cloudinary.com/declutters/image/upload/v1723113594/decrease_c9venp.png" alt="Decrease">
                        </div>
                        <div class="value">₦${doc.total?.toLocaleString()}</div>
                        <div class="label">${doc.store?.name}</div>
                        <div class="label">${doc.store?.area}, ${doc.store?.town}, ${
                          doc.store?.state
                        }</div>
                    </td>
                    `,
                      )
                      .join('')}
                </tr>
            </table>`
                : 'No Sales Recorded'
            }

        </div>
    </div>
</body>
</html>
`;
};

module.exports = { generateInitiativeWeeklyReportHtml };
