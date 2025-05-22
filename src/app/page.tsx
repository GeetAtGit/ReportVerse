import Link from "next/link";
import { Suspense } from "react";
import Image from "next/image";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col">
      {/* Header */}
      <header className="bg-white border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center space-x-2">
            <h1 className="text-2xl font-bold text-primary">ReportVerse</h1>
          </Link>
          <div className="flex items-center space-x-4">
            <Link
              href="/login"
              className="px-4 py-2 rounded-md text-primary border border-primary hover:bg-primary/10"
            >
              Log in
            </Link>
            <Link
              href="/register"
              className="px-4 py-2 rounded-md bg-primary text-white hover:bg-primary/90"
            >
              Register
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="flex-1 bg-gradient-to-b from-white to-blue-50">
        <div className="container mx-auto px-4 py-16 md:py-24 flex flex-col items-center text-center">
          <div className="max-w-3xl">
            <h2 className="text-4xl md:text-5xl font-bold mb-4 text-gray-900">
              Connect, Report, and Grow Together
            </h2>
            <p className="text-lg md:text-xl text-gray-700 mb-8">
              ReportVerse provides a seamless platform for mentors and mentees
              to collaborate, track progress, and achieve academic excellence.
            </p>
            <div className="flex space-x-4 justify-center">
              <Link
                href="/register/mentor"
                className="px-6 py-3 rounded-md bg-primary text-white hover:bg-primary/90"
              >
                Join as Mentor
              </Link>
              <Link
                href="/login"
                className="px-6 py-3 rounded-md border border-primary text-primary hover:bg-primary/10"
              >
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">
            Why Choose ReportVerse?
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div
                key={index}
                className="p-6 border rounded-lg hover:shadow-md transition-shadow"
              >
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                  <span className="text-primary text-2xl">{feature.icon}</span>
                </div>
                <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                <p className="text-gray-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-8">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="mb-4 md:mb-0">
              <h2 className="text-2xl font-bold">ReportVerse</h2>
              <p className="text-gray-400">Connect, Report, Grow</p>
            </div>
            <div className="flex flex-col md:flex-row space-y-4 md:space-y-0 md:space-x-6">
              <Link href="/about" className="hover:text-primary">
                About
              </Link>
              <Link href="/privacy" className="hover:text-primary">
                Privacy
              </Link>
              <Link href="/terms" className="hover:text-primary">
                Terms
              </Link>
              <Link href="/contact" className="hover:text-primary">
                Contact
              </Link>
            </div>
          </div>
          <div className="mt-8 pt-4 border-t border-gray-800 text-center text-gray-400">
            <p>
              &copy; {new Date().getFullYear()} ReportVerse. All rights
              reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

const features = [
  {
    icon: "📊",
    title: "Progress Tracking",
    description:
      "Visualize academic progress and achievements with intuitive dashboards and reports.",
  },
  {
    icon: "💬",
    title: "Easy Communication",
    description:
      "Streamlined communication between mentors and mentees through a centralized platform.",
  },
  {
    icon: "🚀",
    title: "Goal Setting",
    description:
      "Set and track educational goals, with regular check-ins and milestone celebrations.",
  },
  {
    icon: "📝",
    title: "Issue Reporting",
    description:
      "Report and resolve academic issues with an organized tracking system.",
  },
  {
    icon: "🏆",
    title: "Achievement Showcase",
    description:
      "Showcase and celebrate academic and extracurricular achievements.",
  },
  {
    icon: "📱",
    title: "Accessible Anywhere",
    description:
      "Access your reports and communications from any device, anywhere, anytime.",
  },
];
