export type Payment = {
  id: string
  amount: number
  status: 'pending' | 'processing' | 'success' | 'failed'
  email: string
}

export const payments: Payment[] = [
  {
    id: '728ed52f',
    amount: 100,
    status: 'pending',
    email: 'm@example.com',
  },
  {
    id: '489e1d42',
    amount: 125,
    status: 'processing',
    email: 'example@gmail.com',
  },
  {
    id: 'a3fb7289',
    amount: 50,
    status: 'success',
    email: 'john.doe@company.com',
  },
  {
    id: 'b5c72e18',
    amount: 75.5,
    status: 'failed',
    email: 'sarah@outlook.com',
  },
  {
    id: 'c4d82f39',
    amount: 200,
    status: 'success',
    email: 'robert.smith@business.co',
  },
  {
    id: 'd9e84a12',
    amount: 99.99,
    status: 'processing',
    email: 'dev.team@startup.io',
  },
  {
    id: 'e2f17b63',
    amount: 149.95,
    status: 'pending',
    email: 'jane.wilson@example.org',
  },
  {
    id: 'f8g29h45',
    amount: 299.99,
    status: 'success',
    email: 'michael.brown@gmail.com',
  },
  {
    id: '12h34i56',
    amount: 19.99,
    status: 'failed',
    email: 'support@techfirm.net',
  },
  {
    id: '78j91k23',
    amount: 599,
    status: 'success',
    email: 'enterprise@bigcorp.com',
  },
  {
    id: '34l56m78',
    amount: 49.5,
    status: 'pending',
    email: 'maria.garcia@example.com',
  },
  {
    id: '90n12o34',
    amount: 150,
    status: 'processing',
    email: 'david.lee@consulting.biz',
  },
  {
    id: '56p78q90',
    amount: 24.99,
    status: 'success',
    email: 'emma.taylor@school.edu',
  },
  {
    id: 'r1s2t3u4',
    amount: 399.95,
    status: 'failed',
    email: 'customer.service@retailer.com',
  },
  {
    id: 'v5w6x7y8',
    amount: 79.9,
    status: 'success',
    email: 'james.johnson@company.co.uk',
  },
  {
    id: 'z9a8b7c6',
    amount: 34.5,
    status: 'pending',
    email: 'olivia.miller@startup.dev',
  },
  {
    id: 'd5e4f3g2',
    amount: 249.99,
    status: 'processing',
    email: 'william.davis@agency.net',
  },
  {
    id: 'h1i2j3k4',
    amount: 999,
    status: 'success',
    email: 'premium@enterprise.org',
  },
  {
    id: 'l5m6n7o8',
    amount: 15.75,
    status: 'failed',
    email: 'sophia.anderson@personal.me',
  },
  {
    id: 'p9q8r7s6',
    amount: 129.99,
    status: 'success',
    email: 'benjamin.wilson@freelance.co',
  },
]
