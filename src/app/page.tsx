import { redirect } from "next/navigation";
import { auth } from "@/auth";

export default async function Home() {
  const session = await auth();

  if (!session?.user) redirect("/login");

  switch (session.user.role) {
    case "ADMIN":
      redirect("/admin");
    case "AGENT":
      redirect("/agent");
    case "CLIENT":
      redirect("/client");
    default:
      redirect("/login");
  }
}
