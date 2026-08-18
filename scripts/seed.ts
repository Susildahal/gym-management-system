/**
 * Development seed script.
 *
 * Usage:  npm run seed
 *
 * Populates MongoDB with a sample admin, instructors, students, classes,
 * a membership plan/membership, a payment, a notice, and coach feedback so
 * you have something to look at immediately after wiring up each module's
 * UI. Safe to re-run — it clears existing documents in these collections
 * first.
 */
import "dotenv/config";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import { User } from "../models/User";
import { Student } from "../models/Student";
import { Instructor } from "../models/Instructor";
import { Class } from "../models/Class";
import { Attendance } from "../models/Attendance";
import { MembershipPlan } from "../models/MembershipPlan";
import { Membership } from "../models/Membership";
import { Payment } from "../models/Payment";
import { Notice } from "../models/Notice";
import { CoachFeedback } from "../models/CoachFeedback";
import { Settings } from "../models/Settings";

async function seed() {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error("MONGODB_URI is not set. Add it to .env.local first.");

  await mongoose.connect(uri);
  console.log("Connected to MongoDB");

  await Promise.all([
    User.deleteMany({}),
    Student.deleteMany({}),
    Instructor.deleteMany({}),
    Class.deleteMany({}),
    Attendance.deleteMany({}),
    MembershipPlan.deleteMany({}),
    Membership.deleteMany({}),
    Payment.deleteMany({}),
    Notice.deleteMany({}),
    CoachFeedback.deleteMany({}),
    Settings.deleteMany({}),
  ]);
  console.log("Cleared existing collections");

  // --- Settings ---
  await Settings.create({
    academyName: "YinYang Wushu Sanda Center",
    address: "Kathmandu, Nepal",
    phone: "+977-1-4000000",
    email: "info@yinyangwushu.example",
    currency: "NPR",
    timezone: "Asia/Kathmandu",
  });

  // --- Admin user ---
  const adminPasswordHash = await bcrypt.hash("admin123", 10);
  const admin = await User.create({
    username: "admin",
    email: "admin@yinyangwushu.example",
    passwordHash: adminPasswordHash,
    role: "ADMIN",
    firstName: "System",
    lastName: "Admin",
    isActive: true,
  });
  console.log("Created admin user (username: admin / password: admin123)");

  // --- Instructor ---
  const instructorPasswordHash = await bcrypt.hash("coach123", 10);
  const instructorUser = await User.create({
    username: "coach.hari",
    email: "hari@yinyangwushu.example",
    passwordHash: instructorPasswordHash,
    role: "INSTRUCTOR",
    firstName: "Hari",
    lastName: "Thapa",
    isActive: true,
  });
  const instructor = await Instructor.create({
    instructorId: "INS-26-0001",
    user: instructorUser._id,
    firstName: "Hari",
    lastName: "Thapa",
    email: "hari@yinyangwushu.example",
    specialization: "Sanda, Wushu",
    experienceYears: 8,
    joiningDate: new Date("2023-01-15"),
  });

  // --- Student ---
  const studentPasswordHash = await bcrypt.hash("student123", 10);
  const studentUser = await User.create({
    username: "ram.sharma",
    email: "ram@yinyangwushu.example",
    passwordHash: studentPasswordHash,
    role: "STUDENT",
    firstName: "Ram",
    lastName: "Sharma",
    isActive: true,
  });
  const student = await Student.create({
    studentId: "STU-26-0001",
    user: studentUser._id,
    firstName: "Ram",
    lastName: "Sharma",
    gender: "MALE",
    phone: "9800000000",
    email: "ram@yinyangwushu.example",
    guardianName: "Shyam Sharma",
    guardianPhone: "9800000001",
    joinDate: new Date("2025-02-01"),
    membershipStatus: "ACTIVE",
  });

  // --- Class ---
  const trainingClass = await Class.create({
    name: "Beginner Sanda",
    classType: "Beginner Sanda",
    trainingLevel: "BEGINNER",
    instructor: instructor._id,
    trainingDays: ["MON", "WED", "FRI"],
    startTime: "17:00",
    endTime: "18:30",
    location: "Main Hall",
    maxCapacity: 20,
    enrolledStudents: [student._id],
    description: "Foundational Sanda techniques for new students.",
  });

  // --- Attendance ---
  await Attendance.create({
    student: student._id,
    class: trainingClass._id,
    date: new Date(),
    status: "PRESENT",
    markedBy: instructorUser._id,
  });

  // --- Membership plan + membership ---
  const plan = await MembershipPlan.create({
    planName: "Monthly",
    durationMonths: 1,
    price: 3000,
    description: "Billed every month.",
  });

  await Membership.create({
    student: student._id,
    plan: plan._id,
    startDate: new Date(),
    endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    amount: 3000,
    paymentStatus: "PAID",
    status: "ACTIVE",
  });

  // --- Payment ---
  await Payment.create({
    receiptNumber: "RCPT-26-0001",
    student: student._id,
    amount: 3000,
    paymentDate: new Date(),
    paymentMethod: "CASH",
    paymentFor: "Monthly Membership",
    remarks: "First month payment",
    recordedBy: admin._id,
  });

  // --- Notice ---
  await Notice.create({
    title: "Welcome to the new training season",
    content: "Classes resume this week. Please arrive 10 minutes early for warm-up.",
    priority: "NORMAL",
    targetAudience: "EVERYONE",
    createdBy: admin._id,
  });

  // --- Coach feedback ---
  await CoachFeedback.create({
    student: student._id,
    instructor: instructor._id,
    comment: "Good improvement in footwork and defensive movement. Continue working on balance and speed.",
  });

  console.log("Seed complete.");
  console.log("Login as: admin / admin123, coach.hari / coach123, ram.sharma / student123");

  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
