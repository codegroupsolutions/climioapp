import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const path = req.nextUrl.pathname;
    const startTime = Date.now();

    // Check for admin routes
    if (path.startsWith("/dashboard/admin")) {
      if (!token || (token.role !== "ADMIN" && token.role !== "SUPER_ADMIN")) {
        return NextResponse.redirect(new URL("/dashboard", req.url));
      }
    }

    // Check for technician-specific routes
    if (path.startsWith("/dashboard/technician")) {
      if (!token || token.role !== "TECHNICIAN") {
        return NextResponse.redirect(new URL("/dashboard", req.url));
      }
    }

    const response = NextResponse.next();

    // Agregar headers de contexto para telemetría (solo en producción)
    if (process.env.NODE_ENV === 'production' && path.startsWith('/api/')) {
      response.headers.set('x-request-start', startTime.toString());
      response.headers.set('x-user-id', token?.id || 'anonymous');
      response.headers.set('x-company-id', token?.companyId || 'unknown');
      response.headers.set('x-user-role', token?.role || 'unknown');
    }

    return response;
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
  }
);

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/api/companies/((?!register|check-name).*)", // Exclude public endpoints
    "/api/clients/:path*",
    "/api/products/:path*",
    "/api/quotes/:path*",
    "/api/invoices/:path*",
    "/api/appointments/:path*",
    "/api/users/:path*",
    "/api/categories/:path*",
    "/api/distributions/:path*",
    "/api/pending-tasks/:path*",
    "/api/service-contracts/:path*",
    "/api/inventory/:path*",
    "/api/reports/:path*",
    "/api/upload/:path*",
    "/api/export/:path*",
    "/api/settings/:path*",
    "/api/dashboard/:path*",
  ],
};
