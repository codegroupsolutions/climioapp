import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  checkRateLimit,
  getClientIdentifier,
  rateLimitResponse,
  RATE_LIMIT_PRESETS
} from "@/lib/rateLimit";

export async function GET(request) {
  try {
    const clientId = getClientIdentifier(request);
    const rateLimit = checkRateLimit(
      clientId,
      "companies-check-name",
      RATE_LIMIT_PRESETS.public
    );

    if (rateLimit.limited) {
      return rateLimitResponse(rateLimit.resetIn);
    }

    const { searchParams } = new URL(request.url);
    const name = searchParams.get("name")?.trim();

    if (!name) {
      return NextResponse.json(
        { error: "El nombre de la empresa es requerido" },
        { status: 400 }
      );
    }

    const existing = await prisma.company.findFirst({
      where: {
        name: {
          equals: name,
          mode: "insensitive"
        }
      },
      select: { id: true }
    });

    return NextResponse.json({ exists: !!existing });
  } catch (error) {
    console.error("Error checking company name:", error);
    return NextResponse.json(
      { error: "Error al validar el nombre de la empresa" },
      { status: 500 }
    );
  }
}
