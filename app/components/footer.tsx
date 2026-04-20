import Link from 'next/link';

export default function Footer() {
    return (
        <footer className="border-t border-gray-200 bg-gray-50 py-8">
            <div className="mx-auto max-w-4xl px-4">
                <div className="flex justify-center gap-8">
                    <Link
                        href="https://github.com/RyanTF313"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-gray-600 hover:text-gray-900 transition-colors"
                    >
                        GitHub
                    </Link>
                    <Link
                        href="https://www.detlien.dev"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-gray-600 hover:text-gray-900 transition-colors"
                    >
                        Portfolio
                    </Link>
                    <Link
                        href="https://www.linkedin.com/in/ryantf/"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-gray-600 hover:text-gray-900 transition-colors"
                    >
                        LinkedIn
                    </Link>
                </div>
                <p className="text-center text-sm text-gray-500 mt-4">
                    © 2026. All rights reserved.
                </p>
            </div>
        </footer>
    );
}