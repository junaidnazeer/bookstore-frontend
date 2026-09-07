import Link from "next/link";

export default function Navbar() {
  return (
    <nav className="border-b border-neutral-200 px-6 py-4 flex items-center justify-between">
      <Link href="/" className="text-lg font-semibold text-neutral-900">
        Bookstore
      </Link>
      <div className="flex gap-6 text-sm text-neutral-600">
        <Link href="/books">Browse</Link>
        <Link href="/cart">Cart</Link>
        <Link href="/login">Login</Link>
      </div>
    </nav>
  );
}
