import Link from 'next/link';

export default function Header() {
    return (
        <header className="bg-white shadow">
            <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-16">
                    <div className="shrink-0">
                        <Link href="/" className="text-2xl font-bold text-blue-600">
                            GitThePoint
                        </Link>
                    </div>
                    <div className="flex space-x-4">
                        <Link href="/" className="text-gray-700 hover:text-blue-600">
                            Home
                        </Link>
                        <Link href="/about" className="text-gray-700 hover:text-blue-600">
                            About
                        </Link>
                        <Link href="/contact" className="text-gray-700 hover:text-blue-600">
                            Contact
                        </Link>
                    </div>
                </div>
            </nav>
        </header>
    );
}