'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import DemoModal from '@/components/DemoModal'
import ContactModal from '@/components/ContactModal'
import FeaturesGrid from '@/components/FeaturesGrid'
import { FaChartLine, FaDollarSign, FaStar, FaChartBar, FaBars, FaTimes } from 'react-icons/fa'

export default function LandingPage() {
  const [isScrolled, setIsScrolled] = useState(false)
  const [showDemoModal, setShowDemoModal] = useState(false)
  const [showContactModal, setShowContactModal] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Close mobile menu when clicking outside or on a link
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [mobileMenuOpen])

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className={`fixed top-0 w-full z-50 transition-all duration-300 ${
        isScrolled ? 'bg-white/95 backdrop-blur-md border-b border-gray-200' : 'bg-white md:bg-transparent'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 sm:py-4">
          <div className="flex justify-between items-center">
            <Link href="/" className="flex-shrink-0">
              <Image
                src="/logo-black.png"
                alt="Logo"
                width={120}
                height={40}
                className="h-7 sm:h-8 w-auto"
              />
            </Link>
            
            {/* Desktop Menu */}
            <div className="hidden md:flex gap-3 lg:gap-4">
              <Link
                href="/auth/login"
                className="px-4 lg:px-6 py-2 text-gray-600 hover:text-black transition-colors font-medium text-sm lg:text-base"
              >
                Iniciar Sesión
              </Link>
              <Link
                href="/auth/register"
                className="px-4 lg:px-6 py-2 bg-black text-white font-semibold hover:bg-gray-800 transition-all duration-300 text-sm lg:text-base rounded"
              >
                Comenzar Gratis
              </Link>
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 text-gray-600 hover:text-black transition-colors z-50 relative"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? (
                <FaTimes className="w-6 h-6" />
              ) : (
                <FaBars className="w-6 h-6" />
              )}
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <>
          {/* Overlay with opacity */}
          <div
            className="fixed inset-0 bg-black/50 z-40 md:hidden transition-opacity duration-300"
            onClick={() => setMobileMenuOpen(false)}
          />
          
          {/* Mobile Menu Drawer - slides from right */}
          <div className={`fixed top-0 right-0 h-full w-80 max-w-[85vw] bg-white z-50 md:hidden transform transition-transform duration-300 ease-in-out ${
            mobileMenuOpen ? 'translate-x-0' : 'translate-x-full'
          } shadow-2xl`}>
            <div className="flex flex-col h-full">
              {/* Header with close button */}
              <div className="flex justify-between items-center p-4 border-b border-gray-200">
                <Image
                  src="/logo-black.png"
                  alt="Logo"
                  width={100}
                  height={33}
                  className="h-7 w-auto"
                />
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-2 text-gray-600 hover:text-black transition-colors"
                  aria-label="Close menu"
                >
                  <FaTimes className="w-6 h-6" />
                </button>
              </div>
              
              {/* Menu Items */}
              <div className="flex flex-col gap-2 p-4 flex-1">
                <Link
                  href="/auth/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="px-4 py-3 text-gray-600 hover:text-black hover:bg-gray-50 transition-colors font-medium rounded"
                >
                  Iniciar Sesión
                </Link>
                <Link
                  href="/auth/register"
                  onClick={() => setMobileMenuOpen(false)}
                  className="px-4 py-3 bg-black text-white font-semibold hover:bg-gray-800 transition-all duration-300 rounded text-center"
                >
                  Comenzar Gratis
                </Link>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Hero Section */}
      <section className="pt-24 sm:pt-28 md:pt-32 pb-12 sm:pb-16 md:pb-20 px-4 sm:px-6 relative">
        <div className="absolute inset-0 bg-grid-pattern opacity-10"></div>
        <div className="max-w-6xl mx-auto text-center relative z-10">
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-black mb-4 sm:mb-6 leading-tight tracking-tight">
            Gestiona tu negocio
            <br />
            <span className="text-gray-600">del futuro</span>
          </h1>
          <p className="text-base sm:text-lg md:text-xl text-gray-600 mb-8 sm:mb-10 max-w-2xl mx-auto leading-relaxed px-2">
            Plataforma CRM inteligente diseñada para empresas de servicios de aire acondicionado y HVAC.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center items-stretch sm:items-center px-4">
            <Link
              href="/auth/register"
              className="px-6 sm:px-8 py-3 sm:py-4 bg-black text-white text-base sm:text-lg font-bold hover:bg-gray-800 transition-all duration-300 transform hover:translate-y-[-2px] rounded"
            >
              Iniciar Prueba Gratuita
            </Link>
            <button
              onClick={() => {
                setShowDemoModal(true)
                setMobileMenuOpen(false)
              }}
              className="px-6 sm:px-8 py-3 sm:py-4 border-2 border-black text-base sm:text-lg font-medium text-black hover:bg-black hover:text-white transition-all duration-300 rounded"
            >
              Solicitar Demostración
            </button>
          </div>
        </div>
      </section>

      {/* Features Grid Component */}
      <FeaturesGrid />

      {/* Stats Section */}
      <section className="py-12 sm:py-16 md:py-20 px-4 sm:px-6 bg-white border-y-2 border-gray-200">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8 text-center">
            {[
              { Icon: FaDollarSign, label: 'Reduce Costos Operativos', desc: 'Automatiza procesos manuales y elimina el paperwork' },
              { Icon: FaChartLine, label: 'Mejora la Rentabilidad', desc: 'Optimiza rutas, inventario y tiempo de técnicos' },
              { Icon: FaStar, label: 'Aumenta la Satisfacción', desc: 'Respuesta rápida y seguimiento automatizado' },
              { Icon: FaChartBar, label: 'Toma Mejores Decisiones', desc: 'Dashboards y reportes en tiempo real' }
            ].map((stat, index) => (
              <div key={index} className="group">
                <div className="mb-4 flex justify-center">
                  <div className="w-14 h-14 sm:w-16 sm:h-16 bg-gray-100 rounded-lg flex items-center justify-center group-hover:bg-black transition-colors">
                    <stat.Icon className="text-xl sm:text-2xl text-gray-600 group-hover:text-white transition-colors" />
                  </div>
                </div>
                <div className="text-base sm:text-lg font-bold text-black mb-1 px-2">{stat.label}</div>
                <div className="text-gray-600 text-xs sm:text-sm px-2">{stat.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-12 sm:py-16 md:py-20 px-4 sm:px-6 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-8 sm:mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-black mb-3 sm:mb-4">¿Cómo Funciona?</h2>
            <p className="text-lg sm:text-xl text-gray-600 px-2">Comienza a transformar tu negocio en 4 simples pasos</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8 sm:gap-6 md:gap-8">
            {[
              {
                step: '1',
                title: 'Regístrate y configura tu empresa',
                description: 'Crea tu cuenta gratis y personaliza tu perfil empresarial en minutos.'
              },
              {
                step: '2',
                title: 'Registra tus clientes',
                description: 'Añade tu base de clientes actual y organiza toda su información.'
              },
              {
                step: '3',
                title: 'Comienza a gestionar servicios',
                description: 'Crea cotizaciones, programa citas y gestiona tus servicios.'
              },
              {
                step: '4',
                title: 'Analiza y crece tu negocio',
                description: 'Obtén insights valiosos y toma decisiones basadas en datos reales.'
              }
            ].map((item, index) => (
              <div key={index} className="relative">
                {/* Connector Line - hidden on mobile and for last item */}
                {index < 3 && (
                  <div className="hidden md:block absolute top-12 left-full w-full h-0.5 bg-gray-300 z-0" style={{ width: 'calc(100% - 3rem)' }}></div>
                )}

                <div className="relative z-10 text-center">
                  {/* Step Number */}
                  <div className="mb-4 flex justify-center">
                    <div className="w-20 h-20 sm:w-24 sm:h-24 bg-black text-white rounded-full flex flex-col items-center justify-center">
                      <span className="text-[10px] sm:text-xs uppercase tracking-wider mb-1">Paso</span>
                      <span className="text-xl sm:text-2xl font-bold">{item.step}</span>
                    </div>
                  </div>

                  {/* Content */}
                  <h3 className="text-base sm:text-lg font-bold text-black mb-2 px-2">{item.title}</h3>
                  <p className="text-gray-600 text-xs sm:text-sm leading-relaxed px-2">{item.description}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="text-center mt-8 sm:mt-12">
            <Link
              href="/auth/register"
              className="inline-block px-6 sm:px-8 py-3 sm:py-4 bg-black text-white text-base sm:text-lg font-bold hover:bg-gray-800 transition-all duration-300 rounded"
            >
              Comenzar Ahora
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 sm:py-12 px-4 sm:px-6 border-t-2 border-gray-200 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6 md:gap-4">
            <div className="text-gray-600 text-center md:text-left text-sm sm:text-base">
              <div className="mb-2 md:mb-0">
                © {new Date().getFullYear()} CLIMIO. Todos los derechos reservados.
              </div>
              <div>
                <Link
                  href="https://otizy.com"
                  className="text-gray-600 hover:text-black transition-colors"
                  target="_blank"
                  rel="noreferrer"
                >
                  Powered by Otizy Technologies
                </Link>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 md:gap-8 items-center text-sm sm:text-base">
              <div className="flex flex-wrap justify-center gap-4 sm:gap-6 md:gap-8">
                <Link href="/privacy" className="text-gray-600 hover:text-black transition-colors whitespace-nowrap">
                  Política de Privacidad
                </Link>
                <Link href="/terms" className="text-gray-600 hover:text-black transition-colors whitespace-nowrap">
                  Términos y Condiciones
                </Link>
                <button
                  onClick={() => {
                    setShowContactModal(true)
                    setMobileMenuOpen(false)
                  }}
                  className="text-gray-600 hover:text-black transition-colors whitespace-nowrap"
                >
                  Contacto
                </button>
              </div>
              <span className="text-gray-400 text-xs sm:text-sm">Versión 0.1.0</span>
            </div>
          </div>
        </div>
      </footer>

      {/* Demo Modal */}
      <DemoModal
        isOpen={showDemoModal}
        onClose={() => setShowDemoModal(false)}
      />

      {/* Contact Modal */}
      <ContactModal
        isOpen={showContactModal}
        onClose={() => setShowContactModal(false)}
      />
    </div>
  )
}
