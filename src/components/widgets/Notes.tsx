
import { useNotes } from '../../state/selectors';

export default function Notes() {
  const notes = useNotes();

  if (!notes.length) return <p className="muted">Add a note from settings.</p>;

  return (
    <ul className="notes">
      {notes.map((note, idx) => (
        <li key={idx}>{note}</li>
      ))}
    </ul>
  );
}
