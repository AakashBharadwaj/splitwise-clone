import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const expense = await prisma.expense.findFirst({
    where: { id },
    include: {
      group: { include: { members: true } },
    },
  });

  if (!expense) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const isMember = expense.group.members.some((m) => m.userId === session.user.id);
  const isPaidBy = expense.paidById === session.user.id;
  const isAdmin = expense.group.members.find(
    (m) => m.userId === session.user.id
  )?.role === "admin";

  if (!isMember || (!isPaidBy && !isAdmin)) {
    return NextResponse.json({ error: "Not authorized" }, { status: 403 });
  }

  await prisma.expense.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
