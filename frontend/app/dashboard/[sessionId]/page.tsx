import DashboardClient from "@/components/view1/DashboardClient";

type Props = { params: Promise<{ sessionId: string }> };

export default async function DashboardPage({ params }: Props) {
  const { sessionId } = await params;
  return <DashboardClient sessionId={sessionId} />;
}
