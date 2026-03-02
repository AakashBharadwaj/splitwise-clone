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
  const { email } = await req.json();

  if (!email?.trim()) {
    return NextResponse.json({ error: "Email is required" }, { status: 400 });
  }

  // Verify requester is in the group
  const membership = await prisma.groupMember.findFirst({
    where: { groupId, userId: session.user.id },
  });
  if (!membership) {
    return NextResponse.json({ error: "Not a group member" }, { status: 403 });
  }

  // Find the user to add
  const userToAdd = await prisma.user.findUnique({
    where: { email: email.trim().toLowerCase() },
  });
  if (!userToAdd) {
    return NextResponse.json(
      { error: "No user found with that email. They must sign in first." },
      { status: 404 }
    );
  }

  // Check if already a member
  const existing = await prisma.groupMember.findUnique({
    where: { groupId_userId: { groupId, userId: userToAdd.id } },
  });
  if (existing) {
    return NextResponse.json({ error: "Already a member" }, { status: 409 });
  }

  const member = await prisma.groupMember.create({
    data: { groupId, userId: userToAdd.id },
    include: { user: true },
  });

  return NextResponse.json(member, { status: 201 });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: groupId } = await params;
  const { userId } = await req.json();

  // Only admins or the user themselves can remove
  const membership = await prisma.groupMember.findFirst({
    where: { groupId, userId: session.user.id },
  });
  if (!membership || (membership.role !== "admin" && session.user.id !== userId)) {
    return NextResponse.json({ error: "Not authorized" }, { status: 403 });
  }

  await prisma.groupMember.deleteMany({ where: { groupId, userId } });
  return NextResponse.json({ success: true });
}
