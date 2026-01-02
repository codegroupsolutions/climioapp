"use client";

export default function ConfirmationStep({ formData, onPrev, onSubmit, loading }) {
  return (
    <div className="space-y-6">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-foreground">
          Confirmar Información
        </h3>
        <p className="text-sm text-foreground-secondary">
          Por favor revise la información antes de completar el registro
        </p>
      </div>

      <div className="space-y-4">
        {/* Company Information */}
        <div className="bg-background-secondary p-4 rounded-lg">
          <h4 className="font-semibold text-foreground mb-3">
            Información de la Empresa
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
            <div>
              <span className="text-foreground-secondary">Nombre:</span>
              <p className="text-foreground font-medium">{formData.companyName}</p>
            </div>
            <div>
              <span className="text-foreground-secondary">Email:</span>
              <p className="text-foreground font-medium">{formData.companyEmail}</p>
            </div>
            {formData.companyPhone && (
              <div>
                <span className="text-foreground-secondary">Teléfono:</span>
                <p className="text-foreground font-medium">{formData.companyPhone}</p>
              </div>
            )}
            {formData.companyAddress && (
              <div>
                <span className="text-foreground-secondary">Dirección:</span>
                <p className="text-foreground font-medium">{formData.companyAddress}</p>
              </div>
            )}
            {formData.companyCity && (
              <div>
                <span className="text-foreground-secondary">Ciudad:</span>
                <p className="text-foreground font-medium">{formData.companyCity}</p>
              </div>
            )}
            {formData.companyState && (
              <div>
                <span className="text-foreground-secondary">Estado:</span>
                <p className="text-foreground font-medium">{formData.companyState}</p>
              </div>
            )}
            {formData.companyZipCode && (
              <div>
                <span className="text-foreground-secondary">Código Postal:</span>
                <p className="text-foreground font-medium">{formData.companyZipCode}</p>
              </div>
            )}
            {formData.companyTaxId && (
              <div>
                <span className="text-foreground-secondary">RFC/ID Fiscal:</span>
                <p className="text-foreground font-medium">{formData.companyTaxId}</p>
              </div>
            )}
          </div>
        </div>

        {/* Admin User Information */}
        <div className="bg-background-secondary p-4 rounded-lg">
          <h4 className="font-semibold text-foreground mb-3">
            Usuario Administrador
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
            <div>
              <span className="text-foreground-secondary">Nombre:</span>
              <p className="text-foreground font-medium">
                {formData.firstName} {formData.lastName}
              </p>
            </div>
            <div>
              <span className="text-foreground-secondary">Email:</span>
              <p className="text-foreground font-medium">{formData.email}</p>
            </div>
            {formData.phone && (
              <div>
                <span className="text-foreground-secondary">Teléfono:</span>
                <p className="text-foreground font-medium">{formData.phone}</p>
              </div>
            )}
            <div>
              <span className="text-foreground-secondary">Rol:</span>
              <p className="text-foreground font-medium">Administrador</p>
            </div>
          </div>
        </div>
      </div>

      {/* Terms and Conditions */}
      <div className="bg-info/10 border border-info/20 rounded-lg p-4">
        <p className="text-sm text-foreground">
          Al completar el registro, usted acepta nuestros términos de servicio y política de privacidad.
          Se creará una cuenta de administrador con acceso completo a la plataforma.
        </p>
      </div>

      <div className="flex justify-between mt-6">
        <button
          type="button"
          onClick={onPrev}
          disabled={loading}
          className="btn bg-background-tertiary text-foreground hover:bg-border disabled:opacity-50"
        >
          Anterior
        </button>
        <button
          type="button"
          onClick={onSubmit}
          disabled={loading}
          className="btn btn-primary disabled:opacity-50"
        >
          {loading ? "Registrando..." : "Completar Registro"}
        </button>
      </div>
    </div>
  );
}