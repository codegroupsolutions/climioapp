'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'

export default function RegisterPage() {
  const router = useRouter()
  const [formData, setFormData] = useState({
    companyName: '',
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    acceptTerms: false
  })
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [step, setStep] = useState(1)
  const passwordRegex =
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).+$/

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (step === 1) {
      if (!formData.companyName || !formData.name) {
        setError('Por favor completa todos los campos')
        return
      }
      setIsLoading(true)
      setError('')
      try {
        const response = await fetch(
          `/api/companies/check-name?name=${encodeURIComponent(
            formData.companyName.trim()
          )}`
        )
        const data = await response.json()

        if (!response.ok) {
          throw new Error(data.error || 'Error al validar el nombre')
        }

        if (data.exists) {
          setError('El nombre de la empresa ya está registrado')
          return
        }

        setStep(2)
      } catch (err) {
        setError(err.message || 'Error al validar el nombre')
      } finally {
        setIsLoading(false)
      }
      return
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Las contraseñas no coinciden')
      return
    }

    if (formData.password.length < 8) {
      setError('La contraseña debe tener al menos 8 caracteres')
      return
    }

    if (!passwordRegex.test(formData.password)) {
      setError(
        'La contraseña debe incluir mayúscula, minúscula, número y símbolo'
      )
      return
    }

    if (!formData.acceptTerms) {
      setError('Debes aceptar los Términos y Condiciones para continuar')
      return
    }

    setIsLoading(true)
    setError('')

    try {
      const response = await fetch('/api/companies/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyName: formData.companyName,
          adminName: formData.name,
          adminEmail: formData.email,
          adminPassword: formData.password,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Error al registrar')
      }

      router.push('/auth/login?registered=true')
    } catch (err) {
      setError(err.message || 'Error al crear la cuenta')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex bg-white">
      {/* Left Side - Form */}
      <div className="flex-1 flex flex-col justify-center px-8 py-12 lg:px-16 bg-white">
        <div className="w-full max-w-md mx-auto">
          {/* Logo */}
          <Link href="/" className="inline-block mb-10 mx-auto">
            <Image
              src="/logo-black.png"
              alt="Logo"
              width={150}
              height={50}
              className="h-20 w-auto"
            />
          </Link>

          {/* Progress Indicator */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center">
              <div className={`w-10 h-10 flex items-center justify-center font-semibold ${
                step >= 1 ? 'bg-black text-white' : 'bg-gray-300 text-gray-500'
              }`}>
                1
              </div>
              <div className={`w-24 h-1 ${step >= 2 ? 'bg-black' : 'bg-gray-300'}`}></div>
            </div>
            <div className="flex items-center">
              <div className={`w-10 h-10 flex items-center justify-center font-semibold ${
                step >= 2 ? 'bg-black text-white' : 'bg-gray-300 text-gray-500'
              }`}>
                2
              </div>
            </div>
          </div>

          {/* Header */}
          <div className="mb-10">
            <h1 className="text-3xl font-bold text-black mb-2">
              {step === 1 ? 'Crear tu cuenta' : 'Configurar acceso'}
            </h1>
            <p className="text-gray-600">
              {step === 1
                ? 'Comienza tu prueba gratis'
                : 'Casi listo, configura tu contraseña'
              }
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-600 text-sm">
              {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {step === 1 ? (
              <>
                <div>
                  <label htmlFor="companyName" className="block text-sm font-medium text-gray-700 mb-2">
                    Nombre de la Empresa
                  </label>
                  <input
                    id="companyName"
                    type="text"
                    name="companyName"
                    value={formData.companyName}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-white border-2 border-gray-300 text-black focus:outline-none focus:border-black transition-all"
                    placeholder="Mi Empresa S.A."
                    required
                    disabled={isLoading}
                  />
                </div>

                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                    Tu Nombre Completo
                  </label>
                  <input
                    id="name"
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-white border-2 border-gray-300 text-black focus:outline-none focus:border-black transition-all"
                    placeholder="Juan Pérez"
                    required
                    disabled={isLoading}
                  />
                </div>
              </>
            ) : (
              <>
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                    Correo Electrónico
                  </label>
                  <input
                    id="email"
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-white border-2 border-gray-300 text-black focus:outline-none focus:border-black transition-all"
                    placeholder="tu@empresa.com"
                    required
                    disabled={isLoading}
                  />
                </div>

                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                    Contraseña
                  </label>
                  <input
                    id="password"
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-white border-2 border-gray-300 text-black focus:outline-none focus:border-black transition-all"
                    placeholder="Mínimo 8 caracteres"
                    required
                    disabled={isLoading}
                  />
                </div>

                <div>
                  <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                    Confirmar Contraseña
                  </label>
                  <input
                    id="confirmPassword"
                    type="password"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-white border-2 border-gray-300 text-black focus:outline-none focus:border-black transition-all"
                    placeholder="Repite tu contraseña"
                    required
                    disabled={isLoading}
                  />
                </div>

                <div className="flex items-start">
                  <input
                    id="acceptTerms"
                    type="checkbox"
                    name="acceptTerms"
                    checked={formData.acceptTerms}
                    onChange={handleChange}
                    className="mt-1 w-4 h-4 text-black border-gray-300 rounded focus:ring-black"
                    required
                    disabled={isLoading}
                  />
                  <label htmlFor="acceptTerms" className="ml-2 text-sm text-gray-700">
                    Acepto los{' '}
                    <Link href="/terms" className="text-black hover:text-gray-700 underline" target="_blank">
                      Términos y Condiciones
                    </Link>{' '}
                    y la{' '}
                    <Link href="/privacy" className="text-black hover:text-gray-700 underline" target="_blank">
                      Política de Privacidad
                    </Link>
                  </label>
                </div>
              </>
            )}

            <div className="flex gap-4">
              {step === 2 && (
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="flex-1 py-3 px-4 bg-white border-2 border-gray-300 text-gray-700 font-medium hover:border-black transition-all"
                  disabled={isLoading}
                >
                  Atrás
                </button>
              )}
              <button
                type="submit"
                disabled={isLoading}
                className="flex-1 py-3 px-4 bg-black text-white font-bold hover:bg-gray-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? 'PROCESANDO...' : step === 1 ? 'CONTINUAR' : 'CREAR CUENTA'}
              </button>
            </div>
          </form>


          {/* Sign In Link */}
          <p className="mt-8 text-center text-gray-600">
            ¿Ya tienes una cuenta?{' '}
            <Link href="/auth/login" className="text-black hover:text-gray-700 font-medium">
              Inicia sesión
            </Link>
          </p>
        </div>
      </div>

      {/* Right Side - Decorative */}
      <div className="hidden lg:flex lg:flex-1 bg-black items-center justify-center relative overflow-hidden">
        {/* Grid Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0 bg-grid-white"></div>
        </div>

        {/* Content */}
        <div className="relative z-10 text-center px-12 max-w-md">
          <div className="mb-8">
            <div className="w-20 h-20 mx-auto flex items-center justify-center">
              <Image
                  src="/logo-white-icon.png"
                  alt="Logo"
                  width={150}
                  height={50}
                  className="h-20 w-auto"
              />
            </div>
          </div>

          <h2 className="text-3xl font-bold text-white mb-6">
            Comienza tu transformación digital
          </h2>
          {/* Benefits */}
          <div className="space-y-3 text-left bg-white/10 border border-white/20 p-6">
            {[
              'Gestión completa de clientes y servicios',
              'Cotizaciones y facturación automatizada',
              'Control de inventario y citas en tiempo real',
              'Reportes y análisis de tu negocio'
            ].map((benefit, index) => (
              <div key={index} className="flex items-center gap-3 text-white">
                <div className="w-1.5 h-1.5 bg-white"></div>
                <span className="text-sm">{benefit}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Decorative Elements */}
        <div className="absolute top-10 right-10 w-32 h-32 bg-white opacity-10 blur-3xl"></div>
        <div className="absolute bottom-10 left-10 w-48 h-48 bg-white opacity-5 blur-3xl"></div>
      </div>
    </div>
  )
}
