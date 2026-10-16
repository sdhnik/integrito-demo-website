type Props = {
  title: string;
  support: string;
  secondary?: string;
  note?: string;
};

export default function ClassicHero({ title, support, secondary, note }: Props) {
  return (
    <header className="classic-hero">
      <h1 className="classic-h1">{title}</h1>
      <p className="classic-lede">{support}</p>
      {secondary && <p className="classic-lede-secondary">{secondary}</p>}
      {note && (
        <p className="classic-hero-note" role="note">
          {note}
        </p>
      )}
    </header>
  );
}
