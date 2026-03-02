import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const group = await prisma.group.findFirst({
    where: {
      id,
      members: { some: { userId: session.user.id } },
    },
    include: {
      members: { include: { user: true } },
      expenses: {
        include: {
          paidBy: true,
          splits: { include: { user: true } },
        },
        orderBy: { createdAt: "desc" },
      },
      settlements: {
        include: { fromUser: true, toUser: true },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!group) {
    return NextResponse.json({ error: "Group not found" }, { status: 404 });
  }

  return NextResponse.json(group);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const group = await prisma.group.findFirst({
    where: { id, createdById: session.user.id },
  });

  if (!group) {
    return NextResponse.json({ error: "Not found or not authorized" }, { status: 404 });
  }

  await prisma.group.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
