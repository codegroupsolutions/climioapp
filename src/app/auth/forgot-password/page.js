'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { FaArrowLeft, FaEnvelope, FaLock, FaCheckCircle } from 'react-icons/fa'

export default function ForgotPasswordPage() {
  const router = useRouter()
  const [step, setStep] = useState('email') // 'email', 'code', 'password', 'success'
  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  const handleSendCode = async (e) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')
    setMessage('')

    try {
      const response = await fetch('/api/auth/forgot-password/send-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      })

      const data = await response.json()

      if (response.ok) {
        setMessage('Código enviado a tu correo electrónico')
        setStep('code')
      } else {
        setError(data.error || 'Error al enviar el código')
      }
    } catch (error) {
      console.error('Error:', error)
      setError('Error de conexión. Por favor intenta de nuevo.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleVerifyCode = async (e) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    try {
      const response = await fetch('/api/auth/forgot-password/verify-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code })
      })

      const data = await response.json()

      if (response.ok) {
        setStep('password')
      } else {
        setError(data.error || 'Código inválido o expirado')
      }
    } catch (error) {
      console.error('Error:', error)
      setError('Error de conexión. Por favor intenta de nuevo.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleResetPassword = async (e) => {
    e.preventDefault()

    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden')
      return
    }

    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres')
      return
    }

    setIsLoading(true)
    setError('')

    try {
      const response = await fetch('/api/auth/forgot-password/reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code, newPassword: password })
      })

      const data = await response.json()

      if (response.ok) {
        setStep('success')
      } else {
        setError(data.error || 'Error al restablecer la contraseña')
      }
    } catch (error) {
      console.error('Error:', error)
      setError('Error de conexión. Por favor intenta de nuevo.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleResendCode = () => {
    setStep('email')
    setCode('')
    setError('')
    setMessage('')
  }

  return (
    <div className="min-h-screen flex bg-white">
      {/* Left Side - Form */}
      <div className="flex-1 flex flex-col justify-center px-8 py-12 lg:px-16 bg-white">
        <div className="w-full max-w-md mx-auto">
          {/* Logo */}
          <Link href="/" className="inline-block mb-10">
            <Image
              src="/logo-black.png"
              alt="Logo"
              width={150}
              height={50}
              className="h-20 w-auto"
            />
          </Link>

          {/* Progress Indicator */}
          {step !== 'success' && (
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center">
                <div className={`w-10 h-10 flex items-center justify-center font-semibold ${
                  step === 'email' || step === 'code' || step === 'password' ? 'bg-black text-white' : 'bg-gray-300 text-gray-500'
                }`}>
                  1
                </div>
                <div className={`w-20 h-1 ${step === 'code' || step === 'password' ? 'bg-black' : 'bg-gray-300'}`}></div>
              </div>
              <div className="flex items-center">
                <div className={`w-10 h-10 flex items-center justify-center font-semibold ${
                  step === 'code' || step === 'password' ? 'bg-black text-white' : 'bg-gray-300 text-gray-500'
                }`}>
                  2
                </div>
                <div className={`w-20 h-1 ${step === 'password' ? 'bg-black' : 'bg-gray-300'}`}></div>
              </div>
              <div className="flex items-center">
                <div className={`w-10 h-10 flex items-center justify-center font-semibold ${
                  step === 'password' ? 'bg-black text-white' : 'bg-gray-300 text-gray-500'
                }`}>
                  3
                </div>
              </div>
            </div>
          )}

          {/* Header */}
          <div className="mb-10">
            <h1 className="text-3xl font-bold text-black mb-2">
              {step === 'email' && 'Recuperar Contraseña'}
              {step === 'code' && 'Verificar Código'}
              {step === 'password' && 'Nueva Contraseña'}
              {step === 'success' && 'Contraseña Restablecida'}
            </h1>
            <p className="text-gray-600">
              {step === 'email' && 'Ingresa tu correo electrónico para recibir un código de verificación'}
              {step === 'code' && 'Ingresa el código de 6 dígitos enviado a tu correo'}
              {step === 'password' && 'Crea una nueva contraseña segura para tu cuenta'}
              {step === 'success' && 'Tu contraseña ha sido actualizada exitosamente'}
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-600 text-sm">
              {error}
            </div>
          )}

          {/* Success Message */}
          {message && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 text-green-600 text-sm">
              {message}
            </div>
          )}

          {/* Forms */}
          {step === 'email' && (
            <form onSubmit={handleSendCode} className="space-y-6">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                  Correo Electrónico
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <FaEnvelope className="text-gray-400" />
                  </div>
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-11 pr-4 py-3 bg-white border-2 border-gray-300 text-black focus:outline-none focus:border-black transition-all"
                    placeholder="tu@empresa.com"
                    required
                    disabled={isLoading}
                    autoFocus
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 px-4 bg-black text-white font-bold hover:bg-gray-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? 'ENVIANDO...' : 'ENVIAR CÓDIGO'}
              </button>

              <Link
                href="/auth/login"
                className="flex items-center justify-center gap-2 text-gray-600 hover:text-black transition-colors"
              >
                <FaArrowLeft className="text-sm" />
                Volver al inicio de sesión
              </Link>
            </form>
          )}

          {step === 'code' && (
            <form onSubmit={handleVerifyCode} className="space-y-6">
              <div>
                <label htmlFor="code" className="block text-sm font-medium text-gray-700 mb-2">
                  Código de Verificación
                </label>
                <p className="text-sm text-gray-600 mb-3">
                  Enviado a: <span className="font-medium text-black">{email}</span>
                </p>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <FaLock className="text-gray-400" />
                  </div>
                  <input
                    id="code"
                    type="text"
                    value={code}
                    onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    className="w-full pl-11 pr-4 py-3 bg-white border-2 border-gray-300 text-black focus:outline-none focus:border-black transition-all text-center text-2xl font-bold tracking-widest"
                    placeholder="000000"
                    maxLength="6"
                    required
                    disabled={isLoading}
                    autoFocus
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading || code.length !== 6}
                className="w-full py-3 px-4 bg-black text-white font-bold hover:bg-gray-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? 'VERIFICANDO...' : 'VERIFICAR CÓDIGO'}
              </button>

              <button
                type="button"
                onClick={handleResendCode}
                className="w-full py-2 text-gray-600 hover:text-black text-sm transition-colors"
                disabled={isLoading}
              >
                ¿No recibiste el código? Reenviar
              </button>
            </form>
          )}

          {step === 'password' && (
            <form onSubmit={handleResetPassword} className="space-y-6">
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                  Nueva Contraseña
                </label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 bg-white border-2 border-gray-300 text-black focus:outline-none focus:border-black transition-all"
                  placeholder="Mínimo 6 caracteres"
                  required
                  disabled={isLoading}
                  autoFocus
                />
              </div>

              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                  Confirmar Nueva Contraseña
                </label>
                <input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-4 py-3 bg-white border-2 border-gray-300 text-black focus:outline-none focus:border-black transition-all"
                  placeholder="Repite tu contraseña"
                  required
                  disabled={isLoading}
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 px-4 bg-black text-white font-bold hover:bg-gray-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? 'RESTABLECIENDO...' : 'RESTABLECER CONTRASEÑA'}
              </button>
            </form>
          )}

          {step === 'success' && (
            <div className="text-center space-y-6">
              <div className="flex justify-center">
                <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center">
                  <FaCheckCircle className="text-5xl text-green-600" />
                </div>
              </div>

              <p className="text-gray-600">
                Tu contraseña ha sido restablecida exitosamente. Ya puedes iniciar sesión con tu nueva contraseña.
              </p>

              <Link
                href="/auth/login"
                className="block w-full py-3 px-4 bg-black text-white font-bold hover:bg-gray-800 transition-all text-center"
              >
                INICIAR SESIÓN
              </Link>
            </div>
          )}
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
            Recupera el acceso a tu cuenta
          </h2>

          <p className="text-gray-300 mb-8">
            Sigue los pasos para restablecer tu contraseña de forma segura
          </p>

          {/* Security Features */}
          <div className="space-y-3 text-left bg-white/10 border border-white/20 p-6">
            {[
              'Código de verificación por correo',
              'Proceso seguro en 3 pasos',
              'Validación en tiempo real',
              'Acceso inmediato tras recuperación'
            ].map((feature, index) => (
              <div key={index} className="flex items-center gap-3 text-white">
                <div className="w-1.5 h-1.5 bg-white"></div>
                <span className="text-sm">{feature}</span>
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
