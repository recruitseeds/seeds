import { Search, MapPin, Building2 } from "lucide-react";

export default function HomePage() {
  return (
    <div className="container mx-auto px-4 py-8">
      {/* Hero Section */}
      <div className="text-center py-12">
        <h1 className="text-4xl font-bold tracking-tight lg:text-6xl mb-6">
          Find Your Next
          <span className="text-blue-600"> Opportunity</span>
        </h1>
        <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
          Discover amazing career opportunities with top companies. 
          Apply with confidence using our AI-powered matching system.
        </p>
        
        {/* Search Bar */}
        <div className="max-w-2xl mx-auto flex gap-2 p-2 border rounded-lg bg-white shadow-sm">
          <div className="flex-1 flex items-center gap-2 px-3">
            <Search className="h-4 w-4 text-gray-500" />
            <input
              type="text"
              placeholder="Job title, company, or keywords"
              className="w-full bg-transparent outline-none placeholder:text-gray-500"
            />
          </div>
          <div className="flex items-center gap-2 px-3 border-l">
            <MapPin className="h-4 w-4 text-gray-500" />
            <input
              type="text"
              placeholder="Location"
              className="w-32 bg-transparent outline-none placeholder:text-gray-500"
            />
          </div>
          <button className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors">
            Search
          </button>
        </div>
      </div>

      {/* Stats Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 py-12">
        <div className="text-center">
          <div className="text-3xl font-bold text-blue-600 mb-2">500+</div>
          <div className="text-gray-600">Active Jobs</div>
        </div>
        <div className="text-center">
          <div className="text-3xl font-bold text-blue-600 mb-2">100+</div>
          <div className="text-gray-600">Companies</div>
        </div>
        <div className="text-center">
          <div className="text-3xl font-bold text-blue-600 mb-2">95%</div>
          <div className="text-gray-600">Match Accuracy</div>
        </div>
      </div>

      {/* Quick Links */}
      <div className="py-8">
        <h2 className="text-2xl font-semibold mb-6">Browse by Company</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            "TechCorp",
            "StartupXYZ", 
            "InnovateCo",
            "DataDriven",
            "CloudFirst",
            "AIWorks",
            "DevTools",
            "ScaleUp"
          ].map((company) => (
            <div key={company} className="p-4 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Building2 className="h-5 w-5 text-blue-600" />
                </div>
                <span className="font-medium">{company}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* CTA Section */}
      <div className="text-center py-12">
        <div className="max-w-md mx-auto">
          <h3 className="text-xl font-semibold mb-4">Ready to get started?</h3>
          <p className="text-gray-600 mb-6">
            Join thousands of candidates finding their dream jobs
          </p>
          <button className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
            Browse All Jobs
          </button>
        </div>
      </div>
    </div>
  );
}