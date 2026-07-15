'use client';
import { SubmitEvent, useState } from 'react';

export default function ContactPage() {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [message, setMessage] = useState('');

    const handleSubmit = async (e: SubmitEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsSubmitting(true);
        setMessage('');

        try {
            const formData = new FormData(e.currentTarget);
            const response = await fetch('/api/contact', {
                method: 'POST',
                body: formData,
            });

            if (response.ok) {
                setMessage('Thank you for your message!');
                e.currentTarget.reset();
            } else {
                setMessage('Something went wrong. Please try again.');
            }
        } catch {
            setMessage('Error submitting form.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="max-w-md mx-auto p-6">
            <h1 className="text-2xl font-bold mb-6">Contact Us</h1>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block text-sm font-medium mb-1">Name</label>
                    <input
                        type="text"
                        name="name"
                        required
                        className="w-full border rounded px-3 py-2"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium mb-1">Email</label>
                    <input
                        type="email"
                        name="email"
                        required
                        className="w-full border rounded px-3 py-2"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium mb-1">Message</label>
                    <textarea
                        name="message"
                        rows={5}
                        required
                        className="w-full border rounded px-3 py-2"
                    />
                </div>
                <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 disabled:opacity-50"
                >
                    {isSubmitting ? 'Sending...' : 'Send'}
                </button>
            </form>
            {message && <p className="mt-4 text-center text-sm">{message}</p>}
        </div>
    );
}