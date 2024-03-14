const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

exports.createPdf = (data) => {
    const doc = new PDFDocument();
    const width = doc.page.width;
    const height = doc.page.height;
    doc.lineWidth(2); // You can adjust the thickness as needed
    doc.pipe(fs.createWriteStream(path.join('upload', `${data.ordernumber}.pdf`)));

    doc.rect(5, 10, width - 10, height - 15).stroke();
    // Set up the line
    const startX = 5; // X-coordinate for starting point
    const startY = 50; // Y-coordinate for starting point
    const lineWidth = width - 2 * startX; // Width of the line, accounting for margins
    const endX = startX + lineWidth;

    doc.fontSize(20)
        .text(`ShipDate:${data.createdAt.toString().slice(0, 15)}`, 50, 30, { align: 'right' });

    // Draw the line
    doc.moveTo(startX, startY)
        .lineTo(endX, startY)
        .stroke();
    // Add logo with border
    doc.image('./logo.png', 50, 55, { width: 100, height: 100 });
    doc.moveTo(startX, 160)
        .lineTo(endX, 160)
        .stroke();
    // Add barcode with border


    doc.fontSize(20)
        .text('From:', 10, 185)
        .text(data.sendername, 20, 205)
        .text(data.sendercity, 20, 225)
        .text(data.senderaddress, 20, 245)
        .text(data.senderphone, 20, 265);
    doc.moveTo(startX, 300)
        .lineTo(endX, 300)
        .stroke();
    // Add Receiver details with border
    doc.fontSize(20)
        .text('To:', 10, 320)
        .text(data.recivername, 20, 340)
        .text(data.recivercity, 20, 360)
        .text(data.reciveraddress, 20, 380)
        .text(data.reciverphone, 20, 400);
    doc.moveTo(startX, 430)
        .lineTo(endX, 430)
        .stroke();

    doc.fontSize(20)
        .text(`Weight: ${data.weight}`, 50, 450)
        .text(`Pieces:  ${data.pieces}`, 250, 450);
    doc.moveTo(startX, 480)
        .lineTo(endX, 480)
        .stroke()
    // Add Description with border
    doc.fontSize(20)
        .text(`Description: ${data.description}`, 10, 500);
    doc.moveTo(startX, 530)
        .lineTo(endX, 530)
        .stroke()
    // Add CC with border
    doc.fontSize(30)
        .text(`Price : ${data.price} SAR`, 50, 550, { align: 'center' });




    // Adjust position as needed
    doc.fontSize(20).text(`${data.ordernumber}`, 300, 130);
    doc.fontSize(20).text(`${data.ordernumber}`, 250, 660);
    doc.fontSize(20)
    doc.moveTo(startX, 680)
        .lineTo(endX, 680)
        .stroke()
    doc.fontSize(20)
        .text(`{reference id}: ${data.billcode}`, 10, height - 100);
    doc.font("./LibreBarcode128-Regular.ttf").fontSize(90).text(`${data.ordernumber}`, 150, 600);
    doc.font("./LibreBarcode128-Regular.ttf").fontSize(90).text(`${data.ordernumber}`, 1, 70, { align: 'right' }); doc.end();
}