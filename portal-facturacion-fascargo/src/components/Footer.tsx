export default function Footer() {
  return (
    <footer className="bg-white text-center py-4 border-top mt-5">
      <small className="text-muted">
        © {new Date().getFullYear()} <strong>FasCargo Chile</strong>. Todos los derechos reservados.
      </small>
    </footer>
  );
}
