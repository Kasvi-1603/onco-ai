/** VIEW 2 (stretch) — Patient Localization Portal. Owner: FE Dev */

type Props = { params: Promise<{ sessionId: string }> };

export default async function PatientPortalPage({ params }: Props) {
  const { sessionId } = await params;

  return (
    <main className="min-h-screen p-8">
      <h1 className="text-xl font-semibold">Your Care Summary</h1>
      <p className="text-sm text-slate-500">Session: {sessionId}</p>
      {/* TODO: locked state or localized cards after approval */}
    </main>
  );
}
