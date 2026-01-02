"use client";

import { useState } from "react";

export default function CompanyStep({ formData, updateFormData, onNext }) {
  const [errors, setErrors] = useState({});

  const validate = () => {
    const newErrors = {};

    if (!formData.companyName) {
      newErrors.companyName = "El nombre de la empresa es requerido";
    }

    if (!formData.companyEmail) {
      newErrors.companyEmail = "El correo electrónico es requerido";
    } else if (!/\S+@\S+\.\S+/.test(formData.companyEmail)) {
      newErrors.companyEmail = "Correo electrónico inválido";
    }

    if (formData.companyPhone && !/^[0-9+\-\s()]+$/.test(formData.companyPhone)) {
      newErrors.companyPhone = "Número de teléfono inválido";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validate()) {
      onNext();
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    updateFormData({ [name]: value });
    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: "" }));
    }
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-foreground mb-1">
            Nombre de la Empresa *
          </label>
          <input
            type="text"
            name="companyName"
            value={formData.companyName}
            onChange={handleChange}
            className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary
              ${errors.companyName ? "border-error" : "border-border"}`}
            placeholder="Aire Acondicionado ABC S.A."
          />
          {errors.companyName && (
            <p className="text-error text-sm mt-1">{errors.companyName}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground mb-1">
            Correo Electrónico *
          </label>
          <input
            type="email"
            name="companyEmail"
            value={formData.companyEmail}
            onChange={handleChange}
            className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary
              ${errors.companyEmail ? "border-error" : "border-border"}`}
            placeholder="empresa@ejemplo.com"
          />
          {errors.companyEmail && (
            <p className="text-error text-sm mt-1">{errors.companyEmail}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground mb-1">
            Teléfono
          </label>
          <input
            type="tel"
            name="companyPhone"
            value={formData.companyPhone}
            onChange={handleChange}
            className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary
              ${errors.companyPhone ? "border-error" : "border-border"}`}
            placeholder="+52 123 456 7890"
          />
          {errors.companyPhone && (
            <p className="text-error text-sm mt-1">{errors.companyPhone}</p>
          )}
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-foreground mb-1">
            Dirección
          </label>
          <input
            type="text"
            name="companyAddress"
            value={formData.companyAddress}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            placeholder="Calle Principal 123"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground mb-1">
            Ciudad
          </label>
          <input
            type="text"
            name="companyCity"
            value={formData.companyCity}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            placeholder="Ciudad de México"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground mb-1">
            Estado
          </label>
          <input
            type="text"
            name="companyState"
            value={formData.companyState}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            placeholder="CDMX"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground mb-1">
            Código Postal
          </label>
          <input
            type="text"
            name="companyZipCode"
            value={formData.companyZipCode}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            placeholder="12345"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground mb-1">
            RFC / ID Fiscal
          </label>
          <input
            type="text"
            name="companyTaxId"
            value={formData.companyTaxId}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            placeholder="ABC123456789"
          />
        </div>
      </div>

      <div className="flex justify-end mt-6">
        <button
          type="button"
          onClick={handleNext}
          className="btn btn-primary"
        >
          Siguiente
        </button>
      </div>
    </div>
  );
}