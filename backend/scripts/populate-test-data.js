/**
 * Script to populate test data for Reports testing
 * Run this with: node scripts/populate-test-data.js
 */

// For Node.js < 18, we need to use node-fetch
// For Node.js >= 18, fetch is available globally
const fetch = globalThis.fetch || (async () => {
  const module = await import('node-fetch');
  return module.default;
})();

const API_BASE = 'http://localhost:5001';

// Sample data generators
const teamMembers = [
  { id: '1', name: 'Dr. Sarah Johnson' },
  { id: '2', name: 'Dr. Michael Chen' },
  { id: '3', name: 'Dr. Emily Rodriguez' },
  { id: '4', name: 'Dr. James Wilson' },
];

const services = [
  { name: 'Initial Consultation', duration: '60 mins', price: 150 },
  { name: 'Follow-up Visit', duration: '30 mins', price: 75 },
  { name: 'Therapy Session', duration: '45 mins', price: 120 },
  { name: 'Annual Check-up', duration: '90 mins', price: 200 },
  { name: 'Specialist Consultation', duration: '60 mins', price: 180 },
];

const customers = [
  { name: 'John Smith', email: 'john.smith@email.com', phone: '555-0101' },
  { name: 'Emma Davis', email: 'emma.davis@email.com', phone: '555-0102' },
  { name: 'Michael Brown', email: 'michael.brown@email.com', phone: '555-0103' },
  { name: 'Sarah Wilson', email: 'sarah.wilson@email.com', phone: '555-0104' },
  { name: 'David Martinez', email: 'david.martinez@email.com', phone: '555-0105' },
  { name: 'Lisa Anderson', email: 'lisa.anderson@email.com', phone: '555-0106' },
  { name: 'Robert Taylor', email: 'robert.taylor@email.com', phone: '555-0107' },
  { name: 'Jennifer White', email: 'jennifer.white@email.com', phone: '555-0108' },
  { name: 'William Harris', email: 'william.harris@email.com', phone: '555-0109' },
  { name: 'Amanda Clark', email: 'amanda.clark@email.com', phone: '555-0110' },
];

const statuses = ['completed', 'upcoming', 'cancelled'];
const statusWeights = [0.7, 0.2, 0.1]; // 70% completed, 20% upcoming, 10% cancelled

function getRandomElement(array) {
  return array[Math.floor(Math.random() * array.length)];
}

function getWeightedStatus() {
  const rand = Math.random();
  if (rand < statusWeights[0]) return statuses[0];
  if (rand < statusWeights[0] + statusWeights[1]) return statuses[1];
  return statuses[2];
}

function getRandomDate(daysBack) {
  const date = new Date();
  date.setDate(date.getDate() - Math.floor(Math.random() * daysBack));
  return date.toISOString().split('T')[0];
}

function getRandomTime() {
  const hours = 9 + Math.floor(Math.random() * 9); // 9 AM to 5 PM
  const minutes = Math.random() < 0.5 ? '00' : '30';
  const ampm = hours >= 12 ? 'PM' : 'AM';
  const displayHour = hours > 12 ? hours - 12 : hours;
  return `${displayHour}:${minutes} ${ampm}`;
}

