// pages/api/mock-users.js - MOCK API FOR TESTING PREVIEW
export default async function handler(req, res) {
  // Add a small delay to simulate real API
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  const mockUsers = [
    {
      id: 1,
      email: "john.doe@company.com",
      username: "john.doe", 
      first_name: "John",
      last_name: "Doe",
      phone: "+1-555-123-4567",
      department: "Engineering",
      title: "Senior Developer",
      employee_id: "EMP001",
      hire_date: "2022-01-15",
      status: "active"
    },
    {
      id: 2,
      email: "jane.smith@company.com",
      username: "jane.smith",
      first_name: "Jane", 
      last_name: "Smith",
      phone: "+1-555-987-6543",
      department: "Marketing",
      title: "Marketing Manager",
      employee_id: "EMP002", 
      hire_date: "2021-03-20",
      status: "active"
    },
    {
      id: 3,
      email: "bob.wilson@company.com",
      username: "bob.wilson",
      first_name: "Bob",
      last_name: "Wilson", 
      phone: "+1-555-456-7890",
      department: "Sales",
      title: "Sales Representative",
      employee_id: "EMP003",
      hire_date: "2023-06-10",
      status: "active"
    },
    {
      id: 4,
      email: "alice.brown@company.com",
      username: "alice.brown",
      first_name: "Alice",
      last_name: "Brown",
      phone: "+1-555-234-5678", 
      department: "HR",
      title: "HR Specialist",
      employee_id: "EMP004",
      hire_date: "2020-11-05",
      status: "active"
    },
    {
      id: 5,
      email: "charlie.davis@company.com", 
      username: "charlie.davis",
      first_name: "Charlie",
      last_name: "Davis",
      phone: "+1-555-345-6789",
      department: "Finance",
      title: "Financial Analyst", 
      employee_id: "EMP005",
      hire_date: "2022-08-12",
      status: "active"
    }
  ];

  res.status(200).json({
    data: mockUsers,
    total: mockUsers.length,
    page: 1,
    per_page: 10
  });
}