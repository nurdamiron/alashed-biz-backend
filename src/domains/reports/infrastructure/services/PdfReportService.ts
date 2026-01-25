import PDFDocument from 'pdfkit';
import { PassThrough } from 'stream';

export interface OrderReportItem {
  id: number;
  customerName: string;
  customerPhone: string;
  total: number;
  status: string;
  createdAt: string;
  items: Array<{ name: string; quantity: number; price: number }>;
}

export interface SalesReportData {
  period: string;
  totalRevenue: number;
  totalOrders: number;
  averageOrderValue: number;
  topProducts: Array<{ name: string; quantity: number; revenue: number }>;
  salesByDay: Array<{ date: string; revenue: number; orders: number }>;
}

export interface InventoryReportItem {
  id: number;
  name: string;
  sku: string;
  stock: number;
  minStock: number;
  price: number;
  category: string;
}

/**
 * PDF Report Generator Service
 */
export class PdfReportService {
  private readonly companyName = 'ALASHED Business';
  private readonly currency = '₸';

  /**
   * Generate order receipt PDF
   */
  async generateOrderReceipt(order: OrderReportItem): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ size: 'A4', margin: 50 });
      const chunks: Buffer[] = [];

      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      // Header
      doc.fontSize(24).font('Helvetica-Bold').text(this.companyName, { align: 'center' });
      doc.moveDown(0.5);
      doc.fontSize(16).font('Helvetica').text(`Заказ #${order.id}`, { align: 'center' });
      doc.moveDown();

      // Line
      doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke();
      doc.moveDown();

      // Customer info
      doc.fontSize(12).font('Helvetica-Bold').text('Клиент:');
      doc.font('Helvetica').text(`${order.customerName}`);
      doc.text(`Телефон: ${order.customerPhone}`);
      doc.text(`Дата: ${new Date(order.createdAt).toLocaleDateString('ru-RU')}`);
      doc.text(`Статус: ${this.translateStatus(order.status)}`);
      doc.moveDown();

      // Items table header
      doc.font('Helvetica-Bold');
      const tableTop = doc.y;
      doc.text('Товар', 50, tableTop);
      doc.text('Кол-во', 300, tableTop);
      doc.text('Цена', 380, tableTop);
      doc.text('Сумма', 460, tableTop);

      doc.moveTo(50, doc.y + 5).lineTo(545, doc.y + 5).stroke();
      doc.moveDown();

      // Items
      doc.font('Helvetica');
      let y = doc.y;
      for (const item of order.items) {
        doc.text(item.name.substring(0, 35), 50, y);
        doc.text(item.quantity.toString(), 300, y);
        doc.text(`${item.price.toLocaleString()}${this.currency}`, 380, y);
        doc.text(`${(item.quantity * item.price).toLocaleString()}${this.currency}`, 460, y);
        y += 20;
      }

      doc.moveTo(50, y + 5).lineTo(545, y + 5).stroke();
      doc.moveDown(2);

      // Total
      doc.y = y + 20;
      doc.fontSize(14).font('Helvetica-Bold');
      doc.text(`ИТОГО: ${order.total.toLocaleString()}${this.currency}`, { align: 'right' });

      // Footer
      doc.moveDown(3);
      doc.fontSize(10).font('Helvetica').fillColor('gray');
      doc.text('Спасибо за покупку!', { align: 'center' });
      doc.text(`Документ сформирован: ${new Date().toLocaleString('ru-RU')}`, { align: 'center' });

      doc.end();
    });
  }

  /**
   * Generate sales report PDF
   */
  async generateSalesReport(data: SalesReportData): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ size: 'A4', margin: 50 });
      const chunks: Buffer[] = [];

      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      // Header
      doc.fontSize(24).font('Helvetica-Bold').text(this.companyName, { align: 'center' });
      doc.moveDown(0.5);
      doc.fontSize(18).text('Отчёт по продажам', { align: 'center' });
      doc.fontSize(12).font('Helvetica').text(`Период: ${data.period}`, { align: 'center' });
      doc.moveDown();

      doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke();
      doc.moveDown();

      // Summary
      doc.fontSize(14).font('Helvetica-Bold').text('Общая статистика');
      doc.moveDown(0.5);
      doc.fontSize(12).font('Helvetica');

      const summaryData = [
        ['Общая выручка:', `${data.totalRevenue.toLocaleString()}${this.currency}`],
        ['Количество заказов:', data.totalOrders.toString()],
        ['Средний чек:', `${data.averageOrderValue.toLocaleString()}${this.currency}`],
      ];

      for (const [label, value] of summaryData) {
        doc.text(`${label} ${value}`);
      }

      doc.moveDown();

      // Top products
      if (data.topProducts.length > 0) {
        doc.fontSize(14).font('Helvetica-Bold').text('Топ товаров');
        doc.moveDown(0.5);

        doc.fontSize(10).font('Helvetica-Bold');
        const tableTop = doc.y;
        doc.text('Название', 50, tableTop);
        doc.text('Продано', 350, tableTop);
        doc.text('Выручка', 450, tableTop);

        doc.moveTo(50, doc.y + 5).lineTo(545, doc.y + 5).stroke();

        doc.font('Helvetica');
        let y = doc.y + 15;
        for (const product of data.topProducts.slice(0, 10)) {
          doc.text(product.name.substring(0, 40), 50, y);
          doc.text(product.quantity.toString(), 350, y);
          doc.text(`${product.revenue.toLocaleString()}${this.currency}`, 450, y);
          y += 18;
        }

        doc.y = y + 10;
      }

      // Sales by day
      if (data.salesByDay.length > 0) {
        doc.moveDown();
        doc.fontSize(14).font('Helvetica-Bold').text('Продажи по дням');
        doc.moveDown(0.5);

        doc.fontSize(10).font('Helvetica-Bold');
        const dayTableTop = doc.y;
        doc.text('Дата', 50, dayTableTop);
        doc.text('Заказов', 250, dayTableTop);
        doc.text('Выручка', 400, dayTableTop);

        doc.moveTo(50, doc.y + 5).lineTo(545, doc.y + 5).stroke();

        doc.font('Helvetica');
        let y = doc.y + 15;
        for (const day of data.salesByDay.slice(0, 14)) {
          doc.text(day.date, 50, y);
          doc.text(day.orders.toString(), 250, y);
          doc.text(`${day.revenue.toLocaleString()}${this.currency}`, 400, y);
          y += 18;
        }
      }

      // Footer
      doc.moveDown(3);
      doc.fontSize(10).font('Helvetica').fillColor('gray');
      doc.text(`Отчёт сформирован: ${new Date().toLocaleString('ru-RU')}`, { align: 'center' });

      doc.end();
    });
  }

  /**
   * Generate inventory report PDF
   */
  async generateInventoryReport(items: InventoryReportItem[], title: string = 'Отчёт по складу'): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ size: 'A4', margin: 50, layout: 'landscape' });
      const chunks: Buffer[] = [];

      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      // Header
      doc.fontSize(20).font('Helvetica-Bold').text(this.companyName, { align: 'center' });
      doc.fontSize(16).text(title, { align: 'center' });
      doc.fontSize(10).font('Helvetica').text(`Дата: ${new Date().toLocaleDateString('ru-RU')}`, { align: 'center' });
      doc.moveDown();

      doc.moveTo(50, doc.y).lineTo(790, doc.y).stroke();
      doc.moveDown();

      // Table header
      doc.fontSize(9).font('Helvetica-Bold');
      const cols = [
        { x: 50, w: 50, label: 'ID' },
        { x: 100, w: 200, label: 'Название' },
        { x: 300, w: 80, label: 'Артикул' },
        { x: 380, w: 70, label: 'Категория' },
        { x: 460, w: 60, label: 'Остаток' },
        { x: 520, w: 60, label: 'Мин.' },
        { x: 580, w: 80, label: 'Цена' },
        { x: 660, w: 80, label: 'Статус' },
      ];

      const headerY = doc.y;
      for (const col of cols) {
        doc.text(col.label, col.x, headerY, { width: col.w });
      }

      doc.moveTo(50, doc.y + 5).lineTo(790, doc.y + 5).stroke();

      // Table rows
      doc.font('Helvetica').fontSize(8);
      let y = doc.y + 15;

      for (const item of items) {
        if (y > 500) {
          // New page
          doc.addPage();
          y = 50;
        }

        const status = item.stock <= 0 ? 'Нет в наличии' : item.stock <= item.minStock ? 'Мало' : 'В наличии';
        const statusColor = item.stock <= 0 ? 'red' : item.stock <= item.minStock ? 'orange' : 'green';

        doc.fillColor('black').text(item.id.toString(), cols[0].x, y, { width: cols[0].w });
        doc.text(item.name.substring(0, 30), cols[1].x, y, { width: cols[1].w });
        doc.text(item.sku || '-', cols[2].x, y, { width: cols[2].w });
        doc.text(item.category || '-', cols[3].x, y, { width: cols[3].w });
        doc.text(item.stock.toString(), cols[4].x, y, { width: cols[4].w });
        doc.text(item.minStock.toString(), cols[5].x, y, { width: cols[5].w });
        doc.text(`${item.price.toLocaleString()}${this.currency}`, cols[6].x, y, { width: cols[6].w });
        doc.fillColor(statusColor).text(status, cols[7].x, y, { width: cols[7].w });

        y += 16;
      }

      // Summary
      doc.fillColor('black');
      doc.moveDown(2);
      doc.y = y + 20;
      doc.fontSize(10).font('Helvetica-Bold');
      doc.text(`Всего позиций: ${items.length}`);
      doc.font('Helvetica');
      doc.text(`Товаров с низким остатком: ${items.filter((i) => i.stock <= i.minStock && i.stock > 0).length}`);
      doc.text(`Товаров нет в наличии: ${items.filter((i) => i.stock <= 0).length}`);

      // Footer
      doc.moveDown(2);
      doc.fontSize(8).fillColor('gray');
      doc.text(`Отчёт сформирован: ${new Date().toLocaleString('ru-RU')}`, { align: 'center' });

      doc.end();
    });
  }

  /**
   * Generate orders list PDF
   */
  async generateOrdersReport(orders: OrderReportItem[], period: string): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ size: 'A4', margin: 50 });
      const chunks: Buffer[] = [];

      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      // Header
      doc.fontSize(20).font('Helvetica-Bold').text(this.companyName, { align: 'center' });
      doc.fontSize(14).text('Отчёт по заказам', { align: 'center' });
      doc.fontSize(10).font('Helvetica').text(`Период: ${period}`, { align: 'center' });
      doc.moveDown();

      doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke();
      doc.moveDown();

      // Summary
      const totalRevenue = orders.reduce((sum, o) => sum + o.total, 0);
      doc.fontSize(12).font('Helvetica-Bold');
      doc.text(`Всего заказов: ${orders.length}`);
      doc.text(`Общая сумма: ${totalRevenue.toLocaleString()}${this.currency}`);
      doc.moveDown();

      // Table
      doc.fontSize(9).font('Helvetica-Bold');
      const headerY = doc.y;
      doc.text('#', 50, headerY);
      doc.text('Клиент', 80, headerY);
      doc.text('Телефон', 220, headerY);
      doc.text('Сумма', 340, headerY);
      doc.text('Статус', 420, headerY);
      doc.text('Дата', 490, headerY);

      doc.moveTo(50, doc.y + 5).lineTo(545, doc.y + 5).stroke();

      doc.font('Helvetica').fontSize(8);
      let y = doc.y + 15;

      for (const order of orders) {
        if (y > 750) {
          doc.addPage();
          y = 50;
        }

        doc.text(order.id.toString(), 50, y);
        doc.text(order.customerName.substring(0, 20), 80, y);
        doc.text(order.customerPhone, 220, y);
        doc.text(`${order.total.toLocaleString()}${this.currency}`, 340, y);
        doc.text(this.translateStatus(order.status), 420, y);
        doc.text(new Date(order.createdAt).toLocaleDateString('ru-RU'), 490, y);

        y += 16;
      }

      // Footer
      doc.moveDown(3);
      doc.fontSize(8).fillColor('gray');
      doc.text(`Отчёт сформирован: ${new Date().toLocaleString('ru-RU')}`, { align: 'center' });

      doc.end();
    });
  }

  private translateStatus(status: string): string {
    const statuses: Record<string, string> = {
      pending: 'Ожидает',
      processing: 'В обработке',
      shipped: 'Отправлен',
      delivered: 'Доставлен',
      completed: 'Завершён',
      cancelled: 'Отменён',
    };
    return statuses[status] || status;
  }
}