async function createAppointments(count = 50) {
  console.log(`Creating ${count} appointments...`);
  
  for (let i = 0; i < count; i++) {
    const customer = getRandomElement(customers);
    const service = getRandomElement(services);
    const teamMember = getRandomElement(teamMembers);
    const status = getWeightedStatus();
    
    const appointment = {
      customerName: customer.name,
      email: customer.email,
      phone: customer.phone,
      serviceName: service.name,
      serviceId: `service-${services.indexOf(service)}`,
      assignedMemberId: teamMember.id,
      assignedMemberName: teamMember.name,
      date: getRandomDate(90), // Within last 90 days
      time: getRandomTime(),
      status: status,
      notes: `Test appointment ${i + 1}`,
    };
    
    try {
      const response = await fetch(`${API_BASE}/api/appointments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(appointment),
      });
      
      if (response.ok) {
        process.stdout.write('.');
      } else {
        process.stdout.write('x');
      }
    } catch (error) {
      process.stdout.write('E');
    }
  }
  
  console.log('\n✅ Appointments created!');
}

async function createResources() {
  console.log('Creating resources...');
  
  const resources = [
    {
      name: 'Conference Room A',
      type: 'Room',
      description: 'Large conference room with video conferencing',
      status: 'available',
      capacity: '12',
    },
    {
      name: 'Conference Room B',
      type: 'Room',
      description: 'Small meeting room',
      status: 'available',
      capacity: '6',
    },
    {
      name: 'Projector - Sony 4K',
      type: 'Equipment',
      description: '4K projector for presentations',
      status: 'available',
    },
    {
      name: 'Zoom Account Pro',
      type: 'Zoom Account',
      description: 'Professional Zoom account',
      status: 'available',
    },
    {
      name: 'Company Van',
      type: 'Vehicle',
      description: '8-seater company vehicle',
      status: 'available',
      capacity: '8',
    },
  ];
  
  const createdResources = [];
  
  for (const resource of resources) {
    try {
      const response = await fetch(`${API_BASE}/api/resources`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(resource),
      });
      
      if (response.ok) {
        const data = await response.json();
        createdResources.push(data);
        console.log(`✅ Created: ${resource.name}`);
      }
    } catch (error) {
      console.log(`❌ Failed: ${resource.name}`);
    }
  }
  
  return createdResources;
}

async function createResourceBookings(resources, count = 30) {
  if (resources.length === 0) {
    console.log('⚠️  No resources available, skipping resource bookings');
    return;
  }
  
  console.log(`Creating ${count} resource bookings...`);
  
  for (let i = 0; i < count; i++) {
    const resource = getRandomElement(resources);
    const customer = getRandomElement(customers);
    const date = new Date();
    date.setDate(date.getDate() - Math.floor(Math.random() * 60));
    
    const startHour = 9 + Math.floor(Math.random() * 8);
    const duration = 1 + Math.floor(Math.random() * 3); // 1-3 hours
    
    const startTime = new Date(date);
    startTime.setHours(startHour, 0, 0, 0);
    
    const endTime = new Date(startTime);
    endTime.setHours(startTime.getHours() + duration);
    
    const booking = {
      resourceId: resource.id,
      bookedBy: customer.name,
      startTime: startTime.toISOString(),
      endTime: endTime.toISOString(),
      status: Math.random() > 0.1 ? 'confirmed' : 'cancelled',
      notes: `Resource booking ${i + 1}`,
    };
    
    try {
      const response = await fetch(`${API_BASE}/api/resource-bookings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(booking),
      });
      
      if (response.ok) {
        process.stdout.write('.');
      } else {
        process.stdout.write('x');
      }
    } catch (error) {
      process.stdout.write('E');
    }
  }
  
  console.log('\n✅ Resource bookings created!');
}

async function main() {
  console.log('🚀 Starting test data population...\n');
  
  try {
    // Test API connectivity
    const testResponse = await fetch(`${API_BASE}/api/appointments`);
    if (!testResponse.ok) {
      throw new Error('API not reachable. Make sure the server is running on port 5001');
    }
    
    // Create appointments
    await createAppointments(50);
    
    // Create resources
    const resources = await createResources();
    
    // Create resource bookings
    await createResourceBookings(resources, 30);
    
    console.log('\n🎉 Test data population complete!');
    console.log('\n📊 Summary:');
    console.log('   - 50 appointments created');
    console.log(`   - ${resources.length} resources created`);
    console.log('   - 30 resource bookings created');
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error('\nMake sure:');
    console.error('1. The server is running (npm run dev)');
    console.error('2. The API is accessible at http://localhost:5001');
  }
}

main();
