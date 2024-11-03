const generateInitiativeMessagesReportHtml = (data) => {
  return `
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>You have a message to attend to!</title>
  </head>

  <body
    style="
      margin: 0;
      padding: 0;
      box-sizing: border-box;
      background: #e9e9e9;
      text-align: center;
      font-family: Arial, Helvetica, sans-serif;
      font-size: 16px;
    "
  >
    <div style="width: 600px; margin: 0 auto; padding: 0; box-sizing: border-box">
      <!-- logo section -->
      <div
        style="
          width: 100%;
          margin: 0;
          padding: 0;
          box-sizing: border-box;
          text-align: left;
          display: inline-flex;
          align-items: center;
        "
      >
        <img
          src="https://res.cloudinary.com/declutters/image/upload/v1726766092/PromoRama_transparent_zswtei.png"
          alt="promorama's logo"
          style="width: 92px; height: 66px"
        />

        <!-- <a href="#" style="margin-left: auto">Visit website</a> -->
      </div>

      <div style="width: 100%; margin: 0; padding: 10px; box-sizing: border-box; background: #fff">
        <div
          style="width: 100%; margin: 0; padding: 10px; box-sizing: border-box; background: #414483"
        >
          <img
            src=" https://res.cloudinary.com/declutters/image/upload/v1726766615/important_1_w3cez7.png"
            alt="message icon"
            style="width: 51px; height: 51px"
          />

          <p
            style="
              color: #fff;
              margin: 0;
              padding: 0px;
              box-sizing: border-box;
              font-size: 32px;
              font-weight: bold;
            "
          >
            ${data.initiativeName}
          </p>
          <p
            style="
              color: #fff;
              margin-top: 5px;
              padding: 0px;
              box-sizing: border-box;
              font-size: 16px;
            "
          >
            ${data.startDate} - ${data.currentDate}
          </p>
        </div>

        <div style="color: #626060; font-size: 16px; margin-top: 50px">
          <p>Hello <span style="font-weight: bold">${data.name}</span> Team,</p>
          <p style="margin-bottom: 50px">
            Please find attached below, the past 7 days aggregated messages from the Message/Issue Center for your initiative.
          </p>
          <p style="text-align: left; margin: 0; padding: 0; box-sizing: border-box;">Regards,<br>The PromoRama Team.</p>
          <div style="margin: 30px;">
            <a href="https://www.thepromorama.com"
            style="cursor: pointer; padding: 10px 30px; background: #414483; border-radius: 5px; box-sizing: border-box; width: fit-content; color: #fff; text-decoration: none;">Visit Website</a>
          </div>
        </div>
      </div>
    </div>
  </body>
</html>`;
};

module.exports = { generateInitiativeMessagesReportHtml };
