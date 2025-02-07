import { Github } from 'lucide-react';

export function Footer() {
    return (
        <footer className="bg-white shadow-md mt-auto">
            <div className="w-full min-w-[1280px] max-w-[1920px] mx-auto px-4 py-4">
                <div className="flex flex-col items-center justify-center text-center">
                    <div className="text-sm text-gray-500 mb-2">
                        © 2025 MySQL Query Monitor. All rights reserved.
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-500">Created by TeiNam</span>
                        <a
                            href="https://github.com/TeiNam"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-gray-400 hover:text-gray-600 transition-colors"
                        >
                            <Github className="w-4 h-4" />
                        </a>
                    </div>
                </div>
            </div>
        </footer>
    );
}