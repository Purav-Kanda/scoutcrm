import { NextRequest, NextResponse } from "next/server";
import { createLead, listLeads } from "@/lib/data";
import { getToken } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const leads = await listLeads(getToken(req));
  return NextResponse.json(leads);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  if (!body.company_name || !body.contact_name) {
    return NextResponse.json(
      { error: "company_name and contact_name are required" },
      { status: 400 }
    );
  }
  const lead = await createLead(
    {
      company_name: body.company_name,
      website: body.website ?? null,
      contact_name: body.contact_name,
      contact_title: body.contact_title ?? null,
      contact_email: body.contact_email ?? null,
      notes: body.notes ?? null,
    },
    getToken(req)
  );
  return NextResponse.json(lead, { status: 201 });
}
