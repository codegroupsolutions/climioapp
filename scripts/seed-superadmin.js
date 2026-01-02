import { PrismaClient } from '@prisma/client'
import readline from 'readline'

const prisma = new PrismaClient()

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
})

const question = (query) => {
  return new Promise((resolve) => {
    rl.question(query, resolve)
  })
}

async function seedSuperAdmin() {
  console.log('🚀 SuperAdmin Seed Script')
  console.log('=' .repeat(50))

  try {
    // Check if superadmin already exists
    const existingCount = await prisma.superAdmin.count()

    if (existingCount > 0) {
      const overwrite = await question('\n⚠️  Ya existen SuperAdmins. ¿Deseas agregar otro? (s/n): ')

      if (overwrite.toLowerCase() !== 's') {
        console.log('\n❌ Operación cancelada.')
        process.exit(0)
      }
    }

    // Get SuperAdmin details
    console.log('\n📝 Ingresa los datos del SuperAdmin:\n')

    const name = await question('Nombre completo: ')
    const email = await question('Email: ')

    // Validate email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      console.error('\n❌ Email inválido')
      process.exit(1)
    }

    // Check if email already exists
    const existing = await prisma.superAdmin.findUnique({
      where: { email }
    })

    if (existing) {
      console.error('\n❌ Ya existe un SuperAdmin con ese email')
      process.exit(1)
    }

    // Create SuperAdmin
    const superAdmin = await prisma.superAdmin.create({
      data: {
        name,
        email,
        active: true
      }
    })

    console.log('\n✅ SuperAdmin creado exitosamente!')
    console.log('=' .repeat(50))
    console.log('📧 Email:', superAdmin.email)
    console.log('👤 Nombre:', superAdmin.name)
    console.log('🆔 ID:', superAdmin.id)
    console.log('=' .repeat(50))
    console.log('\n📌 Instrucciones de acceso:')
    console.log('1. Ve a /superadmin/login')
    console.log('2. Ingresa el email:', email)
    console.log('3. Recibirás un código de verificación en tu correo')
    console.log('4. Ingresa el código para acceder al panel')
    console.log('\n⚠️  Nota: Asegúrate de configurar las variables de entorno EMAIL_USER y EMAIL_PASSWORD')
    console.log('    en tu archivo .env para que funcione el envío de correos.')

  } catch (error) {
    console.error('\n❌ Error:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
    rl.close()
  }
}

// Run the seed
seedSuperAdmin()