export default function NotFound() {
    return (
        <div className="min-h-screen pt-24 bg-supero-dark-grey flex flex-col items-center justify-center">
            <p className="text-[240px] font-black padadose text-supero-green">
                404
            </p>
            <h1 className="text-4xl font-bold text-white">Page Not Found</h1>
            <p className="mt-4 text-lg text-white">
                Sorry, the page you are looking for does not exist.
            </p>

            <a href="/" className="mt-6 text-supero-green underline">
                Go back to Home
            </a>
        </div>
    );
}
