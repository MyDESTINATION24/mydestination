import mongoose from 'mongoose';
import dotenv from 'dotenv';
import WeddingSupportTicket from './modules/wedding/models/WeddingSupportTicket.js';

dotenv.config();

const seedSupportTickets = async () => {
  try {
    const mongoUrl = process.env.MONGO_URI;
    await mongoose.connect(mongoUrl);
    console.log('Connected to DB');

    await WeddingSupportTicket.deleteMany({});

    const tickets = [
      { ticketId: "TK-451", user: "Vikram Mehta", subject: "Refund for missed photography", status: "Critical", priority: 1 },
      { ticketId: "TK-452", user: "Aditya Sharma", subject: "Vendor not responding since 2 days", status: "In Progress", priority: 2 },
      { ticketId: "TK-453", user: "Royal Photography", subject: "Issues with payout settlement", status: "Open", priority: 3 }
    ];

    await WeddingSupportTicket.insertMany(tickets);
    console.log('Seeded Support Tickets');
    
    process.exit(0);
  } catch (error) {
    console.error('Seed Error:', error);
    process.exit(1);
  }
};

seedSupportTickets();
