const PDFDocument = require("pdfkit");
const fs = require("fs");
const path = require("path");
const bwipjs = require("bwip-js");

// Create a new PDF document

exports.createPdf = (data, isreturn) => {
  const doc = new PDFDocument();
  const customFont = fs.readFileSync(`./Amiri-Regular.ttf`);
  const width = doc.page.width;
  const height = doc.page.height;
  doc.lineWidth(2); // You can adjust the thickness as needed
  doc.pipe(
    fs.createWriteStream(path.join("public/upload", `${data.ordernumber}.pdf`))
  );

  doc.rect(5, 10, width - 10, height - 15).stroke();
  // Set up the line
  const startX = 5; // X-coordinate for starting point
  const startY = 50; // Y-coordinate for starting point
  const lineWidth = width - 2 * startX; // Width of the line, accounting for margins
  const endX = startX + lineWidth;

  doc
    .fontSize(20)
    .text(`ShipDate:${data.createdAt.toString().slice(0, 15)}`, 50, 30, {
      align: "right",
    });

  // Draw the line
  doc.moveTo(startX, startY).lineTo(endX, startY).stroke();
  // Add logo with border
  doc.image("./logo.png", 50, 55, { width: 100, height: 100 });
  doc.moveTo(startX, 160).lineTo(endX, 160).stroke();
  // doc.fontSize(20)
  doc.moveTo(startX, 680).lineTo(endX, 680).stroke();
  doc.fontSize(20).text(`{reference id}: ${data.billcode}`, 10, height - 100);
  const barcodeText = data.ordernumber; // Sample barcode text
  const barcodeOptions = {
    bcid: "code128", // Barcode type
    text: barcodeText,
    scale: 3, // Scaling factor
    height: 10, // Height of the barcode
    includetext: true, // Include the barcode text
    textxalign: "center", // Text alignment
  };

  // Render the barcode onto the PDF
  bwipjs.toBuffer(barcodeOptions, function (err, png) {
    if (err) {
      console.error(err);
      return;
    }

    // Add the barcode image to the PDF
    doc.image(png, 300, 70, {
      fit: [250, 100], // Fit the image within the specified dimensions
      align: "center",
      valign: "center",
    });
    doc.image(png, 170, 580, {
      fit: [250, 100], // Fit the image within the specified dimensions
      align: "center",
      valign: "center",
    });
    doc.registerFont(`Amiri-Regular`, customFont);
    doc
      .fontSize(20)
      .text("From:", 10, 185)
      .font(`Amiri-Regular`)
      .text(isreturn == true ? data.recivername : data.sendername, 20, 205,
        { features: ['rtla'] })
      .text(isreturn == true ? data.recivercity : data.sendercity, 20, 225,
        { features: ['rtla'] })
      .text(
        isreturn == true ? data.reciverdistrict : data.senderdistrict,
        20,
        245,
        { features: ['rtla'] }
      ).text(
        isreturn == true ? data.reciveraddress : data.senderaddress,
        20,
        265,
        { features: ['rtla'] }
      )
      .text(isreturn == true ? data.reciverphone : data.senderphone, 20, 285);
    doc.moveTo(startX, 310).lineTo(endX, 310).stroke();
    // Add Receiver details1 with border
    doc
      .fontSize(20)
      .text("To:", 10, 320)
      .font(`Amiri-Regular`)
      .text(isreturn == true ? data.sendername : data.recivername, 20, 340,
        { features: ['rtla'] })
      .text(isreturn == true ? data.sendercity : data.recivercity, 20, 360,
        { features: ['rtla'] })
      .text(
        isreturn == true ? data.senderdistrict : data.reciverdistrict,
        20,
        380,
        { features: ['rtla'] }
      ).text(
        isreturn == true ? data.senderaddress : data.reciveraddress,
        20,
        400,
        { features: ['rtla'] }
      )
      .text(isreturn == true ? data.senderphone : data.reciverphone, 20, 420);
    doc.moveTo(startX, 445).lineTo(endX, 445).stroke();

    doc
      .fontSize(20)
      .text(`Weight: ${data.weight}`, 50, 450)
      .text(`Pieces:  ${data.pieces}`, 250, 450);
    doc.moveTo(startX, 480).lineTo(endX, 480).stroke();
    // Add Description with border
    doc.fontSize(20).text(`Description: ${data.description}`, 10, 500);
    doc.moveTo(startX, 530).lineTo(endX, 530).stroke();
    doc.rect(390, 160, 216, 152).fill("#ff5900");
    doc.fontSize(20).fillColor("#ffffff")
    if (data.paytype == "cc") {
      doc.moveTo(390, 160).lineTo(390, 312).lineWidth(2).stroke();
      doc.fontSize(80).text(`CC`, 430, 165);
    } else {
      doc.moveTo(390, 160).lineTo(390, 312).lineWidth(2).stroke();
      doc.fontSize(40).text(`COD`, 457, 170);
      doc.fontSize(30).text(`S.R ${data.price}`, 402, 220);
    }
    doc.end();
  });
  // Add barcode with border
  // Adjust position as needed
  // doc.font("./LibreBarcode128-Regular.ttf").fontSize(90).text(`${data.ordernumber}`, 150, 600);
  // doc.font("./LibreBarcode128-Regular.ttf").fontSize(90).text(`${data.ordernumber}`, 1, 70, { align: 'right' }); doc.end();
};
