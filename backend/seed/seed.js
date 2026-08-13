const { PrismaClient } = require('@prisma/client');
const { Pool } = require('pg');
const { PrismaPg } = require('@prisma/adapter-pg');
const dotenv = require('dotenv');

dotenv.config();

const usersData = [
  {
    name: 'Admin User',
    email: 'admin@quickbite.com',
    password: 'Admin@123',
    role: 'admin'
  },
  {
    name: 'Rahul Sharma',
    email: 'student1@quickbite.com',
    password: 'Student@123',
    role: 'student'
  },
  {
    name: 'Priya Patel',
    email: 'student2@quickbite.com',
    password: 'Student@123',
    role: 'student'
  },
  {
    name: 'Aman Verma',
    email: 'student3@quickbite.com',
    password: 'Student@123',
    role: 'student'
  }
];

const productsData = [
  // Burgers
  {
    name: 'Classic Cheeseburger',
    description: 'Juicy patty topped with melted cheddar, fresh lettuce, and signature sauce',
    price: 129,
    category: 'Burgers',
    image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=500&auto=format&fit=crop&q=60',
    available: true,
    stock: 50
  },
  {
    name: 'Veggie Deluxe Burger',
    description: 'Crispy vegetable patty with fresh veggies, mayo, and tangy sauce',
    price: 99,
    category: 'Burgers',
    image: 'https://images.unsplash.com/photo-1550547660-d9450f859349?w=500&auto=format&fit=crop&q=60',
    available: true,
    stock: 45
  },
  {
    name: 'Crispy Chicken Burger',
    description: 'Crispy fried chicken breast topped with lettuce and spicy mayo',
    price: 149,
    category: 'Burgers',
    image: 'https://images.unsplash.com/photo-1625813506062-0aeb1d7a094b?w=500&auto=format&fit=crop&q=60',
    available: true,
    stock: 40
  },

  // Pizza
  {
    name: 'Margherita Pizza',
    description: 'Classic cheese pizza loaded with rich mozzarella and fresh basil',
    price: 199,
    category: 'Pizza',
    image: 'https://images.unsplash.com/photo-1604382355076-af4b0eb60143?w=500&auto=format&fit=crop&q=60',
    available: true,
    stock: 30
  },
  {
    name: 'Paneer Tikka Pizza',
    description: 'Spicy marinated paneer chunks, onion, and bell pepper on a crispy crust',
    price: 249,
    category: 'Pizza',
    image: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=500&auto=format&fit=crop&q=60',
    available: true,
    stock: 25
  },
  {
    name: 'Farmhouse Feast Pizza',
    description: 'Loaded with capsicum, onion, tomato, mushroom, and extra cheese',
    price: 269,
    category: 'Pizza',
    image: 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=500&auto=format&fit=crop&q=60',
    available: true,
    stock: 20
  },

  // Biryani
  {
    name: 'Hyderabadi Chicken Biryani',
    description: 'Aromatic basmati rice cooked with tender chicken and authentic spices',
    price: 189,
    category: 'Biryani',
    image: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=500&auto=format&fit=crop&q=60',
    available: true,
    stock: 35
  },
  {
    name: 'Paneer Dum Biryani',
    description: 'Fragrant saffron rice layered with spiced cottage cheese cubes',
    price: 159,
    category: 'Biryani',
    image: 'https://images.unsplash.com/photo-1633945274405-b6c8069047b0?w=500&auto=format&fit=crop&q=60',
    available: true,
    stock: 30
  },
  {
    name: 'Egg Biryani',
    description: 'Boiled eggs cooked with fragrant basmati rice and rich Indian gravy',
    price: 139,
    category: 'Biryani',
    image: 'https://images.unsplash.com/photo-1543353071-10c8ba85a904?w=500&auto=format&fit=crop&q=60',
    available: true,
    stock: 40
  },

  // South Indian
  {
    name: 'Crispy Masala Dosa',
    description: 'Golden fermented rice crepe filled with spiced potato masala, served with chutneys',
    price: 89,
    category: 'South Indian',
    image: 'https://images.unsplash.com/photo-1668236543090-82eba5ee5976?w=500&auto=format&fit=crop&q=60',
    available: true,
    stock: 60
  },
  {
    name: 'Idli Vada Combo',
    description: 'Two fluffy steamed rice cakes and one crispy medu vada with sambar',
    price: 69,
    category: 'South Indian',
    image: 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=500&auto=format&fit=crop&q=60',
    available: true,
    stock: 50
  },
  {
    name: 'Onion Rava Dosa',
    description: 'Thin crispy semolina crepe loaded with chopped onions and cumin',
    price: 99,
    category: 'South Indian',
    image: 'https://images.unsplash.com/photo-1610192244261-3f33de3f55e4?w=500&auto=format&fit=crop&q=60',
    available: true,
    stock: 45
  },

  // Snacks
  {
    name: 'Punjabi Samosa (2 pcs)',
    description: 'Crispy pastry pockets filled with spiced potato and green peas',
    price: 39,
    category: 'Snacks',
    image: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=500&auto=format&fit=crop&q=60',
    available: true,
    stock: 100
  },
  {
    name: 'Crispy French Fries',
    description: 'Golden fried potato sticks seasoned with peri peri spice mix',
    price: 79,
    category: 'Snacks',
    image: 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=500&auto=format&fit=crop&q=60',
    available: true,
    stock: 80
  },
  {
    name: 'Cheese Loaded Nachos',
    description: 'Tortilla chips topped with warm cheese sauce, jalapenos, and salsa',
    price: 119,
    category: 'Snacks',
    image: 'https://images.unsplash.com/photo-1513456852971-30c0b8199d4d?w=500&auto=format&fit=crop&q=60',
    available: true,
    stock: 40
  },
  {
    name: 'Paneer Kathi Roll',
    description: 'Flaky paratha wrapped around spiced paneer tikka, onions, and chutney',
    price: 109,
    category: 'Snacks',
    image: 'https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?w=500&auto=format&fit=crop&q=60',
    available: true,
    stock: 50
  },

  // Beverages
  {
    name: 'Creamy Cold Coffee',
    description: 'Chilled espresso blended with full-cream milk and topped with cocoa powder',
    price: 79,
    category: 'Beverages',
    image: 'https://images.unsplash.com/photo-1517701604599-bb29b565090c?w=500&auto=format&fit=crop&q=60',
    available: true,
    stock: 60
  },
  {
    name: 'Fresh Lime Soda',
    description: 'Sparkling lemon beverage served sweet or salted with mint leaves',
    price: 49,
    category: 'Beverages',
    image: 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=500&auto=format&fit=crop&q=60',
    available: true,
    stock: 75
  },
  {
    name: 'Mango Lassi',
    description: 'Rich yogurt drink blended with sweet Alphonso mango pulp',
    price: 69,
    category: 'Beverages',
    image: 'https://images.unsplash.com/photo-1527661591475-527312dd65f5?w=500&auto=format&fit=crop&q=60',
    available: true,
    stock: 50
  },

  // Desserts
  {
    name: 'Brownie with Vanilla Ice Cream',
    description: 'Warm fudge chocolate brownie served with a scoop of vanilla bean ice cream',
    price: 119,
    category: 'Desserts',
    image: 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?w=500&auto=format&fit=crop&q=60',
    available: true,
    stock: 30
  },
  {
    name: 'Hot Gulab Jamun (2 pcs)',
    description: 'Soft milk dumplings soaked in cardamom infused sugar syrup',
    price: 59,
    category: 'Desserts',
    image: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=500&auto=format&fit=crop&q=60',
    available: true,
    stock: 45
  },
  {
    name: 'Royal Rasmalai (2 pcs)',
    description: 'Soft cottage cheese patties immersed in saffron flavoured thick milk',
    price: 79,
    category: 'Desserts',
    image: 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=500&auto=format&fit=crop&q=60',
    available: true,
    stock: 35
  }
];

