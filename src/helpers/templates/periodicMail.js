/* eslint-disable no-unsafe-optional-chaining */
/* eslint-disable no-nested-ternary */
/* prettier-ignore */

const { formatDate } = require('../formatDate');
const { moneyFormat } = require('../moneyFormatter');
const { numberFormat, countFormat } = require('../numberFormatter');

const periodicMailTemplate = async ({
  name,
  start,
  end,
  byBrandData,
  lastWeekData,
  attendanceAverage,
  lastWeekAttendanceAverage,
  byStoreData,
  overAllMsl,
  lastWeekMslOverallMsl,
  productiveOutlets,
  lastWeekProductiveOutlet,
  overallStoreInventories,
  lastWeekOverallStoreInventories,
  groupedRegions,
  mslLevelData,
  storesMslLevelData,
  reportType,
}) => {
  // const formattedDate = format(new Date(), 'MMMM d, yyyy, h:mm a');

  const mail = `
  <!DOCTYPE html>
<html lang="en">


<head>
   <meta charset="UTF-8">
   <meta name="viewport" content="width=device-width, initial-scale=1.0">
   <meta name="supported-color-schemes" content="light">
   <title>${reportType} Report: ${name} - ${formatDate(start)} to ${formatDate(end)}</title>
   <style>


       * {
           margin: 0;
           padding: 0;
           box-sizing: border-box;
       }


       body {
           font-family: Arial, sans-serif;
           margin: 0;
           padding: 0;
           background-color: #ffffff;
           color: #000000;
       }


       .container {
           width: 100%;
           width: 900px;
           margin: 0 auto;
       }


       .imageContainer {
           width: 100%;
           background-image: url('https://res.cloudinary.com/declutters/image/upload/v1725054956/background_xmljbj.png');
           background-size: cover;
           background-position: center;
           text-align: center;
       }


       .contentTable {
           width: 100%;
           height: 150px;


       }


       .title {
           font-size: 48px;
           font-weight: 900;
           color: #ffffff;
           margin: 0;
           padding: 0;
       }


       .date {
           font-size: 18px;
           color: #ffffff;
           margin: 0;
           padding: 0;
       }


       .reportTable {
           width: 100%;
           margin-top: 20px;
           border-collapse: separate;
           border-spacing: 20px;
           /* Adds space between the cells */
       }


       .topContainer{
           margin-top: 20px;
           display: inline-flex;
       }


       .reportBox,
       .reportBoxWhite,
       .firstReportBoxWhite {
           width: 292px;
           padding: 20px;
           border-radius: 15px;
           text-align: left;
       }




       .reportBox {
           background-color: #3E4A89;
           color: #ffffff;
       }


       .reportBoxWhite {
           background-color: #f5f6f7;
           color: #1d3557;
           margin-left: 7.3px;
       }


         .firstReportBoxWhite {
           background-color: #f5f6f7;
           color: #1d3557;
       }


       .reportTitle {
           font-size: 14px;
       }


       .reportValue {
           font-size: 30px;
           margin: 5px 0;
           font-weight: bold;
       }


       .reportChange {
           font-size: 13px;
           color: #27AE60;
       }


        .reportChange.down {
           color: #ff4343; /* Red color for down change */
       }


       .reportChange.equal {
           color: #FFA500; /* Orange color for equal case */
       }


          .chart {
           width: 900px;
           display: inline-flex;
            margin: 0;
           padding: 0;
           box-sizing: border-box;
         
       }


       .subChart{
           margin: 0;
           padding: 0;
           box-sizing: border-box;
           width: 444px;
           position: relative;
           margin-top: 20px;
           padding: 30px 0;
           background-color: #f5f6f7;
           text-align: center;
           border-radius: 15px;
text-align: left;"

       }


       .subChart.value{
           margin-left: 13px;
       }


       .progress.low{
       background: #F24401;
       }




.barChartTable {
 width: 100%;
 height: 250px;


}


.barContainer {
  display: block;
   height: 15px;
   width: 100%;
   margin-bottom: 10px;
}


.bar {
   background: #DCE6F5;
           height: 100%;
           border-radius: 10px;
           padding: 3px 0;
           margin-top: 10px
}


.barChartLabel{
   text-align: 'left';
}
  
.day {
 font-size: 12px;
}


      .labelContainer {
           margin: 0;
           padding: 0;
           box-sizing: border-box;
           width: 100%;
           text-align: left;
           padding: 20px;
       }


       .progressContainerBar {
           margin: 0;
           padding: 0;
           box-sizing: border-box;
           background: #fff;
           width: 350px;
           border-radius: 10px;
           height: 10px;
           width: 100%;
       }


       .progress {
           margin: 0;
           padding: 0;
           box-sizing: border-box;
           background: #F24401;
           border-radius: 10px;
           height: 100%;
           
       }




       .performanceContainer {
          margin: 0;
           padding: 0;
            box-sizing: border-box;
           padding: 15px 11px;
           background: #DCE6F5;
           border-radius: 10px;
           margin-top: 10px;
           
       }


       .actualLabel {
       margin: 0;
           padding: 0;
            box-sizing: border-box;
           margin-bottom: 30px;
           margin-top: -20px;
       }


       .subLabel {
       margin: 0;
           padding: 0;
            box-sizing: border-box;
           font-size: 14px;
           color: #516376;
           margin: 5px 0;
       }


       .performanceFigure {
           margin: 0;
           padding: 0;
            box-sizing: border-box;
           background: #3E4A89;
           padding: 10px 20px;
           border-radius: 10px;
           color: #fff;
           width: fit-content;
           font-weight: bold;
           margin: 10px 0;
       }




        .salesArena {
           width: 100%;
           margin-top: 20px;
           padding: 30px 0;
           background-color: #f5f6f7;
           text-align: center;
           border-radius: 15px;
       }




       .salesPerformanceContainer {
        margin: 0;
           padding: 0;
            box-sizing: border-box;
           padding: 15px 11px;
           background: #DCE6F5;
           border-radius: 10px;
           margin-top: 10px;
           width: 100%;
           vertical-align: middle;
       }




       .progressContainerBar.sales{
           width: 100%;
       }




       .stateTable {
           width: 100%;
           margin-top: 20px;
           border-collapse: collapse;
           border-radius: 10px;
           overflow: hidden;
       }


       .stateTable th,
       .stateTable td {
           border: 1px solid #ddd;
           padding: 8px;
           text-align: left;
       }


       .stateTable th {
           background-color: #DCE6F5;
           font-weight: bold;
       }


       .stateTable td {
           background-color: #f5f6f7;
       }


        .storeName {
         margin: 0;
           padding: 0;
            box-sizing: border-box;
            width: 300px;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
        }

         .addressName{
          margin: 0;
           padding: 0;
            box-sizing: border-box;
            width: 300px;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
            font-size: 14px;
            color: #516376;
            margin: 5px 0;
        }


   </style>
</head>


<body 
style=" 
font-family: Arial, sans-serif;
  margin: 0;
    padding: 0;
     box-sizing: border-box;
   background-color: #ffffff;
   color: #000000;">


   <div style="margin: 0; padding: 0; box-sizing: border-box; width: 900px; margin: 0 auto; " class="container">
           <tr>
               <td>
                   <div style=
                   "   width: 100%;
           background-image: url('https://res.cloudinary.com/declutters/image/upload/v1725054956/background_xmljbj.png');
           background-size: cover;
           background-position: center;
           text-align: center;
           margin: 0;
           padding: 0;
           box-sizing: border-box;
     ">


                       <table 
                       style="
                         width: 100%;
                         height: 150px;
                         margin: 0;
                         padding: 0;
                         box-sizing: border-box;
                       "
                       border="0" cellpadding="0" cellspacing="0">
                           <tr>
                               <td style="text-align: center; vertical-align: middle;">
                                   <p style="
                                   text-transform: capitalize;
                                 box-sizing: border-box;
                                 font-size: 48px;
                                  font-weight: 900;
                                    color: #ffffff;
                                      margin: 0;
                                       padding: 0;
                                   ">${reportType} Report</p>
                                   <p style="
                                    font-size: 18px;
                                    color: #ffffff;
                                      margin: 0;
                                    padding: 0;
                                 box-sizing: border-box;
                                   ">Initiative: ${name}</p>
                                   <p 
                                   style="
                                    font-size: 18px;
           color: #ffffff;
           margin: 0;
           padding: 0;
            box-sizing: border-box;
                                   "
                                   >Report for ${formatDate(start)} - ${formatDate(end)}</p>
                               </td>
                           </tr>
                       </table>
                   </div>
               </td>
           </tr>


       <!-- Report Summary Section using Table -->
       <div 
       
       style="
           padding: 0;
            box-sizing: border-box;
         margin-top: 20px;
           display: inline-flex;
       "
       >
           <div 
           style="
           margin:0;
            box-sizing: border-box;
            width: 292px;
           padding: 20px;
           border-radius: 15px;
           text-align: left;
            background-color: #3E4A89;
           color: #ffffff;
           "
           >
               <p style="
                 margin:0;
                   padding: 0;
               font-size: 14px;
                box-sizing: border-box;
               ">Sales cases</p>
               <p style="
                   padding: 0;
                     font-size: 30px;
                       box-sizing: border-box;
           margin: 5px 0;
           font-weight: bold;
               ">${numberFormat.format(byBrandData?.overall?.overallCasesSold)}</p>
            <p style="${
              byBrandData?.overall?.overallCasesSold > lastWeekData?.overall?.overallCasesSold
                ? 'font-size: 13px; color: #27AE60;  margin:0; padding: 0; box-sizing: border-box;'
                : byBrandData?.overall?.overallCasesSold === lastWeekData?.overall?.overallCasesSold
                ? 'font-size: 13px; color: #FFA500;  margin:0; padding: 0; box-sizing: border-box;'
                : 'font-size: 13px; color: #ff4343;  margin:0; padding: 0; box-sizing: border-box;'
            }">
                   ${
                     byBrandData?.overall?.overallCasesSold >
                     lastWeekData?.overall?.overallCasesSold
                       ? '▲'
                       : byBrandData?.overall?.overallCasesSold ===
                         lastWeekData?.overall?.overallCasesSold
                       ? '--'
                       : '▼'
                   } Ix ${numberFormat.format(
                     lastWeekData?.overall?.overallCasesSold
                       ? byBrandData?.overall?.overallCasesSold /
                           lastWeekData?.overall?.overallCasesSold
                       : 1,
                   )} (vs last report)
               </p>
           </div>


           <div
           style="
           margin:0;
             width: 292px;
           padding: 20px;
           border-radius: 15px;
           text-align: left;
              box-sizing: border-box;
               background-color: #f5f6f7;
           color: #1d3557;
           margin-left: 7.3px;
           "
           >
               <p style="
                 margin:0;
                   padding: 0;
               font-size: 14px;
               box-sizing: border-box;
               ">Sales revenues</p>
               <p style="
                   padding: 0;
                     font-size: 30px;
           margin: 5px 0;
           font-weight: bold;
             box-sizing: border-box;
               ">${moneyFormat.format(byBrandData?.overall?.revenueGenerated)}</p>
               <p style="${
                 byBrandData?.overall?.revenueGenerated > lastWeekData?.overall?.revenueGenerated
                   ? 'font-size: 13px; color: #27AE60;  margin:0; padding: 0; box-sizing: border-box;'
                   : byBrandData?.overall?.revenueGenerated ===
                     lastWeekData?.overall?.revenueGenerated
                   ? 'font-size: 13px; color: #FFA500;  margin:0; padding: 0; box-sizing: border-box;'
                   : 'font-size: 13px; color: #ff4343;  margin:0; padding: 0; box-sizing: border-box;'
               }">
                   ${
                     byBrandData?.overall?.revenueGenerated >
                     lastWeekData?.overall?.revenueGenerated
                       ? '▲'
                       : byBrandData?.overall?.revenueGenerated ===
                         lastWeekData?.overall?.revenueGenerated
                       ? '--'
                       : '▼'
                   } Ix ${numberFormat.format(
                     lastWeekData?.overall?.revenueGenerated
                       ? byBrandData?.overall?.revenueGenerated /
                           lastWeekData?.overall?.revenueGenerated
                       : 1,
                   )} (vs last report)
               </p>
           </div>


          <div
           style="
           margin:0;
             width: 292px;
           padding: 20px;
           border-radius: 15px;
           text-align: left;
              box-sizing: border-box;
               background-color: #f5f6f7;
           color: #1d3557;
           margin-left: 7.3px;
           "
           >
               <p style="
                 margin:0;
                   padding: 0;
               font-size: 14px;
                box-sizing: border-box;
               "> Stores worked in daily (avg)</p>
        
               <p style="
                   padding: 0;
                     font-size: 30px;
           margin: 5px 0;
             box-sizing: border-box;
           font-weight: bold;
               ">${numberFormat.format(attendanceAverage)}</p>
 

               <p style="${
                 attendanceAverage > lastWeekAttendanceAverage
                   ? 'font-size: 13px; color: #27AE60;  margin:0; padding: 0; box-sizing: border-box;'
                   : attendanceAverage === lastWeekAttendanceAverage
                   ? 'font-size: 13px; color: #FFA500;  margin:0; padding: 0; box-sizing: border-box;'
                   : 'font-size: 13px; color: #ff4343;  margin:0; padding: 0; box-sizing: border-box;'
               }">
                   ${
                     attendanceAverage > lastWeekAttendanceAverage
                       ? '▲'
                       : attendanceAverage === lastWeekAttendanceAverage
                       ? '--'
                       : '▼'
                   } Ix ${numberFormat.format(
                     lastWeekAttendanceAverage ? attendanceAverage / lastWeekAttendanceAverage : 1,
                   )} (vs last report) 
               </p>
           </div>


       </div>
















         <!-- Second section -->
       <div 
        style="
           padding: 0;
            box-sizing: border-box;
         margin-top: 20px;
           display: inline-flex;
       "
       >
        


           <div style="
           margin: 0;
            width: 292px;
             box-sizing: border-box;
           padding: 20px;
           border-radius: 15px;
           text-align: left;
            background-color: #f5f6f7;
           color: #1d3557;
           ">
               <p 
               style="
                 margin:0;
                   padding: 0;
               font-size: 14px;
                box-sizing: border-box;
               ">Average Brand MSL score</p>
               <p style="
                   padding: 0;
                     font-size: 30px;
           margin: 5px 0;
             box-sizing: border-box;
           font-weight: bold;
               ">${numberFormat.format(overAllMsl)}</p>
               <p style="${
                 overAllMsl > lastWeekMslOverallMsl
                   ? 'font-size: 13px; color: #27AE60;  margin:0; padding: 0; box-sizing: border-box;'
                   : overAllMsl === lastWeekMslOverallMsl
                   ? 'font-size: 13px; color: #FFA500;  margin:0; padding: 0; box-sizing: border-box;'
                   : 'font-size: 13px; color: #ff4343;  margin:0; padding: 0; box-sizing: border-box;'
               }">
                   ${
                     overAllMsl > lastWeekMslOverallMsl
                       ? '▲'
                       : overAllMsl === lastWeekMslOverallMsl
                       ? '--'
                       : '▼'
                   } Ix ${numberFormat.format(
                     lastWeekMslOverallMsl ? overAllMsl / lastWeekMslOverallMsl : 1,
                   )} (vs last report)
               </p>
           </div>


           <div style="
            background-color: #f5f6f7;
           color: #1d3557;
           margin-left: 7.3px;
           padding: 0;
             box-sizing: border-box;
              width: 292px;
           padding: 20px;
           border-radius: 15px;
           text-align: left;
           ">

              <p style="
                 margin:0;
                   padding: 0;
               font-size: 14px;
                box-sizing: border-box;
               "> Productive outlets</p>

                <p style="
                   padding: 0;
                     font-size: 30px;
           margin: 5px 0;
             box-sizing: border-box;
           font-weight: bold;
               ">${countFormat.format(productiveOutlets)}</p>

               <p style="${
                 productiveOutlets > lastWeekProductiveOutlet
                   ? 'font-size: 13px; color: #27AE60;  margin:0; padding: 0; box-sizing: border-box;'
                   : productiveOutlets === lastWeekProductiveOutlet
                   ? 'font-size: 13px; color: #FFA500;  margin:0; padding: 0; box-sizing: border-box;'
                   : 'font-size: 13px; color: #ff4343;  margin:0; padding: 0; box-sizing: border-box;'
               }">
                   ${
                     productiveOutlets > lastWeekProductiveOutlet
                       ? '▲'
                       : productiveOutlets === lastWeekProductiveOutlet
                       ? '--'
                       : '▼'
                   } Ix ${numberFormat.format(
                     lastWeekProductiveOutlet ? productiveOutlets / lastWeekProductiveOutlet : 1,
                   )} (vs last report)
               </p>
           </div>


             <div style="
            background-color: #f5f6f7;
           color: #1d3557;
           margin-left: 7.3px;
           padding: 0;
             box-sizing: border-box;
              width: 292px;
           padding: 20px;
           border-radius: 15px;
           text-align: left;
           ">

               <p style="
                 margin:0;
                   padding: 0;
               font-size: 14px;
                box-sizing: border-box;
               ">Store inventory cases</p>

                  <p style="
                   padding: 0;
                     font-size: 30px;
           margin: 5px 0;
             box-sizing: border-box;
           font-weight: bold;
               ">${numberFormat.format(overallStoreInventories?.totalStoreInventoryCases)}</p>
               <p style="${
                 overallStoreInventories?.totalStoreInventoryCases >
                 lastWeekOverallStoreInventories?.totalStoreInventoryCases
                   ? 'font-size: 13px; color: #27AE60;  margin:0; padding: 0; box-sizing: border-box;'
                   : overallStoreInventories?.totalStoreInventoryCases ===
                     lastWeekOverallStoreInventories?.totalStoreInventoryCases
                   ? 'font-size: 13px; color: #FFA500;  margin:0; padding: 0; box-sizing: border-box;'
                   : 'font-size: 13px; color: #ff4343;  margin:0; padding: 0; box-sizing: border-box;'
               }">
                   ${
                     overallStoreInventories?.totalStoreInventoryCases >
                     lastWeekOverallStoreInventories?.totalStoreInventoryCases
                       ? '▲'
                       : overallStoreInventories?.totalStoreInventoryCases ===
                         lastWeekOverallStoreInventories?.totalStoreInventoryCases
                       ? '--'
                       : '▼'
                   } Ix ${numberFormat.format(
                     lastWeekOverallStoreInventories?.totalStoreInventoryCases
                       ? overallStoreInventories?.totalStoreInventoryCases /
                           lastWeekOverallStoreInventories?.totalStoreInventoryCases
                       : 1,
                   )} (vs last report)
               </p>
           </div>


       </div>











      ${
        groupedRegions.length > 0
          ? `
                  <table style="
                   width: 100%;
           margin-top: 20px;
           border-collapse: collapse;
           border-radius: 10px;
           overflow: hidden;
           padding:0;
            box-sizing: border-box;
                  ">
           <thead>
               <tr>

                   <th 
                   style="
                   margin:0;
            box-sizing: border-box;
            border: 1px solid #ddd;
           padding: 8px;
            background-color: #DCE6F5;
           font-weight: bold;
                   "
                   >Regions</th>

                      <th 
                   style="
                   margin:0;
            box-sizing: border-box;
            border: 1px solid #ddd;
           padding: 8px;
            background-color: #DCE6F5;
           font-weight: bold;
                   "
                   >Total Cases</th>
                     <th 
                   style="
                   margin:0;
            box-sizing: border-box;
            border: 1px solid #ddd;
           padding: 8px;
            background-color: #DCE6F5;
           font-weight: bold;
                   "
                   >Total Value</th>
               </tr>
           </thead>
         
           <tbody>
               ${groupedRegions
                 .map((regionObj) =>
                   Object.keys(regionObj)
                     .map(
                       (region) => `
                       <tr>
                           <td 
                           style="
                            margin:0;
            box-sizing: border-box;
            border: 1px solid #ddd;
           padding: 8px;
            background-color: #f5f6f7;
                           "
                           >${region}</td>

                            <td 
                           style="
                            margin:0;
            box-sizing: border-box;
            border: 1px solid #ddd;
           padding: 8px;
            background-color: #f5f6f7;
                           "
                           >${numberFormat.format(regionObj[region].totalCases)} (${(
                             (regionObj[region].totalCases * 100) /
                             byBrandData?.overall?.overallCasesSold
                           ).toFixed(2)}%)</td>

                            <td 
                           style="
                            margin:0;
            box-sizing: border-box;
            border: 1px solid #ddd;
           padding: 8px;
            background-color: #f5f6f7;
                           "
                           >${moneyFormat.format(regionObj[region].totalValue)} (${(
                             (regionObj[region].totalValue * 100) /
                             byBrandData?.overall?.revenueGenerated
                           ).toFixed(2)}%)</td>
                       </tr>
                   `,
                     )
                     .join(''),
                 )
                 .join('')}
           </tbody>
       </table>
               `
          : ``
      }


















       <div style="width: 900px;
           display: inline-flex;
            margin: 0;
           padding: 0;
           box-sizing: border-box;">


       <div style="margin: 0;
           padding: 0;
           box-sizing: border-box;
           width: 444px;
           position: relative;
           margin-top: 20px;
           padding: 30px 0;
           background-color: #f5f6f7;
           text-align: center;
           border-radius: 15px;
">
           <div style=" margin: 0;
           padding: 0;
           box-sizing: border-box;
           width: 100%;
           text-align: left;
           padding: 20px;
">
           <p style="margin: 0;
           padding: 0;
            box-sizing: border-box;
           margin-bottom: 30px;
           margin-top: -20px;


">Top performing SKUs (cases)</p>
           ${
             byBrandData?.salesByCases?.top3SalesByCases.length <= 0
               ? `
                <div style="margin: 0;
           padding: 0;
            box-sizing: border-box;
           padding: 15px 11px;
           background: #DCE6F5;
           border-radius: 10px;
           margin-top: 10px;
           text-align:center;
">
                     <p  style="margin: 0;
           padding: 0;
            box-sizing: border-box;" >😅</p>

                   <p style="margin: 0;
           padding: 0;
            box-sizing: border-box;" >Nothing appeared here</p>
               </div>
               `
               : `
                      ${byBrandData?.salesByCases?.top3SalesByCases
                        ?.map(
                          (item) => `
           <div   style=" margin: 0;
           padding: 0;
            box-sizing: border-box;
           padding: 15px 11px;
           background: #DCE6F5;
           border-radius: 10px;
           margin-top: 10px;
                ">

                     <p style=" margin: 0;
           padding: 0;
            box-sizing: border-box; text-align:left;">${`${item.brandName}-${item.sku}`}</p>

                   <p style=" margin: 0;
           padding: 0;
            box-sizing: border-box;
           background: #3E4A89;
           padding: 10px 20px;
           border-radius: 10px;
           color: #fff;
           width: fit-content;
           font-weight: bold;
           margin: 10px 0;">
                      ${numberFormat.format(item.totalCase)}
                   </p>
                   <p style=" margin: 0;
           padding: 0;
            box-sizing: border-box;
           font-size: 14px;
           color: #516376;
           margin: 5px 0;">${(
             (item.totalCase * 100) /
             byBrandData?.overall?.overallCasesSold
           ).toFixed(2)}% of overall sales</p>
                   <div style=" margin: 0;
           padding: 0;
           box-sizing: border-box;
           background: #fff;
           width: 350px;
           border-radius: 10px;
           height: 10px;
           ">
                       <div style="width: ${
                         (item.totalCase * 100) / byBrandData?.overall?.overallCasesSold
                       }%;
            margin: 0;
           padding: 0;
           box-sizing: border-box;
           background: #3E4A89;
           border-radius: 10px;
           height: 100%;
            "></div>
                   </div>




           </div>


           `,
                        )
                        .join('')}
          
               `
           }
       
           </div>


       </div>






                   <div style=" margin: 0;
           padding: 0;
           box-sizing: border-box;
           width: 444px;
           position: relative;
           margin-top: 20px;
           padding: 30px 0;
           background-color: #f5f6f7;
           text-align: center;
           border-radius: 15px; margin-left: 13px;">


           <div style=" margin: 0;
           padding: 0;
           box-sizing: border-box;
           width: 100%;
           text-align: left;
           padding: 20px;
">


           <p style="margin: 0;
           padding: 0;
            box-sizing: border-box;
           margin-bottom: 30px;
           margin-top: -20px;
">Least performing SKUs (cases)</p>
           ${
             byBrandData?.salesByCases?.bottom3SalesByCases.length <= 0
               ? `
                <div style="margin: 0;
           padding: 0;
            box-sizing: border-box;
           padding: 15px 11px;
           background: #DCE6F5;
           border-radius: 10px;
           margin-top: 10px;
           text-align: center;
">
                     <p  style="margin: 0;
           padding: 0;
            box-sizing: border-box;"  text-align: center; >😅</p>

                    <p style="margin: 0;
           padding: 0;

            box-sizing: border-box;"  text-align: center; >Nothing appeared here</p>
               </div>
               `
               : `
                      ${byBrandData?.salesByCases?.bottom3SalesByCases
                        ?.map(
                          (item) => `
           <div  style=" margin: 0;
           padding: 0;
            box-sizing: border-box;
           padding: 15px 11px;
           background: #DCE6F5;
           border-radius: 10px;
           margin-top: 10px;
           ">
                      <p style=" margin: 0;
           padding: 0;
            box-sizing: border-box;">${`${item.brandName}-${item.sku}`}</p>
                   <p style=" margin: 0;
           padding: 0;
            box-sizing: border-box;
           background: #F24401;
           padding: 10px 20px;
           border-radius: 10px;
           color: #fff;
           width: fit-content;
           font-weight: bold;
           margin: 10px 0;">
                      ${numberFormat.format(item.totalCase)}
                   </p>
                   <p style=" margin: 0;
           padding: 0;
            box-sizing: border-box;
           font-size: 14px;
           color: #516376;
           margin: 5px 0;">${(
             (item.totalCase * 100) /
             byBrandData?.overall?.overallCasesSold
           ).toFixed(2)}% of overall sales</p>
                   <div style=" margin: 0;
           padding: 0;
           box-sizing: border-box;
           background: #fff;
           width: 350px;
           border-radius: 10px;
           height: 10px;
            text-align:left;
            ">
                       <div style="width: ${
                         (item.totalCase * 100) / byBrandData?.overall?.overallCasesSold
                       }%;
             margin: 0;
           padding: 0;
           box-sizing: border-box;
           background: #F24401;
           border-radius: 10px;
           height: 100%;
            "></div>
                   </div>




           </div>


           `,
                        )
                        .join('')}
          
               `
           }
       
           </div>


       </div>


   </div>


  
         <div style="width: 900px;
           display: inline-flex;
            margin: 0;
           padding: 0;
           box-sizing: border-box;">


           <div style="margin: 0;
           padding: 0;
           box-sizing: border-box;
           width: 444px;
           position: relative;
           margin-top: 20px;
           padding: 30px 0;
           background-color: #f5f6f7;
         
           border-radius: 15px;
">
               <div style=" margin: 0;
           padding: 0;
           box-sizing: border-box;
           width: 100%;
           text-align: left;
           padding: 20px;
">
               <p style="margin: 0;
           padding: 0;
            box-sizing: border-box;
           margin-bottom: 30px;
           margin-top: -20px;
">Top performing SKUs (revenues)</p>
               ${
                 byBrandData?.salesByValue?.top3SalesByValue.length <= 0
                   ? `
                    <div style="margin: 0;
           padding: 0;
            box-sizing: border-box;
           padding: 15px 11px;
           background: #DCE6F5;
           border-radius: 10px;
           margin-top: 10px;
         
">
                         <p  style="margin: 0;
           padding: 0;
            box-sizing: border-box;" >😅</p>

                        <p style="margin: 0;
           padding: 0;
            box-sizing: border-box;" >Nothing appeared here</p>
                   </div>
                   `
                   : `
                          ${byBrandData?.salesByValue?.top3SalesByValue
                            ?.map(
                              (item) => `
                     <div  style=" margin: 0;
           padding: 0;
            box-sizing: border-box;
           padding: 15px 11px;
           background: #DCE6F5;
           border-radius: 10px;
           margin-top: 10px;
           text-align:center;">

                        <p style="  margin: 0;
           padding: 0;
           box-sizing: border-box; text-align: left;" >${`${item.brandName}-${item.sku}`}</p>


                       <p style=" margin: 0;
           padding: 0;
            box-sizing: border-box;
           background: #3E4A89;
           padding: 10px 20px;
           border-radius: 10px;
           color: #fff;
           width: fit-content;
           font-weight: bold;
           margin: 10px 0;
           ">
                          ${moneyFormat.format(item.totalValue)}
                       </p>

                       <p style=" margin: 0;
           padding: 0;
            box-sizing: border-box;
           font-size: 14px;
           color: #516376;
           margin: 5px 0;
           text-align: left;"
           ">${((item.totalValue * 100) / byBrandData?.overall?.revenueGenerated).toFixed(
             2,
           )}% of overall revenue generated</p>
                       <div style=" margin: 0;
           padding: 0;
           box-sizing: border-box;
           background: #fff;
           width: 350px;
           border-radius: 10px;
           height: 10px;
           text-align:left;
           ">
                           <div  style="width: ${
                             (item.totalValue * 100) / byBrandData?.overall?.revenueGenerated
                           }%;
              margin: 0;
           padding: 0;
           box-sizing: border-box;
           background: #3E4A89;
           border-radius: 10px;
           height: 100%;
            "></div>
                       </div>




               </div>


               `,
                            )
                            .join('')}
              
                   `
               }
           
               </div>


           </div>




                       <div style=" margin: 0;
           padding: 0;
           box-sizing: border-box;
           width: 444px;
           position: relative;
           margin-top: 20px;
           padding: 30px 0;
           background-color: #f5f6f7;
           text-align: center;
           border-radius: 15px; margin-left: 13px;">
               <div style=" margin: 0;
           padding: 0;
           box-sizing: border-box;
           width: 100%;
           text-align: left;
           padding: 20px;
">
               <p style="margin: 0;
           padding: 0;
            box-sizing: border-box;
           margin-bottom: 30px;
           margin-top: -20px;
">Least performing SKUs (revenues)</p>
               ${
                 byBrandData?.salesByValue?.bottom3SalesByValue.length <= 0
                   ? `
                    <div style="margin: 0;
           padding: 0;
            box-sizing: border-box;
           padding: 15px 11px;
           background: #DCE6F5;
           border-radius: 10px;
           margin-top: 10px;
           text-align:center;
">
                       <p  style="margin: 0;
           padding: 0;
            box-sizing: border-box;" >😅</p>

                       <p style="margin: 0;
           padding: 0;
            box-sizing: border-box;" >Nothing appeared here</p>
                   </div>
                   `
                   : `
                          ${byBrandData?.salesByValue?.bottom3SalesByValue
                            ?.map(
                              (item) => `
               <div  style=" margin: 0;
           padding: 0;
            box-sizing: border-box;
           padding: 15px 11px;
           background: #DCE6F5;
           border-radius: 10px;
           margin-top: 10px;
           text-align:center;">
                          <p style=" margin: 0;
           padding: 0;
            box-sizing: border-box;  text-align:left;">${`${item.brandName}-${item.sku}`}</p>
                       <p style=" margin: 0;
           padding: 0;
            box-sizing: border-box;
           background: #F24401;
           padding: 10px 20px;
           border-radius: 10px;
           color: #fff;
           width: fit-content;
           font-weight: bold;
           margin: 10px 0;">
                          ${moneyFormat.format(item.totalValue)}
                       </p>
                       <p style=" margin: 0;
           padding: 0;
            box-sizing: border-box;
           font-size: 14px;
           color: #516376;
           margin: 5px 0;  text-align:left;">${(
             (item.totalValue * 100) /
             byBrandData?.overall?.revenueGenerated
           ).toFixed(2)}% of overall sales</p>
                       <div style=" margin: 0;
           padding: 0;
           box-sizing: border-box;
           background: #fff;
           width: 350px;
           border-radius: 10px;
           height: 10px;
          text-align:left;
           ">
                           <div style="width: ${
                             (item.totalValue * 100) / byBrandData?.overall?.revenueGenerated
                           }%;
             margin: 0;
           padding: 0;
           box-sizing: border-box;
           background: #F24401;
           border-radius: 10px;
           height: 100%;
            "></div>
                       </div>




               </div>


               `,
                            )
                            .join('')}
              
                   `
               }
           
               </div>


           </div>


       </div>















    <div style="width: 900px;
           display: inline-flex;
            margin: 0;
           padding: 0;
           box-sizing: border-box;">
         <div style="margin: 0;
           padding: 0;
           box-sizing: border-box;
           width: 444px;
           position: relative;
           margin-top: 20px;
           padding: 30px 0;
           background-color: #f5f6f7;
           text-align: center;
           border-radius: 15px;
">
           <div style=" margin: 0;
           padding: 0;
           box-sizing: border-box;
           width: 100%;
           text-align: left;
           padding: 20px;
">
               <p style="margin: 0;
           padding: 0;
            box-sizing: border-box;
           margin-bottom: 30px;
           margin-top: -20px;
">Top performing stores (cases)</p>


               ${
                 byStoreData?.salesByCases?.top3SalesByCases.length <= 0
                   ? `
                <div style="margin: 0;
           padding: 0;
            box-sizing: border-box;
           padding: 15px 11px;
           background: #DCE6F5;
           border-radius: 10px;
           margin-top: 10px;
           text-align:center;
">
                     <p  style="margin: 0;
           padding: 0;
            box-sizing: border-box;" >😅</p>

                    <p style="margin: 0;
           padding: 0;
            box-sizing: border-box;" >Nothing appeared here</p>
               </div>
               `
                   : `
           ${byStoreData?.salesByCases?.top3SalesByCases
             ?.map(
               (item) =>
                 `
               <div style=" margin: 0;
           padding: 0;
            box-sizing: border-box;
           padding: 15px 11px;
           background: #DCE6F5;
           border-radius: 10px;
           margin-top: 10px;
           width: 100%;
           vertical-align: middle;">
                   <p style="margin: 0;
           padding: 0;
            box-sizing: border-box;
            width: 300px;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;">${item?.initiativeStore?.store?.name}</p>
                   <p style=" margin: 0;
           padding: 0;
            box-sizing: border-box;
            width: 300px;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
            font-size: 14px;
            color: #516376;
            margin: 5px 0;">${`${item?.initiativeStore?.store?.town}, ${item?.initiativeStore?.store?.area}, ${item?.initiativeStore?.store?.state}`}, </p>
                   <p style=" margin: 0;
           padding: 0;
            box-sizing: border-box;
           background: #3E4A89;
           padding: 10px 20px;
           border-radius: 10px;
           color: #fff;
           width: fit-content;
           font-weight: bold;
           margin: 10px 0;">
                      ${numberFormat.format(item.totalCase)}
                   </p>
                   <p style=" margin: 0;
           padding: 0;
            box-sizing: border-box;
           font-size: 14px;
           color: #516376;
           margin: 5px 0;">${(
             (item.totalCase * 100) /
             byBrandData?.overall?.overallCasesSold
           ).toFixed(2)}% of overall sales</p>
                   <div style=" margin: 0;
           padding: 0;
           box-sizing: border-box;
           background: #fff;
           width: 350px;
           border-radius: 10px;
           height: 10px;
           width: 100%;">
                       <div  style="width: ${
                         (item.totalCase * 100) / byBrandData?.overall?.overallCasesSold
                       }%;
              margin: 0;
           padding: 0;
           box-sizing: border-box;
           background: #3E4A89;
           border-radius: 10px;
           height: 100%;
            "></div>
                   </div>
               </div>
                `,
             )
             .join('')}`
               }
             
           </div>
       </div>


        <div style=" margin: 0;
           padding: 0;
           box-sizing: border-box;
           width: 444px;
           position: relative;
           margin-top: 20px;
           padding: 30px 0;
           background-color: #f5f6f7;
           text-align: center;
           border-radius: 15px; margin-left: 13px;">
           <div style=" margin: 0;
           padding: 0;
           box-sizing: border-box;
           width: 100%;
           text-align: left;
           padding: 20px;
">
               <p style="margin: 0;
           padding: 0;
            box-sizing: border-box;
           margin-bottom: 30px;
           margin-top: -20px;
">Least performing stores (cases)</p>


               ${
                 byStoreData?.salesByCases?.bottom3SalesByCases.length <= 0
                   ? `
                <div style="margin: 0;
           padding: 0;
            box-sizing: border-box;
           padding: 15px 11px;
           background: #DCE6F5;
           border-radius: 10px;
           margin-top: 10px;
           text-align:center;
">
                     <p  style="margin: 0;
           padding: 0;
            box-sizing: border-box;" >😅</p>

                    <p style="margin: 0;
           padding: 0;
            box-sizing: border-box;" >Nothing appeared here</p>
               </div>
               `
                   : `
           ${byStoreData?.salesByCases?.bottom3SalesByCases
             ?.map(
               (item) =>
                 `
               <div style=" margin: 0;
           padding: 0;
            box-sizing: border-box;
           padding: 15px 11px;
           background: #DCE6F5;
           border-radius: 10px;
           margin-top: 10px;
           width: 100%;
           vertical-align: middle;">

                   <p style="margin: 0;
           padding: 0;
            box-sizing: border-box;
            width: 300px;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;">${item?.initiativeStore?.store?.name}</p>
                   <p style=" margin: 0;
           padding: 0;
            box-sizing: border-box;
            width: 300px;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
            font-size: 14px;
            color: #516376;
            margin: 5px 0;">${`${item?.initiativeStore?.store?.town}, ${item?.initiativeStore?.store?.area}, ${item?.initiativeStore?.store?.state}`}, </p>
                   <p style=" margin: 0;
           padding: 0;
            box-sizing: border-box;
           background: #F24401;
           padding: 10px 20px;
           border-radius: 10px;
           color: #fff;
           width: fit-content;
           font-weight: bold;
           margin: 10px 0;">
                      ${numberFormat.format(item.totalCase)}
                   </p>
                   <p style=" margin: 0;
           padding: 0;
            box-sizing: border-box;
           font-size: 14px;
           color: #516376;
           margin: 5px 0;">${(
             (item.totalCase * 100) /
             byBrandData?.overall?.overallCasesSold
           ).toFixed(2)}% of overall sales</p>
                   <div style=" margin: 0;
           padding: 0;
           box-sizing: border-box;
           background: #fff;
           width: 350px;
           border-radius: 10px;
           height: 10px;
           width: 100%;">
                       <div style="width: ${
                         (item.totalCase * 100) / byBrandData?.overall?.overallCasesSold
                       }%;
             margin: 0;
           padding: 0;
           box-sizing: border-box;
           background: #F24401;
           border-radius: 10px;
           height: 100%;
            "></div>
                   </div>
               </div>
                `,
             )
             .join('')}`
               }
             
           </div>
       </div>
       </div>


























           
    <div style="width: 900px;
           display: inline-flex;
            margin: 0;
           padding: 0;
           box-sizing: border-box;">
         <div style="margin: 0;
           padding: 0;
           box-sizing: border-box;
           width: 444px;
           position: relative;
           margin-top: 20px;
           padding: 30px 0;
           background-color: #f5f6f7;
           text-align: center;
           border-radius: 15px;
">
           <div style=" margin: 0;
           padding: 0;
           box-sizing: border-box;
           width: 100%;
           text-align: left;
           padding: 20px;
">
               <p style="margin: 0;
           padding: 0;
            box-sizing: border-box;
           margin-bottom: 30px;
           margin-top: -20px;
">Top performing stores (revenues)</p>


               ${
                 byStoreData?.salesByValue?.top3SalesByValue.length <= 0
                   ? `
                <div style="margin: 0;
           padding: 0;
            box-sizing: border-box;
           padding: 15px 11px;
           background: #DCE6F5;
           border-radius: 10px;
           margin-top: 10px;
           text-align:center;
">
                     <p  style="margin: 0;
           padding: 0;
            box-sizing: border-box;" >😅</p>

                  
              <p style="margin: 0;
           padding: 0;
            box-sizing: border-box;" >Nothing appeared here</p>
               </div>
               `
                   : `
           ${byStoreData?.salesByValue?.top3SalesByValue
             ?.map(
               (item) =>
                 `
               <div style=" margin: 0;
           padding: 0;
            box-sizing: border-box;
           padding: 15px 11px;
           background: #DCE6F5;
           border-radius: 10px;
           margin-top: 10px;
           width: 100%;
           vertical-align: middle;">
                   <p  style="margin: 0;
           padding: 0;
            box-sizing: border-box;
            width: 300px;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;">${item?.initiativeStore?.store?.name}</p>
                   <p style=" margin: 0;
           padding: 0;
            box-sizing: border-box;
            width: 300px;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
            font-size: 14px;
            color: #516376;
            margin: 5px 0;">${`${item?.initiativeStore?.store?.town}, ${item?.initiativeStore?.store?.area}, ${item?.initiativeStore?.store?.state}`}, </p>
                   <p style=" margin: 0;
           padding: 0;
            box-sizing: border-box;
           background: #3E4A89;
           padding: 10px 20px;
           border-radius: 10px;
           color: #fff;
           width: fit-content;
           font-weight: bold;
           margin: 10px 0;">
                      ${moneyFormat.format(item.totalValue)}
                   </p>
                   <p style=" margin: 0;
           padding: 0;
            box-sizing: border-box;
           font-size: 14px;
           color: #516376;
           margin: 5px 0;">${(
             (item.totalValue * 100) /
             byBrandData?.overall?.revenueGenerated
           ).toFixed(2)}% of overall sales</p>
            
                   <div style=" margin: 0;
           padding: 0;
           box-sizing: border-box;
           background: #fff;
           width: 350px;
           border-radius: 10px;
           height: 10px;
           width: 100%;">
                       <div  style="width: ${
                         (item.totalValue * 100) / byBrandData?.overall?.revenueGenerated
                       }%;
              margin: 0;
           padding: 0;
           box-sizing: border-box;
           background: #3E4A89;
           border-radius: 10px;
           height: 100%;
            "></div>
                   </div>
               </div>
                `,
             )
             .join('')}`
               }
             
           </div>
       </div>



        <div style=" margin: 0;
           padding: 0;
           box-sizing: border-box;
           width: 444px;
           position: relative;
           margin-top: 20px;
           padding: 30px 0;
           background-color: #f5f6f7;
           text-align: center;
           border-radius: 15px; margin-left: 13px;">
           <div style=" margin: 0;
           padding: 0;
           box-sizing: border-box;
           width: 100%;
           text-align: left;
           padding: 20px;
">
               <p style="margin: 0;
           padding: 0;
            box-sizing: border-box;
           margin-bottom: 30px;
           margin-top: -20px;
">Least performing stores (revenues)</p>


               ${
                 byStoreData?.salesByValue?.bottom3SalesByValue.length <= 0
                   ? `
                <div style="margin: 0;
           padding: 0;
            box-sizing: border-box;
           padding: 15px 11px;
           background: #DCE6F5;
           border-radius: 10px;
           margin-top: 10px;
           text-align:center;
">
                     <p  style="margin: 0;
           padding: 0;
            box-sizing: border-box;" >😅</p>

                    <p style="margin: 0;
           padding: 0;
            box-sizing: border-box;" >Nothing appeared here</p>

               </div>
               `
                   : `
           ${byStoreData?.salesByValue?.bottom3SalesByValue
             ?.map(
               (item) =>
                 `
               <div style=" margin: 0;
           padding: 0;
            box-sizing: border-box;
           padding: 15px 11px;
           background: #DCE6F5;
           border-radius: 10px;
           margin-top: 10px;
           width: 100%;
           vertical-align: middle;">
                   <p style="margin: 0;
           padding: 0;
            box-sizing: border-box;
            width: 300px;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;">${item?.initiativeStore?.store?.name}</p>
                   <p style=" margin: 0;
           padding: 0;
            box-sizing: border-box;
            width: 300px;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
            font-size: 14px;
            color: #516376;
            margin: 5px 0;" >${`${item?.initiativeStore?.store?.town}, ${item?.initiativeStore?.store?.area}, ${item?.initiativeStore?.store?.state}`}, </p>
                   <p style=" margin: 0;
           padding: 0;
            box-sizing: border-box;
           background: #F24401;
           padding: 10px 20px;
           border-radius: 10px;
           color: #fff;
           width: fit-content;
           font-weight: bold;
           margin: 10px 0;">
                      ${moneyFormat.format(item.totalValue)}
                   </p>
                   <p style=" margin: 0;
           padding: 0;
            box-sizing: border-box;
           font-size: 14px;
           color: #516376;
           margin: 5px 0;">${(
             (item.totalValue * 100) /
             byBrandData?.overall?.revenueGenerated
           ).toFixed(2)}% of overall sales</p>
                   <div style=" margin: 0;
           padding: 0;
           box-sizing: border-box;
           background: #fff;
           width: 350px;
           border-radius: 10px;
           height: 10px;
           width: 100%;">
                       <div  style="width: ${
                         (item.totalValue * 100) / byBrandData?.overall?.revenueGenerated
                       }%;
             margin: 0;
           padding: 0;
           box-sizing: border-box;
           background: #F24401;
           border-radius: 10px;
           height: 100%;
            "></div>
                   </div>
               </div>
                `,
             )
             .join('')}`
               }
             
           </div>
       </div>
       </div>












       <div style="width: 900px;
           display: inline-flex;
            margin: 0;
           padding: 0;
           box-sizing: border-box;">


       <div style="margin: 0;
           padding: 0;
           box-sizing: border-box;
           width: 444px;
           position: relative;
           margin-top: 20px;
           padding: 30px 0;
           background-color: #f5f6f7;
           text-align: center;
           border-radius: 15px;
">
           <div style=" margin: 0;
           padding: 0;
           box-sizing: border-box;
           width: 100%;
           text-align: left;
           padding: 20px;
">
           <p style="margin: 0;
           padding: 0;
            box-sizing: border-box;
           margin-bottom: 30px;
           margin-top: -20px;
">Most in stock SKU</p>
           ${
             mslLevelData?.top3.length <= 0
               ? `
                <div style="margin: 0;
           padding: 0;
            box-sizing: border-box;
           padding: 15px 11px;
           background: #DCE6F5;
           border-radius: 10px;
           margin-top: 10px;
           text-align:center;
">
                    <p  style="margin: 0;
           padding: 0;
            box-sizing: border-box;" >😅</p>

                     <p style="margin: 0;
           padding: 0;
            box-sizing: border-box;" >Nothing appeared here</p>
               </div>
               `
               : `
                      ${mslLevelData?.top3
                        ?.map(
                          (item) => `
           <div  style=" margin: 0;
           padding: 0;
            box-sizing: border-box;
           padding: 15px 11px;
           background: #DCE6F5;
           border-radius: 10px;
           margin-top: 10px;
           text-align:center;">
                    <p>${item.brand} - ${item.sku}</p>
                 
                     <p style="color: #27AE60; font-style: italic;" style=" margin: 0;
           padding: 0;
            box-sizing: border-box;
           font-size: 14px;
           color: #516376;
           margin: 5px 0;">Available 
                     ${item.percentageAvailability.toFixed(2)}% of the time</p>
           </div>


           `,
                        )
                        .join('')}
          
               `
           }
       
           </div>


       </div>






                   <div style=" margin: 0;
           padding: 0;
           box-sizing: border-box;
           width: 444px;
           position: relative;
           margin-top: 20px;
           padding: 30px 0;
           background-color: #f5f6f7;
           text-align: center;
           border-radius: 15px; margin-left: 13px;">
           <div style=" margin: 0;
           padding: 0;
           box-sizing: border-box;
           width: 100%;
           text-align: left;
           padding: 20px;
">
           <p style="margin: 0;
           padding: 0;
            box-sizing: border-box;
           margin-bottom: 30px;
           margin-top: -20px;
">Least in stock SKU</p>
           ${
             mslLevelData?.bottom3.length <= 0
               ? `
                <div style="margin: 0;
           padding: 0;
            box-sizing: border-box;
           padding: 15px 11px;
           background: #DCE6F5;
           border-radius: 10px;
           margin-top: 10px;
           text-align:center;
">
                    <p  style="margin: 0;
           padding: 0;
            box-sizing: border-box;" >😅</p>

                   <p style="margin: 0;
           padding: 0;
            box-sizing: border-box;" >Nothing appeared here</p>
               </div>
               `
               : `
                      ${mslLevelData?.bottom3
                        ?.map(
                          (item) => `
           <div  style=" margin: 0;
           padding: 0;
            box-sizing: border-box;
           padding: 15px 11px;
           background: #DCE6F5;
           border-radius: 10px;
           margin-top: 10px;
           text-align:center;">
                   <p>${item.brand} - ${item.sku}</p>
                 
                     <p style="color: #F24401; font-style: italic;" style=" margin: 0;
           padding: 0;
            box-sizing: border-box;
           font-size: 14px;
           color: #516376;
           margin: 5px 0;">Available 
                     ${item.percentageAvailability.toFixed(2)}% of the time</p>


           </div>


           `,
                        )
                        .join('')}
          
               `
           }
       
           </div>


       </div>


   </div>
















   <div style="width: 900px;
   display: inline-flex;
    margin: 0;
   padding: 0;
   box-sizing: border-box;">


<div style="margin: 0;
   padding: 0;
   box-sizing: border-box;
   width: 444px;
   position: relative;
   margin-top: 20px;
   padding: 30px 0;
   background-color: #f5f6f7;
   text-align: center;
   border-radius: 15px;
">
   <div style=" margin: 0;
   padding: 0;
   box-sizing: border-box;
   width: 100%;
   text-align: left;
   padding: 20px;
">
   <p style="margin: 0;
   padding: 0;
    box-sizing: border-box;
   margin-bottom: 30px;
   margin-top: -20px;
">Stores with the most SKU spread</p>
   ${
     storesMslLevelData?.top3.length <= 0
       ? `
        <div style="margin: 0;
   padding: 0;
    box-sizing: border-box;
   padding: 15px 11px;
   background: #DCE6F5;
   border-radius: 10px;
   margin-top: 10px;
   text-align:center;
">
            <p  style="margin: 0;
   padding: 0;
    box-sizing: border-box;" >😅</p>

             <p style="margin: 0;
   padding: 0;
    box-sizing: border-box;" >Nothing appeared here</p>
       </div>
       `
       : `
              ${storesMslLevelData?.top3
                ?.map(
                  (item) => `
   <div  style=" margin: 0;
   padding: 0;
    box-sizing: border-box;
   padding: 15px 11px;
   background: #DCE6F5;
   border-radius: 10px;
   margin-top: 10px;
   text-align:center;">
            <p>${item.storeName}</p>
         
             <p style="color: #27AE60; font-style: italic;" style=" margin: 0;
   padding: 0;
    box-sizing: border-box;
   font-size: 14px;
   color: #516376;
   margin: 5px 0;">Had 
             ${item.percentageAvailability.toFixed(2)}% of all SKUs</p>
   </div>


   `,
                )
                .join('')}
  
       `
   }

   </div>


</div>






           <div style=" margin: 0;
   padding: 0;
   box-sizing: border-box;
   width: 444px;
   position: relative;
   margin-top: 20px;
   padding: 30px 0;
   background-color: #f5f6f7;
   text-align: center;
   border-radius: 15px; margin-left: 13px;">
   <div style=" margin: 0;
   padding: 0;
   box-sizing: border-box;
   width: 100%;
   text-align: left;
   padding: 20px;
">
   <p style="margin: 0;
   padding: 0;
    box-sizing: border-box;
   margin-bottom: 30px;
   margin-top: -20px;
">Stores with the least SKU spread</p>
   ${
     storesMslLevelData?.bottom3.length <= 0
       ? `
        <div style="margin: 0;
   padding: 0;
    box-sizing: border-box;
   padding: 15px 11px;
   background: #DCE6F5;
   border-radius: 10px;
   margin-top: 10px;
   text-align:center;
">
            <p  style="margin: 0;
   padding: 0;
    box-sizing: border-box;" >😅</p>

           <p style="margin: 0;
   padding: 0;
    box-sizing: border-box;" >Nothing appeared here</p>
       </div>
       `
       : `
              ${storesMslLevelData?.bottom3
                ?.map(
                  (item) => `
   <div  style=" margin: 0;
   padding: 0;
    box-sizing: border-box;
   padding: 15px 11px;
   background: #DCE6F5;
   border-radius: 10px;
   margin-top: 10px;
   text-align:center;">
           <p>${item.storeName}</p>
         
             <p style="color: #F24401; font-style: italic;" style=" margin: 0;
   padding: 0;
    box-sizing: border-box;
   font-size: 14px;
   color: #516376;
   margin: 5px 0;">Had ${item.percentageAvailability.toFixed(2)}% of all SKUs</p>


   </div>


   `,
                )
                .join('')}
  
       `
   }

   </div>


</div>


</div>













   






   </div>
</body>


</html>
   `;

  return mail;
};

module.exports = { periodicMailTemplate };
