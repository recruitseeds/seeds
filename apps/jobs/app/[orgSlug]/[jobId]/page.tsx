import { MapPin, Clock, DollarSign, Users, ArrowLeft } from "lucide-react";
import Link from "next/link";

interface JobPageProps {
  params: Promise<{
    orgSlug: string;
    jobId: string;
  }>;
}

// Mock data - will be replaced with API calls
const mockJob = {
  id: "1",
  title: "Senior Frontend Developer",
  company: "TechCorp",
  department: "Engineering",
  location: "San Francisco, CA",
  type: "Full-time",
  salary: "$120k - $180k",
  postedDate: "2 days ago",
  description: `We're looking for a senior frontend developer to join our growing engineering team. You'll be working on our core platform that serves millions of users worldwide.

## What you'll do
- Build and maintain our React-based frontend applications
- Collaborate with designers and backend engineers
- Optimize performance and user experience
- Mentor junior developers

## Requirements
- 5+ years of experience with React and TypeScript
- Strong understanding of modern frontend build tools
- Experience with state management (Redux, Zustand, etc.)
- Familiarity with testing frameworks (Jest, Cypress)

## Nice to have
- Experience with Next.js
- Knowledge of backend technologies
- Open source contributions`,
  requirements: [
    "5+ years React experience",
    "TypeScript proficiency", 
    "Modern build tools",
    "Testing experience",
    "Team collaboration"
  ],
  benefits: [
    "Competitive salary + equity",
    "Health, dental, vision insurance",
    "Unlimited PTO",
    "Remote work flexibility",
    "Learning & development budget"
  ]
};

export default async function JobPage({ params }: JobPageProps) {
  const { orgSlug, jobId } = await params;
  
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card">
        <div className="container mx-auto px-4 py-6">
          <Link 
            href={`/${orgSlug}`}
            className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-4 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to {mockJob.company} jobs
          </Link>
          
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h1 className="text-3xl font-bold mb-2">{mockJob.title}</h1>
              <div className="flex items-center gap-6 text-muted-foreground mb-4">
                <div className="flex items-center gap-1">
                  <Users className="h-4 w-4" />
                  {mockJob.company}
                </div>
                <div className="flex items-center gap-1">
                  <MapPin className="h-4 w-4" />
                  {mockJob.location}
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  {mockJob.type}
                </div>
                <div className="flex items-center gap-1">
                  <DollarSign className="h-4 w-4" />
                  {mockJob.salary}
                </div>
              </div>
              <div className="text-sm text-muted-foreground">
                Posted {mockJob.postedDate}
              </div>
            </div>
            
            <div className="ml-6 space-y-2">
              <Link 
                href={`/${orgSlug}/${jobId}/apply`}
                className="block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-center"
              >
                Apply Now
              </Link>
              <button className="w-full px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                Save Job
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Job Description */}
            <div>
              <h2 className="text-xl font-semibold mb-4">Job Description</h2>
              <div className="prose prose-neutral dark:prose-invert max-w-none">
                <div className="whitespace-pre-line text-muted-foreground">
                  {mockJob.description}
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Apply */}
            <div className="border rounded-lg p-6">
              <h3 className="font-semibold mb-4">Quick Apply</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Apply with your resume and our AI will match your skills to this role.
              </p>
              <Link 
                href={`/${orgSlug}/${jobId}/apply`}
                className="block w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-center mb-3"
              >
                Apply Now
              </Link>
              <button className="w-full px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                Apply with LinkedIn
              </button>
            </div>

            {/* Requirements */}
            <div className="border rounded-lg p-6">
              <h3 className="font-semibold mb-4">Key Requirements</h3>
              <ul className="space-y-2">
                {mockJob.requirements.map((req, index) => (
                  <li key={index} className="flex items-start gap-2 text-sm">
                    <div className="w-1.5 h-1.5 bg-primary rounded-full mt-2 flex-shrink-0" />
                    {req}
                  </li>
                ))}
              </ul>
            </div>

            {/* Benefits */}
            <div className="border rounded-lg p-6">
              <h3 className="font-semibold mb-4">Benefits & Perks</h3>
              <ul className="space-y-2">
                {mockJob.benefits.map((benefit, index) => (
                  <li key={index} className="flex items-start gap-2 text-sm">
                    <div className="w-1.5 h-1.5 bg-green-500 rounded-full mt-2 flex-shrink-0" />
                    {benefit}
                  </li>
                ))}
              </ul>
            </div>

            {/* Company Info */}
            <div className="border rounded-lg p-6">
              <h3 className="font-semibold mb-4">About {mockJob.company}</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Leading technology company building the future of work with innovative solutions.
              </p>
              <button className="w-full px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                View Company Profile
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}