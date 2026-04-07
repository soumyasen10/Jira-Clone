import { currentUser } from "@clerk/nextjs/server";
import { db } from "@/lib/prisma";

export const checkUser = async () => {
  const user = await currentUser();

  if (!user) {
    return null;
  }

  try {
    const name = `${user.firstName || ""} ${user.lastName || ""}`.trim();

    const loggedInUser = await db.user.upsert({
      where: {
        clerkUserId: user.id,
      },
      update: {
        name,
        imageUrl: user.imageUrl,
        email: user.emailAddresses[0].emailAddress,
      },
      create: {
        clerkUserId: user.id,
        name,
        imageUrl: user.imageUrl,
        email: user.emailAddresses[0].emailAddress,
      },
    });

    return loggedInUser;
  } catch (error) {
    console.log("Error in checkUser (Prisma):", error);
    return null;
  }
};
