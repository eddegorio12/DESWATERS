import { NextResponse } from "next/server";

import { getModuleAccess } from "@/features/auth/lib/authorization";
import { readStoredFieldProof } from "@/features/exceptions/lib/field-proof-storage";
import { prisma } from "@/lib/prisma";

type RouteContext = {
  params: Promise<{
    proofId: string;
  }>;
};

export async function GET(request: Request, context: RouteContext) {
  const access = await getModuleAccess("exceptions");

  if (access.status === "signed_out") {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  if (access.status !== "authorized") {
    return NextResponse.json({ error: "Not authorized." }, { status: 403 });
  }

  const { proofId } = await context.params;
  const proof = await prisma.fieldWorkProof.findUnique({
    where: {
      id: proofId,
    },
    select: {
      originalFilename: true,
      storagePath: true,
      contentType: true,
    },
  });

  if (!proof) {
    return NextResponse.json({ error: "Field-proof file not found." }, { status: 404 });
  }

  try {
    const fileBuffer = await readStoredFieldProof(proof.storagePath);
    const url = new URL(request.url);
    const disposition = url.searchParams.get("download") === "1" ? "attachment" : "inline";
    const encodedFilename = encodeURIComponent(proof.originalFilename);

    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        "Content-Type": proof.contentType,
        "Content-Disposition": `${disposition}; filename*=UTF-8''${encodedFilename}`,
        "Cache-Control": "private, no-store",
      },
    });
  } catch {
    return NextResponse.json(
      { error: "The stored field-proof file is no longer available." },
      { status: 404 }
    );
  }
}
