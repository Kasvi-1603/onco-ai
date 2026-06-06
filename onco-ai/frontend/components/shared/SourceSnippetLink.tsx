/** Link to exact OCR source snippet for a field. Owner: FE Dev */

type Props = { field: string; snippet?: string };

export function SourceSnippetLink({ field, snippet }: Props) {
  if (!snippet) return null;
  return (
    <button type="button" className="text-xs text-blue-600 underline" title={snippet}>
      View source — {field}
    </button>
  );
}
