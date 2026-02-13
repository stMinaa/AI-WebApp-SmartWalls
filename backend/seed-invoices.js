/**
 * Seed Test Invoices
 * Creates sample unpaid invoices for testing Director Dugovanja tab
 */

const mongoose = require('mongoose');
const Invoice = require('./models/Invoice');
const User = require('./models/User');
const Building = require('./models/Building');

const MONGO_URI = 'mongodb+srv://minastankovic111_db_user:XcZ45WFEEOnILNJu@cluster0.2lelkqq.mongodb.net/tennetdb?retryWrites=true&w=majority&appName=Cluster0';

async function seedInvoices() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected to MongoDB');

    // Get some associates
    const associates = await User.find({ role: 'associate', status: 'active' }).limit(5);
    if (associates.length === 0) {
      console.log('❌ No associates found! Run seed-associates.js first.');
      process.exit(1);
    }

    // Get a building for reference (optional)
    const building = await Building.findOne();

    console.log('\n📝 Creating test invoices...');

    const testInvoices = [
      // Aqua Fix company
      {
        company: 'Aqua Fix',
        associate: associates[0]._id,
        associateName: `${associates[0].firstName} ${associates[0].lastName}`,
        title: 'Popravka vodovodnih instalacija',
        reason: 'Popravka procurelog vodomera u stanu 12',
        amount: 8500,
        date: new Date('2026-01-25'),
        paid: false
      },
      {
        company: 'Aqua Fix',
        associate: associates[0]._id,
        associateName: `${associates[0].firstName} ${associates[0].lastName}`,
        title: 'Zamena bojlera',
        reason: 'Ugradnja novog bojlera u stanu 7',
        amount: 25000,
        date: new Date('2026-01-28'),
        paid: false
      },
      // Volt Servis company
      {
        company: 'Volt Servis',
        associate: associates.length > 1 ? associates[1]._id : associates[0]._id,
        associateName: associates.length > 1 ? `${associates[1].firstName} ${associates[1].lastName}` : associates[0].firstName,
        title: 'Popravka elektro instalacija',
        reason: 'Popravka osigurača u zajedničkom hodniku',
        amount: 6000,
        date: new Date('2026-02-01'),
        paid: false
      },
      {
        company: 'Volt Servis',
        associate: associates.length > 1 ? associates[1]._id : associates[0]._id,
        associateName: associates.length > 1 ? `${associates[1].firstName} ${associates[1].lastName}` : associates[0].firstName,
        title: 'Ugradnja LED rasvete',
        reason: 'Zamena rasvete u ulazu zgrade',
        amount: 12000,
        date: new Date('2026-02-03'),
        paid: false
      },
      // Mikki company
      {
        company: 'Mikki',
        associate: associates.length > 2 ? associates[2]._id : associates[0]._id,
        associateName: associates.length > 2 ? `${associates[2].firstName} ${associates[2].lastName}` : associates[0].firstName,
        title: 'Generalno održavanje',
        reason: 'Mesečno održavanje zajedničkih prostorija',
        amount: 15000,
        date: new Date('2026-02-05'),
        paid: false
      },
      {
        company: 'Mikki',
        associate: associates.length > 2 ? associates[2]._id : associates[0]._id,
        associateName: associates.length > 2 ? `${associates[2].firstName} ${associates[2].lastName}` : associates[0].firstName,
        title: 'Popravka lifta',
        reason: 'Servis i popravka kabinskog lifta',
        amount: 35000,
        date: new Date('2026-01-20'),
        paid: false
      },
      // Termo Servis company
      {
        company: 'Termo Servis',
        associate: associates.length > 3 ? associates[3]._id : associates[0]._id,
        associateName: associates.length > 3 ? `${associates[3].firstName} ${associates[3].lastName}` : associates[0].firstName,
        title: 'Servis kotla',
        reason: 'Godišnji servis centralnog grejanja',
        amount: 18000,
        date: new Date('2026-01-15'),
        paid: false
      },
      {
        company: 'Termo Servis',
        associate: associates.length > 3 ? associates[3]._id : associates[0]._id,
        associateName: associates.length > 3 ? `${associates[3].firstName} ${associates[3].lastName}` : associates[0].firstName,
        title: 'Popravka radijatora',
        reason: 'Zamena ventila na radijatorima u hodniku',
        amount: 9500,
        date: new Date('2026-02-02'),
        paid: false
      }
    ];

    for (const invoiceData of testInvoices) {
      if (building) {
        invoiceData.building = building._id;
      }
      
      const invoice = new Invoice(invoiceData);
      await invoice.save();
      console.log(`✅ Created: ${invoiceData.company} - ${invoiceData.title} (${invoiceData.amount} RSD)`);
    }

    console.log('\n✅ Seeding completed successfully!');
    
    // Calculate totals by company
    console.log('\n📊 Summary by Company:');
    const invoices = await Invoice.find({ paid: false });
    const byCompany = {};
    invoices.forEach(inv => {
      if (!byCompany[inv.company]) {
        byCompany[inv.company] = { count: 0, total: 0 };
      }
      byCompany[inv.company].count++;
      byCompany[inv.company].total += inv.amount;
    });
    
    Object.keys(byCompany).sort().forEach(company => {
      console.log(`   ${company}: ${byCompany[company].count} faktura, ${byCompany[company].total.toLocaleString('sr-RS')} RSD`);
    });
    
    const grandTotal = Object.values(byCompany).reduce((sum, c) => sum + c.total, 0);
    console.log(`\n   UKUPNO: ${grandTotal.toLocaleString('sr-RS')} RSD`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding invoices:', error);
    process.exit(1);
  }
}

seedInvoices();