const seedDB = async () => {
  const dbUrl = process.env.DATABASE_URL;

  if (!dbUrl) {
    console.error('[Seed Error]: DATABASE_URL environment variable is missing.');
    process.exit(1);
  }

  const pool = new Pool({ connectionString: dbUrl });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });

  try {
    console.log('[Seed]: Connected to PostgreSQL via Prisma successfully.');

    console.log('[Seed]: Clearing existing Database Collections...');
    await prisma.orderItem.deleteMany({});
    await prisma.order.deleteMany({});
    await prisma.cartItem.deleteMany({});
    await prisma.cart.deleteMany({});
    await prisma.product.deleteMany({});
    await prisma.user.deleteMany({});

    console.log('[Seed]: Inserting Seed Users...');
    const createdUsers = [];
    for (const userData of usersData) {
      const bcrypt = require('bcryptjs');
      const salt = await bcrypt.genSalt(10);
      userData.password = await bcrypt.hash(userData.password, salt);
      const user = await prisma.user.create({ data: userData });
      createdUsers.push(user);
    }
    console.log(`[Seed]: Created ${createdUsers.length} users successfully.`);

    console.log('[Seed]: Inserting Seed Products...');
    await prisma.product.createMany({ data: productsData });
    const createdProducts = await prisma.product.findMany();
    console.log(`[Seed]: Created ${createdProducts.length} food products across 7 categories.`);

    console.log('[Seed]: Creating initial carts for students...');
    const students = createdUsers.filter((u) => u.role === 'student');
    for (const student of students) {
      await prisma.cart.create({ data: { userId: student.id } });
    }

    console.log('\n========================================');
    console.log('  SEEDING COMPLETED SUCCESSFULLY!');
    console.log('========================================');
    console.log('Admin Account:   admin@quickbite.com / Admin@123');
    console.log('Student Accounts:');
    console.log('  - student1@quickbite.com / Student@123');
    console.log('  - student2@quickbite.com / Student@123');
    console.log('  - student3@quickbite.com / Student@123');
    console.log('========================================\n');

    process.exit(0);
  } catch (error) {
    console.error(`[Seed Error]: ${error.message}`);
    process.exit(1);
  }
};

seedDB();
