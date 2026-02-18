import {NextResponse} from "next/server";
import {prisma} from "@/lib/prisma";
import {getCurrentUser} from "@/utils/auth";
import dayjs from "dayjs";

export async function GET(request) {
    try {
        const user = await getCurrentUser();

        if (!user) {
            return NextResponse.json(
                {error: "No autorizado"},
                {status: 401}
            );
        }

        const {searchParams} = new URL(request.url);
        const startDate = searchParams.get("startDate");
        const endDate = searchParams.get("endDate");

        const companyId = user.companyId;

        // Parse dates using dayjs (without considering hours)
        const start = startDate ? dayjs(startDate).startOf("day").toDate() : dayjs().startOf("year").toDate();
        const end = endDate ? dayjs(endDate).endOf("day").toDate() : dayjs().endOf("day").toDate();

        // Get company info (taxRate, taxId)
        const company = await prisma.company.findUnique({
            where: {id: companyId},
            select: {
                name: true,
                taxId: true,
                taxRate: true
            }
        });

        // Find paid invoices within the date range
        const paidInvoices = await prisma.invoice.findMany({
            where: {
                companyId,
                status: "PAID",
                date: {
                    gte: start,
                    lte: end
                }
            },
            include: {
                client: {
                    select: {
                        firstName: true,
                        lastName: true,
                        companyName: true
                    }
                }
            },
            orderBy: {
                date: "asc"
            }
        });

        const invoices = paidInvoices.map((inv) => ({
            id: inv.id,
            number: inv.number,
            client: inv.client.companyName || `${inv.client.firstName} ${inv.client.lastName}`,
            date: inv.date,
            subtotal: inv.subtotal,
            discount: inv.discount,
            tax: inv.tax,
            total: inv.total
        }));

        // Calculate summary
        const totalSubtotal = invoices.reduce((sum, inv) => sum + inv.subtotal, 0);
        const totalDiscount = invoices.reduce((sum, inv) => sum + inv.discount, 0);
        const totalTax = invoices.reduce((sum, inv) => sum + inv.tax, 0);
        const totalAmount = invoices.reduce((sum, inv) => sum + inv.total, 0);

        const report = {
            period: {
                start: dayjs(start).format("YYYY-MM-DD"),
                end: dayjs(end).format("YYYY-MM-DD")
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
            {error: "Error al generar reporte de IVU"},
            {status: 500}
        );
    }
}
