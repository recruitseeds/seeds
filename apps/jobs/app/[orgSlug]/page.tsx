import { MapPin, Clock, DollarSign, Users } from "lucide-react";

interface CompanyJobsPageProps {
  params: Promise<{
    orgSlug: string;
  }>;
}

// Mock data - will be replaced with API calls
const mockCompany = {
  name: "TechCorp",
  logo: "/placeholder-logo.png",
  description: "Leading technology company building the future",
  website: "https://techcorp.com",
  size: "501-1000 employees",
  location: "San Francisco, CA",
};

const mockJobs = [
  {
    id: "1",
    title: "Senior Frontend Developer",
    department: "Engineering",
    location: "San Francisco, CA",
    type: "Full-time",
    salary: "$120k - $180k",
    postedDate: "2 days ago",
    description: "We're looking for a senior frontend developer to join our growing team...",
  },
  {
    id: "2", 
    title: "Product Manager",
    department: "Product",
    location: "Remote",
    type: "Full-time",
    salary: "$130k - $200k",
    postedDate: "1 week ago",
    description: "Lead product strategy and execution for our core platform...",
  },
  {
    id: "3",
    title: "DevOps Engineer",
    department: "Infrastructure",
    location: "New York, NY",
    type: "Full-time",
    salary: "$110k - $160k",
    postedDate: "3 days ago",
    description: "Build and maintain our cloud infrastructure at scale...",
  },
];

export default async function CompanyJobsPage({ params }: CompanyJobsPageProps) {
  const { orgSlug } = await params;
  
  return (
    <div className="min-h-screen bg-background">
      {/* Company Header */}
      <div className="border-b bg-card">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-start gap-6">
            <div className="w-16 h-16 bg-primary/10 rounded-lg flex items-center justify-center">
              <span className="text-2xl font-bold text-primary">
                {mockCompany.name[0]}
              </span>
            </div>
            <div className="flex-1">
              <h1 className="text-3xl font-bold mb-2">{mockCompany.name}</h1>
              <p className="text-muted-foreground mb-4">{mockCompany.description}</p>
              <div className="flex items-center gap-6 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Users className="h-4 w-4" />
                  {mockCompany.size}
                </div>
                <div className="flex items-center gap-1">
                  <MapPin className="h-4 w-4" />
                  {mockCompany.location}
                </div>
              </div>
            </div>
            <button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
              View Company Profile
            </button>
          </div>
        </div>
      </div>

      {/* Jobs Section */}
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-semibold">
            Open Positions ({mockJobs.length})
          </h2>
          <div className="flex gap-2">
            <select className="px-3 py-2 border rounded-lg bg-background">
              <option>All Departments</option>
              <option>Engineering</option>
              <option>Product</option>
              <option>Design</option>
            </select>
            <select className="px-3 py-2 border rounded-lg bg-background">
              <option>All Locations</option>
              <option>Remote</option>
              <option>San Francisco</option>
              <option>New York</option>
            </select>
          </div>
        </div>

        {/* Job Listings */}
        <div className="space-y-4">
          {mockJobs.map((job) => (
            <div key={job.id} className="border rounded-lg p-6 hover:bg-muted/50 transition-colors">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-xl font-semibold">{job.title}</h3>
                    <span className="px-2 py-1 bg-primary/10 text-primary text-xs rounded-full">
                      {job.department}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-6 text-sm text-muted-foreground mb-3">
                    <div className="flex items-center gap-1">
                      <MapPin className="h-4 w-4" />
                      {job.location}
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      {job.type}
                    </div>
                    <div className="flex items-center gap-1">
                      <DollarSign className="h-4 w-4" />
                      {job.salary}
                    </div>
                  </div>
                  
                  <p className="text-muted-foreground mb-3">{job.description}</p>
                  
                  <div className="text-xs text-muted-foreground">
                    Posted {job.postedDate}
                  </div>
                </div>
                
                <div className="ml-6">
                  <a 
                    href={`/${orgSlug}/${job.id}`}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors inline-block"
                  >
                    View Job
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* No Jobs State */}
        {mockJobs.length === 0 && (
          <div className="text-center py-12">
            <div className="text-gray-600 mb-4">
              No open positions at the moment
            </div>
            <button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
              Join Talent Pool
            </button>
          </div>
        )}
      </div>
    </div>
  );
}