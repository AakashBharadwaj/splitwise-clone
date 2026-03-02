import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: groupId } = await params;
  const { description, amount, paidById, splitType, splits } = await req.json();

  if (!description?.trim()) {
    return NextResponse.json({ error: "Description is required" }, { status: 400 });
  }
  if (!amount || amount <= 0) {
    return NextResponse.json({ error: "Valid amount is required" }, { status: 400 });
  }

  // Verify requester is in the group
  const membership = await prisma.groupMember.findFirst({
    where: { groupId, userId: session.user.id },
  });
  if (!membership) {
    return NextResponse.json({ error: "Not a group member" }, { status: 403 });
  }

  // Get group members
  const groupMembers = await prisma.groupMember.findMany({
    where: { groupId },
    include: { user: true },
  });

  let splitData: { userId: string; amount: number }[] = [];

  if (splitType === "equal") {
    const perPerson = amount / groupMembers.length;
    splitData = groupMembers.map((m) => ({
      userId: m.userId,
      amount: Math.round(perPerson * 100) / 100,
    }));
  } else if (splitType === "exact" || splitType === "percentage") {
    if (!splits || !Array.isArray(splits)) {
      return NextResponse.json({ error: "Splits data required" }, { status: 400 });
    }
    if (splitType === "percentage") {
      splitData = splits.map((s: { userId: string; value: number }) => ({
        userId: s.userId,
        amount: Math.round((s.value / 100) * amount * 100) / 100,
      }));
    } else {
      splitData = splits.map((s: { userId: string; value: number }) => ({
        userId: s.userId,
        amount: Math.round(s.value * 100) / 100,
      }));
    }
  }

  const expense = await prisma.expense.create({
    data: {
      groupId,
      description: description.trim(),
      amount,
      paidById: paidById || session.user.id,
      splitType,
      splits: {
        create: splitData,
      },
    },
    include: {
      paidBy: true,
      splits: { include: { user: true } },
    },
  });

  return NextResponse.json(expense, { status: 201 });
}
