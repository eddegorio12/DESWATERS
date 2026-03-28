import { NextResponse } from "next/server";

import { getModuleAccess } from "@/features/auth/lib/authorization";
import {
  createRecoveryExportCsv,
  getRecoveryExportData,
} from "@/features/system-readiness/lib/recovery-export";

export async function GET(request: Request) {
  const access = await getModuleAccess("systemReadiness");

  if (access.status === "signed_out") {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  if (access.status !== "authorized") {
    return NextResponse.json({ error: "Not authorized." }, { status: 403 });
  }

  const url = new URL(request.url);
  const format = url.searchParams.get("format") === "json" ? "json" : "csv";
  const data = await getRecoveryExportData();
  const stamp = data.exportedAt.toISOString().slice(0, 10);

  if (format === "json") {
    return new NextResponse(JSON.stringify(data, null, 2), {
      status: 200,
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Content-Disposition": `attachment; filename="dwds-recovery-export-${stamp}.json"`,
      },
    });
  }

  return new NextResponse(createRecoveryExportCsv(data), {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="dwds-recovery-export-${stamp}.csv"`,
    },
  });
}
