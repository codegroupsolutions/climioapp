import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/utils/auth";

export async function GET(request) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { error: "No autorizado" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    const companyId = user.companyId;

    // Parse dates
    const start = startDate ? new Date(startDate) : new Date(new Date().getFullYear(), 0, 1);
    const end = endDate ? new Date(endDate) : new Date();
    end.setHours(23, 59, 59, 999);

    // Get company info (taxRate, taxId)
    const company = await prisma.company.findUnique({
      where: { id: companyId },
      select: {
        name: true,
        taxId: true,
        taxRate: true
      }
    });

    // Find payments within the date range whose invoice is PAID
    const payments = await prisma.payment.findMany({
      where: {
        invoice: {
          companyId,
          status: "PAID"
        },
        paidAt: {
          gte: start,
          lte: end
        }
      },
      include: {
        invoice: {
          include: {
            client: {
              select: {
                firstName: true,
                lastName: true,
                companyName: true
              }
            }
          }
        }
      },
      orderBy: {
        paidAt: "asc"
      }
    });

    // Deduplicate invoices (one invoice can have multiple payments)
    const invoiceMap = new Map();
    payments.forEach((payment) => {
      const inv = payment.invoice;
      if (!invoiceMap.has(inv.id)) {
        invoiceMap.set(inv.id, {
          id: inv.id,
          number: inv.number,
          client: inv.client.companyName || `${inv.client.firstName} ${inv.client.lastName}`,
          date: inv.date,
          paidAt: payment.paidAt,
          subtotal: inv.subtotal,
          discount: inv.discount,
          tax: inv.tax,
          total: inv.total
        });
      }
    });

    const invoices = Array.from(invoiceMap.values());

    // Calculate summary
    const totalSubtotal = invoices.reduce((sum, inv) => sum + inv.subtotal, 0);
    const totalDiscount = invoices.reduce((sum, inv) => sum + inv.discount, 0);
    const totalTax = invoices.reduce((sum, inv) => sum + inv.tax, 0);
    const totalAmount = invoices.reduce((sum, inv) => sum + inv.total, 0);

    const report = {
      period: {
        start: start.toISOString(),
        end: end.toISOString()
      },
      company: {
        name: company?.name || "",
        taxId: company?.taxId || "",
        taxRate: company?.taxRate || 11.5
      },
      summary: {
        totalSubtotal,
        totalDiscount,
        totalTax,
        totalAmount,
        invoiceCount: invoices.length
      },
      invoices
    };

    return NextResponse.json(report);
  } catch (error) {
    console.error("Error generating IVU report:", error);
    return NextResponse.json(
      { error: "Error al generar reporte de IVU" },
      { status: 500 }
    );
  }
}
