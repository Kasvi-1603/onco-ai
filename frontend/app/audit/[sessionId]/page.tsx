import AuditClient from "./AuditClient";

type Props = { params: Promise<{ sessionId: string }> };

export default async function AuditPage({ params }: Props) {
  const { sessionId } = await params;
  return <AuditClient sessionId={sessionId} />;
}
