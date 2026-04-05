export default function Footer() {
  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <footer className="mt-auto bg-black px-4 py-4 text-center text-sm text-white sm:px-6">
      {today}
    </footer>
  );
}
