export default function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
    return (
        <div className="container mx-auto max-w-5xl py-6 px-4 md:px-6">
            {children}
        </div>
    );
}