import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { groupId, toUserId, amount } = await req.json();

  if (!groupId || !toUserId || !amount || amount <= 0) {
    return NextResponse.json({ error: "Invalid data" }, { status: 400 });
  }

  const membership = await prisma.groupMember.findFirst({
    where: { groupId, userId: session.user.id },
  });
  if (!membership) {
    return NextResponse.json({ error: "Not a group member" }, { status: 403 });
  }

  const settlement = await prisma.settlement.create({
    data: {
      groupId,
      fromUserId: session.user.id,
      toUserId,
      amount,
    },
    include: { fromUser: true, toUser: true },
  });

  return NextResponse.json(settlement, { status: 201 });
}
