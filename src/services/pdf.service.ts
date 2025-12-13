import PDFDocument from 'pdfkit';
import { logger } from '../utils/logger';
import { s3Service } from './s3.service';

export class PDFService {
  async generateReceipt(
    invoiceNumber: string,
    organizationName: string,
    amount: number,
    currency: string,
    paidAt: Date,
    items: Array<{ description: string; amount: number }>
  ): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({ size: 'A4', margin: 50 });
        const chunks: Buffer[] = [];

        doc.on('data', (chunk) => chunks.push(chunk));
        doc.on('end', () => resolve(Buffer.concat(chunks)));
        doc.on('error', reject);

        doc
          .fontSize(20)
          .text('RECEIPT', 50, 50, { align: 'center' })
          .moveDown();

        doc
          .fontSize(10)
          .text(`Invoice Number: ${invoiceNumber}`, 50, 120)
          .text(`Date: ${paidAt.toLocaleDateString()}`, 50, 135)
          .text(`Organization: ${organizationName}`, 50, 150);

        doc.moveDown(2);

        doc
          .fontSize(12)
          .text('ITEMS', 50, 200)
          .moveDown(0.5);

        let y = 220;
        items.forEach((item) => {
          doc
            .fontSize(10)
            .text(item.description, 50, y)
            .text(`${currency.toUpperCase()} ${(item.amount / 100).toFixed(2)}`, 400, y, {
              align: 'right',
            });
          y += 20;
        });

        doc.moveTo(50, y).lineTo(550, y).stroke();
        y += 20;

        doc
          .fontSize(12)
          .text('TOTAL', 50, y)
          .text(`${currency.toUpperCase()} ${(amount / 100).toFixed(2)}`, 400, y, {
            align: 'right',
          });

        doc.moveDown(4);

        doc
          .fontSize(8)
          .text('Thank you for your business!', 50, doc.y, { align: 'center' })
          .text('If you have any questions, please contact support.', { align: 'center' });

        doc.end();

        logger.info('Receipt PDF generated', { invoiceNumber });
      } catch (error) {
        logger.error('Failed to generate receipt PDF', { error, invoiceNumber });
        reject(error);
      }
    });
  }

  async generateAndUploadReceipt(
    invoiceNumber: string,
    organizationName: string,
    amount: number,
    currency: string,
    paidAt: Date,
    items: Array<{ description: string; amount: number }>
  ): Promise<string> {
    try {
      const pdfBuffer = await this.generateReceipt(
        invoiceNumber,
        organizationName,
        amount,
        currency,
        paidAt,
        items
      );

      const key = `receipts/${invoiceNumber}.pdf`;
      const url = await s3Service.uploadFile(key, pdfBuffer, 'application/pdf');

      logger.info('Receipt uploaded to S3', {
        invoiceNumber,
        key,
        url,
      });

      return url;
    } catch (error) {
      logger.error('Failed to generate and upload receipt', { error, invoiceNumber });
      throw error;
    }
  }
}

export const pdfService = new PDFService();
