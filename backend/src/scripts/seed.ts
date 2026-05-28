import bcrypt from 'bcryptjs'
import prisma from '../models/db.js'

async function seedAdmin() {
  console.log('Creating admin user...')

  const hashedPassword = await bcrypt.hash('UretimAdmin2026!', 12)

  const admin = await prisma.user.upsert({
    where: { email: 'admin@uretimtakip.com' },
    update: {},
    create: {
      email: 'admin@uretimtakip.com',
      password: hashedPassword,
      fullName: 'Sistem Yöneticisi',
      badgeId: 'ADMIN001',
      role: 'admin'
    }
  })

  console.log('Admin created:', admin.email)
}

async function seedOperator() {
  console.log('Creating operator users...')

  const operators = [
    { email: 'ahmet@uretim.com', fullName: 'Ahmet Yılmaz', badgeId: 'OP001' },
    { email: 'fatma@uretim.com', fullName: 'Fatma Demir', badgeId: 'OP002' },
    { email: 'mehmet@uretim.com', fullName: 'Mehmet Kaya', badgeId: 'OP003' },
    { email: 'ayse@uretim.com', fullName: 'Ayşe Çelik', badgeId: 'OP004' },
    { email: 'mustafa@uretim.com', fullName: 'Mustafa Öztürk', badgeId: 'OP005' }
  ]

  for (const op of operators) {
    const hashedPassword = await bcrypt.hash('operator123', 12)
    
    await prisma.user.upsert({
      where: { email: op.email },
      update: {},
      create: {
        email: op.email,
        password: hashedPassword,
        fullName: op.fullName,
        badgeId: op.badgeId,
        role: 'operator'
      }
    })
    
    console.log('Created operator:', op.email)
  }
}

async function seedWorkstations() {
  console.log('Creating default workstations...')

  const workstations = [
    { code: 'KESIM', name: 'Kesim' },
    { code: 'BUKUM', name: 'Büküm' },
    { code: 'KAYNAK', name: 'Kaynak' },
    { code: 'BOYAMA', name: 'Boyama' },
    { code: 'MONTAJ', name: 'Montaj' },
    { code: 'KALITE', name: 'Kalite Kontrol' },
    { code: 'PAKET', name: 'Paketleme' }
  ]

  for (const ws of workstations) {
    await prisma.workstation.upsert({
      where: { code: ws.code },
      update: {},
      create: ws
    })
  }

  console.log('Workstations created')
}

async function main() {
  console.log('Starting seed...')

  await seedAdmin()
  await seedOperator()
  await seedWorkstations()

  console.log('Seed completed!')
  console.log(`
══════════════════════════════════════
LOGIN CREDENTIALS
══════════════════════════════════════
Admin:
  Email:    admin@uretimtakip.com
  Password: UretimAdmin2026!

Operators (password: operator123):
  ahmet@uretim.com, fatma@uretim.com, mehmet@uretim.com,
  ayse@uretim.com, mustafa@uretim.com
══════════════════════════════════════
  `)
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
