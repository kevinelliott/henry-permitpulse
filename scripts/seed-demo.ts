import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
import * as path from "path";

dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function seed() {
  console.log("Seeding demo data for Pacific Coast Kitchen...");

  // 1. Create a demo user
  const email = "demo@permitpulse.com";
  const password = "Password123!";
  
  const { data: userData, error: userError } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });
  
  let userId;
  if (userError) {
    if (userError.message === "A user with this email address has already been registered") {
      const { data: users } = await supabase.auth.admin.listUsers();
      userId = users.users.find(u => u.email === email)?.id;
    } else {
        console.error("Error creating user:", userError);
        return;
    }
  } else if (userData?.user) {
    userId = userData.user.id;
  }

  if (!userId) {
    console.error("Could not find or create user ID.");
    return;
  }

  console.log(`User ID: ${userId}`);

  // 2. Update Profile
  const { error: profileError } = await supabase.from("profiles").upsert({
    id: userId,
    business_name: "Pacific Coast Kitchen",
    industry: "restaurant",
    state_code: "CA",
    city: "San Francisco",
    slug: "pacific-coast-kitchen",
    onboarding_complete: true,
    plan: "pro",
  });

  if (profileError) console.error("Error updating profile:", profileError);

  // 3. Add Permits
  const today = new Date();
  
  const addDays = (date: Date, days: number) => {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result.toISOString().split("T")[0];
  };

  const permits = [
    {
      user_id: userId,
      name: "City Business License",
      category: "Business",
      issuing_agency: "San Francisco Treasurer & Tax Collector",
      expiry_date: addDays(today, 45), // Warning
      status: "active",
      renewal_cost: 250,
      penalty_amount: 500,
    },
    {
      user_id: userId,
      name: "Health Department Permit",
      category: "Health & Safety",
      issuing_agency: "SF Department of Public Health",
      expiry_date: addDays(today, -10), // Overdue
      status: "expired",
      renewal_cost: 700,
      penalty_amount: 5000,
    },
    {
      user_id: userId,
      name: "ABC Liquor License (Type 41)",
      category: "Alcohol",
      issuing_agency: "CA Dept of Alcoholic Beverage Control",
      expiry_date: addDays(today, 120), // Current
      status: "active",
      renewal_cost: 600,
      penalty_amount: 10000,
    },
    {
      user_id: userId,
      name: "Seller's Permit",
      category: "Tax",
      issuing_agency: "CDTFA",
      expiry_date: addDays(today, 200), // Current
      status: "active",
      renewal_cost: 0,
      penalty_amount: 2500,
    },
    {
        user_id: userId,
        name: "Fire Department Permit",
        category: "Health & Safety",
        issuing_agency: "SFFD",
        expiry_date: addDays(today, 15), // Warning
        status: "active",
        renewal_cost: 300,
        penalty_amount: 1500,
    },
    {
        user_id: userId,
        name: "Workers' Comp Insurance",
        category: "Insurance",
        issuing_agency: "State Fund",
        expiry_date: addDays(today, 300), // Current
        status: "active",
        renewal_cost: 4500,
        penalty_amount: 25000,
    },
    {
        user_id: userId,
        name: "Employer Identification Number",
        category: "Business",
        issuing_agency: "IRS",
        is_one_time: true,
        status: "one_time",
    }
  ];

  const { error: permitError } = await supabase.from("permits").upsert(permits, { onConflict: "user_id, name" });
  if (permitError) console.error("Error seeding permits:", permitError);

  // 4. Add Employees
  const employees = [
    { user_id: userId, name: "Marcus Chen", role: "Head Chef", email: "marcus@pckitchen.com" },
    { user_id: userId, name: "Sarah Miller", role: "Floor Manager", email: "sarah@pckitchen.com" },
    { user_id: userId, name: "David Rodriguez", role: "Bartender", email: "david@pckitchen.com" },
  ];

  const { data: employeeData, error: employeeError } = await supabase.from("employees").upsert(employees, { onConflict: "user_id, email" }).select();
  if (employeeError) console.error("Error seeding employees:", employeeError);

  // 5. Add Certifications
  if (employeeData) {
    const certs = [
      {
        employee_id: employeeData[0].id,
        user_id: userId,
        cert_type: "Food Safety Manager (ServSafe)",
        expiry_date: addDays(today, 400),
        status: "verified",
      },
      {
        employee_id: employeeData[1].id,
        user_id: userId,
        cert_type: "Food Handler Card",
        expiry_date: addDays(today, -5), // Expired
        status: "expired",
      },
      {
        employee_id: employeeData[2].id,
        user_id: userId,
        cert_type: "TABC/ABC Server Certification",
        expiry_date: addDays(today, 25), // Warning
        status: "verified",
      }
    ];
    const { error: certError } = await supabase.from("certifications").upsert(certs, { onConflict: "employee_id, cert_type" });
    if (certError) console.error("Error seeding certs:", certError);
  }

  console.log("Demo data seeded successfully.");
}

seed();
